import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import matter from 'gray-matter'
import { db } from '@/lib/db'
import { users, socialAccounts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// Walk up until we find meowdel.ai root
function getBrainDir(): string {
  return path.resolve(process.cwd(), '../brain')
}

// GitHub webhook signature verification
function verifySignature(payload: string, signature: string, secret: string) {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = 'sha256=' + hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

async function getFirstGithubToken() {
    // Attempt to grab ANY github pat to do the API fetch since this is a background webhook
    const allAccounts = await db.select().from(socialAccounts).where(eq(socialAccounts.platform, 'github_pat')).limit(1);
    if (allAccounts.length > 0) return allAccounts[0].accessToken;
    return null;
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-hub-signature-256')
    const event = request.headers.get('x-github-event')
    
    // In production, you would configure WEBHOOK_SECRET. 
    // For local dev, we might bypass or expect a dummy secret.
    // const secret = process.env.GITHUB_WEBHOOK_SECRET
    // if (secret && signature) {
    //    const payloadString = await request.clone().text()
    //    if (!verifySignature(payloadString, signature, secret)) {
    //       return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    //    }
    // }

    if (event !== 'push') {
       return NextResponse.json({ message: 'Ignored event type' })
    }

    const payload = await request.json()
    const repoName = payload.repository?.name
    const repoFullName = payload.repository?.full_name
    const commitMessage = payload.head_commit?.message || 'No commit message'
    const addedFiles = payload.head_commit?.added || []
    const modifiedFiles = payload.head_commit?.modified || []
    const allChangedFiles = [...addedFiles, ...modifiedFiles]

    if (allChangedFiles.length === 0) {
       return NextResponse.json({ message: 'No files changed' })
    }

    const token = await getFirstGithubToken()
    if (!token) {
        console.warn('Webhook received but no GitHub PAT found in DB to fetch file contents.')
        return NextResponse.json({ error: 'No GitHub PAT configured' }, { status: 403 })
    }

    // Pick maximum 5 interesting files (e.g. source code, not lockfiles) to analyze to stay within limits
    const interestingFiles = allChangedFiles.filter(f => 
        (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.py') || f.endsWith('.go') || f.endsWith('.php') || f.endsWith('.java') || f.endsWith('.md'))
        && !f.includes('package-lock.json') && !f.includes('yarn.lock')
    ).slice(0, 5)

    if (interestingFiles.length === 0) {
        return NextResponse.json({ message: 'No interesting files changed to analyze' })
    }

    let codeContext = `Repository: ${repoFullName}\nCommit: ${commitMessage}\n\n`

    for (const filePath of interestingFiles) {
        try {
            const url = `https://api.github.com/repos/${repoFullName}/contents/${filePath}`
            const res = await fetch(url, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3.raw',
                    'User-Agent': 'Meowdel-App'
                }
            })
            if (res.ok) {
                const content = await res.text()
                codeContext += `--- File: ${filePath} ---\n${content.substring(0, 3000)}\n\n`
            }
        } catch(e) {
            console.warn(`Failed to fetch ${filePath}`, e)
        }
    }

    // Generate architecture note using Claude
    const prompt = `You are an expert software architect AI. 
Analyze the following code changes from a recent Git commit and write a highly structured, concise, markdown documentation note summarizing the architecture updates and key components introduced or modified.
    
DO NOT wrap the note in markdown code blocks (\`\`\`markdown). Just output the raw markdown text. 
Make sure the note is formatted nicely for obsidian/markdown readers with headings and bullet points.

Code context:
${codeContext}`

    const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
    });

    const aiNoteContent = response.content
        .filter(c => c.type === 'text')
        .map(c => (c as any).text)
        .join('');

    // Save to brain
    const brainDir = getBrainDir()
    const autoDocsDir = path.join(brainDir, 'architecture', repoName)
    await fs.mkdir(autoDocsDir, { recursive: true })

    const dateStr = new Date().toISOString().split('T')[0]
    const slug = `${dateStr}-commit-${payload.head_commit?.id?.substring(0,7) || 'auto'}`
    const notePath = path.join(autoDocsDir, `${slug}.md`)

    const fileYamlStr = matter.stringify(aiNoteContent, {
        title: `Auto-Doc: ${repoName} (${dateStr})`,
        tags: ['auto-doc', 'architecture', repoName],
        created: new Date().toISOString(),
        commit: payload.head_commit?.id,
        author: payload.head_commit?.author?.name || 'Unknown'
    })

    await fs.writeFile(notePath, fileYamlStr, 'utf8')

    return NextResponse.json({ success: true, notePath })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 })
  }
}
