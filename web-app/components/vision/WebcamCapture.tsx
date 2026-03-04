'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface WebcamCaptureProps {
  onAnalysis: (analysis: any) => void
  enabled: boolean
  frequency?: number // seconds between captures
}

export default function WebcamCapture({
  onAnalysis,
  enabled,
  frequency = 30 // default: analyze every 30 seconds
}: WebcamCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [lastCapture, setLastCapture] = useState<Date | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Start/stop webcam
  useEffect(() => {
    if (enabled && !stream) {
      startWebcam()
    } else if (!enabled && stream) {
      stopWebcam()
    }

    return () => {
      stopWebcam()
    }
  }, [enabled])

  // Auto-capture at intervals
  useEffect(() => {
    if (isActive && enabled) {
      intervalRef.current = setInterval(() => {
        captureAndAnalyze()
      }, frequency * 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, enabled, frequency])

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      })

      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }

      setIsActive(true)
    } catch (error) {
      console.error('Failed to access webcam:', error)
      alert('Could not access webcam. Please check permissions.')
    }
  }

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsActive(false)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null

    const video = videoRef.current
    const canvas = canvasRef.current

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current frame to canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to base64 JPEG
    return canvas.toDataURL('image/jpeg', 0.8)
  }

  const captureAndAnalyze = async () => {
    if (analyzing) return // Don't overlap analyses

    const frameData = captureFrame()
    if (!frameData) return

    setAnalyzing(true)
    setLastCapture(new Date())

    try {
      const response = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: frameData,
          prompt: '*looks at you through camera* How are you doing, hooman?',
          source: 'webcam',
          userId: 'demo-user', // TODO: Get from session
        }),
      })

      const result = await response.json()

      if (result.success) {
        onAnalysis(result.analysis)
      }
    } catch (error) {
      console.error('Webcam analysis failed:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Camera preview */}
      <div className="relative rounded-xl overflow-hidden border-2 border-purple-300 dark:border-purple-700">
        <video
          ref={videoRef}
          className="w-full h-auto bg-black"
          autoPlay
          playsInline
          muted
        />

        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlay indicators */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <motion.div
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-3 h-3 bg-red-500 rounded-full"
                  />
                  <span className="text-white text-sm font-medium">
                    Meowdel is watching
                  </span>
                </div>

                {analyzing && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="text-2xl"
                  >
                    🐱
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="text-white text-sm">
              {lastCapture && (
                <span>Last analyzed: {formatTimeAgo(lastCapture)}</span>
              )}
            </div>

            <button
              onClick={captureAndAnalyze}
              disabled={analyzing || !isActive}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 text-white rounded-lg font-medium transition-colors"
            >
              {analyzing ? 'Analyzing...' : 'Capture Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="webcam-enabled"
            checked={enabled}
            disabled
            className="rounded"
          />
          <label htmlFor="webcam-enabled" className="text-gray-700 dark:text-gray-300">
            Auto-analyze every {frequency}s
          </label>
        </div>

        <button
          onClick={isActive ? stopWebcam : startWebcam}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors
            ${isActive
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
            }
          `}
        >
          {isActive ? '📹 Stop Camera' : '📹 Start Camera'}
        </button>
      </div>

      {/* Privacy notice */}
      <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
        <p className="font-medium mb-1">🔒 Privacy Notice:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Images are processed in real-time and not stored</li>
          <li>Only you and Meowdel can see the camera feed</li>
          <li>You can disable the camera anytime</li>
          <li>Analysis counts toward your monthly vision limit</li>
        </ul>
      </div>
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}
