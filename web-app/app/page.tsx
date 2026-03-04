'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInterface from '@/components/ChatInterface';
import CatHeader from '@/components/CatHeader';
import { useBrowserID } from '@/lib/useBrowserID';

export default function Home() {
  const [catnipMode, setCatnipMode] = useState(false);
  const { user, browserID, isReturningUser, sessionCount, loading } = useBrowserID();

  const triggerCatnip = () => {
    setCatnipMode(true);
    setTimeout(() => setCatnipMode(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden">
      {/* Animated gradient blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse" />

      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(147, 51, 234, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(147, 51, 234, 0.3) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative z-10">
        <CatHeader onCatnipClick={triggerCatnip} />

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-24 max-w-7xl">
          <div className="text-center mb-16">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-8"
            >
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-purple-100">Powered by Claude AI</span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl"
            >
              Code Smarter,
              <br />
              Purr Louder
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-purple-100 max-w-3xl mx-auto mb-12 leading-relaxed"
            >
              Chat with Claude AI enhanced with cat personality. Your coding companion with extra purrs,
              debugging prowess, and the occasional hairball of wisdom.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <a
                href="#chat"
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-purple-500/50 hover:-translate-y-1 transition-all"
              >
                Start Chatting
              </a>
              <a
                href="/images"
                className="px-8 py-4 bg-white/5 backdrop-blur-md text-white rounded-2xl font-bold text-lg border-2 border-white/20 hover:bg-white/10 hover:-translate-y-1 transition-all"
              >
                Meet Meowdel
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto"
            >
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <div className="text-4xl font-bold text-white mb-2">*purr*</div>
                <div className="text-purple-200">Cat Powered</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <div className="text-4xl font-bold text-white mb-2">24/7</div>
                <div className="text-purple-200">Always Awake</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <div className="text-4xl font-bold text-white mb-2">∞</div>
                <div className="text-purple-200">Bugs Squashed</div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-4">What Makes Meowdel Special</h2>
            <p className="text-xl text-purple-100">All the coding help, with extra cat energy</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-purple-500/50 transition-all"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-xl">
                <span className="text-3xl">🐱</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Cat Personality</h3>
              <p className="text-purple-100 leading-relaxed">
                Not just AI responses - get meows, purrs, and tail swishes along with your code solutions.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -4 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-purple-500/50 transition-all"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-xl">
                <span className="text-3xl">💻</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Code Debugging</h3>
              <p className="text-purple-100 leading-relaxed">
                Claude's powerful AI helps solve bugs, write code, and troubleshoot - with cat jokes included.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -4 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-purple-500/50 transition-all"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-6 shadow-xl">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Cloud Ready</h3>
              <p className="text-purple-100 leading-relaxed">
                From DNS to Docker, troubleshoot cloud infrastructure while Meowdel knocks things off your desk.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Chat Section */}
        <section id="chat" className="container mx-auto px-4 py-20 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-white mb-4">Try It Now</h2>
            <p className="text-xl text-purple-100">Start chatting with your new feline coding companion</p>
          </div>

          {/* Personalized welcome message */}
          {!loading && user && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 max-w-2xl mx-auto"
            >
              {isReturningUser ? (
                <p className="text-lg font-medium text-purple-100" suppressHydrationWarning>
                  *purrs* Welcome back! This is visit #{sessionCount}!
                  {user.catPersonality.affinity > 70 && " *rubs against screen* I missed you!"}
                  {user.catPersonality.affinity > 50 && user.catPersonality.affinity <= 70 && " *tail swish* Ready to code?"}
                </p>
              ) : (
                <p className="text-lg font-medium text-purple-100" suppressHydrationWarning>
                  *stretches* Meow! Nice to meet you! I'm Meowdel, your coding cat!
                </p>
              )}
              {user.catPersonality.bugsSolvedTogether > 0 && (
                <p className="text-sm text-pink-300 mt-2" suppressHydrationWarning>
                  We've fixed {user.catPersonality.bugsSolvedTogether} bugs together! *proud tail swish*
                </p>
              )}
            </motion.div>
          )}

          <ChatInterface
            catnipMode={catnipMode}
            user={user}
            browserID={browserID}
          />
        </section>

        {/* Final CTA Section */}
        <section className="container mx-auto px-4 py-24 max-w-7xl">
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-16 border border-white/10 text-center">
            <h2 className="text-5xl font-bold text-white mb-6">Ready to Code with Cats?</h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Join developers who've discovered that coding is better with a purring companion.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#chat"
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-purple-500/50 hover:-translate-y-1 transition-all"
              >
                Start Free Now
              </a>
              <a
                href="/meet-meowdel"
                className="px-8 py-4 bg-white/5 backdrop-blur-md text-white rounded-2xl font-bold text-lg border-2 border-white/20 hover:bg-white/10 hover:-translate-y-1 transition-all"
              >
                Learn More
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-12 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="text-white font-bold text-lg mb-4">Meowdel</h3>
                <p className="text-purple-200 text-sm">
                  Claude AI with extra cat energy. Part of the cats.center ecosystem.
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Product</h4>
                <ul className="space-y-2">
                  <li><a href="/" className="text-purple-200 hover:text-white transition-colors">Chat</a></li>
                  <li><a href="/images" className="text-purple-200 hover:text-white transition-colors">Gallery</a></li>
                  <li><a href="/pricing" className="text-purple-200 hover:text-white transition-colors">Pricing</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><a href="/about" className="text-purple-200 hover:text-white transition-colors">About</a></li>
                  <li><a href="/meet-meowdel" className="text-purple-200 hover:text-white transition-colors">Meet Meowdel</a></li>
                  <li><a href="https://cats.center" target="_blank" rel="noopener noreferrer" className="text-purple-200 hover:text-white transition-colors">cats.center</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-purple-200 hover:text-white transition-colors">Privacy</a></li>
                  <li><a href="#" className="text-purple-200 hover:text-white transition-colors">Terms</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/10 pt-8 text-center">
              <p className="text-purple-200 text-sm">
                Made with love at <span className="font-mono text-pink-300">meowdel.ai</span>
              </p>
              <p className="text-purple-300 text-sm mt-2">
                *tail swish* Powered by Claude AI (with extra cat energy)
              </p>
            </div>
          </div>
        </footer>

        <AnimatePresence>
          {catnipMode && (
            <motion.div
              initial={{ scale: 0, rotate: 0 }}
              animate={{
                scale: [1, 1.5, 1],
                rotate: [0, 360, 720],
              }}
              exit={{ scale: 0, opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="text-6xl font-bold text-purple-400 animate-bounce drop-shadow-2xl">
                CATNIP MODE!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
