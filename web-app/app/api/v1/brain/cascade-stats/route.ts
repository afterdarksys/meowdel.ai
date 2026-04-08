import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getCascadeStats } from '@/lib/intelligence/cascade'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stats = await getCascadeStats(session.id)
  return NextResponse.json({ success: true, stats })
}
