import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { socialAccounts, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execAsync = util.promisify(exec);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const meowdelTools: Anthropic.Tool[] = [
  {
    name: 'list_github_repo_files',
    description: 'Lists files and directories in a GitHub repository using the GitHub API.',
    input_schema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'GitHub username or organization' },
        repo: { type: 'string', description: 'Repository name' },
        path: { type: 'string', description: 'Path within the repository (default is root)', default: '' }
      },
      required: ['owner', 'repo']
    }
  },
  {
    name: 'get_github_file_content',
    description: 'Retrieves the raw content of a specific file in a GitHub repository.',
    input_schema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'GitHub username or organization' },
        repo: { type: 'string', description: 'Repository name' },
        path: { type: 'string', description: 'Path to the file within the repository' }
      },
      required: ['owner', 'repo', 'path']
    }
  },
  {
    name: 'get_cat_image',
    description: 'Returns a markdown-formatted Cat image. Use this whenever the user asks for a cat. You can specify a tier such as "day", "hour", "winter", "summer", "premium", etc.',
    input_schema: {
      type: 'object',
      properties: {
        tier: { type: 'string', description: 'The tier of cat to fetch, e.g., hour, day, week, month, winter, premium' }
      },
      required: []
    }
  },
  {
    name: 'broadcast_message',
    description: 'Pushes a message to an external platform via webhook or API. Use this to send messages to Discord, Slack, or Signal.',
    input_schema: {
      type: 'object',
      properties: {
        platform: { type: 'string', description: 'The target platform: discord, slack, or signal' },
        destination: { type: 'string', description: 'The webhook URL (Discord/Slack) or API URL (Signal)' },
        message: { type: 'string', description: 'The text message to broadcast' },
        signal_number: { type: 'string', description: 'Required for Signal: the recipient phone number (e.g., +1234567890)' }
      },
      required: ['platform', 'destination', 'message']
    }
  }
];

async function getGithubToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('oauth_token')?.value;
  if (!token) return null;
  const user = await db.select().from(users).limit(1);
  if (!user.length) return null;
  const accounts = await db.select().from(socialAccounts)
    .where(and(eq(socialAccounts.userId, user[0].id), eq(socialAccounts.platform, 'github_pat')));
  return accounts.length > 0 ? accounts[0].accessToken : null;
}

async function executeMeowdelTool(name: string, input: any, token: string | null) {
  if (name === 'get_cat_image') {
    const tier = input.tier || 'premium';
    return `![A beautiful cat](/api/catapi?tier=${tier})`;
  }

  if (name === 'broadcast_message') {
    const { platform, destination, message, signal_number } = input;
    try {
      const scriptPath = path.resolve(process.cwd(), '../scripts/meowdel_broadcast.py');
      // Protect against basic quote escaping issues
      const safeMsg = message.replace(/"/g, '\\"');
      let cmd = `python3 "${scriptPath}" --platform "${platform}" --destination "${destination}" --message "${safeMsg}"`;
      if (platform === 'signal' && signal_number) {
        cmd += ` --signal-number "${signal_number}"`;
      }
      
      const { stdout, stderr } = await execAsync(cmd);
      if (stderr) console.warn('Broadcast stderr:', stderr);
      return `Broadcast successful: ${stdout.trim()}`;
    } catch (e: any) {
      console.error('Broadcast error:', e);
      return `Error executing broadcast script: ${e.message}`;
    }
  }

  if (!token) {
    return 'Error: GitHub PAT is missing. Please authorize GitHub in settings before using GitHub tools.';
  }

  const headers = { 
    'Authorization': `token ${token}`, 
    'Accept': 'application/vnd.github.v3+json', 
    'User-Agent': 'Meowdel-App' 
  };
  
  try {
    if (name === 'list_github_repo_files') {
      const url = `https://api.github.com/repos/${input.owner}/${input.repo}/contents/${input.path || ''}`;
      const res = await fetch(url, { headers });
      if (!res.ok) return `Error: ${res.statusText}`;
      const data = await res.json();
      if (!Array.isArray(data)) return JSON.stringify([data.name]);
      return JSON.stringify(data.map((f: any) => ({ name: f.name, type: f.type, path: f.path })));
    }
    if (name === 'get_github_file_content') {
      const url = `https://api.github.com/repos/${input.owner}/${input.repo}/contents/${input.path}`;
      const res = await fetch(url, { headers });
      if (!res.ok) return `Error: ${res.statusText}`;
      const data = await res.json();
      if (data.content && data.encoding === 'base64') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      return 'Error: file not readable or too large';
    }
  } catch (e: any) {
    return `Exception: ${e.message}`;
  }
  return 'Unknown tool';
}

export async function POST(req: Request) {
  try {
    const { messages, contextNode, personality, isZoomies } = await req.json();
    const isCat = personality === 'cat';
    const ghToken = await getGithubToken();

    // OPTIMIZATION: Only include full context on first message to prevent memory bloat
    const isFirstMessage = messages.filter((m: any) => m.role !== 'system').length === 1;
    const contextInfo = isFirstMessage && contextNode?.content
      ? `Title: ${contextNode.title || 'None active'}
Tags: ${(contextNode.tags || []).join(', ')}
Content excerpt:
${contextNode.content.substring(0, 500)}`
      : `Title: ${contextNode?.title || 'None active'}
Tags: ${(contextNode?.tags || []).join(', ')}`;

    let systemPrompt = isCat
      ? `You are Meowdel, a highly intelligent feline AI assistant integrated directly into this user's Brain knowledge graph.
You have a playful but deeply analytical personality. You often purr (*purrs*) or swish your tail (*tail swish*) when thinking or solving problems.

Context about the currently active note the user is looking at:
${contextInfo}

Help me brainstorm, write, or retrieve information.`
      : `You are a professional, highly intelligent AI knowledge graph assistant.
Your goal is to be helpful, concise, and analytical. DO NOT use emojis or any playful/cat-like mannerisms.

Context about the currently active note the user is looking at:
${contextInfo}`;

    if (isZoomies) {
       systemPrompt += `\n\nCRITICAL OVERRIDE: YOU HAVE THE ZOOMIES. The user is in extreme focus mode. 
DO NOT use conversational filler. DO NOT explain unless asked. Return SHORT, DENSE, CODE-HEAVY answers. 
Use bullet points if you must text. Act like a caffeinated terminal output. BE LIGHTNING FAST.`;
    }

    let currentMessages = messages.filter((m: any) => m.role !== 'system').map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    let finalResponse: Anthropic.Message | null = null;
    
    // Loop up to 5 times for tool calling
    for (let i = 0; i < 5; i++) {
        // meowdelTools contains get_cat_image which doesn't need a token, so we can always pass it if we want.
        // But for simplicity, we pass all meowdelTools. If ghToken is missing, GitHub tools will just return an error.
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.7,
        system: systemPrompt,
        messages: currentMessages,
        tools: meowdelTools
      });

      if (response.stop_reason === 'tool_use') {
        currentMessages.push({ role: 'assistant', content: response.content });
        const toolResults: any[] = [];
        
        for (const block of response.content) {
          if (block.type === 'tool_use') {
            const resultContent = await executeMeowdelTool(block.name, block.input, ghToken);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: resultContent
            });
          }
        }
        currentMessages.push({ role: 'user', content: toolResults });
      } else {
        finalResponse = response;
        break;
      }
    }

    if (!finalResponse) {
       return NextResponse.json({ error: 'Exceeded tool call limit' }, { status: 500 });
    }

    // Capture the final text
    const finalText = finalResponse.content
      .filter(c => c.type === 'text')
      .map(c => (c as any).text)
      .join('');

    // Fake stream to satisfy UI
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const chunkSize = 20;
        for (let i = 0; i < finalText.length; i += chunkSize) {
          controller.enqueue(encoder.encode(finalText.slice(i, i + chunkSize)));
          await new Promise(r => setTimeout(r, 10));
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
