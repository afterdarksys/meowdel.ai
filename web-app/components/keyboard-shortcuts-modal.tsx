'use client'

import { useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)
const mod = isMac ? '⌘' : 'Ctrl'

const SECTIONS = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: [`${mod}`, 'K'], label: 'Command palette / search' },
      { keys: [`${mod}`, '⇧', 'N'], label: 'New note' },
      { keys: [`${mod}`, '⇧', 'M'], label: 'Toggle chat' },
      { keys: [`${mod}`, '⇧', 'G'], label: 'Open knowledge graph' },
    ],
  },
  {
    title: 'Note Editor',
    shortcuts: [
      { keys: [`${mod}`, 'S'], label: 'Save note' },
      { keys: [`${mod}`, '⇧', 'L'], label: 'Auto-link concepts' },
      { keys: [`${mod}`, 'B'], label: 'Bold selection' },
      { keys: [`${mod}`, 'I'], label: 'Italic selection' },
    ],
  },
  {
    title: 'Chat',
    shortcuts: [
      { keys: ['@haiku'], label: 'Force Haiku (fast)' },
      { keys: ['@sonnet'], label: 'Force Sonnet (balanced)' },
      { keys: ['@opus'], label: 'Force Opus (deep)' },
      { keys: ['#skill:name'], label: 'Activate a skill' },
      { keys: ['#save'], label: 'Save to cascade memory' },
      { keys: ['#up / #down'], label: 'Shift model tier' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: ['?'], label: 'Show this help' },
      { keys: [`${mod}`, '⇧', 'Z'], label: 'Toggle zoomies mode 🐈' },
      { keys: ['Esc'], label: 'Close modals / cancel' },
    ],
  },
]

export function KeyboardShortcutsModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Keyboard className="w-4 h-4 text-primary" />
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {SECTIONS.map(section => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.shortcuts.map(({ keys, label }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{label}</span>
                    <div className="flex items-center gap-1">
                      {keys.map((key, i) => (
                        <span key={i}>
                          <kbd className="px-2 py-0.5 text-xs font-mono bg-secondary border border-border rounded text-foreground">
                            {key}
                          </kbd>
                          {i < keys.length - 1 && (
                            <span className="text-muted-foreground text-xs mx-0.5">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 pb-4 text-center text-xs text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 text-xs bg-secondary border border-border rounded font-mono">?</kbd> anywhere to show this
        </div>
      </div>
    </div>
  )
}
