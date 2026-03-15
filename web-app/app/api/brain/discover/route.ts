import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

function getBrainDir(): string {
  return path.resolve(process.cwd(), '../brain')
}

async function getFilesRecursively(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    dirents.map(async (dirent) => {
      const res = path.resolve(dir, dirent.name)
      if (dirent.name === '.git' || dirent.name === 'node_modules' || dirent.name.startsWith('.')) return []
      return dirent.isDirectory() ? getFilesRecursively(res) : res
    })
  )
  return Array.prototype.concat(...files)
}

export async function POST(request: Request) {
  try {
    const { sourceSlug } = await request.json()
    if (!sourceSlug) return NextResponse.json({ error: 'Source slug required' }, { status: 400 })

    const brainDir = getBrainDir()
    const files = await getFilesRecursively(brainDir)
    const mdFiles = files.filter(f => f.endsWith('.md'))

    const notesSummary = []
    let sourceContent = ""

    for (const file of mdFiles) {
      const content = await fs.readFile(file, 'utf8')
      const relPath = path.relative(brainDir, file)
      const slug = relPath.replace(/\.md$/, '')
      try {
        const { data, content: body } = matter(content)
        
        if (slug === sourceSlug) {
            sourceContent = `Title: ${data.title}\n\n${body}`
        } else {
            notesSummary.push({
              slug,
              title: data.title || path.basename(file, '.md'),
              excerpt: body.substring(0, 500) // First 500 chars is enough for semantics usually
            })
        }
      } catch (e) {
        // Ignore
      }
    }

    if (!sourceContent) {
        return NextResponse.json({ error: 'Source note not found' }, { status: 404 })
    }

    // Since we don't have a vector DB setup, we'll use Claude to analyze semantic similarity based on excerpts.
    // For large graphs, text embeddings in Postgres/PgVector would be used, but this works for MVP.
    const systemPrompt = `You are a Semantic Discovery Engine. Your job is to find surprising, latent connections between a Source Note and a list of Candidate Notes.
    
Analyze the conceptual overlap between the Source Note and the Candidates.

Return ONLY a JSON array of the top 3-5 most strongly connected notes, formatted exactly like this:
[
  { 
    "slug": "string",
    "title": "string",
    "confidence": 85, 
    "reason": "Brief 1-sentence explanation of the conceptual overlap." 
  }
]

Confidence should be an integer between 0 and 100 representing the strength of the connection.
Do NOT return anything except the JSON array.`

    const promptMessages = [
        { role: "user" as const, content: `=== SOURCE NOTE ===\n${sourceContent.substring(0, 1500)}\n\n=== CANDIDATE NOTES ===\n${JSON.stringify(notesSummary, null, 2)}` }
    ]

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature: 0.1,
      system: systemPrompt,
      messages: promptMessages
    })

    const responseText = response.content.filter(c => c.type === 'text').map((c: any) => c.text).join('')
    const cleanedText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    
    const parsed = JSON.parse(cleanedText)
    
    return NextResponse.json({ connections: parsed })

  } catch (error: any) {
    console.error('Error discovering connections:', error)
    return NextResponse.json({ error: error.message || 'Failed to discover connections' }, { status: 500 })
  }
}
