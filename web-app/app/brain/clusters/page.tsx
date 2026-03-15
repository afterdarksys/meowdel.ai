"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Layers, Loader2, Sparkles, AlertCircle, FileText, ArrowRight } from "lucide-react"

interface Cluster {
  name: string
  notes: string[]
  reason: string
  overlapScore: number
}

export default function ClustersPage() {
  const [clusters, setClusters] = useState<Cluster[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const analyzeClusters = async () => {
    setLoading(true)
    setError("")
    setClusters(null)
    try {
      const res = await fetch('/api/brain/clusters')
      if (!res.ok) {
         const errData = await res.json()
         throw new Error(errData.error || 'Failed to analyze clusters')
      }
      const json = await res.json()
      setClusters(json.clusters || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-start h-full p-8 bg-background relative overflow-y-auto w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="w-full max-w-4xl max-auto relative z-20">
         <div className="mb-10 text-center">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(99,102,241,0.2)] border border-indigo-500/20">
               <Layers className="w-10 h-10 text-indigo-500" />
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-500 mb-4">
               Concept Clustering
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
               Discover redundant ideas, duplicate notes, and dense semantic groupings across your entire knowledge base.
            </p>
         </div>

         {!clusters && !loading && (
            <div className="flex justify-center mt-8">
               <button 
                 onClick={analyzeClusters}
                 className="flex items-center gap-2 px-8 py-4 bg-indigo-500 text-white rounded-full font-bold text-lg hover:bg-indigo-600 transition-all hover:scale-105 shadow-xl shadow-indigo-500/30"
               >
                 <Sparkles className="w-5 h-5" />
                 Scan for Concept Clusters
               </button>
            </div>
         )}

         {loading && (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground mt-8">
               <Loader2 className="w-12 h-12 animate-spin mb-6 text-indigo-500" />
               <h3 className="text-xl font-semibold mb-2 text-foreground">Mapping Semantic Topography...</h3>
               <p className="animate-pulse">Using high-dimensional math to find matching yarn strings...</p>
            </div>
         )}

         {error && (
            <div className="mt-8 p-6 bg-destructive/10 border border-destructive/20 rounded-xl text-center max-w-lg mx-auto">
               <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
               <h3 className="text-lg font-bold text-destructive mb-2">Scan Failed</h3>
               <p className="text-destructive/80 mb-6">{error}</p>
               <button onClick={analyzeClusters} className="px-6 py-2 bg-background border rounded-lg hover:bg-muted font-medium transition-colors">
                  Try Again
               </button>
            </div>
         )}

         {clusters && clusters.length === 0 && (
            <div className="mt-12 text-center p-12 bg-muted/30 border rounded-2xl animate-in zoom-in-95 max-w-lg mx-auto">
               <h3 className="text-2xl font-bold mb-4">No Clusters Found!</h3>
               <p className="text-muted-foreground">Your notes are exceptionally distinct and well-separated. No duplicate concepts detected.</p>
            </div>
         )}

         {clusters && clusters.length > 0 && (
            <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4">
               <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                 <Layers className="w-5 h-5 text-indigo-500" /> 
                 Found {clusters.length} Concept Clusters
               </h3>
               
               {clusters.map((cluster, idx) => (
                  <div key={idx} className="bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                     <div className="p-5 border-b bg-muted/20 flex items-start justify-between gap-4">
                        <div>
                           <h4 className="text-lg font-bold text-foreground mb-1">{cluster.name}</h4>
                           <p className="text-sm text-muted-foreground">{cluster.reason}</p>
                        </div>
                        <div className="flex flex-col items-end">
                           <div className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${cluster.overlapScore > 80 ? 'bg-amber-500/20 text-amber-600' : 'bg-blue-500/20 text-blue-500'}`}>
                              {cluster.overlapScore}% Overlap
                           </div>
                        </div>
                     </div>
                     <div className="p-5">
                        <div className="flex flex-wrap gap-3">
                           {cluster.notes.map((note, nIdx) => (
                              <div key={nIdx} className="flex items-center gap-2 group">
                                 <button 
                                   onClick={() => router.push(`/brain/notes?slug=${note}`)}
                                   className="flex items-center gap-2 px-3 py-1.5 bg-background border rounded-lg text-sm hover:bg-secondary hover:text-secondary-foreground transition-colors"
                                 >
                                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                    {note}
                                 </button>
                                 {nIdx < cluster.notes.length - 1 && (
                                    <ArrowRight className="w-3 h-3 text-muted-foreground/40 hidden sm:block" />
                                 )}
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
    </div>
  )
}
