/**
 * GitHub Integration — sync READMEs and issues from GitHub repos as Brain notes.
 *
 * POST /api/brain/integrations/github
 * Body: {
 *   repo: "owner/repo",
 *   importReadme: boolean,
 *   importIssues: boolean,
 *   issueState: "open" | "closed" | "all",
 *   token?: string   // GitHub PAT — falls back to stored integration or GITHUB_TOKEN env
 * }
 *
 * GET /api/brain/integrations/github?repo=owner/repo — list repo contents
 *
 * Tier: github_sync (pro)
 *
 * Env vars: GITHUB_TOKEN (optional fallback)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brainNotes, agentJobs, integrations } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { can } from '@/lib/features'

export const dynamic = 'force-dynamic'
export const maxDuration = 45

const GH_API = 'https://api.github.com'

function ghHeaders(token?: string) {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function resolveToken(userId: string, bodyToken?: string): Promise<string | undefined> {
  if (bodyToken) return bodyToken

  const [integration] = await db
    .select({ accessToken: integrations.accessToken })
    .from(integrations)
    .where(and(eq(integrations.userId, userId), eq(integrations.provider, 'github')))
    .limit(1)

  return integration?.accessToken ?? process.env.GITHUB_TOKEN ?? undefined
}

async function fetchReadme(repo: string, token?: string): Promise<{ content: string; sha: string } | null> {
  const res = await fetch(`${GH_API}/repos/${repo}/readme`, {
    headers: { ...ghHeaders(token), Accept: 'application/vnd.github.raw+json' },
  })
  if (!res.ok) return null
  const content = await res.text()
  const etag = res.headers.get('etag') ?? ''
  return { content, sha: etag }
}

async function fetchIssues(
  repo: string,
  state: 'open' | 'closed' | 'all',
  token?: string
): Promise<GitHubIssue[]> {
  const issues: GitHubIssue[] = []
  let page = 1

  while (page <= 5) {
    const res = await fetch(
      `${GH_API}/repos/${repo}/issues?state=${state}&per_page=30&page=${page}`,
      { headers: ghHeaders(token) }
    )
    if (!res.ok) break
    const data: GitHubIssue[] = await res.json()
    if (!data.length) break
    issues.push(...data.filter((i) => !i.pull_request)) // exclude PRs
    if (data.length < 30) break
    page++
  }

  return issues
}

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(user.subscriptionTier, 'github_sync')) {
    return NextResponse.json({ error: 'GitHub sync requires Pro' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const repo = searchParams.get('repo')
  if (!repo) return NextResponse.json({ error: 'repo param required' }, { status: 400 })

  const token = await resolveToken(user.id)

  const [repoRes, issuesRes] = await Promise.all([
    fetch(`${GH_API}/repos/${repo}`, { headers: ghHeaders(token) }),
    fetch(`${GH_API}/repos/${repo}/issues?state=open&per_page=10`, { headers: ghHeaders(token) }),
  ])

  if (!repoRes.ok) {
    return NextResponse.json({ error: 'Repository not found or not accessible' }, { status: 404 })
  }

  const repoData = await repoRes.json()
  const issueCount = issuesRes.ok ? (await issuesRes.json()).length : 0

  return NextResponse.json({
    repo: {
      name: repoData.full_name,
      description: repoData.description,
      stars: repoData.stargazers_count,
      defaultBranch: repoData.default_branch,
    },
    openIssues: issueCount,
    hasReadme: true, // assume yes for now; 404 is handled on import
  })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(user.subscriptionTier, 'github_sync')) {
    return NextResponse.json({ error: 'GitHub sync requires Pro' }, { status: 403 })
  }

  const body = await req.json()
  const {
    repo,
    importReadme = true,
    importIssues = false,
    issueState = 'open',
    token: bodyToken,
  } = body as {
    repo: string
    importReadme?: boolean
    importIssues?: boolean
    issueState?: 'open' | 'closed' | 'all'
    token?: string
  }

  if (!repo || !repo.includes('/')) {
    return NextResponse.json({ error: 'repo must be in format "owner/repo"' }, { status: 400 })
  }

  const token = await resolveToken(user.id, bodyToken)
  const imported: { title: string; slug: string }[] = []
  const jobValues: (typeof agentJobs.$inferInsert)[] = []

  if (importReadme) {
    const readme = await fetchReadme(repo, token)
    if (readme) {
      const title = `${repo} README`
      const slug =
        repo.replace('/', '-').toLowerCase() +
        '-readme-' +
        Date.now().toString(36)

      const noteContent = `> Source: [${repo}](https://github.com/${repo})\n> Synced: ${new Date().toLocaleDateString()}\n\n---\n\n${readme.content}`

      const [note] = await db
        .insert(brainNotes)
        .values({
          userId: user.id,
          slug,
          title,
          content: noteContent,
          tags: ['github', 'readme', repo.split('/')[0]],
          wordCount: readme.content.split(/\s+/).length,
          frontmatter: { source: 'github', repo, type: 'readme', importedAt: new Date().toISOString() },
        })
        .onConflictDoNothing()
        .returning({ id: brainNotes.id, slug: brainNotes.slug })

      if (note) {
        imported.push({ title, slug: note.slug })
        jobValues.push({ userId: user.id, jobType: 'embed_note', agentName: 'embedder', payload: { noteId: note.id }, priority: 7 })
      }
    }
  }

  if (importIssues) {
    const issues = await fetchIssues(repo, issueState, token)

    for (const issue of issues.slice(0, 50)) {
      const title = `#${issue.number}: ${issue.title}`
      const slug =
        `${repo.replace('/', '-')}-issue-${issue.number}`.toLowerCase() +
        '-' +
        Date.now().toString(36)

      const labels = issue.labels.map((l) => l.name).join(', ')
      const noteContent = [
        `> [${title}](${issue.html_url})`,
        `> State: ${issue.state} | Labels: ${labels || 'none'} | Created: ${new Date(issue.created_at).toLocaleDateString()}`,
        '',
        '---',
        '',
        issue.body ?? '_No description provided_',
      ].join('\n')

      const [note] = await db
        .insert(brainNotes)
        .values({
          userId: user.id,
          slug,
          title,
          content: noteContent,
          tags: ['github', 'issue', issue.state, ...issue.labels.map((l) => l.name)],
          wordCount: (issue.body ?? '').split(/\s+/).length,
          frontmatter: {
            source: 'github',
            repo,
            type: 'issue',
            issueNumber: issue.number,
            issueState: issue.state,
            importedAt: new Date().toISOString(),
          },
        })
        .onConflictDoNothing()
        .returning({ id: brainNotes.id, slug: brainNotes.slug })

      if (note) {
        imported.push({ title, slug: note.slug })
        jobValues.push({ userId: user.id, jobType: 'embed_note', agentName: 'embedder', payload: { noteId: note.id }, priority: 8 })
      }
    }
  }

  if (jobValues.length > 0) {
    await db.insert(agentJobs).values(jobValues).onConflictDoNothing()
  }

  return NextResponse.json({ success: true, imported: imported.length, notes: imported })
}

interface GitHubIssue {
  number: number
  title: string
  body: string | null
  state: string
  html_url: string
  created_at: string
  labels: { name: string }[]
  pull_request?: unknown
}
