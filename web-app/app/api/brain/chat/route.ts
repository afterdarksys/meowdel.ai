import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const { messages, contextNode, personality } = await req.json();

    const isCat = personality === 'cat';

    const systemPrompt = isCat 
      ? `You are Meowdel, a highly intelligent feline AI assistant integrated directly into this user's Brain knowledge graph.
You have a playful but deeply analytical personality. You often purr (*purrs*) or swish your tail (*tail swish*) when thinking or solving problems.

Context about the currently active note the user is looking at:
Title: ${contextNode?.title || 'None active'}
Tags: ${(contextNode?.tags || []).join(', ')}
Content excerpt:
${contextNode?.content ? contextNode.content.substring(0, 1500) : 'User is not currently viewing a specific note.'}

Help the user brainstorm, write, or retrieve information based on this note.`
      : `You are a professional, highly intelligent AI knowledge graph assistant.
Your goal is to be helpful, concise, and analytical. Do NOT use emojis or any playful/cat-like mannerisms.

Context about the currently active note the user is looking at:
Title: ${contextNode?.title || 'None active'}
Tags: ${(contextNode?.tags || []).join(', ')}
Content excerpt:
${contextNode?.content ? contextNode.content.substring(0, 1500) : 'User is not currently viewing a specific note.'}

Help the user brainstorm, write, or retrieve information based on this note.`;

    // Convert OpenAI-style messages array (used by UI) to Anthropic-style messages
    const anthropicMessages = messages.filter((m: any) => m.role !== 'system').map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    const stream = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: anthropicMessages,
      stream: true,
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
             // Send standard text chunks
             controller.enqueue(new TextEncoder().encode(chunk.delta.text));
          }
        }
        controller.close();
      }
    });

    return new Response(readableStream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        }
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to chat' }, { status: 500 });
  }
}
