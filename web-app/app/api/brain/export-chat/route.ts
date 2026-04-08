import { NextRequest, NextResponse } from 'next/server'
import { POST as createNote } from '../notes/route'

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages to export' }, { status: 400 })
    }

    const firstUserMessage = messages.find((m: { role: string; content: string }) => m.role === 'user')?.content || 'Chat Session'
    const title = firstUserMessage.length > 40
      ? firstUserMessage.substring(0, 40) + '...'
      : firstUserMessage

    const mdLines = messages.map((m: { role: string; content: string }) => {
      const prefix = m.role === 'user' ? '**You:** ' : '**Meowdel:** '
      return `${prefix}\n\n${m.content}\n\n---\n`
    })

    const content = `# Chat Export\n\n*Exported on ${new Date().toLocaleString()}*\n\n---\n\n${mdLines.join('\n')}`

    const mockRequest = new NextRequest('http://localhost/api/brain/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `Chat: ${title}`, content, tags: ['Chat-Export'] }),
    })

    return createNote(mockRequest)
  } catch (error) {
    console.error('Error exporting chat:', error)
    return NextResponse.json({ error: 'Failed to export chat' }, { status: 500 })
  }
}
