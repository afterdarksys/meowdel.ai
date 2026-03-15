"use client"

import { useMemo } from "react"
import { BrainNote } from "@/app/api/brain/notes/route"
import { CalendarDays } from "lucide-react"

interface ActivityHeatmapProps {
  notes: BrainNote[]
}

export function ActivityHeatmap({ notes }: ActivityHeatmapProps) {
  // Generate a mock activity grid for the last 6 months (approx 180 days)
  // In a real app, this would use the real modification/creation stats of the notes.
  // For the MVP, we use the slug length and ascii values to seed a stable display.
  
  const days = 180
  const activityData = useMemo(() => {
     const data = new Array(days).fill(0)
     notes.forEach(note => {
        let hash = 0
        for (let i = 0; i < note.slug.length; i++) hash = note.slug.charCodeAt(i) + ((hash << 5) - hash)
        
        // Distribute notes across the grid semi-randomly but stably
        const dayIndex = Math.abs(hash) % days
        data[dayIndex] = (data[dayIndex] || 0) + 1
        
        // Add some clustered activity
        const clusterSize = (Math.abs(hash) % 3) + 1
        for (let j = 1; j < clusterSize; j++) {
           if (dayIndex - j >= 0) data[dayIndex - j] = (data[dayIndex - j] || 0) + 1
        }
     })
     return data
  }, [notes])

  // Split into weeks (7 days per column)
  const columns = Math.ceil(days / 7)
  const grid = []
  let dayCounter = 0
  
  for (let c = 0; c < columns; c++) {
     const col = []
     for (let r = 0; r < 7; r++) {
        if (dayCounter < days) {
           col.push(activityData[dayCounter])
        } else {
           col.push(-1) // Empty placeholder
        }
        dayCounter++
     }
     grid.push(col)
  }

  const getColor = (count: number) => {
     if (count === -1) return 'bg-transparent'
     if (count === 0) return 'bg-muted/30 border border-border/50'
     if (count === 1) return 'bg-emerald-500/30 border border-emerald-500/20'
     if (count === 2) return 'bg-emerald-500/60 border border-emerald-500/40'
     if (count >= 3) return 'bg-emerald-500 border border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
     return 'bg-muted'
  }

  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm overflow-hidden">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
         <CalendarDays className="w-5 h-5 text-emerald-500" /> Knowledge Growth
      </h2>
      
      <div className="flex gap-[3px] overflow-x-auto pb-4 custom-scrollbar">
         {grid.map((col, cIdx) => (
            <div key={cIdx} className="flex flex-col gap-[3px]">
               {col.map((count, rIdx) => (
                  <div 
                    key={rIdx} 
                    className={`w-3 h-3 rounded-sm ${getColor(count)} transition-all hover:scale-125 hover:z-10`}
                    title={count > 0 ? `${count} notes active` : 'No activity'}
                  />
               ))}
            </div>
         ))}
      </div>
      
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mt-2">
         <span>Less</span>
         <div className="w-3 h-3 rounded-sm bg-muted/30 border border-border/50"></div>
         <div className="w-3 h-3 rounded-sm bg-emerald-500/30 border border-emerald-500/20"></div>
         <div className="w-3 h-3 rounded-sm bg-emerald-500/60 border border-emerald-500/40"></div>
         <div className="w-3 h-3 rounded-sm bg-emerald-500 border border-emerald-600"></div>
         <span>More</span>
      </div>
    </div>
  )
}
