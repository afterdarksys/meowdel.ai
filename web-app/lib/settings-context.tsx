"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type BrainPersonality = 'regular' | 'cat'

interface SettingsContextType {
  brainPersonality: BrainPersonality
  setBrainPersonality: (p: BrainPersonality) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [brainPersonality, setBrainPersonalityState] = useState<BrainPersonality>('cat')

  useEffect(() => {
    // Load from local storage on mount
    const saved = localStorage.getItem('brainPersonality')
    if (saved === 'regular' || saved === 'cat') {
      setBrainPersonalityState(saved)
    }
  }, [])

  const setBrainPersonality = (p: BrainPersonality) => {
    setBrainPersonalityState(p)
    localStorage.setItem('brainPersonality', p)
  }

  return (
    <SettingsContext.Provider value={{ brainPersonality, setBrainPersonality }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
