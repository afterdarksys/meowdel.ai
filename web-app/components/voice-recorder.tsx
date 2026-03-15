"use client"

import { useState, useRef } from "react"
import { Mic, Square, Loader2, AlertCircle } from "lucide-react"

interface VoiceRecorderProps {
  onTranscription: (text: string) => void
  disabled?: boolean
}

export function VoiceRecorder({ onTranscription, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(track => track.stop())
        await processAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err: any) {
      console.error("Microphone access denied or failed", err)
      setError("Microphone access required")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsProcessing(true)
    }
  }

  const processAudio = async (blob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('file', blob, 'recording.webm')

      const res = await fetch('/api/brain/transcribe', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      if (data.text) {
         onTranscription(data.text)
      }
    } catch (err: any) {
      setError(err.message || 'Transcription failed')
    } finally {
      setIsProcessing(false)
    }
  }

  if (error) {
     return (
        <button 
           onClick={() => setError(null)}
           className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 text-destructive rounded-md transition-colors border border-destructive/20 text-sm"
           title={error}
        >
           <AlertCircle className="w-4 h-4" />
           <span className="hidden md:inline">Error</span>
        </button>
     )
  }

  if (isProcessing) {
     return (
       <button 
         disabled
         className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md transition-colors border text-sm"
       >
         <Loader2 className="w-4 h-4 animate-spin text-primary" />
         <span className="hidden md:inline">Transcribing...</span>
       </button>
     )
  }

  if (isRecording) {
     return (
       <button 
         onClick={stopRecording}
         className="flex items-center gap-2 px-3 py-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md transition-colors border border-destructive text-sm animate-pulse"
       >
         <Square className="w-4 h-4 fill-current" />
         <span className="hidden md:inline">Stop</span>
       </button>
     )
  }

  return (
    <button 
      onClick={startRecording}
      disabled={disabled}
      className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors border text-sm"
      title="Record Voice Note"
    >
      <Mic className="w-4 h-4" />
      <span className="hidden md:inline">Voice</span>
    </button>
  )
}
