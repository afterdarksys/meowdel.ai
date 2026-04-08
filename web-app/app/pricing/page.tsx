'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: null as null,
    stripePriceId: null as string | null,
    features: [
      '50 Brain notes',
      '10 AI actions / day',
      'Web clipper (5 clips/day)',
      'Mermaid diagrams',
      'Activity heatmap',
      'Cat personalities',
      'Community support',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 17,
    interval: 'month' as const,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? 'price_1TJGffRzkrRnzwVvFUcFALa1',
    features: [
      'Unlimited Brain notes',
      '500 AI actions / day',
      'Semantic search + RAG',
      'Version history + flashcards',
      'PDF, DOCX, audio import',
      'YouTube transcript import',
      'Web clipper (unlimited)',
      'Text-to-speech read-aloud',
      'AI cover image generation',
      'Mind maps + RSS feeds',
      'API access',
      'Email support',
    ],
    cta: 'Start Pro',
    highlighted: true,
  },
  {
    id: 'team',
    name: 'Team',
    price: 49,
    interval: 'month' as const,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID ?? null,
    features: [
      'Everything in Pro',
      'Shared Brain workspaces',
      'Real-time collaboration',
      'Ruflo Hive Mind agents',
      '2,000 AI actions / day',
      'Admin dashboard',
      'Priority support',
    ],
    cta: 'Start Team',
    highlighted: false,
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)

  async function subscribe(plan: typeof PLANS[number]) {
    if (!plan.stripePriceId) {
      window.location.href = '/chat'
      return
    }

    setLoading(plan.id)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan.stripePriceId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-20">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Supercharge Your Brain
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Obsidian-style knowledge management with AI superpowers. Start free, upgrade when you need more.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                plan.highlighted
                  ? 'border-purple-500 bg-purple-950/30 shadow-lg shadow-purple-900/20'
                  : 'border-zinc-800 bg-zinc-900/50'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">{plan.name}</h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  {plan.interval && (
                    <span className="text-zinc-400 text-sm">/ {plan.interval}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => subscribe(plan)}
                disabled={loading === plan.id}
                className={`w-full rounded-xl py-3 font-semibold text-sm transition-all ${
                  plan.highlighted
                    ? 'bg-purple-500 hover:bg-purple-400 text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === plan.id ? 'Redirecting...' : plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-zinc-600 text-sm mt-12">
          All plans include a 14-day money-back guarantee. No questions asked.
        </p>
      </div>
    </main>
  )
}
