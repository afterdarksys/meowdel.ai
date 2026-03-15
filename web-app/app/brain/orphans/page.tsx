"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileQuestion, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { BrainNote } from '@/app/api/brain/notes/route'

export default function OrphansPage() {
  const [orphans, setOrphans] = useState<BrainNote[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadOrphans() {
      try {
        const res = await fetch('/api/brain/orphans')
        if (res.ok) {
           const data = await res.json()
           setOrphans(data.orphans || [])
        }
      } catch (error) {
        console.error('Failed to load orphans:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadOrphans()
  }, [])

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex flex-col gap-2 border-b pb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <FileQuestion className="w-6 h-6" />
             </div>
             <h1 className="text-3xl font-bold tracking-tight">Adoption Center</h1>
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
             <AlertCircle className="w-4 h-4" />
             These isolated notes have no incoming connections. Link them to integrate them into your Brain.
          </p>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
             <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : orphans.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center bg-card/50">
             <div className="text-4xl mb-4">🎉</div>
             <h3 className="font-semibold text-xl mb-2">No Orphans Found!</h3>
             <p className="text-muted-foreground">Your knowledge graph is fully connected. Excellent job!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {orphans.map((note) => (
                <Link
                   key={note.slug}
                   href={`/brain/notes/${note.slug}`}
                   className="group relative flex flex-col gap-2 p-5 border rounded-xl bg-card hover:bg-secondary transition-colors overflow-hidden"
                >
                   <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-4 h-4 text-primary" />
                   </div>
                   <h3 className="font-semibold truncate pr-6">{note.title}</h3>
                   <div className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {note.excerpt}
                   </div>
                   {note.tags && note.tags.length > 0 && (
                      <div className="flex gap-1 mt-auto pt-2">
                         {note.tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {tag}
                            </span>
                         ))}
                      </div>
                   )}
                </Link>
             ))}
          </div>
        )}
      </div>
    </div>
  )
}
