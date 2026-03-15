import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Security boundary: Only allow access to the brain folder
const BRAIN_DIR = path.resolve(process.cwd(), '../brain')

/**
 * Helper to recursively map the directory structure and extract metadata flags
 */
function walk(dir: string, results: any[] = []) {
  if (!fs.existsSync(dir)) return results

  const list = fs.readdirSync(dir)
  
  list.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat && stat.isDirectory()) {
      walk(filePath, results)
    } else if (file.endsWith('.md')) {
      const content = fs.readFileSync(filePath, 'utf-8')
      const relativePath = path.relative(BRAIN_DIR, filePath)
      
      // Basic extraction logic
      const titleMatch = content.match(/^#\s+(.+)$/m)
      const title = titleMatch ? titleMatch[1].trim() : file
      
      const tags: string[] = []
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
      if (frontmatterMatch) {
         const tagsMatch = frontmatterMatch[1].match(/tags:\n((?:\s+- .*\n)+)/)
         if (tagsMatch) {
            tagsMatch[1].split('\n').forEach(line => {
                const trimmed = line.trim()
                if (trimmed.startsWith('- ')) {
                    tags.push(trimmed.substring(2).trim())
                }
            })
         }
      }

      results.push({
        path: relativePath,
        name: file,
        title,
        tags,
        sizeBytes: stat.size,
        lastModified: stat.mtime
      })
    }
  })
  
  return results
}

export async function GET() {
  try {
    const files = walk(BRAIN_DIR)
    
    return NextResponse.json({
        success: true,
        count: files.length,
        files
    })
  } catch (error) {
    console.error("Error listing brain files:", error)
    return NextResponse.json(
        { error: 'Failed to access the Brain Vault.' },
        { status: 500 }
    )
  }
}
