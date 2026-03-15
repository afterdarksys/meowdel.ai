import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { NextResponse } from 'next/server'

// Simple in-memory cache with TTL
interface CacheEntry {
  data: any
  timestamp: number
}

let graphCache: CacheEntry | null = null
const CACHE_TTL_MS = parseInt(process.env.GRAPH_CACHE_TTL || '300') * 1000 // Default 5 minutes

function getBrainDir(): string {
  return process.env.BRAIN_DIR || path.resolve(process.cwd(), '../brain')
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

function extractWikilinks(content: string): string[] {
  const links: string[] = []
  const regex = /\[\[(.*?)\]\]/g
  let match
  while ((match = regex.exec(content)) !== null) {
      // Handle aliased links like [[Note Name|Alias]]
      const linkTarget = match[1].split('|')[0].trim()
      links.push(linkTarget)
  }
  return links
}

function slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
}

export async function GET() {
  try {
    // Check cache first
    const now = Date.now()
    if (graphCache && (now - graphCache.timestamp) < CACHE_TTL_MS) {
      console.log('[Graph Cache] Cache hit')
      return NextResponse.json(graphCache.data)
    }

    console.log('[Graph Cache] Cache miss - rebuilding graph')

    const brainDir = getBrainDir()

    try {
      await fs.access(brainDir)
    } catch {
      return NextResponse.json({ nodes: [], links: [] })
    }

    const files = await getFilesRecursively(brainDir)
    const mdFiles = files.filter(f => f.endsWith('.md'))

    const nodesMap = new Map<string, any>()
    const links: { source: string, target: string, value: number, label?: string }[] = []

    // Pass 1: Create all known nodes from files
    for (const file of mdFiles) {
      const content = await fs.readFile(file, 'utf8')
      const { data, content: body } = matter(content)
      
      let relPath = path.relative(brainDir, file)
      const slug = relPath.replace(/\.md$/, '')
      const title = data.title || path.basename(file, '.md')
      const tags = data.tags || []
      
      const outgoingLinks = extractWikilinks(body)

      nodesMap.set(slug, {
          id: slug,
          name: title,
          val: Math.min(20, 5 + outgoingLinks.length * 2), // Node size logic
          tags,
          color: tags.includes('Orphan') ? '#ef4444' : '#a855f7', // Red for orphan, purple default
          outgoingLinks
      })
    }

    // Pass 2: Process links and create implicit/orphan nodes if needed
    for (const [slug, node] of nodesMap.entries()) {
        for (const targetTitle of node.outgoingLinks) {
            const targetSlug = slugify(targetTitle)
            
            // If the target doesn't exist as a file, it's an unresolved link (ghost node)
            if (!nodesMap.has(targetSlug)) {
                nodesMap.set(targetSlug, {
                    id: targetSlug,
                    name: targetTitle,
                    val: 3,
                    tags: ['Unresolved'],
                    color: '#6b7280', // Gray for missing
                    outgoingLinks: []
                })
            }

            links.push({
                source: slug,
                target: targetSlug,
                value: 1
            })
        }
    }

    // Optional: add a central "Meowdel" node connecting to major tags/folders?
    // Let's just return the raw brain graph.

    const nodes = Array.from(nodesMap.values())

    const result = {
        nodes,
        links
    }

    // Store in cache
    graphCache = {
      data: result,
      timestamp: Date.now()
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error reading brain graph:', error)
    return NextResponse.json({ error: 'Failed to read graph' }, { status: 500 })
  }
}
