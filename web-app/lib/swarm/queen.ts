/**
 * Queen Orchestrator — Ruflo Swarm Coordinator
 *
 * The Queen receives high-level tasks and:
 * 1. Decides which agents to invoke and in what order
 * 2. Routes sub-tasks to specialized agents
 * 3. Synthesizes results into a coherent response
 * 4. Stores the orchestration outcome as a structured memory
 *
 * The Queen uses Claude Sonnet to reason about task decomposition,
 * then dispatches to agents in parallel where possible.
 *
 * Task types:
 *   "analyze"   → Researcher + Challenger
 *   "organize"  → Librarian + Curator
 *   "synthesize" → Researcher + Synthesizer
 *   "deep_dive" → All 5 agents (sequential: Researcher → Synthesizer → Challenger → Librarian → Curator)
 *   "auto"      → Queen decides which agents to use based on the task
 */

import Anthropic from '@anthropic-ai/sdk'
import { runAgent, AgentName, AgentResult } from './agents'
import { embed, upsertMemory } from '@/lib/vector'
import { randomUUID } from 'crypto'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type SwarmMode = 'analyze' | 'organize' | 'synthesize' | 'deep_dive' | 'auto'

export interface SwarmTask {
  mode: SwarmMode
  userId: string
  input: string
  context?: string
  noteId?: string
  sessionId?: string
}

export interface SwarmResult {
  mode: SwarmMode
  agentsUsed: AgentName[]
  results: AgentResult[]
  queenSynthesis: string
  memoriesStored: number
  duration: number
}

// Static agent routing by mode
const MODE_AGENTS: Record<Exclude<SwarmMode, 'auto'>, AgentName[]> = {
  analyze: ['researcher', 'challenger'],
  organize: ['librarian', 'curator'],
  synthesize: ['researcher', 'synthesizer'],
  deep_dive: ['researcher', 'synthesizer', 'challenger', 'librarian', 'curator'],
}

const QUEEN_SYSTEM = `You are the Queen — the orchestrator of a swarm of specialized AI agents.

You receive a task and the results from multiple specialized agents (Librarian, Researcher, Synthesizer, Challenger, Curator).

Your job:
1. Synthesize the agents' findings into a coherent, actionable response
2. Identify the most important insights across all agent outputs
3. Provide a clear "so what" — what should the user actually DO with this?
4. Note any conflicts between agent findings

Output format: Valid JSON with:
{
  "synthesis": string,           // the integrated understanding (2-4 paragraphs, markdown)
  "keyInsights": string[],       // top 3-5 insights across all agents
  "recommendedActions": string[], // concrete next steps for the user
  "conflicts": string[],         // where agents disagreed
  "confidence": "high" | "medium" | "low"
}`

export async function runSwarm(task: SwarmTask): Promise<SwarmResult> {
  const startTime = Date.now()
  const sessionId = task.sessionId ?? `swarm-${Date.now()}`

  // Determine which agents to use
  let agentsToUse: AgentName[]

  if (task.mode === 'auto') {
    agentsToUse = await queenDecideAgents(task.input, task.context)
  } else {
    agentsToUse = MODE_AGENTS[task.mode]
  }

  // Run agents — parallel where possible, sequential for deep_dive
  let results: AgentResult[]

  if (task.mode === 'deep_dive') {
    // Sequential: each agent can build on previous context
    results = []
    let accumulatedContext = task.context ?? ''
    for (const agentName of agentsToUse) {
      const result = await runAgent({
        agent: agentName,
        userId: task.userId,
        input: task.input,
        context: accumulatedContext.slice(0, 4000),
        noteId: task.noteId,
        sessionId,
      })
      results.push(result)
      // Feed this agent's output to the next one
      accumulatedContext += `\n\n[${agentName} output]:\n${result.output}`
    }
  } else {
    // Parallel execution
    results = await Promise.all(
      agentsToUse.map(agentName => runAgent({
        agent: agentName,
        userId: task.userId,
        input: task.input,
        context: task.context,
        noteId: task.noteId,
        sessionId,
      }))
    )
  }

  // Queen synthesizes all agent outputs
  const agentSummaries = results.map(r =>
    `=== ${r.agent.toUpperCase()} ===\n${r.output.slice(0, 1500)}`
  ).join('\n\n')

  const queenMsg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: QUEEN_SYSTEM,
    messages: [{
      role: 'user',
      content: `Original task: ${task.input}\n\nAgent outputs:\n\n${agentSummaries}`,
    }],
  })

  const queenRaw = queenMsg.content[0].type === 'text' ? queenMsg.content[0].text.trim() : '{}'

  let queenParsed: { synthesis?: string; keyInsights?: string[]; recommendedActions?: string[] } = {}
  try {
    const match = queenRaw.match(/\{[\s\S]*\}/)
    if (match) queenParsed = JSON.parse(match[0])
  } catch { /* ignore */ }

  const queenSynthesis = queenParsed.synthesis ?? queenRaw

  // Store Queen synthesis as a high-importance memory
  let memoriesStored = results.reduce((sum, r) => sum + r.memoriesStored, 0)

  const insights = queenParsed.keyInsights ?? []
  if (insights.length > 0) {
    await Promise.all(insights.slice(0, 3).map(async (insight) => {
      const vector = await embed(insight)
      await upsertMemory({
        id: randomUUID(),
        vector,
        payload: {
          userId: task.userId,
          sessionId,
          type: 'reasoning',
          content: `[Queen synthesis] ${insight}`,
          importance: 9,
          createdAt: new Date().toISOString(),
        },
      })
      memoriesStored++
    }))
  }

  // Store recommended actions as decisions
  const actions = queenParsed.recommendedActions ?? []
  if (actions.length > 0) {
    await Promise.all(actions.slice(0, 2).map(async (action) => {
      const vector = await embed(action)
      await upsertMemory({
        id: randomUUID(),
        vector,
        payload: {
          userId: task.userId,
          sessionId,
          type: 'decision',
          content: `[Action item] ${action}`,
          importance: 7,
          createdAt: new Date().toISOString(),
        },
      })
      memoriesStored++
    }))
  }

  return {
    mode: task.mode,
    agentsUsed: agentsToUse,
    results,
    queenSynthesis,
    memoriesStored,
    duration: Date.now() - startTime,
  }
}

// Queen decides which agents to use for an "auto" mode task
async function queenDecideAgents(input: string, context?: string): Promise<AgentName[]> {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `You are routing a task to specialized agents. Choose 2-3 agents from: librarian, researcher, synthesizer, challenger, curator.

Task: ${input}
${context ? `Context: ${context.slice(0, 500)}` : ''}

Return a JSON array of agent names. Example: ["researcher", "synthesizer"]
Only return the JSON array.`,
    }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '["researcher"]'
  try {
    const match = raw.match(/\[[\s\S]*\]/)
    if (match) {
      const agents = JSON.parse(match[0]) as string[]
      const valid: AgentName[] = ['librarian', 'researcher', 'synthesizer', 'challenger', 'curator']
      return agents.filter(a => valid.includes(a as AgentName)) as AgentName[]
    }
  } catch { /* ignore */ }
  return ['researcher', 'synthesizer']
}
