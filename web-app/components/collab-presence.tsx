"use client"

/**
 * CollabPresence — shows live avatars + cursors for collaborating users.
 * Wrap the NoteEditor in <RoomProvider> then drop this inside the editor header.
 *
 * Tier: team
 */

import { useOthers, useSelf } from '@/lib/liveblocks'
import { Users } from 'lucide-react'

export function CollabPresence() {
  const others = useOthers()
  const self = useSelf()

  if (!self) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeOthers = (others as any[]).filter((o) => o.presence?.focusedNoteId !== null)

  return (
    <div className="flex items-center gap-2">
      <Users className="w-4 h-4 text-muted-foreground" />
      <div className="flex -space-x-2">
        {/* Self */}
        <Pip
          name={(self.info?.name as string) ?? 'You'}
          color={(self.info?.color as string) ?? '#6366f1'}
          label="You"
        />
        {/* Others */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {activeOthers.slice(0, 5).map((other: any) => (
          <Pip
            key={other.connectionId}
            name={(other.info?.name as string) ?? 'Collaborator'}
            color={(other.info?.color as string) ?? '#ec4899'}
          />
        ))}
      </div>
      {activeOthers.length > 0 && (
        <span className="text-xs text-muted-foreground">
          {activeOthers.length} editing
        </span>
      )}
    </div>
  )
}

function Pip({
  name,
  color,
  label,
}: {
  name: string
  color: string
  label?: string
}) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-background cursor-default"
      style={{ backgroundColor: color }}
      title={label ?? name}
    >
      {initials}
    </div>
  )
}

/**
 * CollabCursorOverlay — renders other users' cursors on top of the editor.
 * Place this as a sibling of MDEditor with position: absolute fill.
 */
export function CollabCursorOverlay() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const others = useOthers() as any[]

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {others.map((other) => {
        const cursor = other.presence?.cursor
        if (!cursor) return null
        const color = (other.info?.color as string) ?? '#ec4899'
        const name = (other.info?.name as string) ?? 'Collaborator'

        return (
          <div
            key={other.connectionId}
            className="absolute transition-transform duration-75"
            style={{ left: cursor.x, top: cursor.y }}
          >
            {/* SVG cursor arrow */}
            <svg
              width="16"
              height="20"
              viewBox="0 0 16 20"
              fill="none"
              style={{ color }}
            >
              <path
                d="M0 0L0 16L4.5 12L7 18L9 17L6.5 11L12 11L0 0Z"
                fill={color}
                stroke="white"
                strokeWidth="1"
              />
            </svg>
            <span
              className="absolute top-4 left-3 text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white whitespace-nowrap"
              style={{ backgroundColor: color }}
            >
              {name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
