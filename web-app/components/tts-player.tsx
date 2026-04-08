"use client"

/**
 * TtsPlayer — reads a note aloud via ElevenLabs TTS.
 * Drop this into the note editor header alongside the Save button.
 *
 * Usage: <TtsPlayer content={noteContent} />
 */

import { useState, useRef, useCallback } from 'react'
import { Volume2, Square, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TtsPlayerProps {
  content: string
  className?: string
}

type TtsState = 'idle' | 'loading' | 'playing'

export function TtsPlayer({ content, className }: TtsPlayerProps) {
  const [state, setState] = useState<TtsState>('idle')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    setState('idle')
  }, [])

  const play = useCallback(async () => {
    if (state !== 'idle') {
      stop()
      return
    }

    // Limit to first 4000 chars so TTS stays snappy
    const text = content.slice(0, 4000)
    if (!text.trim()) return

    setState('loading')

    try {
      const res = await fetch('/api/brain/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'TTS failed' }))
        console.error('TTS error:', err)
        setState('idle')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      const audio = new Audio(url)
      audioRef.current = audio

      audio.onended = () => {
        URL.revokeObjectURL(url)
        setState('idle')
      }
      audio.onerror = () => {
        URL.revokeObjectURL(url)
        setState('idle')
      }

      await audio.play()
      setState('playing')
    } catch (err) {
      console.error('TTS playback error:', err)
      setState('idle')
    }
  }, [content, state, stop])

  const label = state === 'idle' ? 'Read Aloud' : state === 'loading' ? 'Generating...' : 'Stop'

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={play}
      disabled={state === 'loading'}
      className={`gap-2 ${className}`}
      title={state === 'playing' ? 'Stop reading' : 'Read note aloud'}
    >
      {state === 'loading' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : state === 'playing' ? (
        <Square className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
      <span className="hidden md:inline">{label}</span>
    </Button>
  )
}
