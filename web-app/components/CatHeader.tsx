'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface CatHeaderProps {
  onCatnipClick: () => void;
}

export default function CatHeader({ onCatnipClick }: CatHeaderProps) {
  const [isSwatting, setIsSwatting] = useState(false);

  const handleMouseEnter = () => {
    if (Math.random() > 0.7) {
      setIsSwatting(true);
      setTimeout(() => setIsSwatting(false), 500);
    }
  };

  return (
    <header
      className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40"
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo Section */}
        <a href="/" className="flex items-center gap-3">
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-400"
              animate={{
                rotate: isSwatting ? [0, -20, 20, -20, 0] : 0,
              }}
              transition={{ duration: 0.5 }}
            >
              <img
                src="/gallery/meowdel_being_petted.png"
                alt="Meowdel Logo"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Meowdel
              </h2>
              <p className="text-xs text-purple-200">
                Claude AI + Cat Energy
              </p>
            </div>
          </motion.div>
        </a>

        {/* Navigation - ALWAYS VISIBLE */}
        <div className="flex gap-2 md:gap-4 items-center text-sm md:text-base">
          <a
            href="/about"
            className="text-purple-100 hover:text-white font-medium transition-colors"
          >
            About
          </a>
          <a
            href="/meet-meowdel"
            className="text-purple-100 hover:text-white font-medium transition-colors"
          >
            Meet Meowdel
          </a>
          <a
            href="/images"
            className="text-purple-100 hover:text-white font-medium transition-colors"
          >
            Gallery
          </a>
          <a
            href="/api/auth/login"
            className="px-4 py-1.5 md:px-6 md:py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Sign Up
          </a>
          <a
            href="/api/auth/login"
            className="px-3 py-1.5 md:px-4 md:py-2 text-purple-300 hover:text-white font-semibold transition-colors"
          >
            Login
          </a>
        </div>
      </div>
    </header>
  );
}
