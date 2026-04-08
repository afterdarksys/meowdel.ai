"use client"

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Save, Loader2, Sparkles, MessageSquare, Tags, Wand2, History, GitBranch, Map, Zap } from 'lucide-react'
import { TagManager } from '@/components/tag-manager'
import { ConnectionSuggester } from '@/components/connection-suggester'
import { VoiceRecorder } from '@/components/voice-recorder'
import { TtsPlayer } from '@/components/tts-player'
import { MindMap } from '@/components/mind-map'
import { BrainNote } from '@/app/api/brain/notes/route'
import { InlineAiMenu } from '@/components/inline-ai-menu'
import { VersionHistory } from '@/components/version-history'
import { findLinkTrigger, fuzzyMatch } from '@/lib/link-suggester'
import { useShortcuts } from '@/lib/use-shortcuts'

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
  noteId?: string
  onSave?: () => void
  onOpenChat?: () => void
  availableNotes: BrainNote[]
}

export function NoteEditor({ initialContent, initialTitle, initialTags = [], slug, noteId, onSave, onOpenChat, availableNotes = [] }: NoteEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [title, setTitle] = useState(initialTitle)
  const [tags, setTags] = useState(initialTags)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isLinking, setIsLinking] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [isAutoTagging, setIsAutoTagging] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showMindMap, setShowMindMap] = useState(false)

  // Link Suggestions State
  const [suggestions, setSuggestions] = useState<BrainNote[]>([])
  const [suggestionIndex, setSuggestionIndex] = useState(0)
  const [suggestionQueryInfo, setSuggestionQueryInfo] = useState<{ query: string; startIndex: number } | null>(null)
  
  // Inline AI State
  const [selectedText, setSelectedText] = useState("")
  const [selectionRange, setSelectionRange] = useState<[number, number] | null>(null)

  useEffect(() => {
    const handleSelection = () => {
      const activeEl = document.activeElement as HTMLTextAreaElement
      if (activeEl && activeEl.tagName === 'TEXTAREA') {
        const text = activeEl.value.substring(activeEl.selectionStart, activeEl.selectionEnd)
        if (text.trim().length > 5 && text.length < 2000) {
           setSelectedText(text)
           setSelectionRange([activeEl.selectionStart, activeEl.selectionEnd])
        }
      }
    }
    document.addEventListener('selectionchange', handleSelection)
    return () => document.removeEventListener('selectionchange', handleSelection)
  }, [])

  const handleApplyAiTransformation = (newText: string) => {
    if (selectionRange) {
       const [start, end] = selectionRange
       const before = content.slice(0, start)
       const after = content.slice(end)
       setContent(before + newText + after)
       setSelectedText("")
       setSelectionRange(null)
    }
  }

  // Real-time suggestion check
  const handleContentChange = (val: string | undefined) => {
    const newContent = val || ''
    setContent(newContent)

    // A very simple approximation of cursor position by seeing where it differs
    // Real implementation would track via editor ref, but MDEditor obscures it.
    // For MVP, we'll use the end of the text.
    // Actually, we can get cursor pos if MDEditor gives it, but it doesn't easily without refs.
    // Let's assume the user is typing at the end of the content for this check.
    const cursorPos = newContent.length
    
    const trigger = findLinkTrigger(newContent, cursorPos)
    if (trigger && trigger.query.length >= 2) {
      const query = trigger.query
      const otherNotes = availableNotes.filter(n => n.slug !== slug)
      
      const matches = otherNotes.filter(n => 
        fuzzyMatch(query, n.title) || fuzzyMatch(query, n.slug)
      ).slice(0, 5) // Top 5

      if (matches.length > 0) {
        setSuggestions(matches)
        setSuggestionQueryInfo(trigger)
        setSuggestionIndex(0)
      } else {
        setSuggestions([])
        setSuggestionQueryInfo(null)
      }
    } else {
      setSuggestions([])
      setSuggestionQueryInfo(null)
    }
  }

  const applySuggestion = (note: BrainNote) => {
    if (!suggestionQueryInfo) return
    const { startIndex, query } = suggestionQueryInfo
    
    // Replace the query text with the exact link
    const before = content.slice(0, startIndex)
    const after = content.slice(startIndex + query.length)
    
    // If we're already inside `[[`, don't add them again
    const linkText = `[[${note.slug}]]`
    
    setContent(before + linkText + after)
    setSuggestions([])
    setSuggestionQueryInfo(null)
  }

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSuggestionIndex(i => (i + 1) % suggestions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSuggestionIndex(i => (i - 1 + suggestions.length) % suggestions.length)
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault()
        applySuggestion(suggestions[suggestionIndex])
      } else if (e.key === 'Escape') {
        setSuggestions([])
      }
      return // Stop processing if suggestions are open
    }

    // Save
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault()
      handleSave()
      return
    }

    // Quick Link
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
      e.preventDefault()
      handleAutoLink()
      return
    }
  }
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
      
      // Save version snapshot first
      try {
         await fetch('/api/brain/versions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, content })
         })
      } catch (e) {
         console.error("Failed to snapshot version", e)
      }

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

  // Keyboard shortcut handlers
  const wrapSelectedText = (prefix: string, suffix?: string) => {
    const textarea = document.querySelector('textarea[class*="w-md-editor-text"]') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)

    if (selectedText) {
      const wrapped = `${prefix}${selectedText}${suffix || prefix}`
      const newContent = content.substring(0, start) + wrapped + content.substring(end)
      setContent(newContent)

      // Restore selection after state update
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + prefix.length, end + prefix.length)
      }, 0)
    }
  }

  const handleQuickLink = () => {
    wrapSelectedText('[[', ']]')
  }

  const handleQuickTag = () => {
    handleAutoTag()
  }

  const handleQuickSave = () => {
    handleSave()
  }

  const handleBold = () => {
    wrapSelectedText('**')
  }

  const handleItalic = () => {
    wrapSelectedText('*')
  }

  // Initialize keyboard shortcuts
  useShortcuts({
    onQuickLink: handleQuickLink,
    onQuickTag: handleQuickTag,
    onQuickSave: handleQuickSave,
    onBold: handleBold,
    onItalic: handleItalic,
  })

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
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors border ${showHistory ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
              title="View Version History"
            >
              <History className="w-4 h-4" />
              <span className="hidden md:inline">History</span>
            </button>
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
            <VoiceRecorder
              disabled={isSaving}
              onTranscription={(text) => {
                 setContent(prev => prev + (prev.endsWith('\n\n') || prev === '' ? text : `\n\n${text}`))
              }}
            />
            <TtsPlayer content={content} />
            {noteId && (
              <button
                onClick={() => setShowMindMap(!showMindMap)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors border ${showMindMap ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                title="Mind Map"
              >
                <GitBranch className="w-4 h-4" />
                <span className="hidden md:inline">Mind Map</span>
              </button>
            )}
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
          onChange={handleContentChange}
          onKeyDown={handleEditorKeyDown}
          height="100%"
          className="border-none !rounded-none"
          previewOptions={{
             remarkPlugins: [require('@/lib/remark-wikilink').default]
          }}
          style={{ height: '100%' }}
        />
        
        {/* Suggestion Tooltip Overlay */}
        {suggestions.length > 0 && (
          <div className="absolute right-8 bottom-8 z-50 bg-popover text-popover-foreground border shadow-lg rounded-md p-1 w-64 animate-in fade-in slide-in-from-bottom-2">
            <div className="text-xs text-muted-foreground px-2 py-1.5 font-medium border-b mb-1 flex items-center justify-between">
              <span>Link Suggestions</span>
              <span className="text-[10px] bg-muted px-1 rounded">Tab to accept</span>
            </div>
            {suggestions.map((note, i) => (
              <button
                key={note.slug}
                onClick={() => applySuggestion(note)}
                className={`w-full text-left px-2 py-1.5 text-sm rounded-sm flex flex-col transition-colors ${i === suggestionIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'}`}
              >
                <span className="font-medium truncate">{note.title}</span>
                {note.tags && note.tags.length > 0 && (
                   <span className="text-[10px] text-muted-foreground truncate opacity-80">
                      {note.tags.join(', ')}
                   </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      <ConnectionSuggester 
        slug={slug} 
        onAddLink={(targetSlug) => {
          setContent(prev => prev + `\n\n[[${targetSlug}]]`)
        }} 
      />
      {selectedText && (
         <InlineAiMenu 
           selectedText={selectedText}
           context={content}
           onApply={handleApplyAiTransformation}
           onCancel={() => {
              setSelectedText("")
              setSelectionRange(null)
           }}
         />
      )}
      
      {showHistory && (
         <div className="absolute right-0 top-16 bottom-0 z-20">
            <VersionHistory
               slug={slug}
               currentContent={content}
               onClose={() => setShowHistory(false)}
               onRestore={(oldContent) => {
                  setContent(oldContent)
                  setLastSaved(null)
               }}
            />
         </div>
      )}

      {showMindMap && noteId && (
         <div className="absolute left-0 right-0 bottom-0 z-20 h-72 border-t bg-card/95 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 border-b">
               <span className="text-sm font-semibold flex items-center gap-2"><GitBranch className="w-4 h-4 text-primary" /> Mind Map</span>
               <button onClick={() => setShowMindMap(false)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-secondary">Close</button>
            </div>
            <div className="h-full pb-10">
               <MindMap noteId={noteId} noteTitle={title} />
            </div>
         </div>
      )}
    </div>
  )
}
