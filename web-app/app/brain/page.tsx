'use client'

import { Brain, Sparkles, Network, GraduationCap, Upload, Zap, GitBranch, Image, BarChart2, Clock } from 'lucide-react'
import { BrainGraph } from '@/components/brain-graph'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const QUICK_ACTIONS = [
  { icon: Sparkles, label: 'New Note', color: 'text-purple-400', bg: 'bg-purple-500/10', href: null, action: 'new' },
  { icon: Network, label: 'Knowledge Graph', color: 'text-blue-400', bg: 'bg-blue-500/10', href: '/brain/yarn', action: null },
  { icon: GraduationCap, label: 'Flashcards', color: 'text-green-400', bg: 'bg-green-500/10', href: '/brain/flashcards', action: null },
  { icon: Upload, label: 'Import Doc', color: 'text-orange-400', bg: 'bg-orange-500/10', href: '/brain/import', action: null },
  { icon: Zap, label: 'Integrations', color: 'text-yellow-400', bg: 'bg-yellow-500/10', href: '/brain/integrations', action: null },
  { icon: GitBranch, label: 'Timeline', color: 'text-pink-400', bg: 'bg-pink-500/10', href: '/brain/timeline', action: null },
  { icon: Image, label: 'Visual Search', color: 'text-cyan-400', bg: 'bg-cyan-500/10', href: '/brain/visual-search', action: null },
  { icon: BarChart2, label: 'Analytics', color: 'text-indigo-400', bg: 'bg-indigo-500/10', href: '/brain/analytics', action: null },
]

export default function BrainHome() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  const handleNewNote = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/brain/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Untitled Note ${new Date().toLocaleDateString()}`, content: '' }),
      })
      const data = await res.json()
      if (data.slug) router.push(`/brain/notes/${data.slug}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <BrainGraph />
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col pt-24 px-8 pb-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex justify-center mb-6 pointer-events-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <Brain className="w-20 h-20 text-primary relative z-10" strokeWidth={1} />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center mb-2 tracking-tight drop-shadow-xl text-white">
            Meowdel&apos;s 10x Brain
          </h1>
          <p className="text-white/70 text-center mb-10 text-sm max-w-lg mx-auto drop-shadow">
            Obsidian-style knowledge graph with AI superpowers — multi-agent, semantic search, real-time collaboration.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pointer-events-auto">
            {QUICK_ACTIONS.map((item) => {
              const content = (
                <div className="p-4 rounded-xl border border-white/10 bg-black/50 backdrop-blur-md hover:border-white/30 hover:bg-black/60 transition-all group text-center cursor-pointer">
                  <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <span className="text-white/90 text-sm font-medium">{item.label}</span>
                </div>
              )

              if (item.action === 'new') {
                return (
                  <button key={item.label} onClick={handleNewNote} disabled={creating} className="text-left">
                    {content}
                  </button>
                )
              }
              return (
                <Link key={item.label} href={item.href!}>
                  {content}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
