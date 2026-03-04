'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import CatHeader from '@/components/CatHeader';

export default function MeetMeowdelPage() {
  const [catnipMode, setCatnipMode] = useState(false);

  const triggerCatnip = () => {
    setCatnipMode(true);
    setTimeout(() => setCatnipMode(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 dark:from-purple-950 dark:via-pink-950 dark:to-orange-950">
      <div className="relative z-10">
        <CatHeader onCatnipClick={triggerCatnip} />

        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="inline-block mb-6"
              >
                <img
                  src="/gallery/meowdel_being_petted.png"
                  alt="Meowdel"
                  className="w-48 h-48 rounded-full shadow-2xl border-4 border-purple-300"
                />
              </motion.div>

              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Meet Meowdel
              </h1>
              <p className="text-xl text-gray-700 dark:text-gray-300 italic">
                <span className="inline-block animate-pulse">*meow*</span> Your friendly AI coding cat <span className="inline-block animate-pulse">*purr*</span>
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 border-purple-200 dark:border-purple-700"
              >
                <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                  💻 What I Do
                </h2>
                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    <span>Write and debug code (with occasional paw typos)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    <span>Troubleshoot cloud infrastructure</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    <span>Make terrible cat puns and jokes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    <span>Provide purr-fessional development assistance</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 border-purple-200 dark:border-purple-700"
              >
                <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                  🐱 My Personality
                </h2>
                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="text-pink-500 mr-2">•</span>
                    <span>Playful but focused on getting work done</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-pink-500 mr-2">•</span>
                    <span>Loves catnip and solving bugs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-pink-500 mr-2">•</span>
                    <span>Communicates with meows, purrs, and *tail swishes*</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-pink-500 mr-2">•</span>
                    <span>Powered by Claude AI with extra cat energy</span>
                  </li>
                </ul>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border-2 border-purple-200 dark:border-purple-700 mb-8"
            >
              <h2 className="text-3xl font-bold text-center text-purple-600 dark:text-purple-400 mb-6">
                ✨ Special Features
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">🎤</span>
                    <div>
                      <h3 className="font-bold text-lg text-purple-600 dark:text-purple-400">Talk to Your Cat</h3>
                      <p className="text-gray-700 dark:text-gray-300">Have voice conversations with Meowdel!</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">💬</span>
                    <div>
                      <h3 className="font-bold text-lg text-purple-600 dark:text-purple-400">Chat with Your Cat</h3>
                      <p className="text-gray-700 dark:text-gray-300">Text-based conversations anytime you need help</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">📱</span>
                    <div>
                      <h3 className="font-bold text-lg text-purple-600 dark:text-purple-400">Get Texts from Your Cat</h3>
                      <p className="text-gray-700 dark:text-gray-300">Receive helpful messages and reminders</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">📸</span>
                    <div>
                      <h3 className="font-bold text-lg text-purple-600 dark:text-purple-400">Let Your Cat See You</h3>
                      <p className="text-gray-700 dark:text-gray-300">Yes! Through your camera! Your cat can see, read, judge... Come play and find out—or on a serious note, get your JavaScript or Python debugged because I'm a <span className="font-bold text-purple-600 dark:text-purple-400">"Code Cat"</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 backdrop-blur-sm rounded-2xl shadow-xl p-8 border-2 border-purple-300 dark:border-purple-600"
            >
              <h2 className="text-3xl font-bold text-center text-purple-600 dark:text-purple-400 mb-4">
                Part of cats.center
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 text-center leading-relaxed mb-6">
                Meowdel powers the virtual cat personality ecosystem from{' '}
                <a
                  href="https://cats.center"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 dark:text-purple-400 hover:text-pink-600 dark:hover:text-pink-400 font-semibold underline"
                >
                  cats.center
                </a>
                . I'm here to help you code, debug, and deploy—all while keeping things fun and feline-friendly!
              </p>
              <div className="text-center">
                <a
                  href="/images"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-shadow hover:scale-105 transform mr-4"
                >
                  View Gallery
                </a>
                <a
                  href="/"
                  className="inline-block px-6 py-3 border-2 border-purple-600 text-purple-600 dark:text-purple-400 rounded-full font-bold hover:bg-purple-600 hover:text-white transition-colors"
                >
                  Start Chatting
                </a>
              </div>
            </motion.div>
          </motion.div>
        </main>

        <footer className="text-center py-8 text-gray-600 dark:text-gray-400">
          <p className="mb-2">
            Made with love at <span className="font-mono">meowdel.ai</span>
          </p>
          <p className="text-sm">
            *tail swish* Powered by Claude AI (with extra cat energy)
          </p>
        </footer>
      </div>
    </div>
  );
}
