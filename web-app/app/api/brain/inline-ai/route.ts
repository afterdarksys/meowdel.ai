import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function POST(request: Request) {
  try {
    const { action, text, context } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text to transform is required' }, { status: 400 })
    }

    let prompt = ''
    
    switch (action) {
      case 'improve':
        prompt = `Improve the following text for clarity, flow, and impact while maintaining its original meaning and voice. Return ONLY the improved text, without quotes or explanation:\n\n${text}`
        break
      case 'summarize':
        prompt = `Write a concise 1-2 sentence TL;DR summary of the following text. Return ONLY the summary, without quotes or explanation:\n\n${text}`
        break
      case 'expand':
        prompt = `Expand upon the following idea, adding more detail, examples, and depth. Return ONLY the expanded text, without quotes or explanation:\n\n${text}`
        break
      case 'cat':
        prompt = `Rewrite the following text from the perspective of a highly intelligent, slightly sassy cat (Meowdel). Use subtle feline puns (purr-fect, pawsitive, etc.) but keep the core information intact. Return ONLY the rewritten text, without quotes or explanation:\n\n${text}`
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (context) {
        prompt = `Context of the surrounding document:\n${context.substring(0, 1000)}\n\n---\n\n${prompt}`
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature: 0.7,
      system: "You are an AI text transformation utility. You strictly follow instructions and return ONLY the requested modified text. You never use conversational filler like 'Here is the improved text:'.",
      messages: [
        { role: 'user', content: prompt }
      ]
    })

    const resultText = response.content.filter(c => c.type === 'text').map((c: any) => c.text).join('')
    
    return NextResponse.json({ result: resultText.trim() })

  } catch (error: any) {
    console.error('Error applying inline AI:', error)
    return NextResponse.json({ error: error.message || 'Failed to transform text' }, { status: 500 })
  }
}
