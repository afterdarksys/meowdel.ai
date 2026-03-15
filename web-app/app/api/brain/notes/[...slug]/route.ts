import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { NextResponse } from 'next/server'

function getBrainDir(): string {
  return path.resolve(process.cwd(), '../brain')
}

function getFilePath(slugParts: string[]): string | null {
  const brainDir = getBrainDir()
  const relPath = slugParts.join('/')

  // CRITICAL SECURITY: Validate path doesn't contain traversal attempts
  if (relPath.includes('..') || relPath.includes('\0') || relPath.includes('\x00')) {
    console.error(`[SECURITY] Path traversal attempt blocked: ${relPath}`)
    return null
  }

  // Resolve to absolute path
  const requestedPath = path.resolve(brainDir, `${relPath}.md`)

  // CRITICAL: Verify the resolved path is within brain directory
  if (!requestedPath.startsWith(brainDir + path.sep) && requestedPath !== brainDir) {
    console.error(`[SECURITY] Path outside brain directory blocked: ${relPath} -> ${requestedPath}`)
    return null
  }

  return requestedPath
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const slugParams = await params
    const filePath = getFilePath(slugParams.slug)

    if (!filePath) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

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

    if (!filePath) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

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

    // DISABLED: Background AI workers to prevent race conditions
    // TODO: Re-enable with proper file locking
    // import('@/lib/workers/brain').then((workers) => {
    //   workers.processNoteWorkers(filePath, content, mergedFrontmatter.tags)
    // }).catch(e => console.error("Worker import failed", e))

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

    if (!filePath) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

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
