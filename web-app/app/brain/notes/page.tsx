'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, FileText, Tag, Clock, Hash,
  Trash2, ExternalLink, BookOpen, TrendingUp, Layers
} from 'lucide-react'

interface BrainNote {
  id: string
  slug: string
  title: string
  tags: string[]
  summary: string | null
  wordCount: number
  updatedAt: string
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

export default function NotesPage() {
  const router = useRouter()
  const [notes, setNotes] = useState<BrainNote[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)

  useEffect(() => {
    fetch('/api/brain/notes')
      .then(r => r.json())
      .then(data => {
        setNotes(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const tagCounts = useMemo(() => {
    const map = new Map<string, number>()
    notes.forEach(n => (n.tags ?? []).forEach(t => map.set(t, (map.get(t) ?? 0) + 1)))
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)
  }, [notes])

  const filtered = useMemo(() => {
    let result = notes
    if (activeTag) result = result.filter(n => (n.tags ?? []).includes(activeTag))
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        (n.summary ?? '').toLowerCase().includes(q) ||
        (n.tags ?? []).some(t => t.toLowerCase().includes(q))
      )
    }
    return result
  }, [notes, search, activeTag])

  const totalWords = useMemo(() => notes.reduce((sum, n) => sum + (n.wordCount ?? 0), 0), [notes])

  async function createNote() {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/brain/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      })
      const data = await res.json()
      if (data.slug) router.push(`/brain/notes/${data.slug}`)
    } finally {
      setCreating(false)
      setShowNewModal(false)
      setNewTitle('')
    }
  }

  async function deleteNote(note: BrainNote, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Delete "${note.title}"?`)) return
    setDeleting(note.id)
    await fetch(`/api/brain/notes/${note.slug}`, { method: 'DELETE' })
    setNotes(prev => prev.filter(n => n.id !== note.id))
    setDeleting(null)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Notes
          </h1>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        </div>

        {!loading && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{notes.length} notes</span>
            <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{totalWords.toLocaleString()} words</span>
            <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" />{tagCounts.length} tags</span>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notes by title, summary, or tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Tag sidebar */}
        {tagCounts.length > 0 && (
          <div className="w-44 shrink-0 border-r border-border overflow-y-auto py-3 px-2 hidden md:flex flex-col gap-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Tags</p>
            <button
              onClick={() => setActiveTag(null)}
              className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center justify-between transition-colors ${
                activeTag === null ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <span>All</span>
              <span className="text-xs opacity-60">{notes.length}</span>
            </button>
            {tagCounts.map(([tag, count]) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center justify-between transition-colors ${
                  activeTag === tag ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <span className="truncate flex items-center gap-1.5">
                  <Tag className="w-3 h-3 shrink-0" />{tag}
                </span>
                <span className="text-xs opacity-60 shrink-0">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Notes grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-36 bg-card/50 rounded-xl border border-border animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">
                {search || activeTag ? 'No notes match your filter.' : 'No notes yet — create your first one.'}
              </p>
              {!search && !activeTag && (
                <button
                  onClick={() => setShowNewModal(true)}
                  className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create first note
                </button>
              )}
            </div>
          ) : (
            <>
              {(search || activeTag) && (
                <p className="text-xs text-muted-foreground mb-3">
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                  {search ? ` for "${search}"` : ''}
                  {activeTag ? ` tagged "${activeTag}"` : ''}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map(note => (
                  <div
                    key={note.id}
                    onClick={() => router.push(`/brain/notes/${note.slug}`)}
                    className="group relative bg-card/60 hover:bg-card border border-border hover:border-primary/30 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md flex flex-col"
                  >
                    <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); router.push(`/brain/notes/${note.slug}`) }}
                        className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground"
                        title="Open"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={e => deleteNote(note, e)}
                        disabled={deleting === note.id}
                        className="p-1 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-400 disabled:opacity-40"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="font-medium text-foreground text-sm leading-snug pr-12 mb-1.5 line-clamp-2">
                      {note.title}
                    </h3>

                    {note.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-1">{note.summary}</p>
                    )}

                    {(note.tags ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(note.tags ?? []).slice(0, 4).map(tag => (
                          <span
                            key={tag}
                            onClick={e => { e.stopPropagation(); setActiveTag(tag) }}
                            className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs hover:bg-primary/20 transition-colors"
                          >
                            {tag}
                          </span>
                        ))}
                        {(note.tags ?? []).length > 4 && (
                          <span className="text-xs text-muted-foreground">+{note.tags.length - 4}</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-1 border-t border-border/50">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(note.updatedAt)}</span>
                      {(note.wordCount ?? 0) > 0 && (
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{note.wordCount.toLocaleString()}w</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Note Modal */}
      {showNewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setShowNewModal(false) }}
        >
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-foreground mb-4">New Note</h2>
            <input
              autoFocus
              type="text"
              placeholder="Note title..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') createNote()
                if (e.key === 'Escape') setShowNewModal(false)
              }}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary text-sm mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowNewModal(false); setNewTitle('') }}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createNote}
                disabled={!newTitle.trim() || creating}
                className="px-4 py-1.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-lg text-sm font-medium transition-colors"
              >
                {creating ? 'Creating...' : 'Create & Open'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
