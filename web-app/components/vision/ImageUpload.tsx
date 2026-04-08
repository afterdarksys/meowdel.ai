'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ImageUploadProps {
  onAnalysis: (analysis: any) => void
  disabled?: boolean
}

export default function ImageUpload({ onAnalysis, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Convert to base64 and analyze
    setIsUploading(true)

    try {
      const base64 = await fileToBase64(file)

      const response = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          prompt: 'Look at this image and tell me what you see, as Meowdel the cat!',
          source: 'upload',
        }),
      })

      const result = await response.json()

      if (result.success) {
        onAnalysis(result.analysis)
      } else {
        console.error('Analysis failed:', result.error)
      }

    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to analyze image. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8
          transition-all duration-200
          ${dragActive
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-300 dark:border-gray-700 hover:border-purple-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        <div className="text-center">
          {isUploading ? (
            <div className="space-y-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="text-6xl inline-block"
              >
                🐱
              </motion.div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                *sniff sniff* Analyzing your image... *purr*
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-6xl">📸</div>
              <div>
                <p className="text-lg font-medium">
                  Drop an image here or click to upload
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Let Meowdel see what you're up to!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-xl overflow-hidden border-2 border-purple-300 dark:border-purple-700"
          >
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto max-h-96 object-contain bg-gray-100 dark:bg-gray-800"
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                setPreview(null)
              }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Supports: JPG, PNG, WebP, GIF (max 10MB)
      </div>
    </div>
  )
}

/**
 * Convert File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
  })
}
