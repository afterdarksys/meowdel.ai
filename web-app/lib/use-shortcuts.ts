"use client"

import { useEffect } from 'react'

export interface ShortcutHandlers {
  onToggleChat?: () => void
  onOpenSearch?: () => void
  onToggleZoomies?: () => void
  onNewNote?: () => void
  onOpenGraph?: () => void
  onQuickLink?: () => void
  onQuickTag?: () => void
  onQuickSave?: () => void
  onBold?: () => void
  onItalic?: () => void
}

export function useShortcuts({ onToggleChat, onOpenSearch, onToggleZoomies, onNewNote, onOpenGraph, onQuickLink, onQuickTag, onQuickSave, onBold, onItalic }: ShortcutHandlers) {
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

      // Cmd/Ctrl + Shift + L for Quick Link
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        if (onQuickLink) onQuickLink()
      }

      // Cmd/Ctrl + Shift + T for Quick Tag
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault()
        if (onQuickTag) onQuickTag()
      }

      // Cmd/Ctrl + Shift + S for Quick Save
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (onQuickSave) onQuickSave()
      }

      // Cmd/Ctrl + B for Bold (only in editor context)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'b') {
        const target = e.target as HTMLElement
        if (target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
          e.preventDefault()
          if (onBold) onBold()
        }
      }

      // Cmd/Ctrl + I for Italic (only in editor context)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'i') {
        const target = e.target as HTMLElement
        if (target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
          e.preventDefault()
          if (onItalic) onItalic()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onToggleChat, onOpenSearch, onToggleZoomies, onNewNote, onOpenGraph, onQuickLink, onQuickTag, onQuickSave, onBold, onItalic])
}
