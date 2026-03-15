"use client"

import { useEffect, useState } from 'react'
import { BrainNote } from '@/app/api/brain/notes/route'
import { Hash, Network, Activity } from 'lucide-react'
import Link from 'next/link'

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

  // 2. Connection Discovery (finding orphaned notes)
  const allLinks = new Set<string>()
  notes.forEach(note => {
    const wikiLinkRegex = /\[\[(.*?)\]\]/g
    const matches = Array.from(note.content.matchAll(wikiLinkRegex))
    matches.forEach(match => {
        const [page] = match[1].split('|')
        const slug = page.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        allLinks.add(slug)
    })
  })
  
  const orphanedNotes = notes.filter(n => !allLinks.has(n.slug) && n.content.indexOf('[[') === -1)
  const connectedNotes = notes.length - orphanedNotes.length

  return (
    <div className="flex-1 w-full overflow-y-auto p-12 max-w-6xl mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3">
          <Activity className="w-8 h-8 text-primary" /> Brain Analytics
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
            <Network className="w-5 h-5 text-destructive" /> Connection Discovery (Orphans)
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
                <div className="text-xs text-muted-foreground line-clamp-1">{note.excerpt}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
