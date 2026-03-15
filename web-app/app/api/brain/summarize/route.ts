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
      max_tokens: 300,
      temperature: 0.2,
      system: "You are a highly efficient knowledge extractor. Your task is to provide a concise, single-paragraph TL;DR (summary) of the provided markdown note format. Do NOT include markdown styling like > or bolding in your output except when mathematically or technically necessary. Just the raw text.",
      messages: [{ role: 'user', content: `Summarize this note:\n\n${content}` }],
    });

    const summary = response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({ summary: summary.trim() });
  } catch (error) {
    console.error('Summarize error:', error);
    return NextResponse.json({ error: 'Failed to summarize' }, { status: 500 });
  }
}
