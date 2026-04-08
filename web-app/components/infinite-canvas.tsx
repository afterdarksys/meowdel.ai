"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  Panel
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { FileText, Save, Plus, Loader2 } from "lucide-react"
import { BrainNote } from "@/app/api/brain/notes/route"

// Define a custom node styling for notes
function NoteNode({ data }: { data: any }) {
  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl shadow-lg p-4 w-64 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-2 border-b pb-2 mb-2 border-border/50">
         <FileText className="w-4 h-4 text-primary" />
         <h3 className="font-bold text-sm truncate">{data.title}</h3>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">
         {data.summary || "No content summary available."}
      </p>
      {data.tags && data.tags.length > 0 && (
         <div className="flex gap-1 mt-3 overflow-hidden">
            {data.tags.slice(0, 3).map((tag: string, i: number) => (
               <span key={i} className="text-[9px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-sm font-mono truncate">
                  {tag}
               </span>
            ))}
         </div>
      )}
    </div>
  )
}

const nodeTypes = {
  noteNote: NoteNode,
}

export function InfiniteCanvas() {
  const router = useRouter()
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [notes, setNotes] = useState<BrainNote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial load: Fetch notes and setup a basic grid
    const loadNotes = async () => {
      try {
        const res = await fetch('/api/brain/notes')
        const data: BrainNote[] = await res.json()
        setNotes(data)

        // Generate initial nodes in a simple layout if there is no saved state
        // In a real app, we'd fetch this from a saved JSON file or DB
        const initialNodes: Node[] = data.slice(0, 10).map((note, i) => {
            // Simple spiral/grid generation for default placement
            const cols = 4
            const row = Math.floor(i / cols)
            const col = i % cols
            return {
              id: note.slug,
              type: 'noteNote',
              position: { x: col * 320 + 100, y: row * 250 + 100 },
              data: { title: note.title, excerpt: note.summary ?? "", tags: note.tags }
            }
        })
        
        // Very basic edge detection (based on internal wikilinks if possible, but skipping for MVP simple canvas)
        setNodes(initialNodes)
      } catch (e) {
        console.error("Failed to load notes for canvas", e)
      } finally {
        setLoading(false)
      }
    }
    loadNotes()
  }, [])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  )
  
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  )

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: 'hsl(var(--primary))' } }, eds)),
    []
  )

  const handleNodeDoubleClick = (event: React.MouseEvent, node: Node) => {
    router.push(`/brain/notes?slug=${node.id}`)
  }

  const addRandomNote = () => {
     if (notes.length === 0) return
     const unplacedNotes = notes.filter(n => !nodes.find(nd => nd.id === n.slug))
     if (unplacedNotes.length === 0) return
     
     const randomNote = unplacedNotes[Math.floor(Math.random() * unplacedNotes.length)]
     
     // Place roughly in center
     const newNode: Node = {
        id: randomNote.slug,
        type: 'noteNote',
        position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
        data: { title: randomNote.title, excerpt: randomNote.summary ?? "", tags: randomNote.tags }
     }
     
     setNodes(nds => [...nds, newNode])
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-muted-foreground w-full h-full">
         <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
         <p>Preparing Canvas...</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative" data-color-mode="dark">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={handleNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
      >
        <Background gap={16} size={1} color="hsl(var(--muted-foreground))" className="opacity-20" />
        <Controls className="bg-card border-border fill-foreground" />
        
        <Panel position="top-left" className="bg-card/80 backdrop-blur-md border p-4 rounded-xl shadow-lg">
           <h2 className="font-bold mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Whiteboard Canvas
           </h2>
           <p className="text-xs text-muted-foreground max-w-[200px] mb-4 leading-relaxed">
              Drag notes around to cluster concepts manually. Double click a note to open it. Draw connection lines between related ideas.
           </p>
           <div className="flex gap-2">
              <button 
                onClick={addRandomNote}
                className="flex items-center justify-center gap-2 flex-1 bg-secondary text-secondary-foreground py-1.5 rounded-md text-xs font-medium hover:bg-secondary/80 transition-colors"
                title="Drop an unlinked note onto the canvas"
              >
                 <Plus className="w-3.5 h-3.5" /> Note
              </button>
              <button 
                className="flex items-center justify-center gap-2 flex-1 bg-primary text-primary-foreground py-1.5 rounded-md text-xs font-bold shadow-sm hover:bg-primary/90 transition-colors"
                onClick={() => alert("Mock: Canvas state saved internally.")}
              >
                 <Save className="w-3.5 h-3.5" /> Save
              </button>
           </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
