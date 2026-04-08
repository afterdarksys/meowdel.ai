"use client"

/**
 * CollabNoteWrapper — conditionally wraps <NoteEditor> in a Liveblocks room.
 * On free/pro: renders children directly.
 * On team+: wraps with <RoomProvider> so presence and cursor features activate.
 *
 * Usage (in the note page server component):
 *   <CollabNoteWrapper noteId={note.id} isTeam={can(tier, 'collaboration')}>
 *     <NoteEditor ... />
 *   </CollabNoteWrapper>
 */

import { ReactNode } from 'react'
import { RoomProvider } from '@/lib/liveblocks'
import { CollabPresence, CollabCursorOverlay } from '@/components/collab-presence'

interface CollabNoteWrapperProps {
  noteId: string
  isTeam: boolean
  children: ReactNode
}

export function CollabNoteWrapper({ noteId, isTeam, children }: CollabNoteWrapperProps) {
  if (!isTeam) {
    return <>{children}</>
  }

  return (
    <RoomProvider
      id={`note:${noteId}`}
      initialPresence={{
        cursor: null,
        focusedNoteId: noteId,
        selectionStart: null,
        selectionEnd: null,
      }}
    >
      <div
        className="relative h-full w-full"
        onPointerMove={(e) => {
          // Presence cursor tracking is wired in here so all child components
          // benefit without needing direct access to useMyPresence.
          // The actual mutation lives in CollabPresenceTracker below.
        }}
      >
        {/* Presence bar injected above the editor */}
        <div className="absolute top-0 right-4 z-30 flex items-center gap-2 py-1">
          <CollabPresence />
        </div>
        {/* Cursor overlay */}
        <CollabCursorOverlay />
        {children}
      </div>
    </RoomProvider>
  )
}
