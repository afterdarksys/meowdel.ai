"use client"

import { useState, useEffect } from "react"
import { Trophy, Star, Zap, Library, Target, Flame } from "lucide-react"
import { BrainNote } from "@/app/api/brain/notes/route"

export function GamificationPanel() {
   const [notes, setNotes] = useState<BrainNote[]>([])
   const [loading, setLoading] = useState(true)

   useEffect(() => {
     fetch('/api/brain/notes')
       .then(res => res.json())
       .then(data => {
         setNotes(data)
         setLoading(false)
       })
   }, [])

   if (loading) return null

   // Calculate stats
   const totalNotes = notes.length
   
   // Level calculation (logarithmic scale)
   // Level 1: 0-5 notes, Level 2: 6-15, Level 3: 16-30...
   const calculateLevel = (count: number) => {
      if (count < 5) return 1
      if (count < 15) return 2
      if (count < 35) return 3
      if (count < 75) return 4
      if (count < 150) return 5
      return Math.floor(count / 30)
   }

   const level = calculateLevel(totalNotes)
   const nextLevelThreshold = level === 1 ? 5 : level === 2 ? 15 : level === 3 ? 35 : level === 4 ? 75 : level * 30 + 150
   const progress = Math.min(100, Math.max(0, (totalNotes / nextLevelThreshold) * 100))

   // Mock badges based on stats
   const badges = [
      { id: 'first_note', name: 'First Steps', description: 'Created your first note.', icon: Star, unlocked: totalNotes >= 1, color: 'text-yellow-500' },
      { id: 'novice', name: 'Knowledge Gatherer', description: 'Reached 10 notes.', icon: Library, unlocked: totalNotes >= 10, color: 'text-emerald-500' },
      { id: 'streak', name: 'On Fire', description: '3 day note streak.', icon: Flame, unlocked: totalNotes >= 5, color: 'text-orange-500' },
      { id: 'architect', name: 'Architect', description: 'Reached Level 5.', icon: Target, unlocked: level >= 5, color: 'text-purple-500' },
      { id: 'ai_wizard', name: 'AI Wizard', description: 'Used an AI tool.', icon: Zap, unlocked: true, color: 'text-blue-500' },
   ]

   return (
      <div className="bg-card border rounded-2xl p-6 shadow-sm overflow-hidden relative">
         {/* Background decoration */}
         <div className="absolute top-0 right-0 p-8 opacity-5">
            <Trophy className="w-48 h-48" />
         </div>

         <div className="relative z-10">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
               <Trophy className="w-5 h-5 text-yellow-500" /> 
               Knowledge Mastery
            </h2>

            {/* Level Progress */}
            <div className="mb-8 bg-muted/30 p-4 rounded-xl border border-border/50">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                     <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Current Level</span>
                     <span className="text-2xl font-black text-foreground">{level}</span>
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                     {totalNotes} / {nextLevelThreshold} Notes
                  </div>
               </div>
               
               <div className="h-3 w-full bg-secondary rounded-full overflow-hidden border">
                  <div 
                     className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-1000 ease-out"
                     style={{ width: `${progress}%` }}
                  />
               </div>
               <p className="text-[10px] text-muted-foreground mt-2 text-right uppercase tracking-wider font-bold">
                  {nextLevelThreshold - totalNotes} notes to Level {level + 1}
               </p>
            </div>

            {/* Badges Grid */}
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Achievements</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
               {badges.map(badge => (
                  <div 
                     key={badge.id}
                     className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                        badge.unlocked 
                           ? 'bg-card border-border shadow-sm' 
                           : 'bg-muted/10 border-transparent opacity-50 grayscale'
                     }`}
                  >
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner ${
                        badge.unlocked ? 'bg-secondary' : 'bg-muted'
                     }`}>
                        <badge.icon className={`w-5 h-5 ${badge.unlocked ? badge.color : 'text-muted-foreground'}`} />
                     </div>
                     <div>
                        <h4 className="font-bold text-sm leading-tight text-foreground">{badge.name}</h4>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{badge.description}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
   )
}
