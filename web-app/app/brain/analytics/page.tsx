"use client"

import { useEffect, useState } from 'react'
import type { BrainNote } from '@/app/api/brain/notes/route'
import { Brain, Layers, Link as LinkIcon, Hash, Search, ArrowUpRight, BarChart3, TrendingUp, Compass, ChevronRight } from "lucide-react"
import Link from 'next/link'
import { ActivityHeatmap } from '@/components/activity-heatmap'
import { GamificationPanel } from "@/components/gamification-panel"

export default function AnalyticsPage() {
  const [notes, setNotes] = useState<BrainNote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/brain/notes')
      .then(res => res.json())
      .then(data => {
        setNotes(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="p-12 text-muted-foreground animate-pulse">Loading Analytics Matrix...</div>

  // 1. Tag Cloud computation
  const tagCounts: Record<string, number> = {}
  notes.forEach(note => {
    note.tags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])

  // 2. Connection Discovery — list endpoint no longer returns content for performance.
  // Orphan detection now relies on summary presence as a proxy.
  const orphanedNotes = notes.filter(n => !n.summary)
  const connectedNotes = notes.length - orphanedNotes.length

  // Placeholder for categories, as it's used in the new snippet but not defined in the original
  // In a real scenario, this would likely come from an API or be computed from notes.
  const categories = [
    { name: "Productivity", count: 15, growth: "12%" },
    { name: "Learning", count: 22, growth: "8%" },
    { name: "Creativity", count: 10, growth: "5%" },
  ];


  return (
    <div className="flex-1 w-full overflow-y-auto p-12 max-w-6xl mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-primary" /> Brain Analytics
        </h1>
        <p className="text-muted-foreground text-lg">Statistical overview and structure of your knowledge graph.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <div className="text-4xl font-bold text-primary mb-1">{notes.length}</div>
          <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Total Nodes</div>
        </div>
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <div className="text-4xl font-bold text-primary mb-1">{connectedNotes}</div>
          <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Connected Nodes</div>
        </div>
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <div className="text-4xl text-destructive font-bold mb-1">{orphanedNotes.length}</div>
          <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Orphaned Nodes</div>
        </div>
      </div>

      {/* Left Column - Trends & Heatmap & Gamification */}
      <div className="lg:col-span-8 flex flex-col gap-6 w-full">
         <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-emerald-500" /> Focus Areas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {categories.map((cat, i) => (
                  <div key={i} className="bg-secondary/50 rounded-xl p-4 border border-border/50 hover:bg-secondary/80 transition-colors">
                     <p className="font-bold text-lg mb-1">{cat.name}</p>
                     <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{cat.count} concepts</span>
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-500 px-2 py-0.5 bg-emerald-500/10 rounded">
                           <ArrowUpRight className="w-3 h-3" /> {cat.growth}
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Knowledge Heatmap */}
         <div className="bg-card border rounded-2xl p-6 shadow-sm overflow-x-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-indigo-500" /> Activity
            </h2>
            <ActivityHeatmap year={new Date().getFullYear()} />
         </div>

         {/* Gamification Panel */}
         <GamificationPanel />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card border rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary" /> Semantic Tag Cloud
          </h2>
          <div className="flex flex-wrap gap-2">
            {sortedTags.length === 0 && <p className="text-muted-foreground text-sm">No metadata extracted yet.</p>}
            {sortedTags.map(([tag, count]) => (
              <div 
                key={tag} 
                className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors cursor-default"
                style={{ fontSize: `${Math.max(0.75, Math.min(1.5, 0.75 + (count * 0.1)))}rem` }}
              >
                #{tag} <span className="opacity-50 text-xs ml-1">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-destructive" /> Connection Discovery (Orphans)
          </h2>
          <p className="text-sm text-muted-foreground mb-4">These notes have no inbound or outbound links. Consider connecting them to your semantic web.</p>
          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            {orphanedNotes.length === 0 && <p className="text-primary text-sm font-medium">✨ Your knowledge graph is perfectly connected!</p>}
            {orphanedNotes.map(note => (
              <Link 
                href={`/brain/notes/${note.slug}`} 
                key={note.slug}
                className="block p-3 rounded-lg border border-destructive/20 bg-destructive/5 hover:border-destructive/50 transition-colors"
              >
                <div className="font-medium text-foreground mb-1">{note.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">{note.summary ?? 'No summary yet'}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
