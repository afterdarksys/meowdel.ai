"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, X } from "lucide-react"

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
}

export function AchievementPopup() {
  const [achievements, setAchievements] = useState<Badge[]>([])

  // This would typically tie into a global state (Zustand/Context) or WebSocket 
  // to listen for new badges won. For the MVP, we expose a global function 
  // that other components can call: `window.triggerAchievement()`
  useEffect(() => {
    const handleNewAchievement = (e: CustomEvent<Badge>) => {
      setAchievements((prev) => [...prev, e.detail])
      
      // Auto-dismiss after 6 seconds
      setTimeout(() => {
        setAchievements((prev) => prev.filter(b => b.id !== e.detail.id))
      }, 6000)
    }

    window.addEventListener("new-achievement", handleNewAchievement as EventListener)
    return () => window.removeEventListener("new-achievement", handleNewAchievement as EventListener)
  }, [])

  const dismiss = (id: string) => {
    setAchievements((prev) => prev.filter(b => b.id !== id))
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {achievements.map((badge) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="pointer-events-auto bg-card border border-primary/30 shadow-2xl rounded-xl p-4 flex items-start gap-4 w-80 overflow-hidden relative"
          >
            {/* Celebration shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-primary/10 to-primary/0 animate-shimmer -z-10" />
            
            <div className="flex-shrink-0 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center text-2xl relative">
              {badge.icon}
              <Trophy className="absolute -bottom-1 -right-1 w-5 h-5 text-yellow-500 drop-shadow-md" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Achievement Unlocked!</p>
              <h4 className="font-semibold text-foreground truncate">{badge.name}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-snug break-words">
                {badge.description}
              </p>
            </div>
            
            <button 
              onClick={() => dismiss(badge.id)}
              className="text-muted-foreground hover:text-foreground transition-colors absolute top-2 right-2"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
