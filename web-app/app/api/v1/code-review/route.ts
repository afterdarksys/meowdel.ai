import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Proxy to the internal code-review route
export async function POST(req: NextRequest) {
  const body = await req.json()
  const internalRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/brain/code-review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': req.headers.get('Authorization') ?? '', 'Cookie': req.headers.get('cookie') ?? '' },
    body: JSON.stringify(body),
  })
  return NextResponse.json(await internalRes.json(), { status: internalRes.status })
}

export async function GET(req: NextRequest) {
  const internalRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/brain/code-review`, {
    headers: { 'Authorization': req.headers.get('Authorization') ?? '', 'Cookie': req.headers.get('cookie') ?? '' },
  })
  return NextResponse.json(await internalRes.json(), { status: internalRes.status })
}
