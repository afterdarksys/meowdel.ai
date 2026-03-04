'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import CatHeader from '@/components/CatHeader';

export default function AboutPage() {
  const [catnipMode, setCatnipMode] = useState(false);

  const triggerCatnip = () => {
    setCatnipMode(true);
    setTimeout(() => setCatnipMode(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 dark:from-purple-950 dark:via-pink-950 dark:to-orange-950">
      <div className="relative z-10">
        <CatHeader onCatnipClick={triggerCatnip} />

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-5xl font-bold mb-6 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              About Meowdel
            </h1>

            <div className="space-y-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border-2 border-purple-200 dark:border-purple-700">
              <motion.section
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                  Who is Meowdel?
                </h2>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  Meowdel is an AI Cat who codes, troubleshoots cloud infrastructure, makes cat jokes, and loves catnip.
                </p>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                  Why does Meowdel exist?
                </h2>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  Meowdel powers the virtual cat personality ecosystem from{' '}
                  <a
                    href="https://cats.center"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 dark:text-purple-400 hover:text-pink-600 dark:hover:text-pink-400 font-semibold underline"
                  >
                    cats.center
                  </a>
                </p>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="pt-6 border-t border-purple-200 dark:border-purple-700"
              >
                <p className="text-center text-gray-600 dark:text-gray-400 italic">
                  <span className="inline-block animate-pulse">*purr*</span> Chat with Claude AI... but with extra cat energy! <span className="inline-block animate-pulse">*meow*</span>
                </p>
              </motion.section>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center mt-8"
            >
              <a
                href="/"
                className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-shadow hover:scale-105 transform"
              >
                Start Chatting
              </a>
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
