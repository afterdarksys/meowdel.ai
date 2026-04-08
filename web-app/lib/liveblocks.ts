/**
 * Liveblocks client configuration
 * Import this in client components that need real-time features.
 */

import { createClient } from '@liveblocks/client'
import { createRoomContext } from '@liveblocks/react'

const client = createClient({
  authEndpoint: '/api/brain/liveblocks-auth',
})

// Presence = what each user is doing right now (cursor, selection)
type Presence = {
  cursor: { x: number; y: number } | null
  // noteId the user has focused
  focusedNoteId: string | null
  // character offset in the editor
  selectionStart: number | null
  selectionEnd: number | null
}

// Storage = the shared document state (Yjs handles the CRDT)
type Storage = Record<string, never>

// UserMeta = static info attached to the Liveblocks session
type UserMeta = {
  id: string
  info: {
    name: string
    email: string
    color: string
  }
}

type RoomEvent = {
  type: 'CURSOR_CLICK'
  x: number
  y: number
}

export const {
  RoomProvider,
  useMyPresence,
  useOthers,
  useSelf,
  useRoom,
  useStatus,
  useBroadcastEvent,
  useEventListener,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client)
