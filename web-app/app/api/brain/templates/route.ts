import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { NextResponse } from 'next/server'

function getBrainDir(): string {
  return path.resolve(process.cwd(), '../brain')
}

function getTemplatesDir(): string {
  return path.join(getBrainDir(), 'templates')
}

export interface BrainTemplate {
  slug: string
  title: string
  content: string
}

export async function GET() {
  try {
    const templatesDir = getTemplatesDir()
    
    try {
      await fs.access(templatesDir)
    } catch {
      await fs.mkdir(templatesDir, { recursive: true })
      return NextResponse.json({ templates: [] }) // Empty initially
    }

    const dirents = await fs.readdir(templatesDir, { withFileTypes: true })
    const mdFiles = dirents.filter(d => !d.isDirectory() && d.name.endsWith('.md'))

    const templates: BrainTemplate[] = []

    for (const file of mdFiles) {
      const filePath = path.join(templatesDir, file.name)
      const content = await fs.readFile(filePath, 'utf8')
      
      try {
        const { data, content: body } = matter(content)
        
        templates.push({
          slug: file.name.replace(/\.md$/, ''),
          title: data.title || path.basename(file.name, '.md'),
          content: body,
        })
      } catch (e) {
        console.warn(`Failed to parse template ${file.name}`, e)
      }
    }

    return NextResponse.json({ templates })
    
  } catch (error) {
    console.error('Error reading templates:', error)
    return NextResponse.json({ error: 'Failed to read templates' }, { status: 500 })
  }
}
