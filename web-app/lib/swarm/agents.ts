/**
 * Ruflo-inspired Swarm Agents
 *
 * Five specialized agents, each with a distinct role in the knowledge brain.
 * All agents share the same memory API but have specialized prompts and tools.
 *
 * Agent taxonomy:
 *   Librarian   — Organizes, tags, and categorizes knowledge
 *   Researcher  — Finds connections, surfaces related context
 *   Synthesizer — Generates summaries, merges overlapping notes
 *   Challenger  — Critiques assumptions, finds contradictions
 *   Curator     — Memory hygiene: deduplicates, rates importance, expires stale facts
 */

import Anthropic from '@anthropic-ai/sdk'
import { embed, searchNotes, searchMemories, upsertMemory } from '@/lib/vector'
import { randomUUID } from 'crypto'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type AgentName = 'librarian' | 'researcher' | 'synthesizer' | 'challenger' | 'curator'

export interface AgentTask {
  agent: AgentName
  userId: string
  input: string           // free-form task description
  context?: string        // additional context (note content, memory dump, etc.)
  noteId?: string
  sessionId?: string
  maxTokens?: number
}

export interface AgentResult {
  agent: AgentName
  output: string
  memoriesStored: number
  metadata?: Record<string, unknown>
}

// ── Agent Definitions ─────────────────────────────────────────────────────────

const AGENT_SYSTEM_PROMPTS: Record<AgentName, string> = {
  librarian: `You are the Librarian — a specialized AI agent responsible for organizing and structuring knowledge.

Your role:
- Analyze notes and memories to suggest optimal tags, categories, and titles
- Identify when content belongs to existing knowledge clusters
- Suggest [[wikilinks]] to related notes the user already has
- Create structured metadata (YAML frontmatter) for unstructured content
- Flag notes that are orphaned (no connections to other notes)

Output format: Always return valid JSON with keys:
{
  "tags": string[],
  "suggestedTitle": string | null,
  "wikilinks": string[],    // titles of notes to link to
  "category": string,       // one of: "project", "reference", "journal", "idea", "research", "meeting"
  "summary": string,        // 1-2 sentence description
  "actions": string[]       // recommended follow-up actions
}`,

  researcher: `You are the Researcher — a specialized AI agent that finds connections and surfaces relevant context.

Your role:
- Given a query or note, identify what other knowledge is most relevant
- Find non-obvious connections between ideas
- Surface memories from past sessions that relate to current work
- Identify gaps in knowledge that should be filled
- Suggest external resources or research directions

Output format: Always return valid JSON with keys:
{
  "connections": [{"title": string, "relevance": string, "score": number}],
  "gaps": string[],           // knowledge gaps identified
  "relatedMemories": string[], // relevant past memories
  "researchSuggestions": string[], // things worth exploring
  "synthesis": string         // 2-3 sentence synthesis of what was found
}`,

  synthesizer: `You are the Synthesizer — a specialized AI agent that creates higher-order understanding from disparate notes.

Your role:
- Merge overlapping notes into coherent, unified documents
- Extract the core insight from a collection of related ideas
- Create executive summaries of large knowledge areas
- Build "evergreen" notes that capture timeless principles
- Identify when multiple notes are really about the same thing

Output format: Always return valid JSON with keys:
{
  "synthesis": string,        // the merged/synthesized content (markdown)
  "keyInsights": string[],    // 3-5 core insights extracted
  "suggestedTitle": string,   // title for the synthesized note
  "mergeRecommendations": [{"noteIds": string[], "reason": string}], // notes to merge
  "evergreen": boolean        // is this synthesis timeless enough to be evergreen?
}`,

  challenger: `You are the Challenger — a specialized AI agent that stress-tests ideas and finds weaknesses.

Your role:
- Identify assumptions that haven't been examined
- Find contradictions between notes or memories
- Apply steelmanning: give the strongest possible counterargument
- Flag logical fallacies or weak reasoning
- Ask the questions that haven't been asked yet

Output format: Always return valid JSON with keys:
{
  "assumptions": string[],    // unexamined assumptions found
  "contradictions": [{"claim1": string, "claim2": string, "explanation": string}],
  "counterarguments": string[], // strongest objections to the main idea
  "weaknesses": string[],     // structural weaknesses in the reasoning
  "questions": string[],      // the questions that should be asked
  "verdict": "strong" | "weak" | "mixed"  // overall assessment
}`,

  curator: `You are the Curator — a specialized AI agent responsible for memory hygiene and knowledge quality.

Your role:
- Identify duplicate or near-duplicate memories and flag for consolidation
- Rate the importance and freshness of stored memories
- Mark stale memories that should be expired or updated
- Ensure high-signal memories aren't buried by low-signal noise
- Maintain the quality and trustworthiness of the knowledge base

Output format: Always return valid JSON with keys:
{
  "duplicates": [{"ids": string[], "consolidatedContent": string}],
  "staleMemories": [{"content": string, "reason": string}],
  "importanceAdjustments": [{"content": string, "oldImportance": number, "newImportance": number, "reason": string}],
  "highValue": string[],      // memories that deserve higher importance
  "toExpire": string[],       // memories that should be removed
  "qualityScore": number      // 1-10 overall quality of the memory corpus
}`,
}

// ── Agent Runner ──────────────────────────────────────────────────────────────

export async function runAgent(task: AgentTask): Promise<AgentResult> {
  const { agent, userId, input, context, sessionId } = task
  const systemPrompt = AGENT_SYSTEM_PROMPTS[agent]

  // Fetch relevant memories to ground the agent
  const queryVector = await embed(input)
  const relevantMemories = await searchMemories(queryVector, userId, 8, 3)
  const memoryContext = relevantMemories.length > 0
    ? '\n\nRelevant memories:\n' + relevantMemories
        .map(m => `- ${(m.payload as Record<string, unknown>).content}`)
        .join('\n')
    : ''

  const userMessage = [
    input,
    context ? `\n\nContext:\n${context}` : '',
    memoryContext,
  ].filter(Boolean).join('')

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: task.maxTokens ?? 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '{}'

  // Parse the JSON output
  let parsed: Record<string, unknown> = {}
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) parsed = JSON.parse(match[0])
  } catch { /* agent output was not JSON — store as-is */ }

  // Store agent insights as memories
  const memoriesStored = await storeAgentInsights(agent, userId, sessionId, parsed, input)

  return {
    agent,
    output: raw,
    memoriesStored,
    metadata: parsed,
  }
}

// ── Memory Persistence ────────────────────────────────────────────────────────

async function storeAgentInsights(
  agent: AgentName,
  userId: string,
  sessionId: string | undefined,
  parsed: Record<string, unknown>,
  originalInput: string,
): Promise<number> {
  const toStore: { content: string; importance: number; type: string }[] = []

  switch (agent) {
    case 'librarian': {
      const summary = parsed.summary as string | undefined
      const category = parsed.category as string | undefined
      if (summary) {
        toStore.push({ content: `[Librarian] ${summary} (category: ${category ?? 'unknown'})`, importance: 5, type: 'fact' })
      }
      break
    }
    case 'researcher': {
      const synthesis = parsed.synthesis as string | undefined
      const gaps = (parsed.gaps as string[] | undefined) ?? []
      if (synthesis) toStore.push({ content: `[Researcher] ${synthesis}`, importance: 6, type: 'reasoning' })
      gaps.slice(0, 2).forEach(g => toStore.push({ content: `[Knowledge gap] ${g}`, importance: 7, type: 'fact' }))
      break
    }
    case 'synthesizer': {
      const insights = (parsed.keyInsights as string[] | undefined) ?? []
      insights.slice(0, 3).forEach(i => toStore.push({ content: `[Synthesis] ${i}`, importance: 8, type: 'reasoning' }))
      break
    }
    case 'challenger': {
      const contradictions = (parsed.contradictions as Array<{claim1: string; claim2: string; explanation: string}> | undefined) ?? []
      const questions = (parsed.questions as string[] | undefined) ?? []
      contradictions.slice(0, 2).forEach(c =>
        toStore.push({ content: `[Contradiction] ${c.explanation}`, importance: 8, type: 'reasoning' })
      )
      questions.slice(0, 2).forEach(q =>
        toStore.push({ content: `[Open question] ${q}`, importance: 6, type: 'reasoning' })
      )
      break
    }
    case 'curator': {
      const qualityScore = parsed.qualityScore as number | undefined
      if (qualityScore != null) {
        toStore.push({ content: `[Curator] Memory corpus quality score: ${qualityScore}/10 for task: ${originalInput.slice(0, 100)}`, importance: 4, type: 'fact' })
      }
      break
    }
  }

  if (toStore.length === 0) return 0

  await Promise.all(toStore.map(async (m) => {
    const vector = await embed(m.content)
    await upsertMemory({
      id: randomUUID(),
      vector,
      payload: {
        userId,
        sessionId,
        type: m.type as 'fact' | 'preference' | 'reasoning' | 'project' | 'decision',
        content: m.content,
        importance: m.importance,
        createdAt: new Date().toISOString(),
      },
    })
  }))

  return toStore.length
}
