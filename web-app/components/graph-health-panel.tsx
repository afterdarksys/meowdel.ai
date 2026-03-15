"use client"

import { useState, useEffect } from 'react'
import { Activity, AlertTriangle, Link as LinkIcon, Network, Loader2 } from 'lucide-react'

interface HealthMetrics {
  totalNotes: number;
  totalLinks: number;
  orphanedNotes: { slug: string; name: string }[];
  hubNotes: { slug: string; name: string; incomingLinks: number }[];
  weakClusters: { slug: string; name: string; links: number }[];
}

export function GraphHealthPanel() {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/brain/graph-health')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setMetrics(data)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-muted-foreground bg-card border rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Analyzing graph health...</span>
      </div>
    )
  }

  if (error || !metrics) {
    return null
  }

  return (
    <div className="bg-card border rounded-lg shadow-sm w-80 max-h-[80vh] flex flex-col overflow-hidden text-sm">
      <div className="p-4 border-b bg-muted/50 flex items-center gap-2 font-medium">
        <Activity className="w-4 h-4 text-primary" />
        <h3>Graph Health</h3>
      </div>
      
      <div className="p-4 overflow-y-auto flex-1 space-y-6">
        {/* Stats Summary */}
        <div className="flex gap-4">
          <div className="flex-1 bg-background border rounded p-3 text-center">
             <div className="text-2xl font-bold">{metrics.totalNotes}</div>
             <div className="text-xs text-muted-foreground">Notes</div>
          </div>
          <div className="flex-1 bg-background border rounded p-3 text-center">
             <div className="text-2xl font-bold">{metrics.totalLinks}</div>
             <div className="text-xs text-muted-foreground">Connections</div>
          </div>
        </div>

        {/* Orphans */}
        <div>
          <h4 className="flex items-center gap-2 font-medium mb-2 text-destructive">
             <AlertTriangle className="w-4 h-4" />
             Orphaned Notes ({metrics.orphanedNotes.length})
          </h4>
          {metrics.orphanedNotes.length === 0 ? (
            <p className="text-xs text-muted-foreground">No orphans found! Great job.</p>
          ) : (
            <div className="space-y-1 max-h-32 overflow-y-auto">
               {metrics.orphanedNotes.map(n => (
                 <a key={n.slug} href={`/brain/notes/${n.slug}`} className="block text-xs text-muted-foreground hover:text-primary hover:underline truncate">
                   {n.name}
                 </a>
               ))}
            </div>
          )}
        </div>

        {/* Hubs */}
        <div>
          <h4 className="flex items-center gap-2 font-medium mb-2 text-primary">
             <Network className="w-4 h-4" />
             Knowledge Hubs
          </h4>
          {metrics.hubNotes.length === 0 ? (
            <p className="text-xs text-muted-foreground">No hubs (&gt;5 incoming links) yet.</p>
          ) : (
            <div className="space-y-2">
               {metrics.hubNotes.slice(0, 5).map(n => (
                 <div key={n.slug} className="flex items-center justify-between text-xs">
                   <a href={`/brain/notes/${n.slug}`} className="text-muted-foreground hover:text-primary hover:underline truncate max-w-[180px]">
                     {n.name}
                   </a>
                   <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[10px] font-medium">
                     {n.incomingLinks} links
                   </span>
                 </div>
               ))}
            </div>
          )}
        </div>

        {/* Weak Clusters */}
        {metrics.weakClusters.length > 0 && (
            <div>
            <h4 className="flex items-center gap-2 font-medium mb-2 text-amber-500">
                <LinkIcon className="w-4 h-4" />
                Weak Connections
            </h4>
            <div className="space-y-2">
                {metrics.weakClusters.slice(0, 3).map(n => (
                    <div key={n.slug} className="flex items-center justify-between text-xs">
                    <a href={`/brain/notes/${n.slug}`} className="text-muted-foreground hover:text-primary hover:underline truncate max-w-[180px]">
                        {n.name}
                    </a>
                    <span className="text-muted-foreground text-[10px]">
                        {n.links} total
                    </span>
                    </div>
                ))}
            </div>
            </div>
        )}
      </div>
      
      {/* Footer / Fix action */}
      <div className="p-3 border-t bg-muted/20">
         <button className="w-full py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors text-xs font-medium border" onClick={() => alert('Wizard not implemented yet!')}>
            Fix My Graph Wizard
         </button>
      </div>
    </div>
  )
}
