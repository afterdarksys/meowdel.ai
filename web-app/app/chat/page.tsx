'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import EmojiPicker from '@/components/EmojiPicker'

interface Message {
  role: 'user' | 'assistant'
  content: string
  photo?: string
  timestamp: string
}

// ─── Message list – only re-renders when messages/loading changes ─────────────
const MessageList = memo(function MessageList({
  messages,
  loading,
  messagesEndRef,
}: {
  messages: Message[]
  loading: boolean
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div className="bg-white dark:bg-gray-800 h-[600px] overflow-y-auto p-6 space-y-6">
      <AnimatePresence initial={false}>
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
              {message.role === 'assistant' && message.photo && (
                <div className="mb-2 rounded-lg overflow-hidden max-w-xs">
                  <img src={message.photo} alt="Cat response" className="w-64 h-64 object-cover" />
                </div>
              )}
              <div className={`rounded-2xl p-4 ${
                message.role === 'user'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}>
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
              <div className="text-xs text-gray-500 mt-1 px-2">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {loading && (
        <div className="flex justify-start">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-4">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
})

// ─── Input area – owns its own input state so typing never re-renders the page ─
const InputArea = memo(function InputArea({
  onSend,
  loading,
  visionEnabled,
  audioEnabled,
  toggleVision,
  toggleAudio,
}: {
  onSend: (text: string) => void
  loading: boolean
  visionEnabled: boolean
  audioEnabled: boolean
  toggleVision: () => void
  toggleAudio: () => void
}) {
  const [input, setInput] = useState('')

  const handleSend = () => {
    const text = input.trim()
    if (!text || loading) return
    onSend(text)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-b-2xl p-6 shadow-lg">
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            disabled={loading}
            className="w-full resize-none rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 pr-24 focus:outline-none focus:border-purple-500 dark:text-white disabled:opacity-50"
            rows={3}
          />
          <div className="absolute right-2 bottom-2 flex space-x-1">
            <button
              onClick={toggleAudio}
              title={audioEnabled ? 'Stop microphone' : 'Let Meowdel hear you'}
              className={`p-2 rounded-full transition-colors ${
                audioEnabled
                  ? 'bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={toggleVision}
              title={visionEnabled ? 'Stop camera' : 'Let Meowdel see you'}
              className={`p-2 rounded-full transition-colors ${
                visionEnabled
                  ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
            <EmojiPicker onEmojiSelect={(emoji) => setInput(prev => prev + emoji)} />
          </div>
        </div>
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700 text-white font-medium rounded-xl transition-all shadow-lg disabled:cursor-not-allowed disabled:shadow-none"
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 flex justify-between items-center">
        <span>Tip: Meowdel loves helping with code! Share your bugs!</span>
        <span className="text-xs">MVP v0.1</span>
      </div>
    </div>
  )
})

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [petInfo, setPetInfo] = useState<any>(null)
  const [visionEnabled, setVisionEnabled] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoStreamRef = useRef<MediaStream | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)

  // Load pet info on mount with timeout
  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    fetch('/api/pets/meowdel/chat', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPetInfo(data.pet)
          setMessages([{
            role: 'assistant',
            content: data.pet.greeting,
            photo: data.pet.photo,
            timestamp: new Date().toISOString(),
          }])
        }
      })
      .catch(err => { if (err.name !== 'AbortError') console.error(err) })
      .finally(() => clearTimeout(timeout))

    return () => { controller.abort(); clearTimeout(timeout) }
  }, [])

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Cleanup streams on unmount
  useEffect(() => {
    return () => {
      videoStreamRef.current?.getTracks().forEach(t => t.stop())
      audioStreamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const toggleVision = useCallback(async () => {
    if (visionEnabled) {
      videoStreamRef.current?.getTracks().forEach(t => t.stop())
      videoStreamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
      setVisionEnabled(false)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        videoStreamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setVisionEnabled(true)
      } catch {
        alert('Could not access camera. Please check permissions.')
      }
    }
  }, [visionEnabled])

  const toggleAudio = useCallback(async () => {
    if (audioEnabled) {
      audioStreamRef.current?.getTracks().forEach(t => t.stop())
      audioStreamRef.current = null
      setAudioEnabled(false)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        audioStreamRef.current = stream
        setAudioEnabled(true)
      } catch {
        alert('Could not access microphone. Please check permissions.')
      }
    }
  }, [audioEnabled])

  // Stable reference — messages captured via functional updater so no stale closure
  const sendMessage = useCallback(async (text: string) => {
    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])
    setLoading(true)

    try {
      const response = await fetch('/api/pets/meowdel/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: [] // history is context only; kept simple to avoid stale capture
        }),
      })
      const data = await response.json()
      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response.message,
          photo: data.response.photo,
          timestamp: data.response.timestamp,
        }])
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Send message error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '*ears flatten* Oh no! Something went wrong. *worried meow* Can you try again?',
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">

        {/* Header – static after mount, no animation needed */}
        <div className="bg-white dark:bg-gray-800 rounded-t-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-4">
            <img src="/gallery/meowdel_being_petted.png" alt="Meowdel" className="w-16 h-16 rounded-full" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {petInfo?.name || 'Meowdel'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {petInfo?.personality || 'Your AI Assistant Cat'}
              </p>
            </div>
            <div className="ml-auto">
              <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-700 dark:text-green-400 text-sm font-medium">
                ● Online
              </div>
            </div>
          </div>
        </div>

        <MessageList messages={messages} loading={loading} messagesEndRef={messagesEndRef} />

        {/* Media preview bar */}
        {(visionEnabled || audioEnabled) && (
          <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-end gap-3">
            {audioEnabled && (
              <div className="flex items-center gap-2 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-700 rounded-lg px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500" />
                </span>
                <span className="text-xs text-pink-700 dark:text-pink-300 font-medium">Meowdel can hear you</span>
              </div>
            )}
            {visionEnabled && (
              <div className="relative rounded-xl overflow-hidden shadow-lg border-2 border-purple-500 w-[160px]">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto block" />
                <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded backdrop-blur-sm">
                  Meowdel can see you 👁️
                </div>
              </div>
            )}
          </div>
        )}

        <InputArea
          onSend={sendMessage}
          loading={loading}
          visionEnabled={visionEnabled}
          audioEnabled={audioEnabled}
          toggleVision={toggleVision}
          toggleAudio={toggleAudio}
        />
      </div>
    </div>
  )
}
