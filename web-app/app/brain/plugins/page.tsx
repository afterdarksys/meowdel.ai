"use client"

import { useState } from 'react'
import { Plug, Zap, Plus, Settings, TerminalSquare } from 'lucide-react'

// Dummy data for now, would be fetched from API
const initialPlugins = [
  { id: '1', name: 'GitHub Integration', description: 'Read and write PRs, issues, and code changes.', status: 'active', type: 'official' },
  { id: '2', name: 'Postgres Vector DB', description: 'Advanced semantic search indexing.', status: 'inactive', type: 'community' },
  { id: '3', name: 'Feline Psychology API', description: 'Custom behavior models for Meowdel interactions.', status: 'active', type: 'local' },
]

export default function PluginsPage() {
  const [plugins, setPlugins] = useState(initialPlugins)
  
  const togglePlugin = (id: string) => {
    setPlugins(plugins.map(p => 
      p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p
    ))
  }

  return (
    <div className="flex-1 w-full overflow-y-auto p-12 max-w-6xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3">
            <Plug className="w-8 h-8 text-primary" /> MCP Extensions
          </h1>
          <p className="text-muted-foreground text-lg">Manage AI capabilities and Model Context Protocol (MCP) servers.</p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Add MCP Server
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plugins.map((plugin) => (
          <div key={plugin.id} className={`bg-card border rounded-2xl p-6 relative overflow-hidden transition-all ${plugin.status === 'active' ? 'border-primary/50 ring-1 ring-primary/20' : 'opacity-70 hover:opacity-100'}`}>
             
            {plugin.status === 'active' && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            )}
             
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-secondary text-secondary-foreground">
                {plugin.type}
              </div>
              <button 
                 onClick={() => togglePlugin(plugin.id)}
                 className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${plugin.status === 'active' ? 'bg-primary' : 'bg-muted'}`}
                 role="switch"
                 aria-checked={plugin.status === 'active'}
              >
                <span className="sr-only">Toggle plugin</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-sm ring-0 transition duration-200 ease-in-out ${plugin.status === 'active' ? 'translate-x-2' : '-translate-x-2'}`}
                />
              </button>
            </div>
            
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2 relative z-10">
              {plugin.status === 'active' && <Zap className="w-4 h-4 text-primary fill-primary" />}
              {plugin.name}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-6 relative z-10 min-h-[40px]">
              {plugin.description}
            </p>
            
            <div className="flex items-center gap-3 relative z-10">
              <button className="flex-1 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium rounded-md transition-colors flex justify-center items-center gap-2">
                <Settings className="w-3.5 h-3.5" /> Configure
              </button>
              {plugin.status === 'active' && (
                <button className="px-3 py-1.5 border border-primary/30 text-primary hover:bg-primary/10 text-sm font-medium rounded-md transition-colors flex justify-center items-center gap-2">
                  <TerminalSquare className="w-3.5 h-3.5" /> Logs
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-card border border-dashed border-border p-8 rounded-2xl flex flex-col items-center justify-center text-center">
         <TerminalSquare className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
         <h3 className="text-lg font-semibold mb-2">Build Your Own MCP Server</h3>
         <p className="text-muted-foreground max-w-md mb-6">Create custom integrations tailored to your workflow using our Next.js API route templates.</p>
         <button className="px-4 py-2 bg-secondary text-foreground hover:bg-secondary/80 font-medium rounded-lg transition-colors border">
           Generate Boilerplate
         </button>
      </div>

    </div>
  )
}
