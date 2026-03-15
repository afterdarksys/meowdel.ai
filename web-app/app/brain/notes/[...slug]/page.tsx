"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { NoteEditor } from "@/components/note-editor"
import { BrainNote } from "@/app/api/brain/notes/route"
import { useGlobalChat } from "@/lib/chat-context"

export default function NotePage() {
  const params = useParams()
  const slugArray = params.slug as string[]
  const slug = slugArray?.join('/')

  const [note, setNote] = useState<BrainNote | null>(null)
  const [availableNotes, setAvailableNotes] = useState<BrainNote[]>([])
  const [loading, setLoading] = useState(true)
  const { setActiveContextNote, setChatOpen } = useGlobalChat()

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    
    Promise.all([
      fetch(`/api/brain/notes/${slugArray.map(encodeURIComponent).join('/')}`).then(res => res.json()),
      fetch('/api/brain/notes').then(res => res.json())
    ])
      .then(([noteData, allNotesData]) => {
        if (!noteData.error) {
          setNote(noteData)
          setActiveContextNote(noteData) // Set global context
        }
        if (!allNotesData.error && Array.isArray(allNotesData)) {
          setAvailableNotes(allNotesData)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to fetch note:", err)
        setLoading(false)
      })
  }, [slug, slugArray])

  if (loading) {
     return <div className="h-full w-full flex items-center justify-center bg-background"><div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin"></div></div>
  }

  if (!note) {
    return <div className="p-8 text-center text-muted-foreground">Note not found or failed to load.</div>
  }

  return (
    <NoteEditor 
      initialContent={note.content} 
      initialTitle={note.title} 
      slug={slug} 
      onOpenChat={() => setChatOpen(true)}
      availableNotes={availableNotes}
    />
  )
}
