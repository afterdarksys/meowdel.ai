"use client"

/**
 * InlineAiMenu — floating toolbar that appears when text is selected in the editor.
 * Provides the full slash-command suite for AI writing assistance.
 *
 * Free users get: improve, summarize, fix_grammar, cat
 * Pro users get: all actions
 */

import { useState } from 'react'
import {
  Sparkles, Wand2, Maximize2, Cat, Loader2, X, Check,
  Minimize2, RotateCcw, Languages, ListChecks, BrainCircuit,
  ArrowRight, Pencil, Briefcase, MessageCircle
} from 'lucide-react'

export type AiAction =
  | 'improve' | 'summarize' | 'expand' | 'rewrite' | 'translate'
  | 'bullet_points' | 'make_shorter' | 'make_longer' | 'fix_grammar'
  | 'continue_writing' | 'explain_like_5' | 'make_formal' | 'make_casual'
  | 'find_action_items' | 'cat'

interface ActionDef {
  id: AiAction
  label: string
  icon: React.ReactNode
  proOnly?: boolean
  color: string
}

const ACTIONS: ActionDef[] = [
  { id: 'improve',         label: 'Improve',          icon: <Wand2 className="w-4 h-4" />,         color: 'text-blue-500' },
  { id: 'fix_grammar',     label: 'Fix Grammar',       icon: <Pencil className="w-4 h-4" />,        color: 'text-green-500' },
  { id: 'summarize',       label: 'Summarize',         icon: <Sparkles className="w-4 h-4" />,      color: 'text-emerald-500' },
  { id: 'expand',          label: 'Expand',            icon: <Maximize2 className="w-4 h-4" />,     color: 'text-amber-500',  proOnly: true },
  { id: 'make_shorter',    label: 'Make Shorter',      icon: <Minimize2 className="w-4 h-4" />,     color: 'text-orange-500', proOnly: true },
  { id: 'make_longer',     label: 'Make Longer',       icon: <ArrowRight className="w-4 h-4" />,    color: 'text-indigo-500', proOnly: true },
  { id: 'rewrite',         label: 'Rewrite',           icon: <RotateCcw className="w-4 h-4" />,     color: 'text-violet-500', proOnly: true },
  { id: 'translate',       label: 'Translate',         icon: <Languages className="w-4 h-4" />,     color: 'text-sky-500',    proOnly: true },
  { id: 'bullet_points',   label: 'Make Bullets',      icon: <ListChecks className="w-4 h-4" />,    color: 'text-teal-500',   proOnly: true },
  { id: 'find_action_items',label: 'Action Items',     icon: <BrainCircuit className="w-4 h-4" />,  color: 'text-pink-500',   proOnly: true },
  { id: 'continue_writing',label: 'Continue',          icon: <ArrowRight className="w-4 h-4" />,    color: 'text-purple-500', proOnly: true },
  { id: 'make_formal',     label: 'Make Formal',       icon: <Briefcase className="w-4 h-4" />,     color: 'text-slate-500',  proOnly: true },
  { id: 'make_casual',     label: 'Make Casual',       icon: <MessageCircle className="w-4 h-4" />, color: 'text-rose-500',   proOnly: true },
  { id: 'cat',             label: 'Meowdel Mode',      icon: <Cat className="w-4 h-4" />,           color: 'text-pink-400' },
]

interface InlineAiMenuProps {
  selectedText: string
  context: string
  onApply: (newText: string) => void
  onCancel: () => void
  isPro?: boolean
}

export function InlineAiMenu({ selectedText, context, onApply, onCancel, isPro = false }: InlineAiMenuProps) {
  const [loading, setLoading] = useState<AiAction | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<AiAction | null>(null)
  const [error, setError] = useState('')
  const [showAll, setShowAll] = useState(false)

  const handleAction = async (action: AiAction) => {
    setLoading(action)
    setActiveAction(action)
    setError('')
    try {
      const res = await fetch('/api/brain/inline-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, text: selectedText, context }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data.result)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  if (!selectedText) return null

  const visibleActions = showAll ? ACTIONS : ACTIONS.slice(0, 6)

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-popover/96 backdrop-blur-md border shadow-[0_8px_30px_rgb(0,0,0,0.18)] rounded-2xl p-3 w-[560px] flex flex-col gap-2 animate-in slide-in-from-bottom-4 duration-200">
      {!result ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pb-1.5 border-b">
            <span className="font-semibold flex items-center gap-1.5 text-primary">
              <Sparkles className="w-3.5 h-3.5" /> AI Writing Assistant
            </span>
            <span className="truncate max-w-[280px] italic opacity-75">
              &ldquo;{selectedText.slice(0, 40)}{selectedText.length > 40 ? '...' : ''}&rdquo;
            </span>
            <button onClick={onCancel} className="hover:text-foreground ml-2 flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 px-2 py-1.5 rounded-md">
              {error}
            </div>
          )}

          {/* Action grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {visibleActions.map((action) => {
              const isDisabled = loading !== null
              const isProLocked = action.proOnly && !isPro

              return (
                <button
                  key={action.id}
                  onClick={() => !isProLocked && handleAction(action.id)}
                  disabled={isDisabled || isProLocked}
                  title={isProLocked ? 'Requires Pro' : action.label}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-all border border-transparent
                    ${isProLocked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-secondary hover:border-border cursor-pointer'}
                    ${loading === action.id ? 'bg-secondary' : ''}`}
                >
                  <span className={action.color}>
                    {loading === action.id ? <Loader2 className="w-4 h-4 animate-spin" /> : action.icon}
                  </span>
                  <span className="truncate">{action.label}</span>
                  {isProLocked && (
                    <span className="ml-auto text-[9px] bg-primary/10 text-primary px-1 rounded">PRO</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Show more toggle */}
          {ACTIONS.length > 6 && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="text-xs text-muted-foreground hover:text-foreground text-center py-0.5 transition-colors"
            >
              {showAll ? 'Show less' : `${ACTIONS.length - 6} more actions...`}
            </button>
          )}
        </>
      ) : (
        /* Result view */
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-semibold text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {ACTIONS.find((a) => a.id === activeAction)?.label ?? 'Result'}
            </span>
            <button onClick={() => setResult(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-3 bg-muted/60 rounded-lg text-sm max-h-52 overflow-y-auto leading-relaxed border">
            {result}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setResult(null); setError('') }}
              className="flex-1 py-1.5 border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => onApply(result)}
              className="flex-1 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" /> Replace Selection
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
