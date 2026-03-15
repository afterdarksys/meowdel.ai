import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { NextResponse } from 'next/server'

// Walk up until we find meowdel.ai root
function getBrainDir(): string {
  return path.resolve(process.cwd(), '../brain')
}

export interface BrainNote {
  slug: string
  title: string
  tags: string[]
  content: string
  excerpt: string
  modifiedAt: string
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
    
    // Ensure dir exists
    try {
      await fs.access(brainDir)
    } catch {
      await fs.mkdir(brainDir, { recursive: true })
      return NextResponse.json([])
    }

    const files = await getFilesRecursively(brainDir)
    const mdFiles = files.filter(f => f.endsWith('.md'))

    const notes: BrainNote[] = []

    for (const file of mdFiles) {
      const content = await fs.readFile(file, 'utf8')
      const stat = await fs.stat(file)
      
      try {
        const { data, content: body } = matter(content)
        
        let relPath = path.relative(brainDir, file)
        
        // Exclude root README if we want, but letting everything through for now
        
        notes.push({
          slug: relPath.replace(/\.md$/, ''),
          title: data.title || path.basename(file, '.md'),
          tags: data.tags || [],
          content: body,
          excerpt: body.substring(0, 150) + (body.length > 150 ? '...' : ''),
          modifiedAt: stat.mtime.toISOString(),
        })
      } catch (e) {
        console.warn(`Failed to parse frontmatter for ${file}`, e)
      }
    }

    // Sort by modified date descending
    notes.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())
    return NextResponse.json(notes)
    
  } catch (error) {
    console.error('Error reading brain notes:', error)
    return NextResponse.json({ error: 'Failed to read brain' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const brainDir = getBrainDir()
    const { title, slug: requestedSlug, content, tags, template } = await request.json()

    if (!title) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Generate slug from title if not provided
    const slug = requestedSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    
    // Default suffix if collision
    const filePath = path.join(brainDir, `${slug}.md`)
    
    // Check if exists
    try {
      await fs.access(filePath)
      return NextResponse.json({ error: 'Note with this slug already exists' }, { status: 409 })
    } catch {
      // Good, it doesn't exist
    }

    let finalContent = content || ''
    let finalTags = tags || []

    // Handle template substitution
    if (template) {
      const templatePath = path.join(brainDir, 'templates', `${template}.md`)
      try {
        const templateContent = await fs.readFile(templatePath, 'utf8')
        const { data: templateData, content: templateBody } = matter(templateContent)
        
        let processedBody = templateBody
          .replace(/\{\{\s*title\s*\}\}/g, title)
          .replace(/\{\{\s*date\s*\}\}/g, new Date().toLocaleDateString())
          
        finalContent = processedBody + (finalContent ? `\n\n${finalContent}` : '')
        
        if (templateData.tags && Array.isArray(templateData.tags)) {
           finalTags = [...new Set([...finalTags, ...templateData.tags])]
        }
      } catch (err) {
         console.warn(`Template ${template} not found or failed to load.`, err)
      }
    }

    if (!finalContent.trim()) {
        finalContent = `\n# ${title}\n`
    }

    const fileContent = matter.stringify(finalContent, {
      title,
      tags: finalTags,
      created: new Date().toISOString()
    })

    // Ensure parent dir exists (if slug contains slashes)
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    
    await fs.writeFile(filePath, fileContent, 'utf8')

    return NextResponse.json({ success: true, slug })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}
