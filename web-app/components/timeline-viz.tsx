"use client"

/**
 * TimelineViz — chronological knowledge journey using real DB data.
 * Fixed to use /api/brain/timeline instead of fake slug-hash dates.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, FileText, Loader2, GitCommitHorizontal, Tag, TrendingUp } from 'lucide-react'

interface TimelineNote {
  id: string
  slug: string
  title: string
  summary: string | null
  tags: string[]
  wordCount: number
  createdAt: string
}

interface TimelineMonth {
  month: string
  label: string
  notes: TimelineNote[]
  count: number
  totalWords: number
}

export function TimelineViz() {
  const router = useRouter()
  const [months, setMonths] = useState<TimelineMonth[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetch('/api/brain/timeline?limit=200')
      .then((r) => r.json())
      .then((data) => {
        setMonths(data.months ?? [])
        setTotal(data.total ?? 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground w-full">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
        <p>Loading your knowledge timeline...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto w-full py-12 px-4 md:px-6">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex w-16 h-16 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-500 items-center justify-center rounded-2xl mb-4 shadow-[0_0_30px_rgba(245,158,11,0.15)] border border-amber-500/20">
          <CalendarClock className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-500 mb-2">
          Knowledge Journey
        </h1>
        <p className="text-muted-foreground">
          {total > 0
            ? `${total} notes across ${months.length} months`
            : 'Trace the chronological growth of your digital brain'}
        </p>
      </div>

      {/* Timeline */}
      {months.length === 0 ? (
        <div className="text-center p-12 bg-muted/30 border rounded-2xl">
          <p className="text-muted-foreground mb-2">Your timeline is empty.</p>
          <p className="text-sm text-muted-foreground/70">Start writing notes to see your journey unfold.</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-primary/20 ml-4 md:ml-0 space-y-12">
          {months.map((group, gIdx) => (
            <div key={group.month} className="relative">
              {/* Month marker */}
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-background border-2 border-primary shadow-[0_0_10px_rgba(99,102,241,0.4)] z-10" />

              <div className="pl-8 sticky top-0 bg-background/95 backdrop-blur py-2 z-10 flex items-center justify-between pr-2 -mx-2 rounded-lg mb-4">
                <h2 className="text-xl font-bold text-foreground">{group.label}</h2>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" /> {group.count} note{group.count !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {group.totalWords.toLocaleString()} words
                  </span>
                </div>
              </div>

              <div className="pl-8 space-y-5">
                {group.notes.map((note) => (
                  <div
                    key={note.slug}
                    className="group relative bg-card border border-border/50 hover:border-primary/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    onClick={() => router.push(`/brain/notes?slug=${note.slug}`)}
                  >
                    {/* Connector */}
                    <div className="absolute -left-8 top-8 w-8 text-border group-hover:text-primary/50 transition-colors flex items-center justify-end pr-1">
                      <GitCommitHorizontal className="w-5 h-5" />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h3 className="text-base font-bold text-foreground flex items-center gap-2 group-hover:text-primary transition-colors">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        {note.title}
                      </h3>
                      <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-md shrink-0">
                        {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {note.summary && (
                      <p className="text-sm text-muted-foreground/90 line-clamp-2 leading-relaxed mb-3">
                        {note.summary}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {note.tags.slice(0, 4).map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="flex items-center gap-1 text-[10px] bg-secondary/50 text-secondary-foreground border px-2 py-0.5 rounded-full font-medium"
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground/60 ml-auto">
                        {note.wordCount} words
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
