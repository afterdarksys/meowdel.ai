"use client"
import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { AskMeowdel } from "@/components/ask-meowdel"
import { BrainChatPanel } from "@/components/brain-chat-panel"

export default function BrainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [chatOpen, setChatOpen] = useState(true)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 w-full flex flex-col min-w-0 overflow-hidden relative">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 pointer-events-auto shadow-2xl">
           <AskMeowdel />
        </div>
        {children}
      </main>
      <BrainChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}
