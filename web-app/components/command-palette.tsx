"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, FileCode, Hash } from 'lucide-react'
import { BrainNote } from '@/app/api/brain/notes/route'
// We use a simple fuzzy match for speed
import Fuse from 'fuse.js'

export interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [notes, setNotes] = useState<BrainNote[]>([])
  const [results, setResults] = useState<BrainNote[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setIsLoading(true)
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 50)
      
      fetch('/api/brain/notes')
        .then(res => res.json())
        .then(data => {
            setNotes(data)
            setResults(data)
            setIsLoading(false)
        })
        .catch(console.error)
    }
  }, [isOpen])

  useEffect(() => {
    if (!query) {
       setResults(notes)
       setSelectedIndex(0)
       return
    }

    const fuse = new Fuse(notes, {
        keys: ['title', 'tags', 'content'],
        threshold: 0.3, // Fuzzy matching threshold
        includeScore: true
    })

    const fusedResults = fuse.search(query).map((r: any) => r.item)
    setResults(fusedResults)
    setSelectedIndex(0)
  }, [query, notes])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex].slug)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  const handleSelect = (slug: string) => {
    onClose()
    router.push(`/brain/notes/${slug}`)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-start justify-center pt-[20vh]" onClick={onClose}>
       <div 
         className="w-full max-w-xl bg-card border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
         onClick={e => e.stopPropagation()}
       >
         <div className="flex items-center gap-3 px-4 py-3 border-b">
           <Search className="w-5 h-5 text-muted-foreground" />
           <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search concepts, notes, or tags..."
              className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-lg placeholder:text-muted-foreground"
           />
           {isLoading && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
           <div className="text-xs text-muted-foreground font-semibold px-2 py-0.5 border rounded">ESC</div>
         </div>

         <div className="max-h-[60vh] overflow-y-auto p-2">
            {results.length === 0 && !isLoading ? (
               <div className="py-12 text-center text-muted-foreground">
                  No matches found for "{query}"
               </div>
            ) : (
               results.map((note, index) => (
                  <div
                     key={note.slug}
                     onClick={() => handleSelect(note.slug)}
                     className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        index === selectedIndex ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
                     }`}
                  >
                     <div className="mt-1 bg-card border rounded p-1.5 flex-shrink-0">
                        {note.tags?.length > 0 ? <Hash className="w-4 h-4" /> : <FileCode className="w-4 h-4" />}
                     </div>
                     <div className="flex flex-col min-w-0">
                        <span className="font-semibold truncate">{note.title}</span>
                        <span className="text-xs text-muted-foreground truncate">{note.summary ?? ""}</span>
                     </div>
                     {index === selectedIndex && (
                        <div className="ml-auto flex items-center shrink-0">
                           <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">Enter</span>
                        </div>
                     )}
                  </div>
               ))
            )}
         </div>
       </div>
    </div>
  )
}
