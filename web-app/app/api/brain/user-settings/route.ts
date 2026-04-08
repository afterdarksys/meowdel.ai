import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, user.id))
    .limit(1)

  // Return defaults if no settings row yet
  return NextResponse.json(settings ?? {
    customSystemPrompt: null,
    meowdelPersonaName: 'Meowdel',
    preferredModel: 'claude-sonnet-4-6',
    defaultSwarmMode: 'auto',
    autoEmbedNotes: true,
    autoLinkNotes: true,
    autoSummarizeNotes: true,
    editorTheme: 'default',
    sidebarCollapsed: false,
    showWordCount: true,
    defaultNoteView: 'edit',
    extra: {},
  })
}

export async function PATCH(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Whitelist updatable fields
  const allowed = [
    'customSystemPrompt', 'meowdelPersonaName', 'preferredModel',
    'defaultSwarmMode', 'autoEmbedNotes', 'autoLinkNotes', 'autoSummarizeNotes',
    'editorTheme', 'sidebarCollapsed', 'showWordCount', 'defaultNoteView', 'extra',
  ] as const

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  // Upsert
  const [result] = await db
    .insert(userSettings)
    .values({ userId: user.id, ...updates })
    .onConflictDoUpdate({ target: userSettings.userId, set: updates })
    .returning()

  return NextResponse.json(result)
}
