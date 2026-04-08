"use client"

/**
 * FlashcardStudy — full-screen study session component.
 * Shows cards due for review, accepts quality ratings 0-5 (simplified to 3 buttons),
 * and updates the SM-2 schedule via the review API.
 *
 * Usage: <FlashcardStudy noteId={note.id} /> on the note page,
 * or standalone at /brain/flashcards.
 */

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, ChevronRight, RotateCcw, Sparkles, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-full bg-muted ${className}`}>
      <div
        className="h-full bg-primary transition-all duration-300"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

interface Flashcard {
  id: string
  front: string
  back: string
  noteId: string
  interval: number
  easinessFactor: number
  repetitions: number
}

interface FlashcardStudyProps {
  noteId?: string // If provided, study only cards for this note; else study all due cards
}

type StudyPhase = 'loading' | 'question' | 'answer' | 'done' | 'empty'

export function FlashcardStudy({ noteId }: FlashcardStudyProps) {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<StudyPhase>('loading')
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState<{ easy: number; hard: number; again: number }>({
    easy: 0,
    hard: 0,
    again: 0,
  })

  const load = useCallback(async () => {
    setPhase('loading')
    const url = noteId
      ? `/api/brain/flashcards?noteId=${noteId}`
      : '/api/brain/flashcards'
    const res = await fetch(url)
    const data = await res.json()
    const fetched: Flashcard[] = data.cards ?? []
    setCards(fetched)
    setIndex(0)
    setFlipped(false)
    setPhase(fetched.length === 0 ? 'empty' : 'question')
  }, [noteId])

  useEffect(() => {
    load()
  }, [load])

  const currentCard = cards[index]
  const progress = cards.length > 0 ? (index / cards.length) * 100 : 0

  async function rate(quality: number, label: 'easy' | 'hard' | 'again') {
    if (!currentCard) return

    await fetch('/api/brain/flashcards/review', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: currentCard.id, quality }),
    })

    setResults((r) => ({ ...r, [label]: r[label] + 1 }))

    if (index + 1 >= cards.length) {
      setPhase('done')
    } else {
      setIndex((i) => i + 1)
      setFlipped(false)
      setPhase('question')
    }
  }

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
        <Brain className="w-5 h-5 animate-pulse" />
        Loading cards...
      </div>
    )
  }

  if (phase === 'empty') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500" />
        <div>
          <p className="font-semibold text-lg">No cards due today</p>
          <p className="text-muted-foreground text-sm mt-1">
            Generate cards from a note or come back when reviews are scheduled.
          </p>
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    const total = results.easy + results.hard + results.again
    const score = total > 0 ? Math.round(((results.easy + results.hard * 0.5) / total) * 100) : 0
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-6 text-center">
        <Sparkles className="w-12 h-12 text-primary" />
        <div>
          <p className="font-bold text-2xl">Session complete!</p>
          <p className="text-muted-foreground mt-1">Retention score: {score}%</p>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="w-4 h-4" /> {results.easy} easy
          </span>
          <span className="flex items-center gap-1 text-yellow-600">
            <AlertCircle className="w-4 h-4" /> {results.hard} hard
          </span>
          <span className="flex items-center gap-1 text-red-500">
            <XCircle className="w-4 h-4" /> {results.again} again
          </span>
        </div>
        <Button onClick={load} variant="outline" className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Study again
        </Button>
      </div>
    )
  }

  if (!currentCard) return null

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>
          {index + 1} / {cards.length}
        </span>
        <Progress value={progress} className="flex-1 h-2" />
        <span>{Math.round(progress)}%</span>
      </div>

      {/* Card */}
      <div
        className="cursor-pointer select-none"
        onClick={() => {
          if (phase === 'question') {
            setFlipped(true)
            setPhase('answer')
          }
        }}
      >
        <Card className="min-h-[200px] flex flex-col items-center justify-center p-8 text-center transition-all border-2 hover:border-primary/40">
          <CardContent className="p-0 flex flex-col items-center gap-4 w-full">
            {!flipped ? (
              <>
                <Badge variant="outline" className="text-xs uppercase tracking-wider">
                  Question
                </Badge>
                <p className="text-xl font-medium leading-relaxed">{currentCard.front}</p>
                <p className="text-sm text-muted-foreground mt-4">
                  Click to reveal answer
                </p>
              </>
            ) : (
              <>
                <Badge variant="secondary" className="text-xs uppercase tracking-wider">
                  Answer
                </Badge>
                <p className="text-sm text-muted-foreground">{currentCard.front}</p>
                <div className="w-full border-t my-2" />
                <p className="text-xl font-medium leading-relaxed">{currentCard.back}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rating buttons — only shown after flip */}
      {phase === 'answer' && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 gap-2"
            onClick={() => rate(1, 'again')}
          >
            <RotateCcw className="w-4 h-4" />
            Again
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-yellow-300 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950 gap-2"
            onClick={() => rate(3, 'hard')}
          >
            <AlertCircle className="w-4 h-4" />
            Hard
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 gap-2"
            onClick={() => rate(5, 'easy')}
          >
            <ChevronRight className="w-4 h-4" />
            Easy
          </Button>
        </div>
      )}
    </div>
  )
}
