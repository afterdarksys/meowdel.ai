import { NextResponse } from 'next/server'
import { GET as getNotes } from '../notes/route'

export async function GET() {
  try {
    // Re-use the existing GET to fetch all parsed notes
    const notesRes = await getNotes()
    if (!notesRes.ok) {
        return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }
    
    const notes = await notesRes.json()
    
    // Map slugs to hit counts
    const linkCounts: Record<string, number> = {}
    
    // Initialize all existing slugs with 0
    notes.forEach((n: any) => {
        linkCounts[n.slug] = 0
    })

    // Regex to match [[slug]] wikilinks
    const wikilinkRegex = /\[\[(.*?)\]\]/g

    // Iterate through all notes and count outbound links
    for (const note of notes) {
       const content = note.content || ''
       let match
       while ((match = wikilinkRegex.exec(content)) !== null) {
           const linkedSlug = match[1]
           if (linkCounts[linkedSlug] !== undefined) {
               linkCounts[linkedSlug]++
           }
       }
    }
    
    // Filter to only those with 0 incoming links
    const orphans = notes.filter((n: any) => linkCounts[n.slug] === 0)
    
    return NextResponse.json({ orphans })
    
  } catch (error) {
    console.error('Error finding orphans:', error)
    return NextResponse.json({ error: 'Failed to find orphans' }, { status: 500 })
  }
}
