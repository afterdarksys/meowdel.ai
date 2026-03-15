"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { NoteEditor } from "@/components/note-editor"
import { BrainNote } from "@/app/api/brain/notes/route"

export default function NotePage() {
  const params = useParams()
  const slugArray = params.slug as string[]
  const slug = slugArray?.join('/')

  const [note, setNote] = useState<BrainNote | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    
    fetch(`/api/brain/notes/${slugArray.map(encodeURIComponent).join('/')}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setNote(data)
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
    />
  )
}
