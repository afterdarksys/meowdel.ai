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
          excerpt: body.substring(0, 300) // First 300 chars is usually enough for topical clustering
        })
      } catch (e) {
        // Ignore
      }
    }

    const systemPrompt = `You are an expert data analyst and librarian.
Your task is to analyze a collection of notes and identify "Concept Clusters". 
A cluster is a group of 2 or more notes that share highly similar semantic themes, concepts, or duplicate ideas.

Return ONLY a JSON object with this exact schema:
{
  "clusters": [
    {
      "name": "string (A short, descriptive name for the cluster, e.g. 'React state management')",
      "notes": ["slug1", "slug2"],
      "reason": "string (1 sentence explaining why these are grouped together)",
      "overlapScore": number (0-100 indicating how redundant these notes are with each other)
    }
  ]
}

DO NOT return any clusters with fewer than 2 notes.
DO NOT wrap the response in markdown blocks. Return the raw JSON.`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      temperature: 0.1,
      system: systemPrompt,
      messages: [
        { role: 'user', content: JSON.stringify(notesSummary, null, 2) }
      ]
    })

    const responseText = response.content.filter(c => c.type === 'text').map((c: any) => c.text).join('')
    const cleanedText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    
    const parsed = JSON.parse(cleanedText)
    
    return NextResponse.json(parsed)

  } catch (error: any) {
    console.error('Error analyzing clusters:', error)
    return NextResponse.json({ error: error.message || 'Failed to analyze clusters' }, { status: 500 })
  }
}
