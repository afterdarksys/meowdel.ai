import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { NextResponse } from 'next/server'

function getBrainDir(): string {
  return path.resolve(process.cwd(), '../brain')
}

function getFilePath(slugParts: string[]) {
  const relPath = slugParts.join('/')
  // Prevent directory traversal attacks
  const safePath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '')
  return path.join(getBrainDir(), `${safePath}.md`)
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const slugParams = await params
    const filePath = getFilePath(slugParams.slug)

    try {
      const content = await fs.readFile(filePath, 'utf8')
      const { data, content: body } = matter(content)
      const stat = await fs.stat(filePath)

      return NextResponse.json({
        slug: slugParams.slug.join('/'),
        title: data.title || path.basename(filePath, '.md'),
        tags: data.tags || [],
        content: body,
        frontmatter: data,
        modifiedAt: stat.mtime.toISOString(),
      })
    } catch {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error reading note:', error)
    return NextResponse.json({ error: 'Failed to read note' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const slugParams = await params
    const filePath = getFilePath(slugParams.slug)
    const { content, title, tags, frontmatter } = await request.json()

    // We'll read the existing file to preserve unmanaged frontmatter if any,
    // though for a full overhaul we might just overwrite.
    let existingFrontmatter: Record<string, any> = {}
    try {
      const existingContent = await fs.readFile(filePath, 'utf8')
      existingFrontmatter = matter(existingContent).data
    } catch {
      // It's okay if it doesn't exist, we'll create it.
      await fs.mkdir(path.dirname(filePath), { recursive: true })
    }

    const mergedFrontmatter = {
      ...existingFrontmatter,
      ...(frontmatter || {}),
      title: title || existingFrontmatter.title || path.basename(filePath, '.md'),
      tags: tags || existingFrontmatter.tags || [],
      modified: new Date().toISOString()
    }

    const fileContent = matter.stringify(content, mergedFrontmatter)
    await fs.writeFile(filePath, fileContent, 'utf8')

    // Fire off background AI workers without awaiting them
    import('@/lib/workers/brain').then((workers) => {
      workers.processNoteWorkers(filePath, content, mergedFrontmatter.tags)
    }).catch(e => console.error("Worker import failed", e))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating note:', error)
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const slugParams = await params
    const filePath = getFilePath(slugParams.slug)

    try {
      await fs.unlink(filePath)
      return NextResponse.json({ success: true })
    } catch {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}
