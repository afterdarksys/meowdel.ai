import { NextResponse } from 'next/server'
import { GET as getNotes } from '../../brain/notes/route'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function GET(req: Request) {
  // Authentication check for cron endpoints is highly recommended standard practice
  // Check for specialized Vercel Cron header or internal secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Fetch all notes
    const notesRes = await getNotes()
    if (!notesRes.ok) throw new Error('Failed to fetch notes')
    const notes = await notesRes.json()

    // 2. Filter notes modified in the last 24 hours
    const now = new Date()
    const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000))
    
    const recentNotes = notes.filter((n: any) => new Date(n.modifiedAt) > yesterday)

    if (recentNotes.length === 0) {
      return NextResponse.json({ message: 'No notes updated in the last 24h. Skipping email.' })
    }

    // 3. Summarize using Anthropic
    const notesSummary = recentNotes.map((n: any) => `Title: ${n.title}\nExcerpt: ${n.excerpt}`).join('\n\n')
    
    const aiResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.7,
      system: `You are Meowdel, an intelligent feline AI. You are writing a daily digest email to the user.
Summarize the notes they created or modified today. Keep it fun, concise, and encourage them to link their thoughts. Use markdown.`,
      messages: [{ role: 'user', content: `Here are the notes modified today:\n\n${notesSummary}\n\nPlease generate the email body.` }]
    })

    const emailContent = (aiResponse.content[0] as {text: string}).text

    // 4. Send Email via Resend
    // Typically we'd fetch the user's email from the DB, but for this single-tenant scope we'll use a preset env var
    const toEmail = process.env.USER_EMAIL || 'user@example.com'

    if (process.env.RESEND_API_KEY) {
       const resend = new Resend(process.env.RESEND_API_KEY)
       await resend.emails.send({
          from: 'Meowdel <brain@meowdel.ai>',
          to: [toEmail],
          subject: '🐾 Your Meowdel Daily Digest',
          text: emailContent, 
          // HTML could be parsed from markdown here using marked or similar, but text works for testing
        })
        return NextResponse.json({ success: true, message: `Email sent to ${toEmail} about ${recentNotes.length} notes.` })
    } else {
       // If no Resend key, just log to console
       console.log('--- DAILY DIGEST EMAIL ---')
       console.log(emailContent)
       console.log('--------------------------')
       return NextResponse.json({ success: true, message: 'Email logged to console (No Resend API key found).' })
    }

  } catch (error) {
    console.error('Digest error:', error)
    return NextResponse.json({ error: 'Failed to generate digest' }, { status: 500 })
  }
}
