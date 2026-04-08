"use client"

/**
 * ActivityHeatmap — GitHub-style contribution graph for note activity.
 * Fetches real data from /api/brain/heatmap instead of using fake slug-hash data.
 *
 * Usage: <ActivityHeatmap year={2025} />
 */

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, TrendingUp } from 'lucide-react'

interface DayData {
  date: string
  count: number
}

interface HeatmapData {
  days: DayData[]
  max: number
  year: number
  totalActivity: number
  activeDays: number
}

interface ActivityHeatmapProps {
  year?: number
  compact?: boolean
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

export function ActivityHeatmap({ year = new Date().getFullYear(), compact = false }: ActivityHeatmapProps) {
  const [data, setData] = useState<HeatmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/brain/heatmap?year=${year}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [year])

  const grid = useMemo(() => {
    if (!data) return []

    // Group days into weeks (columns), starting from Sunday
    const weeks: (DayData | null)[][] = []
    let currentWeek: (DayData | null)[] = []

    // Pad start of first week with nulls
    const firstDay = new Date(data.days[0]?.date ?? `${year}-01-01`)
    const startPad = firstDay.getDay() // 0=Sun
    for (let i = 0; i < startPad; i++) currentWeek.push(null)

    for (const day of data.days) {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }

    // Pad end of last week
    while (currentWeek.length > 0 && currentWeek.length < 7) currentWeek.push(null)
    if (currentWeek.length) weeks.push(currentWeek)

    return weeks
  }, [data, year])

  // Determine month label positions (which column each month starts in)
  const monthPositions = useMemo(() => {
    if (!grid.length) return []
    const positions: { label: string; col: number }[] = []
    let lastMonth = -1

    grid.forEach((week, colIdx) => {
      for (const day of week) {
        if (day) {
          const month = new Date(day.date).getMonth()
          if (month !== lastMonth) {
            positions.push({ label: MONTH_LABELS[month], col: colIdx })
            lastMonth = month
          }
          break
        }
      }
    })

    return positions
  }, [grid])

  function getColor(count: number, max: number): string {
    if (count === 0) return 'bg-muted/40 border border-border/30'
    const intensity = Math.ceil((count / max) * 4) // 1-4
    const colors = [
      'bg-emerald-500/25 border border-emerald-500/20',
      'bg-emerald-500/50 border border-emerald-500/40',
      'bg-emerald-500/75 border border-emerald-500/60',
      'bg-emerald-500 border border-emerald-600 shadow-[0_0_6px_rgba(16,185,129,0.35)]',
    ]
    return colors[intensity - 1] ?? colors[3]
  }

  if (loading) {
    return (
      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-40" />
          <div className="h-24 bg-muted/30 rounded" />
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-emerald-500" />
          Knowledge Growth {year}
        </h2>
        {!compact && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              {data.activeDays} active days
            </span>
            <span>{data.totalActivity} total actions</span>
          </div>
        )}
      </div>

      {/* Month labels */}
      <div className="relative flex gap-[3px] ml-7 mb-1">
        {monthPositions.map((pos) => (
          <div
            key={pos.label + pos.col}
            className="absolute text-[10px] text-muted-foreground"
            style={{ left: pos.col * 15 }}
          >
            {pos.label}
          </div>
        ))}
        <div className="h-4" />
      </div>

      {/* Day-of-week labels + grid */}
      <div className="flex gap-1">
        {/* Y-axis labels */}
        <div className="flex flex-col gap-[3px] mr-1">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="h-3 text-[9px] text-muted-foreground leading-3 w-6 text-right pr-1">
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-[3px] overflow-x-auto pb-2">
          {grid.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-[3px]">
              {week.map((day, dIdx) =>
                day === null ? (
                  <div key={dIdx} className="w-3 h-3" />
                ) : (
                  <div
                    key={dIdx}
                    className={`w-3 h-3 rounded-sm cursor-default transition-all hover:scale-125 hover:z-10 ${getColor(day.count, data.max)}`}
                    title={`${day.date}: ${day.count} action${day.count !== 1 ? 's' : ''}`}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                  />
                )
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend + hover tooltip */}
      <div className="flex items-center justify-between mt-3">
        {hoveredDay ? (
          <span className="text-xs text-muted-foreground">
            {new Date(hoveredDay.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            : {hoveredDay.count} action{hoveredDay.count !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Hover for details</span>
        )}

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Less</span>
          {['bg-muted/40 border border-border/30', 'bg-emerald-500/25', 'bg-emerald-500/50', 'bg-emerald-500/75', 'bg-emerald-500'].map((cls, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
