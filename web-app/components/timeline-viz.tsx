"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CalendarClock, FileText, Loader2, GitCommitHorizontal, Tag } from "lucide-react"
import { BrainNote } from "@/app/api/brain/notes/route"

// Helper to simulate stable creation dates based on note content for demo purposes
// In a real app with file stats, this would use fs.stat
const getSimulatedDate = (slug: string) => {
  // Generate a reproducible date between 1-30 days ago
  let hash = 0
  for (let i = 0; i < slug.length; i++) hash = slug.charCodeAt(i) + ((hash << 5) - hash)
  const daysAgo = (Math.abs(hash) % 30) + 1
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d
}

interface TimelineGroup {
  monthYear: string
  notes: (BrainNote & { date: Date })[]
}

export function TimelineViz() {
  const router = useRouter()
  const [timelineData, setTimelineData] = useState<TimelineGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTimeline = async () => {
      try {
        const res = await fetch('/api/brain/notes')
        const notes: BrainNote[] = await res.json()

        // Assign fake dates and sort newest first
        const datedNotes = notes.map(n => ({ ...n, date: getSimulatedDate(n.slug) }))
                                .sort((a, b) => b.date.getTime() - a.date.getTime())

        // Group by Month Year
        const groups: Record<string, typeof datedNotes> = {}
        datedNotes.forEach(note => {
           const my = note.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
           if (!groups[my]) groups[my] = []
           groups[my].push(note)
        })

        const groupArray = Object.keys(groups).map(k => ({
           monthYear: k,
           notes: groups[k]
        }))

        setTimelineData(groupArray)

      } catch (e) {
        console.error("Failed to load timeline", e)
      } finally {
        setLoading(false)
      }
    }
    loadTimeline()
  }, [])

  if (loading) {
    return (
       <div className="flex flex-col items-center justify-center p-12 text-muted-foreground w-full h-full">
         <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
         <p>Mapping temporal history...</p>
       </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto w-full py-12 px-6">
       <div className="mb-12 text-center">
          <div className="inline-flex w-16 h-16 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-500 items-center justify-center rounded-2xl mb-4 shadow-[0_0_30px_rgba(245,158,11,0.15)] border border-amber-500/20">
             <CalendarClock className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-500 mb-2">
             Knowledge Journey
          </h1>
          <p className="text-muted-foreground">Trace the chronological growth of your digital brain.</p>
       </div>

       <div className="relative border-l-2 border-primary/20 ml-4 md:ml-0 space-y-12">
          {timelineData.map((group, gIdx) => (
             <div key={gIdx} className="relative">
                {/* Timeline Node for Month */}
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-background border-2 border-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] z-10" />
                
                <h2 className="pl-8 text-2xl font-bold text-foreground mb-6 sticky top-4 bg-background/95 backdrop-blur py-2 z-10 w-[calc(100%+32px)]">
                  {group.monthYear}
                </h2>
                
                <div className="pl-8 space-y-6 relative">
                   {group.notes.map((note, nIdx) => (
                      <div 
                        key={note.slug} 
                        className="group relative bg-card border border-border/50 hover:border-primary/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        onClick={() => router.push(`/brain/notes?slug=${note.slug}`)}
                      >
                         {/* Connection to edge */}
                         <div className="absolute -left-8 top-8 w-8 text-border group-hover:text-primary/50 transition-colors flex items-center justify-end pr-1">
                            <GitCommitHorizontal className="w-5 h-5" />
                         </div>

                         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2 group-hover:text-primary transition-colors">
                               <FileText className="w-4 h-4" />
                               {note.title}
                            </h3>
                            <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-md shrink-0">
                               {note.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                         </div>
                         
                         <p className="text-sm text-muted-foreground/90 line-clamp-2 leading-relaxed mb-4">
                            {note.excerpt || "No content summary available."}
                         </p>

                         {note.tags && note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-auto">
                               {note.tags.map((tag, tIdx) => (
                                  <span key={tIdx} className="flex items-center gap-1 text-[10px] bg-secondary/50 text-secondary-foreground border px-2 py-0.5 rounded-full font-medium">
                                     <Tag className="w-2.5 h-2.5" />
                                     {tag}
                                  </span>
                               ))}
                            </div>
                         )}
                      </div>
                   ))}
                </div>
             </div>
          ))}
       </div>
       
       {timelineData.length === 0 && (
          <div className="text-center p-12 bg-muted/30 border rounded-2xl relative">
             <div className="absolute top-1/2 left-0 w-2 h-full -translate-y-1/2 -ml-[1px] bg-background"></div>
             <p className="text-muted-foreground mb-2 relative z-10">Your timeline is empty.</p>
             <p className="text-sm text-muted-foreground/70 relative z-10">Start writing notes to see your journey unfold.</p>
          </div>
       )}
    </div>
  )
}
