"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Brain, FileCode, Network, Plus, Settings, Search, Hash, Activity, Plug } from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { icon: Brain, label: "Brain Home", href: "/brain" },
    { icon: Network, label: "Knowledge Graph", href: "/brain/graph" },
    { icon: FileCode, label: "All Notes", href: "/brain/notes" },
  ]

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-card/50 backdrop-blur-xl hidden md:flex flex-col h-screen sticky top-0">
      <div className="h-14 flex items-center px-4 border-b">
        <div className="flex items-center gap-2 font-semibold">
          <Brain className="w-5 h-5 text-primary" />
          <span>10x Brain</span>
        </div>
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
            <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground rounded hover:bg-secondary transition-colors cursor-pointer">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="truncate">Feline Psychology</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground rounded hover:bg-secondary transition-colors cursor-pointer">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              <span className="truncate">10x Overhaul Plan</span>
            </div>
          </div>
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
