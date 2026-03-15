"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, MessageSquare, X, Send, Loader2, Paperclip, FileText, Cat, UserRound, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { BrainNote } from '@/app/api/brain/notes/route'
import { useSettings } from '@/lib/settings-context'
import { useGlobalChat } from '@/lib/chat-context'
import { PurrAudio } from './purr-audio'

export interface BrainChatPanelProps {
  activeNote?: BrainNote | null
  isOpen: boolean
  onClose: () => void
}

type Message = { id: string, role: 'user' | 'assistant', content: string }

export function BrainChatPanel({ activeNote, isOpen, onClose }: BrainChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  const { brainPersonality, setBrainPersonality } = useSettings()
  const { isZoomies } = useGlobalChat()

  const handleExportChat = async () => {
    if (messages.length === 0) return
    setIsExporting(true)
    try {
      const res = await fetch('/api/brain/export-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      })
      const data = await res.json()
      if (data.slug) {
         router.push(`/brain/notes/${data.slug}`)
         onClose()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsExporting(false)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    const file = acceptedFiles[0]
    
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    // Add a user message indicating the upload
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: `Attached document: ${file.name}` }
    setMessages(prev => [...prev, userMessage])

    try {
      const res = await fetch('/api/brain/docengine', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error(res.statusText)
      
      const data = await res.json()
      
      // Determine response tone
      const successMsg = brainPersonality === 'cat' 
          ? `Purrrfect! I processed **${file.name}**. Here is the extracted text:\n\n\`\`\`markdown\n${data.markdown}\n\`\`\``
          : `I have processed **${file.name}**. Here is the extracted text:\n\n\`\`\`markdown\n${data.markdown}\n\`\`\``
      
      // Add standard assistant response with the parsed markdown
      const aiMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: successMsg
      }
      setMessages(prev => [...prev, aiMessage])
      
    } catch (error) {
      console.error("Upload error:", error)
      const errorMsg = brainPersonality === 'cat'
        ? "*(hisss)* Failed to parse that document."
        : "An error occurred while parsing the document."
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: errorMsg }])
    } finally {
      setIsUploading(false)
    }
  }, [brainPersonality])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true })

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // HISS PROTOCOL: Threat Polling
  useEffect(() => {
    if (!isOpen) return;
    
    let lastSeenThreatId: string | null = null;
    
    const pollThreats = async () => {
        try {
            const res = await fetch('/api/brain/threats');
            const data = await res.json();
            
            if (data.threat && data.threat.id !== lastSeenThreatId) {
                lastSeenThreatId = data.threat.id;
                
                // Hijack the chat!
                const emergencyMsg: Message = {
                    id: `threat-${data.threat.id}`,
                    role: 'assistant',
                    content: `🚨 **HSSSSS! INTRUSION BLOCKED!** 🚨\n\nSir, the local After Dark daemon (${data.threat.source}) just intercepted a threat!\n\n**Details**: ${data.threat.message}\n**Severity**: ${data.threat.severity.toUpperCase()}\n\nShall I isolate this endpoint from the network?`
                };
                
                setMessages(prev => [...prev, emergencyMsg]);
            }
        } catch (e) {
            // Silently fail polling
        }
    };

    const intervalId = setInterval(pollThreats, 3000);
    return () => clearInterval(intervalId);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Create a temporary assistant message to stream into
      const initialAssistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '' }
      setMessages(prev => [...prev, initialAssistantMessage])

      const response = await fetch('/api/brain/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          contextNode: activeNote,
          personality: brainPersonality,
          isZoomies
        }),
      })

      if (!response.ok) throw new Error(response.statusText)

      // Handle raw streaming text directly line by line/chunk by chunk
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          
          setMessages(prev => {
            const newMessages = [...prev]
            const lastIndex = newMessages.length - 1
            newMessages[lastIndex] = {
               ...newMessages[lastIndex],
               content: newMessages[lastIndex].content + chunk
            }
            return newMessages
          })
        }
      }

    } catch (error) {
       console.error("Chat error:", error)
       const errorMsg = brainPersonality === 'cat' 
         ? "*(hisss)* Something went wrong connecting to my brain..." 
         : "An error occurred while connecting to the assistant."
       setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: errorMsg }])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div {...getRootProps()} className={`w-80 border-l bg-card/50 backdrop-blur-xl flex flex-col h-full shadow-2xl z-40 flex-shrink-0 animate-in slide-in-from-right-full ${isDragActive ? 'ring-2 ring-primary ring-inset bg-primary/5' : ''}`}>
      <PurrAudio isPurring={isLoading && brainPersonality === 'cat'} />
      <input {...getInputProps()} />
      {isDragActive && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary m-4 rounded-xl">
          <FileText className="w-12 h-12 text-primary mb-2 animate-bounce" />
          <p className="font-semibold text-primary">Drop document to parse</p>
        </div>
      )}
      <div className="h-14 flex items-center justify-between px-4 border-b">
        <div className="flex items-center gap-2 font-semibold">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>{brainPersonality === 'cat' ? 'Ask Meowdel' : 'Ask AI'}</span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
             <button
               onClick={handleExportChat}
               disabled={isExporting}
               className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground transition-colors mr-1"
               title="Save Chat to Note"
             >
               {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-primary" />}
             </button>
          )}
          <button 
            onClick={() => setBrainPersonality(brainPersonality === 'cat' ? 'regular' : 'cat')}
            className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground transition-colors mr-1"
            title={brainPersonality === 'cat' ? "Switch to Professional Mode" : "Switch to Cat Mode"}
          >
            {brainPersonality === 'cat' ? <Cat className="w-4 h-4 text-primary" /> : <UserRound className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-2 border-b bg-secondary/50">
        <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Context</div>
        <div className="text-sm truncate font-medium">
          {activeNote ? activeNote.title : 'Global Brain (No specific note)'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground pt-8 space-y-4">
            <MessageSquare className="w-8 h-8 mx-auto opacity-20" />
            <p>
              {brainPersonality === 'cat' 
                ? "I'm Meowdel. Ask me to summarize this note, write new sections, or find connections to other ideas in your Brain." 
                : "I am your AI knowledge assistant. Ask me to summarize this note, draft new sections, or find related thoughts."}
            </p>
            {/* Quick Actions Placeholder */}
            {activeNote && (
               <div className="flex flex-col gap-2 pt-4">
                 <button onClick={() => { setInput("Can you summarize this note?"); handleSubmit(new Event('submit') as any) }} className="text-xs border text-muted-foreground hover:bg-secondary hover:text-foreground rounded-lg p-2 transition-colors">
                   Summarize this note
                 </button>
                 <button onClick={() => { setInput("What tags would you suggest for this note?"); handleSubmit(new Event('submit') as any) }} className="text-xs border text-muted-foreground hover:bg-secondary hover:text-foreground rounded-lg p-2 transition-colors">
                   Suggest tags
                 </button>
               </div>
            )}
          </div>
        )}
        
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div 
              className={`px-3 py-2 rounded-2xl max-w-[90%] break-words whitespace-pre-wrap ${
                m.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                  : 'bg-secondary text-foreground border rounded-tl-sm'
              }`}
            >
              {m.content}
              {(isLoading && m.role === 'assistant' && m.content === '') && <span className="animate-pulse">...</span>}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length-1]?.role === 'user' && !isUploading && ( // Only show if we haven't started an assistant block and not uploading
          <div className="flex items-center gap-2 text-muted-foreground text-xs p-2">
            <Loader2 className="w-3 h-3 animate-spin" /> {brainPersonality === 'cat' ? 'Meowdel is thinking...' : 'AI is processing...'}
          </div>
        )}
        {isUploading && (
           <div className="flex items-center gap-2 text-primary text-xs p-2">
             <Loader2 className="w-3 h-3 animate-spin" /> Processing document in DocEngine...
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t bg-card">
        <div className="relative flex items-center gap-2">
          {/* We use a separate dropzone open method if we want a clickable button, but since we disabled click on the wrapper we can create a tiny button to trigger click */}
          <button
              type="button"
              onClick={() => {
                const inputEl = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (inputEl) inputEl.click();
              }}
              className="p-2 bg-secondary rounded-full hover:bg-secondary/80 text-muted-foreground transition-colors shrink-0"
              title="Upload PDF, DOCX, Img"
           >
              <Paperclip className="w-4 h-4" />
          </button>
          <div className="relative flex-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="w-full bg-secondary border-none rounded-full pl-4 pr-10 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none"
              disabled={isLoading || isUploading}
            />
            <button 
              type="submit" 
              disabled={isLoading || isUploading || !input.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-primary rounded-full text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
