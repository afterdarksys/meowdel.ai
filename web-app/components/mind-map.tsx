"use client"

/**
 * MindMap — interactive mind map rendered from AI-extracted concepts.
 * Uses react-d3-tree for the tree layout.
 *
 * npm install react-d3-tree
 *
 * Usage: <MindMap noteId={note.id} />
 */

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Loader2, GitBranch, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

// react-d3-tree must be loaded client-side (uses SVG + DOM APIs)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Tree = dynamic(() => import('react-d3-tree').then((m) => m.Tree as any), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64 text-muted-foreground gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading mind map...</div>,
})

interface MindMapNode {
  name: string
  children?: MindMapNode[]
}

interface MindMapProps {
  noteId: string
  noteTitle?: string
}

export function MindMap({ noteId, noteTitle }: MindMapProps) {
  const [tree, setTree] = useState<MindMapNode | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/brain/mindmap?noteId=${noteId}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTree(data.tree)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate mind map')
    } finally {
      setLoading(false)
    }
  }, [noteId])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Generating mind map with AI...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
      </div>
    )
  }

  if (!tree) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
          <GitBranch className="w-4 h-4" />
          Mind Map
          {noteTitle && <span className="text-foreground">— {noteTitle}</span>}
        </h3>
        <Button variant="ghost" size="sm" onClick={load} className="gap-1 h-7 text-xs">
          <RefreshCw className="w-3 h-3" /> Regenerate
        </Button>
      </div>

      <div
        className="w-full rounded-xl border bg-card overflow-hidden"
        style={{ height: 420 }}
      >
        {(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const T = Tree as any
          return (
            <T
              data={tree}
              orientation="horizontal"
              translate={{ x: 180, y: 210 }}
              separation={{ siblings: 1.2, nonSiblings: 1.5 }}
              nodeSize={{ x: 200, y: 50 }}
              renderCustomNodeElement={({ nodeDatum, toggleNode }: { nodeDatum: any; toggleNode: () => void }) => (
                <g onClick={toggleNode}>
                  <rect x={-80} y={-14} width={160} height={28} rx={6} className="fill-primary/10 stroke-primary/30" strokeWidth={1} />
                  <text
                    className="fill-foreground"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ fontSize: '11px', fontWeight: nodeDatum.children?.length ? 600 : 400 }}
                  >
                    {(nodeDatum.name as string).slice(0, 22)}
                  </text>
                </g>
              )}
              pathClassFunc={() => 'stroke-primary/30 fill-none stroke-1'}
            />
          )
        })()}
      </div>
    </div>
  )
}
