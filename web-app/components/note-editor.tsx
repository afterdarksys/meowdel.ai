"use client"

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Save, Loader2 } from 'lucide-react'
import { TagManager } from '@/components/tag-manager'

// Dynamically import MDEditor with SSR disabled
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center animate-pulse bg-muted/20">Loading Editor...</div> }
)

export interface NoteEditorProps {
  initialContent: string
  initialTitle: string
  initialTags?: string[]
  slug: string
  onSave?: () => void
}

export function NoteEditor({ initialContent, initialTitle, initialTags = [], slug, onSave }: NoteEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [title, setTitle] = useState(initialTitle)
  const [tags, setTags] = useState(initialTags)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const parts = slug.split('/')
      await fetch(`/api/brain/notes/${parts.map(encodeURIComponent).join('/')}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, title, tags })
      })
      setLastSaved(new Date())
      if (onSave) onSave()
    } catch (error) {
      console.error('Failed to save', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Auto-save debounce effect could go here

  return (
    <div className="flex flex-col h-full w-full bg-background relative" data-color-mode="dark">
      {/* Editor Header */}
      <div className="flex flex-col px-6 py-4 border-b bg-card z-10">
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold bg-transparent border-none outline-none focus:ring-0 placeholder:text-muted-foreground w-full"
            placeholder="Untitled Note"
          />
          <div className="flex items-center gap-4 text-sm text-muted-foreground ml-4 flex-shrink-0">
            {lastSaved && <span>Saved {lastSaved.toLocaleTimeString()}</span>}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        <TagManager tags={tags} onTagsChange={setTags} />
      </div>

      <div className="flex-1 overflow-hidden relative">
        <MDEditor
          value={content}
          onChange={(val) => setContent(val || '')}
          height="100%"
          className="border-none !rounded-none"
          previewOptions={{
             remarkPlugins: [require('@/lib/remark-wikilink').default]
          }}
          style={{ height: '100%' }}
        />
      </div>
    </div>
  )
}
