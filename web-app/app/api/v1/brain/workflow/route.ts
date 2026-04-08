import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { runSwarm } from '@/lib/swarm/queen'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { mode = 'auto', input, context, noteId } = await req.json()
  if (!input) return NextResponse.json({ error: 'input required' }, { status: 400 })

  const result = await runSwarm({ mode, userId: user.id, input, context, noteId })
  return NextResponse.json(result)
}
