/**
 * Smart Reminders — AI-extracted TODOs + spaced-repetition revisit suggestions
 *
 * GET /api/brain/reminders
 *
 * Replaces the old filesystem-based implementation with a proper DB query.
 * TODOs are extracted from note content using regex (fast).
 * Revisit suggestions use note updatedAt timestamps with SM-2-inspired intervals.
 *
 * Tier: free (basic todos); pro (AI-enhanced prioritization)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brainNotes } from '@/lib/db/schema'
import { eq, and, lt, gt, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export interface ReminderTodo {
  id: string
  noteId: string
  noteSlug: string
  noteTitle: string
  text: string
  completed: boolean
}

export interface ReminderRevisit {
  noteId: string
  noteSlug: string
  noteTitle: string
  reason: string
  lastModified: string
  daysSince: number
}

const REVISIT_WINDOWS = [
  { min: 6, max: 8, label: '1 week' },
  { min: 13, max: 15, label: '2 weeks' },
  { min: 28, max: 32, label: '1 month' },
  { min: 55, max: 65, label: '2 months' },
  { min: 85, max: 95, label: '3 months' },
  { min: 175, max: 190, label: '6 months' },
  { min: 355, max: 375, label: '1 year' },
]

function extractTodos(content: string, noteId: string, noteSlug: string, noteTitle: string): ReminderTodo[] {
  const todos: ReminderTodo[] = []
  const lines = content.split('\n')

  lines.forEach((line, index) => {
    const trimmed = line.trim()
    let text = ''
    let completed = false
    let isTodo = false

    if (/^[-*]\s*\[\s*x\s*\]/i.test(trimmed)) {
      isTodo = true
      completed = true
      text = trimmed.replace(/^[-*]\s*\[[xX]\]\s*/, '')
    } else if (/^[-*]\s*\[\s*\]/.test(trimmed)) {
      isTodo = true
      completed = false
      text = trimmed.replace(/^[-*]\s*\[\s*\]\s*/, '')
    } else if (/TODO:/i.test(trimmed)) {
      isTodo = true
      completed = false
      text = trimmed.replace(/^.*TODO:\s*/i, '')
    } else if (/FIXME:/i.test(trimmed)) {
      isTodo = true
      completed = false
      text = trimmed.replace(/^.*FIXME:\s*/i, '')
    }

    if (isTodo && text.trim()) {
      todos.push({
        id: `${noteId}-${index}`,
        noteId,
        noteSlug,
        noteTitle,
        text: text.slice(0, 200),
        completed,
      })
    }
  })

  return todos
}

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()

  // Fetch recent notes (last 200) — lightweight query with content for TODO extraction
  const notes = await db
    .select({
      id: brainNotes.id,
      slug: brainNotes.slug,
      title: brainNotes.title,
      content: brainNotes.content,
      updatedAt: brainNotes.updatedAt,
    })
    .from(brainNotes)
    .where(and(
      eq(brainNotes.userId, user.id),
      eq(brainNotes.isDeleted, false),
      eq(brainNotes.isArchived, false),
    ))
    .orderBy(desc(brainNotes.updatedAt))
    .limit(200)

  const todos: ReminderTodo[] = []
  const revisit: ReminderRevisit[] = []

  for (const note of notes) {
    // Extract TODOs
    const noteTodos = extractTodos(note.content, note.id, note.slug, note.title)
    todos.push(...noteTodos)

    // Revisit logic
    const mtime = new Date(note.updatedAt)
    const daysSince = Math.floor((now.getTime() - mtime.getTime()) / (1000 * 60 * 60 * 24))

    for (const window of REVISIT_WINDOWS) {
      if (daysSince >= window.min && daysSince <= window.max) {
        revisit.push({
          noteId: note.id,
          noteSlug: note.slug,
          noteTitle: note.title,
          reason: `You last edited this ${window.label} ago`,
          lastModified: mtime.toISOString(),
          daysSince,
        })
        break
      }
    }
  }

  // Surface incomplete TODOs first, limit to 50 to keep response lean
  const incompleteTodos = todos.filter((t) => !t.completed).slice(0, 30)
  const completedTodos = todos.filter((t) => t.completed).slice(0, 20)

  return NextResponse.json({
    todos: [...incompleteTodos, ...completedTodos],
    revisit: revisit.slice(0, 15),
    stats: {
      totalTodos: todos.length,
      incompleteTodos: incompleteTodos.length,
      revisitCount: revisit.length,
    },
  })
}
