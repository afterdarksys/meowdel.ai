"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { AskMeowdel } from "@/components/ask-meowdel"
import { BrainChatPanel } from "@/components/brain-chat-panel"
import { CommandPalette } from "@/components/command-palette"
import { KeyboardShortcutsModal } from "@/components/keyboard-shortcuts-modal"
import { useGlobalChat } from "@/lib/chat-context"
import { useShortcuts } from "@/lib/use-shortcuts"
import { MeowdelAvatar } from "@/components/meowdel-avatar"

export default function BrainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isChatOpen, setChatOpen, toggleChat, activeContextNote, isZoomies, setZoomies } = useGlobalChat()
  const [searchOpen, setSearchOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const router = useRouter()

  // '?' key opens shortcuts modal (when not typing in an input)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      const editable = (e.target as HTMLElement).contentEditable === 'true'
      if (e.key === '?' && tag !== 'INPUT' && tag !== 'TEXTAREA' && !editable) {
        e.preventDefault()
        setShortcutsOpen(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Register global shortcuts
  useShortcuts({
     onToggleChat: toggleChat,
     onOpenSearch: () => setSearchOpen(true),
     onToggleZoomies: () => {
         setZoomies(!isZoomies)
         if (!isZoomies) {
             setChatOpen(true) // Zoomies implies talking to chat aggressively
         }
     },
     onNewNote: () => {
         // Generate a blank new note
         fetch('/api/brain/notes', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ title: `Untitled Note ${Date.now()}`, content: '' })
         }).then(res => res.json()).then(data => {
             if (data.slug) router.push(`/brain/notes/${data.slug}`)
         })
     },
     onOpenGraph: () => router.push('/brain/yarn')
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
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <MeowdelAvatar />
    </div>
  )
}
