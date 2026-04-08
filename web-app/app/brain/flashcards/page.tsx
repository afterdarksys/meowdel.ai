'use client'

import { FlashcardStudy } from '@/components/flashcard-study'
import { Brain } from 'lucide-react'

export default function FlashcardsPage() {
  return (
    <div className="flex flex-col h-full w-full overflow-y-auto bg-background">
      <div className="px-8 pt-20 pb-4 border-b bg-card/50">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          Flashcard Study
        </h1>
        <p className="text-muted-foreground mt-1">SM-2 spaced repetition — review cards due today</p>
      </div>
      <div className="flex-1 p-8">
        <FlashcardStudy />
      </div>
    </div>
  )
}
