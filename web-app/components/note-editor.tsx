"use client"

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Save, Loader2, Link as LinkIcon, Sparkles, MessageSquare, Tags, Wand2 } from 'lucide-react'
import { TagManager } from '@/components/tag-manager'
import { BrainNote } from '@/app/api/brain/notes/route'

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
  onOpenChat?: () => void
}

export function NoteEditor({ initialContent, initialTitle, initialTags = [], slug, onSave, onOpenChat }: NoteEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [title, setTitle] = useState(initialTitle)
  const [tags, setTags] = useState(initialTags)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isLinking, setIsLinking] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [isAutoTagging, setIsAutoTagging] = useState(false)
  
  const handleAutoLink = async () => {
    setIsLinking(true)
    try {
      // 1. Fetch all available notes
      const res = await fetch('/api/brain/notes')
      const notes: BrainNote[] = await res.json()
      
      // 2. We don't want to link to ourselves
      const otherNotes = notes.filter(n => n.slug !== slug)
      
      let newContent = content
      let linksAdded = 0
      
      // Sort by length descending so "Docker Basics" matches before "Docker"
      otherNotes.sort((a, b) => b.title.length - a.title.length)

      for (const note of otherNotes) {
        // Find literal occurrences of the title that are NOT already inside [[...]]
        // Use a regex with negative lookbehind/lookahead for [[ ]], or just basic word boundaries
        // This regex looks for the word, making sure it's not preceded by [[ and followed by ]]
        // Due to lack of full lookbehind in all JS engines, we can do a simpler replacement loop:
        const escapedTitle = note.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // We only want to match the title as whole words ideally, ignoring case
        // and ensuring it's not already in double brackets.
        const regex = new RegExp(`(?<!\\[\\[)(?<!\\[[^\\]]*)\\b(${escapedTitle})\\b(?![^\\[]*\\]\\])`, 'gi');
        
        const previousContent = newContent;
        newContent = newContent.replace(regex, (match) => {
           // Provide the exact title/slug in the link, keep original matched casing or just use slug
           return `[[${note.slug}]]`
        });
        
        if (previousContent !== newContent) {
            linksAdded++;
        }
      }
      
      setContent(newContent)
      if (linksAdded > 0) {
          // Toast or visual indicator could go here
          console.log(`Added ${linksAdded} links!`)
      }
    } catch (error) {
       console.error("Auto link failed", error)
    } finally {
       setIsLinking(false)
    }
  }

  const handleSummarize = async () => {
    setIsSummarizing(true)
    try {
      const res = await fetch('/api/brain/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      const data = await res.json()
      if (data.summary) {
         setContent(`> **TL;DR:** ${data.summary}\n\n` + content)
      }
    } catch (error) {
       console.error("Auto summarize failed", error)
    } finally {
       setIsSummarizing(false)
    }
  }

  const handleAutoTag = async () => {
    setIsAutoTagging(true)
    try {
      const res = await fetch('/api/brain/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      const data = await res.json()
      if (data.tags && Array.isArray(data.tags)) {
         // Merge unique tags
         const newTags = Array.from(new Set([...tags, ...data.tags]))
         setTags(newTags)
      }
    } catch (error) {
       console.error("Auto tag failed", error)
    } finally {
       setIsAutoTagging(false)
    }
  }

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
              onClick={onOpenChat}
              className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors border"
              title="Ask Meowdel about this note"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden md:inline">Ask Meowdel</span>
            </button>
            <button
              onClick={handleAutoLink}
              disabled={isLinking || isSaving}
              className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors border"
              title="Auto-Link Concepts"
            >
              {isLinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span className="hidden md:inline">Magic Link</span>
            </button>
            <button
              onClick={handleAutoTag}
              disabled={isAutoTagging || isSaving}
              className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors border"
              title="Auto-Tag Note"
            >
              {isAutoTagging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tags className="w-4 h-4" />}
              <span className="hidden md:inline">Auto-Tag</span>
            </button>
            <button
              onClick={handleSummarize}
              disabled={isSummarizing || isSaving}
              className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors border"
              title="Summarize Note"
            >
              {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              <span className="hidden md:inline">Summarize</span>
            </button>
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
