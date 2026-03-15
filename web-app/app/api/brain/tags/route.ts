import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      temperature: 0.1,
      system: "You are an expert taxonomist. Return a JSON array of 3 to 5 concise and relevant lowercase tags (e.g. ['docker', 'deployment', 'containers']) derived from the provided note text. Output ONLY the raw JSON array of strings, with no markdown code blocks or additional text.",
      messages: [{ role: 'user', content: `Extract tags from this note:\n\n${content}` }],
    });

    let rawText = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]';
    
    // Safety cleanup in case Claude drops it into a codeblock anyway
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/```json\n?/, '').replace(/```\n?/, '');
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/```\n?/, '').replace(/```\n?/, '');
    }

    let tags: string[] = [];
    try {
       tags = JSON.parse(rawText);
    } catch(e) {
       console.error("Failed to parse tags JSON:", rawText);
    }

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Tags error:', error);
    return NextResponse.json({ error: 'Failed to extract tags' }, { status: 500 });
  }
}
