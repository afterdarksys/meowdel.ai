"use client"

import { useEffect } from 'react'

export interface ShortcutHandlers {
  onToggleChat?: () => void
  onOpenSearch?: () => void
  onToggleZoomies?: () => void
  onNewNote?: () => void
  onOpenGraph?: () => void
}

export function useShortcuts({ onToggleChat, onOpenSearch, onToggleZoomies, onNewNote, onOpenGraph }: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + M for Chat
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        if (onToggleChat) onToggleChat()
      }
      
      // Cmd/Ctrl + K for Search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (onOpenSearch) onOpenSearch()
      }

      // Cmd/Ctrl + Shift + Z for Zoomies Mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (onToggleZoomies) onToggleZoomies()
      }
      
      // Cmd/Ctrl + Shift + N for New Note
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        if (onNewNote) onNewNote()
      }
      
      // Cmd/Ctrl + Shift + G for Jump to Graph
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        if (onOpenGraph) onOpenGraph()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onToggleChat, onOpenSearch, onToggleZoomies, onNewNote, onOpenGraph])
}
