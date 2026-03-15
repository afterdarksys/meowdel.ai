"use client"

import { useState } from "react"
import { Sparkles, Link as LinkIcon, AlertCircle, Loader2 } from "lucide-react"

interface Connection {
  slug: string
  title: string
  confidence: number
  reason: string
}

interface ConnectionSuggesterProps {
  slug: string
  onAddLink: (slug: string) => void
}

export function ConnectionSuggester({ slug, onAddLink }: ConnectionSuggesterProps) {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const discoverConnections = async () => {
    setLoading(true)
    setError("")
    setConnections([])
    try {
      const res = await fetch('/api/brain/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceSlug: slug })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setConnections(data.connections || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border-t border-b p-4 text-sm relative z-10 w-full overflow-hidden shrink-0">
       <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-foreground">Semantic Discovery</h3>
         </div>
         <button 
           onClick={discoverConnections}
           disabled={loading}
           className="px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors font-medium border text-xs flex items-center gap-2"
         >
           {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
           Find Connections
         </button>
       </div>

       {error && (
         <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-2 rounded text-xs mb-2">
           <AlertCircle className="w-4 h-4" />
           {error}
         </div>
       )}

       {connections.length > 0 && (
         <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
           {connections.map((c, i) => (
              <div key={i} className="flex-shrink-0 w-64 bg-background border rounded-lg p-3 flex flex-col justify-between group">
                 <div>
                   <div className="flex items-start justify-between mb-2">
                     <h4 className="font-bold text-sm truncate pr-2">{c.title}</h4>
                     <div className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full whitespace-nowrap ${c.confidence >= 80 ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'}`}>
                       {c.confidence}% Match
                     </div>
                   </div>
                   <p className="text-xs text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
                     {c.reason}
                   </p>
                 </div>
                 <button 
                   onClick={() => onAddLink(c.slug)}
                   className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded text-xs font-semibold transition-colors opacity-0 group-hover:opacity-100"
                 >
                   <LinkIcon className="w-3 h-3" />
                   Insert Link
                 </button>
              </div>
           ))}
         </div>
       )}

       {!loading && !error && connections.length === 0 && (
          <div className="text-muted-foreground text-xs italic opacity-70">
             Click "Find Connections" to use AI to discover latent, semantic relationships between this note and the rest of your brain.
          </div>
       )}
    </div>
  )
}
