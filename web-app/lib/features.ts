/**
 * Feature gating for subscription tiers.
 *
 * Tiers (ascending): free → pro → team → enterprise
 *
 * Usage:
 *   import { can } from '@/lib/features'
 *   if (!can(user.subscriptionTier, 'semantic_search')) return 403
 */

export type Tier = 'free' | 'pro' | 'team' | 'enterprise'
export type Feature =
  | 'brain_notes'          // Store notes in Brain (free: up to 50, pro: unlimited)
  | 'semantic_search'      // Vector-based semantic search
  | 'ruflo_agents'         // AI agent jobs (summarize, embed, auto-link)
  | 'version_history'      // Note version history
  | 'collaboration'        // Shared workspaces + real-time editing (Team+)
  | 'api_access'           // API key access
  | 'custom_personas'      // Custom cat personalities
  | 'hive_mind'            // Ruflo Hive Mind multi-agent tasks (Team+)
  | 'unlimited_notes'      // No note count cap
  | 'priority_jobs'        // Higher priority in agent job queue
  // ── New features ──────────────────────────────────────────────────────────
  | 'spaced_repetition'    // Flashcard / spaced repetition study mode (pro+)
  | 'note_images'          // AI cover image generation per note (pro+)
  | 'tts'                  // Text-to-speech read-aloud (pro+)
  | 'voice_notes'          // In-browser voice recording → transcription (pro+)
  | 'pdf_import'           // PDF text extraction import (pro+)
  | 'docx_import'          // Word document import (pro+)
  | 'templates_marketplace'// Publish & browse community templates (pro+)
  | 'web_clipper'          // Save any URL as a note (free, rate limited)
  | 'youtube_import'       // YouTube transcript import (pro+)
  | 'notion_import'        // Notion page sync (pro+)
  | 'github_sync'          // GitHub README/issues sync (pro+)
  | 'rss_feeds'            // RSS/Atom feed reader (pro+)
  | 'mermaid_diagrams'     // Render mermaid code blocks (free)
  | 'mind_map'             // Interactive mind map from note content (pro+)
  | 'knowledge_heatmap'    // GitHub-style activity heatmap (free)
  | 'audio_transcription'  // Upload audio file → transcript note (pro+)
  | 'obsidian_import'      // Obsidian vault zip import (pro+)

const TIER_RANK: Record<Tier, number> = {
  free: 0,
  pro: 1,
  team: 2,
  enterprise: 3,
}

// Minimum tier required for each feature
const FEATURE_GATES: Record<Feature, Tier> = {
  // Free
  brain_notes: 'free',
  ruflo_agents: 'free',
  custom_personas: 'free',
  mermaid_diagrams: 'free',
  knowledge_heatmap: 'free',
  web_clipper: 'free',
  // Pro
  semantic_search: 'pro',
  version_history: 'pro',
  api_access: 'pro',
  unlimited_notes: 'pro',
  priority_jobs: 'pro',
  spaced_repetition: 'pro',
  note_images: 'pro',
  tts: 'pro',
  voice_notes: 'pro',
  pdf_import: 'pro',
  docx_import: 'pro',
  templates_marketplace: 'pro',
  youtube_import: 'pro',
  notion_import: 'pro',
  github_sync: 'pro',
  rss_feeds: 'pro',
  mind_map: 'pro',
  audio_transcription: 'pro',
  obsidian_import: 'pro',
  // Team
  collaboration: 'team',
  hive_mind: 'team',
}

export function can(tier: string, feature: Feature): boolean {
  const required = FEATURE_GATES[feature]
  if (!required) return false
  return (TIER_RANK[tier as Tier] ?? 0) >= (TIER_RANK[required] ?? 0)
}

// Daily AI action limits by tier
export const AI_ACTION_LIMITS: Record<Tier, number> = {
  free: 10,
  pro: 500,
  team: 2000,
  enterprise: Infinity,
}

export function aiActionLimit(tier: string): number {
  return AI_ACTION_LIMITS[tier as Tier] ?? AI_ACTION_LIMITS.free
}

// Pricing (in cents)
export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: null,
    stripePriceId: null,
    features: [
      '50 Brain notes',
      '10 AI actions/day',
      'Basic semantic search',
      'Cat personalities',
    ],
    cta: 'Get Started',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 1700, // $17/month
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      'Unlimited Brain notes',
      '500 AI actions/day',
      'Semantic search + RAG',
      'Version history',
      'API access',
      'Priority agent queue',
    ],
    cta: 'Start Pro',
    highlighted: true,
  },
  {
    id: 'team',
    name: 'Team',
    price: 4900, // $49/month
    interval: 'month',
    stripePriceId: process.env.STRIPE_TEAM_PRICE_ID,
    features: [
      'Everything in Pro',
      'Shared Brain workspaces',
      'Real-time collaboration',
      'Ruflo Hive Mind agents',
      '2000 AI actions/day',
      'Admin dashboard',
    ],
    cta: 'Start Team',
  },
] as const
