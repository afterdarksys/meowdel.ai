"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { File, Folder, ChevronRight, ChevronDown, Plus } from 'lucide-react'
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
  const [notes, setNotes] = useState<BrainNote[]>([])
  const [loading, setLoading] = useState(true)
  const [tree, setTree] = useState<TreeNode[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']))

  useEffect(() => {
    fetch('/api/brain/notes')
      .then(res => res.json())
      .then((data: BrainNote[]) => {
        setNotes(data)
        setTree(buildTree(data))
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch notes', err)
        setLoading(false)
      })
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
          existingNode = {
            name: part,
            path: currentPath,
            isDir: !isFile,
            children: [],
          }
          if (isFile) {
            existingNode.note = note
          }
          currentLevel.push(existingNode)
        }
        
        currentLevel = existingNode.children
      })
    })

    // Sort: Dirs first, then files alphabetically
    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
        if (a.isDir === b.isDir) return a.name.localeCompare(b.name)
        return a.isDir ? -1 : 1
      })
      nodes.forEach(n => {
        if (n.isDir) sortNodes(n.children)
      })
    }
    
    sortNodes(root)
    return root
  }

  const toggleExpand = (path: string) => {
    const next = new Set(expanded)
    if (next.has(path)) {
      next.delete(path)
    } else {
      next.add(path)
    }
    setExpanded(next)
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
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
            )}
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

  if (loading) {
    return (
       <div className="p-4 flex flex-col gap-2">
         {[1,2,3,4,5].map(i => (
           <div key={i} className="h-6 bg-muted/50 rounded animate-pulse" style={{ width: `${Math.random() * 40 + 60}%`}}></div>
         ))}
       </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-card/30 border-r w-64 flex-shrink-0">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vault Explorer</span>
        <button className="p-1 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="p-2 overflow-y-auto flex-1 custom-scrollbar">
        {tree.map(node => renderNode(node))}
      </div>
    </div>
  )
}
