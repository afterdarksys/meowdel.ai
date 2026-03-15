"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Brain, FileCode, Network, Plus, Settings, Search, Hash, Activity, Plug, FileQuestion, ChevronDown, ChevronRight, FileText, MoonStar, Loader2, Image as ImageIcon } from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [templates, setTemplates] = useState<{slug: string, title: string}[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [isNapping, setIsNapping] = useState(false)

  const triggerNap = async () => {
      setIsNapping(true)
      try {
          const res = await fetch('/api/brain/nap', { method: 'POST' })
          const data = await res.json()
          if (data.success) {
              alert(`Meowdel woke up! Added a dream insight to note: ${data.file}\nPreview: ${data.insight}`)
          } else {
              alert("Meowdel had a nightmare: " + data.message)
          }
      } catch (e) {
          alert("Couldn't fall asleep...")
      } finally {
          setIsNapping(false)
      }
  }

  useEffect(() => {
    fetch('/api/brain/templates')
      .then(res => res.json())
      .then(data => {
        if (data.templates) setTemplates(data.templates)
      })
      .catch(console.error)
  }, [])

  const handleCreateFromTemplate = async (templateSlug: string) => {
    const title = prompt("Enter a title for your new note:")
    if (!title) return

    try {
      const res = await fetch('/api/brain/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, template: templateSlug })
      })
      const data = await res.json()
      if (data.slug) {
        router.push(`/brain/notes/${data.slug}`)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const navItems = [
    { icon: Brain, label: "Brain Home", href: "/brain" },
    { icon: Network, label: "Knowledge Graph", href: "/brain/yarn" },
    { icon: FileQuestion, label: "Orphans", href: "/brain/orphans" },
    { icon: FileCode, label: "All Notes", href: "/brain/notes" },
    { icon: ImageIcon, label: "Visual Search", href: "/brain/visual-search" },
  ]

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-card/50 backdrop-blur-xl hidden md:flex flex-col h-screen sticky top-0 relative">
      {isNapping && (
         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-indigo-200">
             <MoonStar className="w-12 h-12 mb-4 animate-pulse text-indigo-400" />
             <div className="font-bold tracking-widest uppercase text-sm flex items-center gap-2">
                 <Loader2 className="w-4 h-4 animate-spin" /> Nap Time...
             </div>
             <p className="text-xs text-indigo-300 mt-2 text-center px-4">Meowdel is analyzing your notes in background mode.</p>
         </div>
      )}
      <div className="h-14 flex items-center justify-between px-4 border-b">
        <div className="flex items-center gap-2 font-semibold">
          <Brain className="w-5 h-5 text-primary" />
          <span>10x Brain</span>
        </div>
        <button onClick={triggerNap} title="Trigger Nap Time (Background Processing)" className="text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10 p-1.5 rounded-full transition-colors">
            <MoonStar className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="space-y-1 mb-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                pathname === item.href || pathname?.startsWith(item.href + '/')
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Recent Notes</span>
            <button className="hover:text-foreground transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {/* Placeholder for real notes list later */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground rounded hover:bg-secondary transition-colors cursor-pointer">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span className="truncate">MCP Integration Specs</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 mt-6">
          <div 
            className="flex items-center justify-between px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            <span>Templates</span>
            {showTemplates ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </div>
          
          {showTemplates && (
            <div className="space-y-1">
              {templates.length === 0 ? (
                <div className="px-3 py-1.5 text-xs text-muted-foreground italic">No templates found</div>
              ) : (
                templates.map(t => (
                  <div 
                    key={t.slug}
                    onClick={() => handleCreateFromTemplate(t.slug)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground rounded hover:bg-secondary transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate">{t.title}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t">
          <Link 
            href="/brain/analytics"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === '/brain/analytics' ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <Activity className="w-4 h-4" />
            Analytics
          </Link>
          <Link 
            href="/brain/plugins"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === '/brain/plugins' ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <Plug className="w-4 h-4" />
            Extensions (MCP)
          </Link>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors mt-1">
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
    </aside>
  )
}
