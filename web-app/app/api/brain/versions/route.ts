import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { BrainNote } from '../notes/route'
import matter from 'gray-matter'

const getBrainDir = () => path.resolve(process.cwd(), '../brain')
const getVersionsDir = () => path.join(getBrainDir(), '.versions')

export interface NoteVersion {
   id: string
   timestamp: string
   content: string
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const slug = url.searchParams.get('slug')
    
    if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 })

    const versionsDir = getVersionsDir()
    const safeSlug = slug.replace(/[^a-zA-Z0-9.-]/g, '_')
    const noteVersionsDir = path.join(versionsDir, safeSlug)

    try {
        await fs.access(noteVersionsDir)
    } catch {
        // No versions exist yet
        return NextResponse.json([])
    }

    const files = await fs.readdir(noteVersionsDir)
    const versions: NoteVersion[] = []

    for (const file of files) {
        if (!file.endsWith('.md')) continue
        
        const timestampStr = file.replace('.md', '')
        const timestamp = parseInt(timestampStr, 10)
        
        if (isNaN(timestamp)) continue

        const content = await fs.readFile(path.join(noteVersionsDir, file), 'utf8')
        
        // Return only content, not full parsed note for the diff
        versions.push({
           id: timestampStr,
           timestamp: new Date(timestamp).toISOString(),
           content
        })
    }

    // Sort newest first
    versions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json(versions)

  } catch (error: any) {
    console.error("Versions fetch error", error)
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
     const { slug, content } = await request.json()
     if (!slug || !content) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })

     const versionsDir = getVersionsDir()
     const safeSlug = slug.replace(/[^a-zA-Z0-9.-]/g, '_')
     const noteVersionsDir = path.join(versionsDir, safeSlug)

     // Ensure versions directory exists
     await fs.mkdir(noteVersionsDir, { recursive: true })

     const timestamp = Date.now().toString()
     const destFile = path.join(noteVersionsDir, `${timestamp}.md`)

     await fs.writeFile(destFile, content, 'utf8')

     return NextResponse.json({ success: true, versionId: timestamp })
  } catch (error: any) {
     console.error("Version save error", error)
     return NextResponse.json({ error: 'Failed to save version' }, { status: 500 })
  }
}
