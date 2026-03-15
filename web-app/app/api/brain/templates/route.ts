import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'

function getTemplatesDir(): string {
  return path.resolve(process.cwd(), '../brain/templates')
}

export async function GET() {
  try {
    const templatesDir = getTemplatesDir()

    // Check if templates directory exists
    try {
      await fs.access(templatesDir)
    } catch {
      // Directory doesn't exist, return empty array
      return NextResponse.json({ templates: [] })
    }

    const files = await fs.readdir(templatesDir)
    const mdFiles = files.filter(f => f.endsWith('.md'))

    const templates = await Promise.all(
      mdFiles.map(async (file) => {
        const filePath = path.join(templatesDir, file)
        const fileContent = await fs.readFile(filePath, 'utf8')

        try {
          const { data, content } = matter(fileContent)
          const slug = path.basename(file, '.md')

          return {
            slug,
            title: data.title || slug.replace(/-/g, ' '),
            content: content.trim(),
            tags: data.tags || []
          }
        } catch (e) {
          console.error(`Failed to parse template ${file}`, e)
          return null
        }
      })
    )

    return NextResponse.json({
      templates: templates.filter(t => t !== null)
    })

  } catch (error: any) {
    console.error('Error loading templates:', error)
    return NextResponse.json({ error: error.message || 'Failed to load templates' }, { status: 500 })
  }
}
