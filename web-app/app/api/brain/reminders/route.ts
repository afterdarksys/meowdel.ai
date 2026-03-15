import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { NextResponse } from 'next/server'

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

export interface ReminderTodo {
  id: string
  noteSlug: string
  noteTitle: string
  text: string
  completed: boolean
}

export interface ReminderRevisit {
  noteSlug: string
  noteTitle: string
  reason: string // e.g. "You learned this 3 months ago"
  lastModified: string
}

export async function GET() {
  try {
    const brainDir = getBrainDir()
    
    try {
      await fs.access(brainDir)
    } catch {
      return NextResponse.json({ todos: [], revisit: [] })
    }

    const files = await getFilesRecursively(brainDir)
    const mdFiles = files.filter(f => f.endsWith('.md'))

    const todos: ReminderTodo[] = []
    const revisit: ReminderRevisit[] = []
    
    const now = new Date()

    for (const file of mdFiles) {
      const content = await fs.readFile(file, 'utf8')
      const stat = await fs.stat(file)
      const mtime = new Date(stat.mtime)
      
      try {
        const { data, content: body } = matter(content)
        const relPath = path.relative(brainDir, file)
        const slug = relPath.replace(/\.md$/, '')
        const title = data.title || path.basename(file, '.md')

        // 1. Extract TODOs
        const lines = body.split('\n')
        lines.forEach((line, index) => {
          const trimmed = line.trim()
          let isTodo = false
          let text = ''
          let completed = false

          if (trimmed.startsWith('- [ ]') || trimmed.startsWith('* [ ]')) {
            isTodo = true
            text = trimmed.substring(5).trim()
            completed = false
          } else if (trimmed.startsWith('- [x]') || trimmed.startsWith('* [x]') || trimmed.startsWith('- [X]')) {
            isTodo = true
            text = trimmed.substring(5).trim()
            completed = true
          } else if (trimmed.toUpperCase().includes('TODO:')) {
            isTodo = true
            text = trimmed.substring(trimmed.toUpperCase().indexOf('TODO:') + 5).trim()
            completed = false
          }

          if (isTodo && text) {
            todos.push({
              id: `${slug}-${index}`,
              noteSlug: slug,
              noteTitle: title,
              text,
              completed
            })
          }
        })

        // 2. Identify Revisit (Spaced Repetition logic)
        // Check if modified ~1 month ago (25-35 days), 3 months ago (85-95 days), 1 year ago, etc.
        const daysAgo = Math.floor((now.getTime() - mtime.getTime()) / (1000 * 60 * 60 * 24))
        
        let reason = ''
        if (daysAgo >= 6 && daysAgo <= 8) {
          reason = '1 week ago'
        } else if (daysAgo >= 28 && daysAgo <= 32) {
          reason = '1 month ago'
        } else if (daysAgo >= 88 && daysAgo <= 92) {
          reason = '3 months ago'
        } else if (daysAgo >= 180 && daysAgo <= 185) {
          reason = '6 months ago'
        } else if (daysAgo >= 360 && daysAgo <= 370) {
          reason = '1 year ago'
        }

        if (reason) {
          revisit.push({
            noteSlug: slug,
            noteTitle: title,
            reason: `You learned this ${reason}`,
            lastModified: mtime.toISOString()
          })
        }

      } catch (e) {
        console.warn(`Failed to parse ${file} for reminders`, e)
      }
    }

    return NextResponse.json({ todos, revisit })
    
  } catch (error) {
    console.error('Error fetching reminders:', error)
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
  }
}
