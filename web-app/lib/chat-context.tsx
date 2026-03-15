"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { BrainNote } from '@/app/api/brain/notes/route'

interface GlobalChatContextType {
  isChatOpen: boolean
  setChatOpen: (open: boolean) => void
  toggleChat: () => void
  activeContextNote: BrainNote | null
  setActiveContextNote: (note: BrainNote | null) => void
  isZoomies: boolean
  setZoomies: (active: boolean) => void
}

const GlobalChatContext = createContext<GlobalChatContextType | undefined>(undefined)

export function GlobalChatProvider({ children }: { children: ReactNode }) {
  const [isChatOpen, setChatOpen] = useState(false)
  const [activeContextNote, setActiveContextNote] = useState<BrainNote | null>(null)
  const [isZoomies, setZoomies] = useState(false)

  const toggleChat = () => setChatOpen(prev => !prev)

  return (
    <GlobalChatContext.Provider value={{ isChatOpen, setChatOpen, toggleChat, activeContextNote, setActiveContextNote, isZoomies, setZoomies }}>
      {children}
    </GlobalChatContext.Provider>
  )
}

export function useGlobalChat() {
  const context = useContext(GlobalChatContext)
  if (context === undefined) {
    throw new Error('useGlobalChat must be used within a GlobalChatProvider')
  }
  return context
}
