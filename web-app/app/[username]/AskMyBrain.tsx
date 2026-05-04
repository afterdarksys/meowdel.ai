'use client'

import { useState, useRef } from 'react'

interface Props {
  username: string
  displayName: string
}

export default function AskMyBrain({ username, displayName }: Props) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  async function ask() {
    if (!question.trim() || loading) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setLoading(true)
    setAnswer('')

    try {
      const res = await fetch(`/api/public/${username}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
        signal: ctrl.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setAnswer(err.error || 'Something went wrong.')
        return
      }

      const reader = res.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setAnswer(prev => prev + decoder.decode(value, { stream: true }))
      }
    } catch (e: unknown) {
      if ((e as Error).name !== 'AbortError') setAnswer('Failed to reach the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-purple-500/20 rounded-3xl p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>🧠</span> Ask {displayName}&apos;s Brain
        </h2>
        <p className="text-zinc-400 text-sm mt-1">
          AI-powered answers from {displayName}&apos;s published notes
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask()}
          placeholder={`Ask anything about ${displayName}'s notes…`}
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
          disabled={loading}
        />
        <button
          onClick={ask}
          disabled={loading || !question.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-all"
        >
          {loading ? '…' : 'Ask'}
        </button>
      </div>

      {answer && (
        <div className="bg-black/30 border border-white/10 rounded-2xl p-4 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
          {answer}
          {loading && <span className="inline-block w-1.5 h-4 bg-purple-400 ml-1 animate-pulse rounded-sm" />}
        </div>
      )}
    </div>
  )
}
