'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EMOJI_CATEGORIES = {
  'Cat Emojis': ['🐱', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🐈', '🐈‍⬛'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💗', '💖', '💝'],
  'Stars': ['⭐', '🌟', '✨', '💫', '⚡', '🔥', '💥'],
  'Hands': ['👋', '🤚', '✋', '👍', '👎', '👏', '🙌', '🤝', '✊', '👊'],
  'Faces': ['😀', '😃', '😄', '😁', '😊', '😍', '🤩', '😎', '🤓', '🧐', '🤔', '😮', '😯', '🥺'],
  'Other': ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🚀', '💻', '📱', '⌨️', '🖱️', '💾', '🔧', '⚙️'],
};

export default function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Cat Emojis');

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Add emoji"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 text-gray-600 dark:text-gray-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"
          />
        </svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Emoji Picker Panel */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full mb-2 left-0 z-50 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Category Tabs */}
              <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 gap-1">
                {Object.keys(EMOJI_CATEGORIES).map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      activeCategory === category
                        ? 'bg-purple-500 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Emoji Grid */}
              <div className="p-4 max-h-64 overflow-y-auto">
                <div className="grid grid-cols-8 gap-2">
                  {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, index) => (
                    <motion.button
                      key={`${emoji}-${index}`}
                      type="button"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEmojiClick(emoji)}
                      className="text-2xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-900">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Click an emoji to add it to your message
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
