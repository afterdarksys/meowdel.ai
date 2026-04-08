/**
 * Meowdel Intelligence Router
 *
 * Routes each message to the appropriate Claude model tier:
 *   Haiku  — casual chat, quick facts, greetings, simple lookups
 *   Sonnet — code, research, analysis, debugging, medium complexity
 *   Opus   — architecture, deep planning, complex reasoning, system design
 *
 * User override commands (parsed from message):
 *   @haiku / @quick          → force Haiku
 *   @sonnet / @s             → force Sonnet
 *   @opus / @deep / @plan    → force Opus
 *   #save                    → store this exchange in cascade memory
 *   #skill:name              → activate a skill for this turn
 *   #up                      → route to one tier above current
 *   #down                    → route to one tier below current
 */

export type ModelTier = 'haiku' | 'sonnet' | 'opus'

export const MODELS: Record<ModelTier, string> = {
  haiku:  'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-6',
  opus:   'claude-opus-4-6',
}

export const TIER_RANK: Record<ModelTier, number> = { haiku: 0, sonnet: 1, opus: 2 }
export const RANK_TIER: Record<number, ModelTier> = { 0: 'haiku', 1: 'sonnet', 2: 'opus' }

export interface ParsedCommand {
  cleanMessage: string         // message with routing commands stripped
  forcedTier?: ModelTier       // explicit model override
  saveToCascade: boolean       // #save flag
  activeSkillSlugs: string[]   // #skill:name flags
  shiftTier: number            // #up/down relative shift (-1, 0, +1)
}

export interface RouteResult {
  tier: ModelTier
  model: string
  reason: string
  command: ParsedCommand
}

// ── Command parser ────────────────────────────────────────────────────────────

const HAIKU_TRIGGERS  = /^@(haiku|quick|h|fast)\b\s*/i
const SONNET_TRIGGERS = /^@(sonnet|s|normal)\b\s*/i
const OPUS_TRIGGERS   = /^@(opus|deep|plan|think|o)\b\s*/i

export function parseCommands(raw: string): ParsedCommand {
  let msg = raw.trim()
  let forcedTier: ModelTier | undefined
  let saveToCascade = false
  let shiftTier = 0
  const activeSkillSlugs: string[] = []

  // Leading model trigger (must be at start of message)
  if (OPUS_TRIGGERS.test(msg)) {
    msg = msg.replace(OPUS_TRIGGERS, '')
    forcedTier = 'opus'
  } else if (SONNET_TRIGGERS.test(msg)) {
    msg = msg.replace(SONNET_TRIGGERS, '')
    forcedTier = 'sonnet'
  } else if (HAIKU_TRIGGERS.test(msg)) {
    msg = msg.replace(HAIKU_TRIGGERS, '')
    forcedTier = 'haiku'
  }

  // Inline tags (anywhere in message)
  msg = msg.replace(/#save\b/gi, () => { saveToCascade = true; return '' })
  msg = msg.replace(/#up\b/gi, () => { shiftTier = Math.min(shiftTier + 1, 2); return '' })
  msg = msg.replace(/#down\b/gi, () => { shiftTier = Math.max(shiftTier - 1, -2); return '' })
  msg = msg.replace(/#skill:([\w-]+)/gi, (_, slug) => { activeSkillSlugs.push(slug); return '' })

  return {
    cleanMessage: msg.trim(),
    forcedTier,
    saveToCascade,
    activeSkillSlugs,
    shiftTier,
  }
}

// ── Heuristic classifier ──────────────────────────────────────────────────────

interface Message { role: string; content: string }

const OPUS_KEYWORDS = [
  'architect', 'architecture', 'design system', 'roadmap', 'strategy',
  'comprehensive plan', 'long-term', 'tradeoffs', 'deep analysis',
  'from scratch', 'production system', 'scalable', 'entire codebase',
  'step by step plan', 'redesign', 'overhaul', 'think through',
]
const SONNET_KEYWORDS = [
  'code', 'bug', 'debug', 'implement', 'function', 'class', 'refactor',
  'test', 'explain', 'research', 'analyze', 'compare', 'review',
  'fix', 'error', 'exception', 'performance', 'optimize', 'database',
  'api', 'algorithm', 'typescript', 'python', 'javascript', 'rust',
]
const HAIKU_KEYWORDS = [
  'hi', 'hello', 'hey', 'thanks', 'thank you', 'ok', 'okay', 'got it',
  'what time', 'what day', 'weather', 'quick question', 'simple question',
  'just wondering', 'yes', 'no', 'sure', 'cool', 'great', 'awesome',
]

function scoreMessage(message: string, history: Message[]): { tier: ModelTier; reason: string } {
  const lower = message.toLowerCase()
  const wordCount = message.split(/\s+/).length
  const historyDepth = history.length

  // Explicit planning signals → Opus
  const opusHits = OPUS_KEYWORDS.filter(k => lower.includes(k)).length
  if (opusHits >= 2 || (opusHits >= 1 && wordCount > 80)) {
    return { tier: 'opus', reason: `Planning/architecture keywords detected (${opusHits} hits)` }
  }

  // Very long message → likely complex → at least Sonnet
  if (wordCount > 200) {
    return { tier: opusHits > 0 ? 'opus' : 'sonnet', reason: `Long message (${wordCount} words)` }
  }

  // Code blocks → Sonnet minimum
  if (/```/.test(message) || message.includes('function ') || message.includes('class ')) {
    return { tier: 'sonnet', reason: 'Code content detected' }
  }

  // Technical/research keywords → Sonnet
  const sonnetHits = SONNET_KEYWORDS.filter(k => lower.includes(k)).length
  if (sonnetHits >= 1 && wordCount > 10) {
    return { tier: 'sonnet', reason: `Technical keywords detected (${sonnetHits} hits)` }
  }

  // Long conversation → escalate
  if (historyDepth >= 10 && wordCount > 30) {
    return { tier: 'sonnet', reason: `Deep conversation (${historyDepth} turns)` }
  }

  // Clearly casual → Haiku
  const haikuHits = HAIKU_KEYWORDS.filter(k => lower.includes(k)).length
  if (haikuHits >= 1 || wordCount <= 8) {
    return { tier: 'haiku', reason: `Casual message (${wordCount} words)` }
  }

  // Default: Sonnet for anything moderately complex
  if (wordCount > 15) {
    return { tier: 'sonnet', reason: 'Default for substantive messages' }
  }

  return { tier: 'haiku', reason: 'Short/simple message' }
}

// ── Main router ───────────────────────────────────────────────────────────────

export function route(
  rawMessage: string,
  history: Message[] = [],
  currentTier?: ModelTier,
): RouteResult {
  const command = parseCommands(rawMessage)
  let tier: ModelTier
  let reason: string

  if (command.forcedTier) {
    tier = command.forcedTier
    reason = `User forced: @${tier}`
  } else {
    const scored = scoreMessage(command.cleanMessage, history)
    tier = scored.tier
    reason = scored.reason
  }

  // Apply relative shift (#up / #down)
  if (command.shiftTier !== 0) {
    const current = TIER_RANK[tier]
    const shifted = Math.max(0, Math.min(2, current + command.shiftTier))
    tier = RANK_TIER[shifted]
    reason += command.shiftTier > 0 ? ' (+shifted up)' : ' (-shifted down)'
  }

  return { tier, model: MODELS[tier], reason, command }
}
