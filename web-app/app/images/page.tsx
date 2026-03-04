'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import CatHeader from '@/components/CatHeader';
import Image from 'next/image';

export default function ImagesPage() {
  const [catnipMode, setCatnipMode] = useState(false);

  const triggerCatnip = () => {
    setCatnipMode(true);
    setTimeout(() => setCatnipMode(false), 3000);
  };

  const images = [
    {
      src: '/gallery/meowdel_on_keyboard-blurry.png',
      title: 'Meowdel on Keyboard',
      description: 'A cute Russian Blue Maine Coon sitting on a laptop keyboard - the classic cat behavior!'
    },
    {
      src: '/gallery/meowdel_network_cables.png',
      title: 'Meowdel & Network Cables',
      description: 'Playful tech cat pulling colorful network cables from a server rack'
    },
    {
      src: '/gallery/meowdel_being_petted.png',
      title: 'Meowdel Being Petted',
      description: 'Content cat being petted by a hand wearing a smartwatch - tech meets comfort'
    },
    {
      src: '/gallery/meowdel_catnip.png',
      title: 'Meowdel & Catnip',
      description: 'Curious cat sniffing catnip - pure bliss!'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 relative overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(147, 51, 234, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(147, 51, 234, 0.3) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Floating paw prints background - reduced for performance */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-10 relative z-0">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl"
            style={{ willChange: 'transform' }}
            initial={{
              x: Math.random() * 1200,
              y: -50,
              rotate: Math.random() * 360
            }}
            animate={{
              y: 1000,
              rotate: Math.random() * 360 + 360
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'linear'
            }}
          >
            🐾
          </motion.div>
        ))}
      </div>

      <div className="relative z-10">
        <CatHeader onCatnipClick={triggerCatnip} />

        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 text-center"
          >
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
              Meowdel Gallery
            </h1>
            <p className="text-xl text-purple-100">
              <span className="inline-block animate-pulse">*meow*</span> Meet the Meowdel mascot in all its glory! <span className="inline-block animate-pulse">*purr*</span>
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
            {images.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-white/10"
              >
                <div className="relative aspect-square">
                  <Image
                    src={image.src}
                    alt={image.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-bold text-purple-300 mb-1">
                    {image.title}
                  </h3>
                  <p className="text-xs text-purple-200">
                    {image.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <a
              href="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              Back to Chat
            </a>
          </motion.div>
        </main>

        <footer className="text-center py-8 text-purple-200">
          <p className="mb-2">
            Made with love at <span className="font-mono text-pink-300">meowdel.ai</span>
          </p>
          <p className="text-sm text-purple-300">
            *tail swish* Powered by Claude AI (with extra cat energy)
          </p>
        </footer>
      </div>
    </div>
  );
}
