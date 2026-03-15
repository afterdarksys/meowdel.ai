import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function processNoteWorkers(filePath: string, content: string, existingTags: string[]) {
  // We run these "workers" asynchronously without blocking the save request
  try {
    const fileName = path.basename(filePath, '.md')

    // 1. Auto-tagging Engine
    let newTags = [...existingTags]
    if (content.length > 50) { 
      try {
        const response = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307', // Use fast, cheap model for background tasks
          max_tokens: 100,
          temperature: 0.1,
          system: `You are an auto-tagging engine for a knowledge graph. 
Given the markdown content, respond ONLY with a comma-separated list of 1 to 4 highly relevant lowercase tags.
Do not include '#' symbols. 
If the content is too short or doesn't have clear topics, return an empty string.`,
          messages: [{ role: 'user', content: content.substring(0, 2000) }]
        })

        const aiTags = (response.content[0] as any).text
          .split(',')
          .map((t: string) => t.trim().toLowerCase())
          .filter((t: string) => t.length > 0 && t.length < 25 && /^[a-z0-9-]+$/.test(t))

        // Merge tags
        const tagSet = new Set([...existingTags, ...aiTags])
        newTags = Array.from(tagSet)
      } catch (e) {
        console.error('Auto-tagging worker failed', e)
      }
    }

    // 2. Auto-linking Engine (Latent Connection Discovery)
    let finalContent = content
    try {
      // 2a. Brute force list some other nodes in the brain to link to. 
      // In production this would be semantically clustered first via the embeddings route.
      const brainDir = path.resolve(process.cwd(), '../brain')
      const files = await fs.readdir(brainDir, { withFileTypes: true, recursive: true })
      
      const potentialLinks = files
        .filter(f => f.isFile() && f.name.endsWith('.md') && f.name !== `${fileName}.md`)
        .map(f => path.basename(f.name, '.md'))
        .slice(0, 50) // Limit to top 50 for prompt context limits

      if (potentialLinks.length > 0) {
          const linkResponse = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 150,
            temperature: 0.3,
            system: `You are a latent connection discovery engine. 
Here are potential WikiLink pages existing in the user's brain: ${potentialLinks.join(', ')}

Given the provided markdown text, identify exactly 1 or 2 existing keywords or phrases in the text that SHOULD be linked to one of those existing pages, but currently are not.
Respond EXACTLY in this JSON format and nothing else:
[{"original_text": "keyword", "link_target": "page-slug"}]
Return an empty array [] if no good connections exist based on the allowed targets.`,
            messages: [{ role: 'user', content: finalContent.substring(0, 1500) }]
          })

          try {
             const suggestionText = (linkResponse.content[0] as any).text
             const suggestions = JSON.parse(suggestionText)
             
             if (Array.isArray(suggestions)) {
                 suggestions.forEach((suggestion: any) => {
                     if (suggestion.original_text && suggestion.link_target) {
                         // Very basic string replacement - in prod use AST transformer
                         // We ensure we only replace the FIRST instance and not one already linked
                         const regex = new RegExp(`(?<!\\[\\[)(${suggestion.original_text})(?!\\]\\])`, 'i')
                         finalContent = finalContent.replace(regex, `[[${suggestion.link_target}]]`)
                     }
                 })
             }
          } catch (e) {
             console.log("Failed to parse link suggestions JSON from Claude", e)
          }
      }
    } catch (e) {
      console.error('Auto-linking worker failed', e)
    }

    // If tags changed or links were added, update the file
    if (newTags.length !== existingTags.length || finalContent !== content) {
       const existingContent = await fs.readFile(filePath, 'utf8')
       const parsed = matter(existingContent)
       
       parsed.data.tags = newTags
       parsed.data.ai_processed = new Date().toISOString()
       
       const fileContent = matter.stringify(finalContent, parsed.data)
       await fs.writeFile(filePath, fileContent, 'utf8')
       console.log(`[Worker] Updated ${fileName} with tags (${newTags.length}) and latent links.`)
    }

  } catch (error) {
    console.error(`[Worker] Failed processing ${filePath}`, error)
  }
}
