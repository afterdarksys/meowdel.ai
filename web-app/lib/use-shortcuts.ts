"use client"

import { useEffect } from 'react'

export interface ShortcutHandlers {
  onToggleChat?: () => void
  onOpenSearch?: () => void
  onToggleZoomies?: () => void
}

export function useShortcuts({ onToggleChat, onOpenSearch, onToggleZoomies }: ShortcutHandlers) {
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
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onToggleChat, onOpenSearch, onToggleZoomies])
}
