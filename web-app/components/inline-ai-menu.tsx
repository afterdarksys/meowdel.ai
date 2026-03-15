"use client"

import { useState } from "react"
import { Sparkles, Wand2, Maximize2, Cat, Loader2, X, Check } from "lucide-react"

export type AiAction = 'improve' | 'summarize' | 'expand' | 'cat'

interface InlineAiMenuProps {
  selectedText: string
  context: string
  onApply: (newText: string) => void
  onCancel: () => void
}

export function InlineAiMenu({ selectedText, context, onApply, onCancel }: InlineAiMenuProps) {
  const [loading, setLoading] = useState<AiAction | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState("")

  const handleAction = async (action: AiAction) => {
    setLoading(action)
    setError("")
    try {
      const res = await fetch('/api/brain/inline-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, text: selectedText, context })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data.result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(null)
    }
  }

  if (!selectedText) return null

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-popover/95 backdrop-blur-md border shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl p-3 w-[500px] flex flex-col gap-3 animate-in slide-in-from-bottom-5">
      
      {!result ? (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pb-1 border-b">
             <span className="font-semibold flex items-center gap-1.5 text-primary">
               <Sparkles className="w-3 h-3" /> AI Magic
             </span>
             <span className="truncate max-w-[300px] italic opacity-80">"{selectedText.substring(0, 40)}{selectedText.length > 40 ? '...' : ''}"</span>
             <button onClick={onCancel} className="hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
          </div>

          {error && <div className="text-xs text-destructive px-1">{error}</div>}

          <div className="grid grid-cols-2 gap-2 mt-1">
             <button 
               onClick={() => handleAction('improve')}
               disabled={loading !== null}
               className="flex items-center gap-2 p-2 hover:bg-secondary rounded-lg text-sm text-left transition-colors font-medium border border-transparent hover:border-border"
             >
               {loading === 'improve' ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <Wand2 className="w-4 h-4 text-blue-500" />}
               Improve Writing
             </button>
             <button 
               onClick={() => handleAction('summarize')}
               disabled={loading !== null}
               className="flex items-center gap-2 p-2 hover:bg-secondary rounded-lg text-sm text-left transition-colors font-medium border border-transparent hover:border-border"
             >
               {loading === 'summarize' ? <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> : <Sparkles className="w-4 h-4 text-emerald-500" />}
               Summarize
             </button>
             <button 
               onClick={() => handleAction('expand')}
               disabled={loading !== null}
               className="flex items-center gap-2 p-2 hover:bg-secondary rounded-lg text-sm text-left transition-colors font-medium border border-transparent hover:border-border"
             >
               {loading === 'expand' ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <Maximize2 className="w-4 h-4 text-amber-500" />}
               Expand Idea
             </button>
             <button 
               onClick={() => handleAction('cat')}
               disabled={loading !== null}
               className="flex items-center gap-2 p-2 hover:bg-secondary rounded-lg text-sm text-left transition-colors font-medium border border-transparent hover:border-border"
             >
               {loading === 'cat' ? <Loader2 className="w-4 h-4 animate-spin text-pink-500" /> : <Cat className="w-4 h-4 text-pink-500" />}
               Make Purr-fessional
             </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3">
           <div className="text-xs font-semibold text-primary flex items-center justify-between px-1">
              Result
           </div>
           <div className="p-3 bg-muted rounded-md text-sm max-h-48 overflow-y-auto custom-scrollbar leading-relaxed">
              {result}
           </div>
           <div className="flex gap-2">
              <button 
                onClick={() => setResult(null)} 
                className="flex-1 py-1.5 border rounded-md text-sm font-medium hover:bg-muted transition-colors"
              >
                Discard
              </button>
              <button 
                onClick={() => onApply(result)} 
                className="flex-1 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" /> Replace Text
              </button>
           </div>
        </div>
      )}
    </div>
  )
}
