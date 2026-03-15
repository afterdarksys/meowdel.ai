import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { searchBrain } from '@/lib/brain/rag'
import { getPersonalityById } from '@/lib/personality/engine'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Combined operations schema
const combineRequestSchema = z.object({
  query: z.string().min(1),
  operations: z.array(
    z.enum([
      'search-brain',       // Search brain for relevant notes
      'chat-primary',       // Chat with primary personality
      'chat-secondary',     // Chat with secondary personality
      'multi-agent-debate', // Multi-agent debate between personalities
      'summarize',          // Summarize results
      'synthesize',         // Synthesize all results into final answer
    ])
  ).min(1),
  primaryPersonality: z.string().optional().default('mittens'),
  secondaryPersonality: z.string().optional().default('professor'),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).optional().default([]),
})

// API Key validation
function validateApiKey(request: NextRequest): { valid: boolean; userId?: string } {
  const authHeader = request.headers.get('authorization')
  const apiKey = authHeader?.replace('Bearer ', '')

  if (apiKey && apiKey.startsWith('meow_')) {
    return { valid: true, userId: apiKey }
  }

  return { valid: false }
}

export async function POST(request: NextRequest) {
  try {
    const { valid, userId } = validateApiKey(request)
    if (!valid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validationResult = combineRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { query, operations, primaryPersonality, secondaryPersonality, conversationHistory } = validationResult.data

    const results: any = {
      query,
      operations: [],
      timestamp: new Date().toISOString(),
    }

    let brainSnippets: any[] = []
    let primaryResponse = ''
    let secondaryResponse = ''

    // Execute operations in sequence
    for (const operation of operations) {
      const opResult: any = { operation, startedAt: new Date().toISOString() }

      try {
        switch (operation) {
          case 'search-brain':
            brainSnippets = await searchBrain(query)
            opResult.result = {
              found: brainSnippets.length,
              snippets: brainSnippets.map(s => ({
                id: s.id,
                score: s.score,
                preview: s.content.substring(0, 200) + '...'
              }))
            }
            break

          case 'chat-primary':
            const primary = getPersonalityById(primaryPersonality)!
            let primaryPrompt = query
            if (brainSnippets.length > 0) {
              const contextXML = brainSnippets.map(doc =>
                `<document id="${doc.id}">\n${doc.content}\n</document>`
              ).join('\n\n')
              primaryPrompt = `${query}\n\n<brain_context>\n${contextXML}\n</brain_context>`
            }

            const primaryRes = await anthropic.messages.create({
              model: 'claude-sonnet-4-5-20250929',
              max_tokens: 1500,
              system: primary.systemPrompt,
              messages: [{ role: 'user', content: primaryPrompt }],
            })
            primaryResponse = primaryRes.content[0].type === 'text' ? primaryRes.content[0].text : ''
            opResult.result = {
              personality: primary.name,
              response: primaryResponse,
              tokens: primaryRes.usage
            }
            break

          case 'chat-secondary':
            const secondary = getPersonalityById(secondaryPersonality)!
            let secondaryPrompt = query
            if (brainSnippets.length > 0) {
              const contextXML = brainSnippets.map(doc =>
                `<document id="${doc.id}">\n${doc.content}\n</document>`
              ).join('\n\n')
              secondaryPrompt = `${query}\n\n<brain_context>\n${contextXML}\n</brain_context>`
            }

            const secondaryRes = await anthropic.messages.create({
              model: 'claude-sonnet-4-5-20250929',
              max_tokens: 1500,
              system: secondary.systemPrompt,
              messages: [{ role: 'user', content: secondaryPrompt }],
            })
            secondaryResponse = secondaryRes.content[0].type === 'text' ? secondaryRes.content[0].text : ''
            opResult.result = {
              personality: secondary.name,
              response: secondaryResponse,
              tokens: secondaryRes.usage
            }
            break

          case 'multi-agent-debate':
            const p1 = getPersonalityById(primaryPersonality)!
            const p2 = getPersonalityById(secondaryPersonality)!

            // Round 1: Both respond to query
            const round1P1 = await anthropic.messages.create({
              model: 'claude-sonnet-4-5-20250929',
              max_tokens: 800,
              system: p1.systemPrompt,
              messages: [{ role: 'user', content: query }],
            })
            const r1p1 = round1P1.content[0].type === 'text' ? round1P1.content[0].text : ''

            const round1P2 = await anthropic.messages.create({
              model: 'claude-sonnet-4-5-20250929',
              max_tokens: 800,
              system: p2.systemPrompt,
              messages: [{ role: 'user', content: query }],
            })
            const r1p2 = round1P2.content[0].type === 'text' ? round1P2.content[0].text : ''

            // Round 2: Each responds to the other
            const round2P1 = await anthropic.messages.create({
              model: 'claude-sonnet-4-5-20250929',
              max_tokens: 800,
              system: p1.systemPrompt,
              messages: [
                { role: 'user', content: query },
                { role: 'assistant', content: r1p1 },
                { role: 'user', content: `${p2.name} responded: "${r1p2}". What do you think about their perspective?` }
              ],
            })
            const r2p1 = round2P1.content[0].type === 'text' ? round2P1.content[0].text : ''

            const round2P2 = await anthropic.messages.create({
              model: 'claude-sonnet-4-5-20250929',
              max_tokens: 800,
              system: p2.systemPrompt,
              messages: [
                { role: 'user', content: query },
                { role: 'assistant', content: r1p2 },
                { role: 'user', content: `${p1.name} responded: "${r1p1}". What do you think about their perspective?` }
              ],
            })
            const r2p2 = round2P2.content[0].type === 'text' ? round2P2.content[0].text : ''

            opResult.result = {
              rounds: [
                {
                  round: 1,
                  [p1.name]: r1p1,
                  [p2.name]: r1p2,
                },
                {
                  round: 2,
                  [p1.name]: r2p1,
                  [p2.name]: r2p2,
                }
              ]
            }
            break

          case 'synthesize':
            const synthesizerPrompt = `You are a synthesis agent. Review the following information and provide a comprehensive, well-structured answer to the user's query.

User Query: ${query}

${brainSnippets.length > 0 ? `Brain Knowledge:\n${brainSnippets.map(s => `- ${s.id}: ${s.content.substring(0, 300)}`).join('\n\n')}` : ''}

${primaryResponse ? `Primary Agent Response:\n${primaryResponse}` : ''}

${secondaryResponse ? `Secondary Agent Response:\n${secondaryResponse}` : ''}

Synthesize this information into a clear, actionable answer.`

            const synthRes = await anthropic.messages.create({
              model: 'claude-sonnet-4-5-20250929',
              max_tokens: 2000,
              messages: [{ role: 'user', content: synthesizerPrompt }],
            })

            const synthesis = synthRes.content[0].type === 'text' ? synthRes.content[0].text : ''
            opResult.result = {
              synthesis,
              tokens: synthRes.usage
            }
            break
        }

        opResult.completedAt = new Date().toISOString()
        opResult.success = true
      } catch (error) {
        opResult.error = error instanceof Error ? error.message : 'Unknown error'
        opResult.success = false
      }

      results.operations.push(opResult)
    }

    return NextResponse.json({
      success: true,
      data: results
    })

  } catch (error) {
    console.error('Combine API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
