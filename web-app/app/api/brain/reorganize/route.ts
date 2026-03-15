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

export async function GET() {
  try {
    const brainDir = getBrainDir()
    const files = await getFilesRecursively(brainDir)
    const mdFiles = files.filter(f => f.endsWith('.md'))

    const notesSummary = []

    for (const file of mdFiles) {
      const content = await fs.readFile(file, 'utf8')
      const relPath = path.relative(brainDir, file)
      const slug = relPath.replace(/\.md$/, '')
      try {
        const { data, content: body } = matter(content)
        notesSummary.push({
          slug,
          title: data.title || path.basename(file, '.md'),
          tags: data.tags || [],
          excerpt: body.substring(0, 300)
        })
      } catch (e) {
        // Ignore
      }
    }

    const systemPrompt = `You are an expert personal knowledge management archivist. 
Your task is to analyze a chaotic folder of markdown notes and suggest a cohesive folder structure and some Map of Content (MOC) index files to organize them.

You will strictly return a JSON object with this schema:
{
  "moves": [
    { "originalSlug": "string", "newSlug": "string" }
  ],
  "mocs": [
    { "title": "string", "slug": "string", "content": "markdown string" }
  ]
}

- originalSlug: The current slug (e.g., "docker-basics")
- newSlug: The new suggested slug/path (e.g., "devops/docker-basics")
- ONLY suggest moving files if they logically belong in a category folder.
- DO NOT change the filename (the part after the last slash), only prepend directories.
- Create 1-3 highly useful Map of Content (MOC) notes that link to the organized files.
- Ensure 'content' inside 'mocs' is valid Markdown containing wikilinks (e.g., [[devops/docker-basics]]) to the newly located notes.
- Respond with ONLY the raw JSON object. No markdown code blocks, no explanation.`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.1,
      system: systemPrompt,
      messages: [
        { role: 'user', content: JSON.stringify(notesSummary, null, 2) }
      ]
    })

    const responseText = response.content.filter(c => c.type === 'text').map((c: any) => c.text).join('')
    
    // clean up any potential markdown formatting the model might have returned despite instructions
    const cleanedText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    
    const parsed = JSON.parse(cleanedText)
    
    return NextResponse.json(parsed)

  } catch (error: any) {
    console.error('Error analyzing brain:', error)
    return NextResponse.json({ error: error.message || 'Failed to analyze brain' }, { status: 500 })
  }
}

export async function POST(request: Request) {
    try {
        const { moves, mocs } = await request.json()
        const brainDir = getBrainDir()

        // 1. Move files
        for (const move of moves) {
            if (move.originalSlug === move.newSlug) continue;
            const oldPath = path.join(brainDir, `${move.originalSlug}.md`)
            const newPath = path.join(brainDir, `${move.newSlug}.md`)
            
            // Ensure parent dir exists
            await fs.mkdir(path.dirname(newPath), { recursive: true })
            
            try {
                await fs.rename(oldPath, newPath)
            } catch (e) {
                console.error(`Failed to move ${oldPath} to ${newPath}`, e)
            }
        }

        // 2. Create MOCs
        for (const moc of mocs) {
            const mocPath = path.join(brainDir, `${moc.slug}.md`)
            await fs.mkdir(path.dirname(mocPath), { recursive: true })
            
            const fileContent = matter.stringify(moc.content, {
              title: moc.title,
              tags: ['moc', 'index'],
              created: new Date().toISOString()
            })
            
            await fs.writeFile(mocPath, fileContent, 'utf8')
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error applying organization:', error)
        return NextResponse.json({ error: error.message || 'Failed to apply' }, { status: 500 })
    }
}
