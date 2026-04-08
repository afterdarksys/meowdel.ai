"use client"

import { useState } from 'react'
import { Sparkles, Loader2, ArrowRight } from 'lucide-react'
import { BrainNote } from '@/app/api/brain/notes/route'
import Link from 'next/link'
import { useSettings } from '@/lib/settings-context'

export function AskMeowdel() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<(BrainNote & {score: number})[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  
  const { brainPersonality } = useSettings()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    try {
      // Get all notes first to act as corpus
      const notesRes = await fetch('/api/brain/notes')
      const notes = await notesRes.json()

      const searchRes = await fetch('/api/brain/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, notes })
      })

      const scored = await searchRes.json()
      setResults(scored)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSearching(false)
      setIsOpen(true)
    }
  }

  return (
    <div className="relative w-full max-w-xl mx-auto z-50">
      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative flex items-center bg-card/80 backdrop-blur-md border rounded-full px-4 py-2 shadow-lg">
          <Sparkles className="w-5 h-5 text-primary mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={brainPersonality === 'cat' ? "Ask Meowdel anything about the brain..." : "Search your knowledge base..."}
            className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm"
          />
          {isSearching ? (
             <Loader2 className="w-5 h-5 text-muted-foreground animate-spin ml-2" />
          ) : (
            <button type="submit" disabled={!query.trim()} className="p-1 rounded-full hover:bg-primary/10 text-primary transition-colors disabled:opacity-50 disabled:hover:bg-transparent">
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card/90 backdrop-blur-xl border rounded-xl shadow-2xl p-2 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-2 border-b mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top Semantic Matches</span>
            <button onClick={() => setIsOpen(false)} className="text-xs hover:text-foreground text-muted-foreground">Close</button>
          </div>
          <div className="space-y-1">
            {results.map(res => (
              <Link 
                key={res.slug} 
                href={`/brain/notes/${res.slug}`}
                onClick={() => setIsOpen(false)}
                className="block p-3 hover:bg-secondary rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-primary group-hover:underline">{res.title}</h4>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono">
                    {(res.score * 100).toFixed(0)}% Match
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{res.summary ?? ""}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
