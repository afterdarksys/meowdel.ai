"use client"
import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { AskMeowdel } from "@/components/ask-meowdel"
import { BrainChatPanel } from "@/components/brain-chat-panel"
import { CommandPalette } from "@/components/command-palette"
import { useGlobalChat } from "@/lib/chat-context"
import { useShortcuts } from "@/lib/use-shortcuts"

export default function BrainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isChatOpen, setChatOpen, toggleChat, activeContextNote, isZoomies, setZoomies } = useGlobalChat()
  const [searchOpen, setSearchOpen] = useState(false)

  // Register global shortcuts
  useShortcuts({
     onToggleChat: toggleChat,
     onOpenSearch: () => setSearchOpen(true),
     onToggleZoomies: () => {
         setZoomies(!isZoomies)
         if (!isZoomies) {
             setChatOpen(true) // Zoomies implies talking to chat aggressively
         }
     }
  })

  return (
    <div className={`flex h-screen overflow-hidden bg-background ${isZoomies ? 'ring-[10px] ring-emerald-500 animate-pulse transition-all duration-300' : ''}`}>
      {/* Sidebar hidden during Zoomies mode */}
      <div className={`${isZoomies ? 'hidden md:hidden' : 'hidden md:flex'}`}>
          <Sidebar />
      </div>
      <main className="flex-1 w-full flex flex-col min-w-0 overflow-hidden relative">
        {isZoomies && (
           <div className="absolute inset-0 pointer-events-none z-0 opacity-10 bg-[url('/brain-bg.svg')] bg-repeat shadow-[inset_0_0_100px_rgba(16,185,129,0.5)]" />
        )}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 pointer-events-auto shadow-2xl">
           <AskMeowdel />
        </div>
        {children}
      </main>
      <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <BrainChatPanel isOpen={isChatOpen} onClose={() => setChatOpen(false)} activeNote={activeContextNote} />
    </div>
  )
}
