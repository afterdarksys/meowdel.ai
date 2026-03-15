"use client"

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { BrainNote } from '@/app/api/brain/notes/route'

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false, loading: () => <div className="h-full w-full bg-background flex items-center justify-center animate-pulse">Initializing 3D Brain Matrix...</div> }) as any

interface GraphData {
  nodes: { id: string; name: string; val: number; group: number }[]
  links: { source: string; target: string; value: number }[]
}

export function BrainGraph() {
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const fgRef = useRef<any>(null)

  useEffect(() => {
    fetch('/api/brain/notes')
      .then(res => res.json())
      .then((notes: BrainNote[]) => {
        
        const nodes: any[] = []
        const links: any[] = []
        const nodeSet = new Set<string>()

        // Pass 1: Create all nodes
        notes.forEach(n => {
          nodeSet.add(n.slug)
          nodes.push({
            id: n.slug,
            name: n.title,
            val: Math.max(2, (n.tags?.length || 0) * 2), // Size node by number of tags roughly
            group: n.tags?.[0] ? String(n.tags[0]).split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0) % 10 : 0 // Hash first tag for color grouping
          })
        })

        // Pass 2: Brute-force link extraction from content (simple regex for [[wikilinks]])
        notes.forEach(sourceNode => {
          const wikiLinkRegex = /\[\[(.*?)\]\]/g;
          const matches = Array.from(sourceNode.content.matchAll(wikiLinkRegex));
          
          matches.forEach(match => {
            const linkText = match[1];
            const [page] = linkText.split('|');
            const targetSlug = page.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            
            // Only link if the target node actually exists in our graph
            if (nodeSet.has(targetSlug)) {
              links.push({
                source: sourceNode.slug,
                target: targetSlug,
                value: 1
              })
            }
          })
        })

        setData({ nodes, links })
        setLoading(false)
      })
      .catch(console.error)
  }, [])

  const handleNodeClick = useCallback(
    (node: any) => {
      // Aim at node from outside it
      const distance = 40;
      const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

      if (fgRef.current) {
        fgRef.current.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
          node, // lookAt ({ x, y, z })
          3000  // ms transition duration
        );
      }
      
      // Navigate to the note after a short delay for the camera zoom
      setTimeout(() => {
          router.push(`/brain/notes/${node.id}`)
      }, 1500)
    },
    [router]
  );
  
  if (loading) return null;

  return (
    <div className="h-full w-full bg-black relative">
      {/* @ts-ignore */}
      <ForceGraph3D
        ref={fgRef}
        graphData={data}
        nodeLabel="name"
        nodeColor={(node: any) => {
            const colors = ['#8a2be2', '#b45cff', '#00f0ff', '#ff003c', '#00ff66', '#ff00ff', '#f0f0f2', '#1a1a1c', '#a1a1aa', '#fca5a5']
            return colors[node.group] || colors[0]
        }}
        nodeRelSize={4}
        linkWidth={1.5}
        linkColor={() => 'rgba(255, 255, 255, 0.15)'}
        backgroundColor="#050506" // Deep dark background matching app tokens
        onNodeClick={handleNodeClick}
      />
      <div className="absolute bottom-6 left-6 pointer-events-none bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
        <h3 className="text-white font-medium mb-1">Knowledge Constellation</h3>
        <p className="text-xs text-white/50">{data.nodes.length} Thoughts &bull; {data.links.length} Synapses</p>
      </div>
    </div>
  )
}
