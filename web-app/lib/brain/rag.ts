import fs from 'fs'
import path from 'path'

// Define the root of our brain repository
// Next.js runs from the web-app directory, so we go up one level to find the brain
const BRAIN_DIR = path.resolve(process.cwd(), '../brain')

export interface BrainDocument {
  id: string
  title: string
  content: string
  tags: string[]
  score?: number
}

/**
 * Recursively reads all markdown files in a directory.
 */
function getAllMarkdownFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) {
    return arrayOfFiles;
  }
  
  const files = fs.readdirSync(dirPath)

  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllMarkdownFiles(dirPath + "/" + file, arrayOfFiles)
    } else if (file.endsWith('.md')) {
      arrayOfFiles.push(path.join(dirPath, "/", file))
    }
  })

  return arrayOfFiles
}

/**
 * Parses frontmatter tags and title from markdown content.
 */
function parseMetadata(content: string, filePath: string) {
  const tags: string[] = []
  let title = path.basename(filePath, '.md')

  // Extract frontmatter tags
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (frontmatterMatch) {
    const yaml = frontmatterMatch[1]
    const tagsMatch = yaml.match(/tags:\n((?:\s+- .*\n)+)/)
    if (tagsMatch) {
        const tagLines = tagsMatch[1].split('\n')
        for (const line of tagLines) {
            const trimmed = line.trim()
            if (trimmed.startsWith('- ')) {
                tags.push(trimmed.substring(2).trim())
            }
        }
    }
  }

  // Extract title from first H1
  const h1Match = content.match(/^#\s+(.+)$/m)
  if (h1Match) {
    title = h1Match[1].trim()
  }

  return { title, tags }
}

/**
 * Searches the Brain repository for relevant markdown files based on a user query.
 * This is a lightweight keyword/regex based RAG implementation.
 */
export async function searchBrain(query: string, maxResults: number = 2): Promise<BrainDocument[]> {
  try {
    const files = getAllMarkdownFiles(BRAIN_DIR)
    const documents: BrainDocument[] = []

    // Clean and tokenize the query
    const searchTerms = query.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(term => term.length > 3) // Ignore very short words like 'the', 'and'

    if (searchTerms.length === 0) return []

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8')
      const { title, tags } = parseMetadata(content, filePath)
      const lowerContent = content.toLowerCase()
      
      let score = 0
      
      // Calculate relevance score
      for (const term of searchTerms) {
        // Boost for title matches
        if (title.toLowerCase().includes(term)) {
           score += 10
        }
        
        // Boost for tag matches
        if (tags.some(tag => tag.toLowerCase().includes(term))) {
            score += 5
        }

        // Count occurrences in body content
        const regex = new RegExp(term, 'g')
        const matches = lowerContent.match(regex)
        if (matches) {
            score += matches.length
        }
      }

      if (score > 0) {
        documents.push({
          id: path.relative(BRAIN_DIR, filePath),
          title,
          content,
          tags,
          score
        })
      }
    }

    // Sort by score descending and return top matches
    return documents
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, maxResults)

  } catch (error) {
    console.error("Brain search error:", error)
    return [] // Fail gracefully, Meowdel just won't have brain context
  }
}
