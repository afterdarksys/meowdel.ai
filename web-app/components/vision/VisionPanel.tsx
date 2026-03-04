'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ImageUpload from './ImageUpload'
import WebcamCapture from './WebcamCapture'

interface VisionPanelProps {
  onVisionMessage: (message: string) => void
}

export default function VisionPanel({ onVisionMessage }: VisionPanelProps) {
  const [mode, setMode] = useState<'upload' | 'webcam'>('upload')
  const [webcamEnabled, setWebcamEnabled] = useState(false)
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null)

  const handleAnalysis = (analysis: any) => {
    setLatestAnalysis(analysis)

    // Send cat's response as a chat message
    onVisionMessage(analysis.catResponse)
  }

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setMode('upload')}
          className={`
            flex-1 px-4 py-2 rounded-lg font-medium transition-colors
            ${mode === 'upload'
              ? 'bg-white dark:bg-gray-700 shadow'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }
          `}
        >
          📸 Upload Image
        </button>
        <button
          onClick={() => setMode('webcam')}
          className={`
            flex-1 px-4 py-2 rounded-lg font-medium transition-colors
            ${mode === 'webcam'
              ? 'bg-white dark:bg-gray-700 shadow'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }
          `}
        >
          📹 Webcam
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {mode === 'upload' ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <ImageUpload onAnalysis={handleAnalysis} />
          </motion.div>
        ) : (
          <motion.div
            key="webcam"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <WebcamCapture
              onAnalysis={handleAnalysis}
              enabled={webcamEnabled}
              frequency={30}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Latest analysis display */}
      <AnimatePresence>
        {latestAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800"
          >
            <div className="flex items-start space-x-3">
              <div className="text-4xl">🐱</div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">Meowdel sees:</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {latestAnalysis.description}
                </p>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {latestAnalysis.objects.length > 0 && (
                    <div>
                      <div className="font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Objects:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {latestAnalysis.objects.map((obj: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-white dark:bg-gray-800 rounded-full text-xs"
                          >
                            {obj}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {latestAnalysis.mood && (
                    <div>
                      <div className="font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Your mood:
                      </div>
                      <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm">
                        {getMoodEmoji(latestAnalysis.mood)} {latestAnalysis.mood}
                      </span>
                    </div>
                  )}

                  {latestAnalysis.people > 0 && (
                    <div>
                      <div className="font-medium text-gray-600 dark:text-gray-400 mb-1">
                        People:
                      </div>
                      <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm">
                        👥 {latestAnalysis.people}
                      </span>
                    </div>
                  )}

                  {latestAnalysis.environment && (
                    <div>
                      <div className="font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Location:
                      </div>
                      <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm">
                        📍 {latestAnalysis.environment}
                      </span>
                    </div>
                  )}
                </div>

                {/* Suggestions */}
                {latestAnalysis.suggestions && latestAnalysis.suggestions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                    <div className="font-medium text-gray-600 dark:text-gray-400 mb-2">
                      💡 Cat's advice:
                    </div>
                    <ul className="space-y-1 text-sm">
                      {latestAnalysis.suggestions.map((suggestion: string, idx: number) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span>•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function getMoodEmoji(mood: string): string {
  const moods: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    neutral: '😐',
    tired: '😴',
    focused: '🧐',
    excited: '🤩',
  }
  return moods[mood] || '🙂'
}
