import { NextResponse } from 'next/server'
import { createWorker } from 'tesseract.js'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as Blob | null
    
    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Initialize Tesseract worker
    const worker = await createWorker('eng')
    const { data: { text } } = await worker.recognize(buffer)
    await worker.terminate()

    const extractedText = text.trim()
    
    return NextResponse.json({ text: extractedText.substring(0, 1000) })

  } catch (error) {
    console.error('Visual Search OCR error:', error)
    return NextResponse.json({ error: 'Failed to process image OCR' }, { status: 500 })
  }
}
