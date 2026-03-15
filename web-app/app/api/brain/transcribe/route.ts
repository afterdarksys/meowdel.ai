import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('file') as Blob

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Check for OpenAI key
    const apiKey = process.env.OPENAI_API_KEY
    
    if (apiKey) {
      // Forward to actual OpenAI Whisper API
      const openAiFormData = new FormData()
      openAiFormData.append('file', audioFile, 'recording.webm')
      openAiFormData.append('model', 'whisper-1')

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: openAiFormData
      })

      if (!response.ok) {
         const err = await response.json()
         throw new Error(err.error?.message || 'Failed to transcribe audio')
      }

      const data = await response.json()
      return NextResponse.json({ text: data.text })
    } 

    // MOCK MODE if no API key is present for MVP testing
    console.warn("No OPENAI_API_KEY found, using mock transcription.")
    await new Promise(r => setTimeout(r, 1500)) // simulate network delay
    
    const mockTranscriptions = [
       "This is a mocked transcription of your voice note, since no API key was found.",
       "I just had an amazing idea about using generative AI to automatically organize my notes.",
       "Docker containers are basically just isolated processes running on a shared kernel.",
       "Don't forget to buy catnip on the way home, Meowdel is getting grumpy."
    ]
    
    const randomMock = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)]
    
    return NextResponse.json({ text: randomMock })

  } catch (error: any) {
    console.error('Error transcribing audio:', error)
    return NextResponse.json({ error: error.message || 'Failed to process audio' }, { status: 500 })
  }
}
