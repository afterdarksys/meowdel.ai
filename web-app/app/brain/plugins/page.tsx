"use client"

import { useState, useEffect } from "react"
import { Plug, Search, Download, Trash2, CheckCircle2, ChevronRight, Puzzle } from "lucide-react"

import { CodeToNoteSetup } from "@/components/code-to-note-setup"

// Import type from our route
interface McpPlugin {
  id: string
  name: string
  description: string
  version: string
  author: string
  icon: string
  isInstalled: boolean
  tags: string[]
}

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<McpPlugin[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch('/api/brain/plugins')
      .then(res => res.json())
      .then(data => {
        setPlugins(data)
        setLoading(false)
      })
  }, [])

  const handleToggleInstall = async (plugin: McpPlugin) => {
    const action = plugin.isInstalled ? 'uninstall' : 'install'
    
    // Optimistic UI update
    setPlugins(prev => prev.map(p => p.id === plugin.id ? { ...p, isInstalled: !p.isInstalled } : p))
    
    try {
      const res = await fetch('/api/brain/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: plugin.id, action })
      })
      if (!res.ok) throw new Error("Failed to toggle plugin")
    } catch (e) {
      // Revert on error
      console.error(e)
      setPlugins(prev => prev.map(p => p.id === plugin.id ? { ...p, isInstalled: plugin.isInstalled } : p))
    }
  }

  const filtered = plugins.filter(p => 
     p.name.toLowerCase().includes(search.toLowerCase()) || 
     p.description.toLowerCase().includes(search.toLowerCase()) ||
     p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="flex-1 w-full overflow-y-auto p-12 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3">
          <Plug className="w-8 h-8 text-primary" /> Plugin Marketplace
        </h1>
        <p className="text-muted-foreground text-lg">Extend Meowdel with intelligent tools and MCP integrations.</p>
      </div>

      <CodeToNoteSetup />

      <div className="relative max-w-xl">
         <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
         <input 
           type="text" 
           placeholder="Search plugins by name, tag, or capability..." 
           value={search}
           onChange={e => setSearch(e.target.value)}
           className="w-full bg-card border rounded-full py-3 pl-12 pr-4 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
         />
      </div>

      {loading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1,2,3,4,5,6].map(i => (
               <div key={i} className="bg-card border rounded-2xl p-6 h-48"></div>
            ))}
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(plugin => (
               <div key={plugin.id} className="bg-card border rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                  
                  {/* Status Indicator */}
                  {plugin.isInstalled && (
                     <div className="absolute top-0 right-0 border-b border-l bg-primary/10 rounded-bl-xl px-3 py-1 text-[10px] font-bold text-primary flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> ACTIVE
                     </div>
                  )}

                  <div>
                     <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 border border-border/50">
                           <Puzzle className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                           <h3 className="font-bold text-lg text-foreground leading-tight mb-1">{plugin.name}</h3>
                           <p className="text-xs text-muted-foreground">by {plugin.author} • v{plugin.version}</p>
                        </div>
                     </div>
                     <p className="text-sm text-muted-foreground/90 leading-relaxed line-clamp-3 mb-4">
                        {plugin.description}
                     </p>
                  </div>

                  <div className="mt-auto">
                     <div className="flex flex-wrap gap-1.5 mb-4">
                        {plugin.tags.map(tag => (
                           <span key={tag} className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-sm font-medium"> # {tag} </span>
                        ))}
                     </div>
                     
                     <div className="flex gap-2">
                        {plugin.isInstalled ? (
                           <>
                             <button 
                               className="flex-1 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground py-2 text-sm font-semibold rounded-lg hover:bg-secondary/80 transition-colors border"
                             >
                                <ChevronRight className="w-4 h-4" /> Configure
                             </button>
                             <button 
                               onClick={() => handleToggleInstall(plugin)}
                               className="p-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors border border-destructive/20"
                               title="Uninstall Plugin"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                           </>
                        ) : (
                           <button 
                             onClick={() => handleToggleInstall(plugin)}
                             className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 text-sm font-bold rounded-lg shadow-sm hover:bg-primary/90 transition-colors"
                           >
                              <Download className="w-4 h-4" /> Install
                           </button>
                        )}
                     </div>
                  </div>
               </div>
            ))}
         </div>
      )}

      {!loading && filtered.length === 0 && (
         <div className="text-center py-20 bg-muted/30 border rounded-2xl">
            <Plug className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No plugins found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms.</p>
         </div>
      )}
    </div>
  )
}
