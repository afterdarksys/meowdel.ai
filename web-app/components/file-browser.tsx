"use client"

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { File, Folder, ChevronRight, ChevronDown, Plus, Search, X } from 'lucide-react'
import { BrainNote } from '@/app/api/brain/notes/route'

interface FileTreeProps {
  currentSlug?: string
}

interface TreeNode {
  name: string
  path: string
  isDir: boolean
  children: TreeNode[]
  note?: BrainNote
}

export function FileBrowser({ currentSlug }: FileTreeProps) {
  const router = useRouter()
  const [notes, setNotes] = useState<BrainNote[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']))
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [showNewInput, setShowNewInput] = useState(false)

  useEffect(() => {
    fetch('/api/brain/notes')
      .then(res => res.json())
      .then((data: BrainNote[]) => {
        setNotes(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function buildTree(notes: BrainNote[]): TreeNode[] {
    const root: TreeNode[] = []

    notes.forEach(note => {
      const parts = note.slug.split('/')
      let currentLevel = root
      let currentPath = ''

      parts.forEach((part, i) => {
        const isFile = i === parts.length - 1
        currentPath = currentPath ? `${currentPath}/${part}` : part

        let existingNode = currentLevel.find(n => n.name === part)
        if (!existingNode) {
          existingNode = { name: part, path: currentPath, isDir: !isFile, children: [] }
          if (isFile) existingNode.note = note
          currentLevel.push(existingNode)
        }
        currentLevel = existingNode.children
      })
    })

    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
        if (a.isDir === b.isDir) return a.name.localeCompare(b.name)
        return a.isDir ? -1 : 1
      })
      nodes.forEach(n => { if (n.isDir) sortNodes(n.children) })
    }
    sortNodes(root)
    return root
  }

  // When searching, flatten to matching notes only
  const filteredNotes = useMemo(() => {
    if (!search.trim()) return null
    const q = search.toLowerCase()
    return notes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.slug.toLowerCase().includes(q) ||
      (n.tags ?? []).some(t => t.toLowerCase().includes(q))
    )
  }, [notes, search])

  const tree = useMemo(() => buildTree(notes), [notes])

  const toggleExpand = (path: string) => {
    const next = new Set(expanded)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    setExpanded(next)
  }

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
      if (data.slug) {
        // Add to local list optimistically
        setNotes(prev => [{
          id: data.id ?? '',
          slug: data.slug,
          title: newTitle.trim(),
          tags: [],
          summary: null,
          wordCount: 0,
          updatedAt: new Date(),
        }, ...prev])
        router.push(`/brain/notes/${data.slug}`)
      }
    } finally {
      setCreating(false)
      setShowNewInput(false)
      setNewTitle('')
    }
  }

  const renderNode = (node: TreeNode, level = 0) => {
    const isExpanded = expanded.has(node.path)
    const isActive = currentSlug === node.path

    return (
      <div key={node.path}>
        {node.isDir ? (
          <div
            className="flex items-center gap-2 py-1.5 px-2 hover:bg-secondary rounded-md cursor-pointer text-sm text-foreground/80 group transition-colors"
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => toggleExpand(node.path)}
          >
            {isExpanded
              ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
            }
            <Folder className="w-4 h-4 text-primary/80" />
            <span className="truncate">{node.name}</span>
          </div>
        ) : (
          <Link
            href={`/brain/notes/${node.path}`}
            className={`flex items-center gap-2 py-1.5 px-2 rounded-md text-sm transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
            style={{ paddingLeft: `${level * 12 + 24}px` }}
          >
            <File className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{node.note?.title || node.name}</span>
          </Link>
        )}
        {node.isDir && isExpanded && (
          <div className="mt-0.5">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-card/30 border-r w-64 flex-shrink-0">
      {/* Header */}
      <div className="px-3 py-3 border-b flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Vault{notes.length > 0 ? ` · ${notes.length}` : ''}
        </span>
        <button
          onClick={() => setShowNewInput(v => !v)}
          className="p-1 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground"
          title="New note"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* New note inline input */}
      {showNewInput && (
        <div className="px-2 py-2 border-b border-border flex gap-1">
          <input
            autoFocus
            type="text"
            placeholder="Note title..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') createNote()
              if (e.key === 'Escape') { setShowNewInput(false); setNewTitle('') }
            }}
            className="flex-1 min-w-0 px-2 py-1 bg-secondary border border-border rounded text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={createNote}
            disabled={!newTitle.trim() || creating}
            className="px-2 py-1 bg-primary hover:bg-primary/90 disabled:opacity-40 text-primary-foreground rounded text-xs font-medium transition-colors"
          >
            {creating ? '…' : '→'}
          </button>
        </div>
      )}

      {/* Search */}
      <div className="px-2 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-6 pr-6 py-1 bg-secondary border border-border rounded text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Tree / flat search results */}
      <div className="p-2 overflow-y-auto flex-1 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col gap-2 p-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-5 bg-muted/50 rounded animate-pulse" style={{ width: `${60 + i * 7}%` }} />
            ))}
          </div>
        ) : filteredNotes !== null ? (
          filteredNotes.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-4 text-center">No matches</p>
          ) : (
            filteredNotes.map(note => (
              <Link
                key={note.id}
                href={`/brain/notes/${note.slug}`}
                className={`flex items-center gap-2 py-1.5 px-2 rounded-md text-sm transition-colors ${
                  currentSlug === note.slug
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <File className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{note.title}</span>
              </Link>
            ))
          )
        ) : (
          tree.map(node => renderNode(node))
        )}
      </div>
    </div>
  )
}
