/**
 * BrowserID Demo Component
 * Shows user their BrowserID and personality settings
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBrowserID, useCatPersonality } from '@/lib/useBrowserID';

export default function BrowserIDDemo() {
  const { browserID, user, isReturningUser, sessionCount } = useBrowserID();
  const {
    personality,
    updateMeowFrequency,
    updatePersonalityMode,
    increaseAffinity
  } = useCatPersonality();

  const [showSettings, setShowSettings] = useState(false);

  if (!browserID || !user || !personality) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading cat personality...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-2 border-purple-200 dark:border-purple-800"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-purple-800 dark:text-purple-200">
          🐱 Your Cat Profile
        </h3>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
        >
          {showSettings ? 'Hide' : 'Settings'}
        </button>
      </div>

      {/* BrowserID */}
      <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
        <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
          Your BrowserID:
        </p>
        <p className="text-xs font-mono text-purple-900 dark:text-purple-100 break-all">
          {browserID.substring(0, 16)}...{browserID.substring(browserID.length - 8)}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-4 bg-pink-50 dark:bg-pink-900/30 rounded-lg">
          <p className="text-sm text-pink-700 dark:text-pink-300">Visits</p>
          <p className="text-3xl font-bold text-pink-900 dark:text-pink-100">
            {sessionCount}
          </p>
        </div>
        <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
          <p className="text-sm text-orange-700 dark:text-orange-300">Bugs Fixed</p>
          <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
            {personality.bugsSolvedTogether}
          </p>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300">Affinity</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold text-green-900 dark:text-green-100">
              {personality.affinity}%
            </p>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${personality.affinity}%` }}
              />
            </div>
          </div>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">Trust Level</p>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
            {personality.trustLevel}%
          </p>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t-2 border-purple-200 dark:border-purple-800">
              <h4 className="text-lg font-bold text-purple-800 dark:text-purple-200 mb-4">
                Personality Settings
              </h4>

              {/* Meow Frequency */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meow Frequency 🐱
                </label>
                <div className="flex gap-2">
                  {(['rare', 'moderate', 'chatty'] as const).map((freq) => (
                    <button
                      key={freq}
                      onClick={() => updateMeowFrequency(freq)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        personality.meowFrequency === freq
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personality Mode */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Personality Mode 😺
                </label>
                <div className="flex gap-2">
                  {(['playful', 'professional', 'balanced'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => updatePersonalityMode(mode)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        personality.personalityMode === mode
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Test Button */}
              <button
                onClick={() => {
                  increaseAffinity(10);
                  alert('*purrs louder* Thanks for the pets! Affinity +10! 💜');
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                🐱 Pet the Cat (+10 Affinity)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Messages */}
      {isReturningUser && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 rounded">
          <p className="text-sm text-green-800 dark:text-green-200">
            ✨ *purrs* I remember you! This is visit #{sessionCount}!
          </p>
        </div>
      )}

      {personality.affinity > 80 && (
        <div className="mt-4 p-3 bg-pink-50 dark:bg-pink-900/30 border-l-4 border-pink-500 rounded">
          <p className="text-sm text-pink-800 dark:text-pink-200">
            💖 *rubs against screen* I really like you! Let's code together forever!
          </p>
        </div>
      )}
    </motion.div>
  );
}
