"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Wand2, Loader2, ArrowRight, FolderTree, FilePlus, CheckCircle2, AlertCircle } from "lucide-react"

interface ReorgData {
  moves: { originalSlug: string, newSlug: string }[]
  mocs: { title: string, slug: string, content: string }[]
}

export function ReorganizeWizard() {
  const [data, setData] = useState<ReorgData | null>(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const analyzeBrain = async () => {
    setLoading(true)
    setError("")
    setData(null)
    setSuccess(false)
    try {
      const res = await fetch('/api/brain/reorganize')
      if (!res.ok) {
         const errData = await res.json()
         throw new Error(errData.error || 'Failed to analyze brain')
      }
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const applyChanges = async () => {
    if (!data) return
    setApplying(true)
    setError("")
    try {
      const res = await fetch('/api/brain/reorganize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
         const errData = await res.json()
         throw new Error(errData.error || 'Failed to apply changes')
      }
      setSuccess(true)
      setData(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-8 relative z-20">
      <div className="mb-8 text-center">
         <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(236,72,153,0.2)] border border-primary/20">
           <Wand2 className="w-10 h-10 text-primary" />
         </div>
         <h2 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
            Meowdel's Brain Reorganizer
         </h2>
         <p className="text-muted-foreground mt-4 text-lg max-w-xl mx-auto">
            Let me analyze your semantic networks, build folder structures, and generate Maps of Content (MOCs) to turn chaos into clarity.
         </p>
      </div>

      {!data && !loading && !success && (
         <div className="flex justify-center mt-12">
            <button 
              onClick={analyzeBrain}
              className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold text-lg hover:bg-primary/90 transition-all hover:scale-105 shadow-xl shadow-primary/30"
            >
              <Wand2 className="w-6 h-6" />
              Analyze My Notes
            </button>
         </div>
      )}

      {loading && (
         <div className="flex flex-col items-center justify-center p-12 text-muted-foreground mt-8">
            <Loader2 className="w-12 h-12 animate-spin mb-6 text-primary" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">Analyzing Semantic Topography...</h3>
            <p className="animate-pulse">Sniffing out related concepts and un-tangling yarn balls...</p>
         </div>
      )}

      {error && (
         <div className="mt-8 p-6 bg-destructive/10 border border-destructive/20 rounded-xl text-center">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-bold text-destructive mb-2">Analysis Failed</h3>
            <p className="text-destructive/80 mb-6">{error}</p>
            <button onClick={analyzeBrain} className="px-6 py-2 bg-background border rounded-lg hover:bg-muted font-medium transition-colors">
               Try Again
            </button>
         </div>
      )}

      {success && (
         <div className="mt-8 p-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center animate-in zoom-in-95">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-emerald-500 mb-4">Purr-fect! Reorganization Complete.</h3>
            <p className="text-muted-foreground mb-8 text-lg">Your knowledge graph has been successfully restructured.</p>
            <button 
              onClick={() => router.push('/brain/yarn')} 
              className="px-8 py-3 bg-emerald-500 text-white rounded-full font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
            >
               View New Graph
            </button>
         </div>
      )}

      {data && !loading && (
         <div className="mt-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
               <div className="p-6 border-b bg-muted/30">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                     <FolderTree className="w-6 h-6 text-primary" />
                     Proposed Changes
                  </h3>
                  <p className="text-muted-foreground mt-2">
                     Meowdel found {data.moves.length} files to reorganize and suggested {data.mocs.length} new Maps of Content.
                  </p>
               </div>
               
               <div className="p-0">
                  {data.mocs.length > 0 && (
                     <div className="p-6 border-b">
                        <h4 className="font-semibold text-lg flex items-center gap-2 mb-4">
                           <FilePlus className="w-5 h-5 text-emerald-500" />
                           New Maps of Content (MOCs)
                        </h4>
                        <div className="space-y-3">
                           {data.mocs.map((moc, i) => (
                              <div key={i} className="flex items-center justify-between p-4 bg-background border rounded-lg relative overflow-hidden group">
                                 <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                                 <div className="font-medium">{moc.title}</div>
                                 <div className="text-sm text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full font-mono">
                                    {moc.slug}.md
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {data.moves.length > 0 && (
                     <div className="p-6">
                        <h4 className="font-semibold text-lg flex items-center gap-2 mb-4">
                           <FolderTree className="w-5 h-5 text-blue-500" />
                           File Moves
                        </h4>
                        <div className="space-y-2">
                           {data.moves.map((move, i) => {
                              // Only show actual moves
                              if (move.originalSlug === move.newSlug) return null;
                              return (
                                 <div key={i} className="flex items-center gap-4 p-3 bg-background border rounded-lg text-sm">
                                    <div className="flex-1 truncate text-muted-foreground opacity-80">{move.originalSlug}.md</div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <div className="flex-1 truncate font-medium text-blue-500">{move.newSlug}.md</div>
                                 </div>
                              )
                           })}
                           {data.moves.filter(m => m.originalSlug !== m.newSlug).length === 0 && (
                               <p className="text-muted-foreground py-2 italic text-sm">No files need moving. Everything is in its right place!</p>
                           )}
                        </div>
                     </div>
                  )}
               </div>

               <div className="p-6 bg-muted/30 border-t flex items-center justify-end gap-4">
                  <button 
                     onClick={() => setData(null)}
                     disabled={applying}
                     className="px-6 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg font-medium transition-colors"
                  >
                     Cancel
                  </button>
                  <button 
                     onClick={applyChanges}
                     disabled={applying}
                     className="flex items-center gap-2 px-8 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-md"
                  >
                     {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                     {applying ? "Applying Changes..." : "Apply Reorganization"}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  )
}
