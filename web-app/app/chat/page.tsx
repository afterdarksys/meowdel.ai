'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import EmojiPicker from '@/components/EmojiPicker'

interface Message {
  role: 'user' | 'assistant'
  content: string
  photo?: string
  timestamp: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [petInfo, setPetInfo] = useState<any>(null)
  const [visionEnabled, setVisionEnabled] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Load pet info on mount
  useEffect(() => {
    fetch('/api/pets/meowdel/chat')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPetInfo(data.pet)
          // Add greeting as first message
          setMessages([{
            role: 'assistant',
            content: data.pet.greeting,
            photo: data.pet.photo,
            timestamp: new Date().toISOString()
          }])
        }
      })
      .catch(console.error)
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Cleanup vision stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const toggleVision = async () => {
    try {
      if (visionEnabled) {
        // Turn off
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
        setVisionEnabled(false)
      } else {
        // Turn on
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setVisionEnabled(true)
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      alert("Could not access camera. Please check permissions.")
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/pets/meowdel/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response.message,
          photo: data.response.photo,
          timestamp: data.response.timestamp
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Send message error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '*ears flatten* Oh no! Something went wrong with my connection. *worried meow* Can you try again?',
        timestamp: new Date().toISOString()
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-t-2xl p-6 shadow-lg"
        >
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
        </motion.div>

        {/* Messages */}
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
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="mb-2 rounded-lg overflow-hidden max-w-xs"
                    >
                      <img src={message.photo} alt="Cat response" className="w-64 h-64 object-cover" />
                    </motion.div>
                  )}

                  <div className={`rounded-2xl p-4 ${message.role === 'user'
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Vision Preview */}
        {visionEnabled && (
          <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-4 flex justify-end">
            <div className="relative rounded-xl overflow-hidden shadow-lg border-2 border-purple-500 max-w-[200px]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto"
              />
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                Vision Active 👁️
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="bg-white dark:bg-gray-800 rounded-b-2xl p-6 shadow-lg">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (Shift+Enter for new line)"
                disabled={loading}
                className="w-full resize-none rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 pr-12 focus:outline-none focus:border-purple-500 dark:text-white disabled:opacity-50"
                rows={3}
              />
              <div className="absolute right-2 bottom-2 flex space-x-2">
                <button
                  onClick={toggleVision}
                  className={`p-2 rounded-full transition-colors ${visionEnabled ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
                  title="Toggle Vision API"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </button>
                <EmojiPicker onEmojiSelect={(emoji) => setInput(input + emoji)} />
              </div>
            </div>
            <button
              onClick={sendMessage}
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
      </div>
    </div>
  )
}
