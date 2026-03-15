import { NextResponse } from 'next/server'
import { POST as createNote } from '../notes/route'

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages to export' }, { status: 400 })
    }

    // Attempt to generate a title from the first user message
    const firstUserMessage = messages.find((m: any) => m.role === 'user')?.content || 'Chat Session'
    const title = firstUserMessage.length > 40 
        ? firstUserMessage.substring(0, 40) + '...' 
        : firstUserMessage

    // Convert chat history to markdown
    const mdLines = messages.map((m: any) => {
        const prefix = m.role === 'user' ? '**You:** ' : '**Meowdel:** '
        return `${prefix}\n\n${m.content}\n\n---\n`
    })

    const content = `# Chat Export\n\n*Exported on ${new Date().toLocaleString()}*\n\n---\n\n${mdLines.join('\n')}`

    // Pass this to the existing notes API creation logic
    // Create a mock Request object
    const mockRequest = new Request('http://localhost/api/brain/notes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: `Chat: ${title}`,
            content,
            tags: ['Chat-Export']
        })
    })

    const res = await createNote(mockRequest)
    return res

  } catch (error) {
    console.error('Error exporting chat:', error)
    return NextResponse.json({ error: 'Failed to export chat' }, { status: 500 })
  }
}
