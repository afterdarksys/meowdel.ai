import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { codeGraphScans, brainNotes } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const execAsync = promisify(exec)
const CRG = process.env.CRG_BIN ?? '/opt/crg-venv/bin/code-review-graph'

// GET /api/brain/code-review — list user's scans
export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scans = await db
    .select()
    .from(codeGraphScans)
    .where(eq(codeGraphScans.userId, user.id))
    .orderBy(codeGraphScans.createdAt)

  return NextResponse.json(scans)
}

// POST /api/brain/code-review — run a scan
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { repoUrl, baseBranch = 'main', saveAsNote = false } = await req.json()

  if (!repoUrl || typeof repoUrl !== 'string') {
    return NextResponse.json({ error: 'repoUrl required' }, { status: 400 })
  }

  const githubMatch = repoUrl.match(/^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/.*)?$/)
  if (!githubMatch) {
    return NextResponse.json({ error: 'Only public GitHub URLs are supported' }, { status: 400 })
  }

  const [, repoOwner, repoName] = githubMatch
  const cleanUrl = `https://github.com/${repoOwner}/${repoName}.git`

  // Create scan record
  const [scan] = await db.insert(codeGraphScans).values({
    userId: user.id,
    repoUrl: cleanUrl,
    repoOwner,
    repoName,
    baseBranch,
    status: 'building',
  }).returning({ id: codeGraphScans.id })

  const tmpDir = path.join('/tmp', `crg-${randomUUID()}`)

  try {
    // Clone (shallow, no blobs for speed)
    await execAsync(
      `git clone --depth 1 --no-tags --filter=blob:none ${cleanUrl} ${tmpDir}`,
      { timeout: 45_000 }
    )

    // Build the code graph
    await execAsync(`${CRG} build`, { cwd: tmpDir, timeout: 90_000 })

    // Get stats from status command
    const { stdout: statusOut } = await execAsync(
      `${CRG} status`,
      { cwd: tmpDir, timeout: 15_000 }
    ).catch(() => ({ stdout: '' }))

    // Parse stats from status output (plain text)
    const nodeMatch = statusOut.match(/nodes?[:\s]+(\d+)/i)
    const edgeMatch = statusOut.match(/edges?[:\s]+(\d+)/i)
    const fileMatch = statusOut.match(/files?[:\s]+(\d+)/i)
    const nodeCount = nodeMatch ? parseInt(nodeMatch[1]) : 0
    const edgeCount = edgeMatch ? parseInt(edgeMatch[1]) : 0
    const fileCount = fileMatch ? parseInt(fileMatch[1]) : 0

    // Get architecture overview if available
    const { stdout: archOut } = await execAsync(
      `${CRG} status --verbose`,
      { cwd: tmpDir, timeout: 15_000 }
    ).catch(() => ({ stdout: statusOut }))

    // Estimate token savings (8x avg based on benchmark data)
    const estimatedTokenSavings = fileCount > 0
      ? Math.round(fileCount * 200 * (1 - 1 / 8)) // avg 200 tokens/file, 8x reduction
      : null

    const summaryText = buildSummary({ repoOwner, repoName, nodeCount, edgeCount, fileCount, statusOut: archOut })

    const analysisResult = {
      status: statusOut,
      nodeCount,
      edgeCount,
      fileCount,
      estimatedTokenSavings,
    }

    // Update scan record
    await db.update(codeGraphScans)
      .set({
        status: 'complete',
        nodeCount,
        edgeCount,
        fileCount,
        analysisResult,
        summaryText,
        estimatedTokenSavings,
        completedAt: new Date(),
      })
      .where(and(eq(codeGraphScans.id, scan.id), eq(codeGraphScans.userId, user.id)))

    // Optionally save as brain note
    let brainNoteId: string | undefined
    if (saveAsNote) {
      const slug = `code-review-${repoOwner}-${repoName}-${Date.now()}`
      const noteContent = `# Code Graph: ${repoOwner}/${repoName}\n\n${summaryText}\n\n\`\`\`\n${archOut}\n\`\`\``
      const [note] = await db.insert(brainNotes).values({
        userId: user.id,
        slug,
        title: `Code Graph: ${repoOwner}/${repoName}`,
        content: noteContent,
        tags: ['code-graph', 'code-review', repoName],
        summary: `Code graph analysis of ${repoOwner}/${repoName}: ${nodeCount} nodes, ${edgeCount} edges across ${fileCount} files.`,
        frontmatter: { repoUrl: cleanUrl, repoOwner, repoName, scanId: scan.id },
      }).returning({ id: brainNotes.id, slug: brainNotes.slug })

      brainNoteId = note.id
      await db.update(codeGraphScans)
        .set({ brainNoteId: note.id })
        .where(eq(codeGraphScans.id, scan.id))
    }

    return NextResponse.json({
      success: true,
      scanId: scan.id,
      repoOwner,
      repoName,
      nodeCount,
      edgeCount,
      fileCount,
      estimatedTokenSavings,
      summaryText,
      brainNoteId,
    })

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    await db.update(codeGraphScans)
      .set({ status: 'failed', errorMessage })
      .where(and(eq(codeGraphScans.id, scan.id), eq(codeGraphScans.userId, user.id)))

    return NextResponse.json({ error: 'Scan failed', detail: errorMessage }, { status: 500 })
  } finally {
    fs.rm(tmpDir, { recursive: true, force: true }, () => {})
  }
}

function buildSummary({ repoOwner, repoName, nodeCount, edgeCount, fileCount, statusOut }: {
  repoOwner: string
  repoName: string
  nodeCount: number
  edgeCount: number
  fileCount: number
  statusOut: string
}) {
  const lines = [
    `## ${repoOwner}/${repoName}`,
    '',
    `- **${fileCount}** files analyzed`,
    `- **${nodeCount}** code nodes (functions, classes, modules)`,
    `- **${edgeCount}** dependency edges`,
    '',
    '### Raw Output',
    '```',
    statusOut.trim(),
    '```',
  ]
  return lines.join('\n')
}
