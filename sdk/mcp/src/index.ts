#!/usr/bin/env node
/**
 * Meowdel MCP Server
 * Works with Claude Code, Cursor, Windsurf, Zed, and any MCP-compatible client.
 *
 * Install:
 *   npx meowdel-mcp
 *
 * Claude Code config (~/.claude/settings.json):
 *   {
 *     "mcpServers": {
 *       "meowdel": {
 *         "command": "npx",
 *         "args": ["-y", "meowdel-mcp"],
 *         "env": { "MEOWDEL_API_KEY": "mwdl_..." }
 *       }
 *     }
 *   }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js'

const API_KEY = process.env.MEOWDEL_API_KEY
const BASE_URL = (process.env.MEOWDEL_API_URL ?? 'https://meowdel.ai').replace(/\/$/, '')

if (!API_KEY) {
  process.stderr.write('MEOWDEL_API_KEY environment variable is required.\n')
  process.exit(1)
}

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'meowdel-mcp/1.0.0',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json() as Record<string, unknown>
  if (!res.ok) throw new Error(String(data.error ?? `HTTP ${res.status}`))
  return data
}

const server = new Server(
  { name: 'meowdel', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'meowdel_chat',
      description: 'Chat with Meowdel — the AI cat who codes. Gets context from your Brain knowledge base automatically.',
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Your message or question' },
          conversationHistory: {
            type: 'array',
            description: 'Previous messages for context',
            items: {
              type: 'object',
              properties: {
                role: { type: 'string', enum: ['user', 'assistant'] },
                content: { type: 'string' },
              },
              required: ['role', 'content'],
            },
          },
        },
        required: ['message'],
      },
    },
    {
      name: 'brain_search',
      description: 'Semantic search across all notes in the Meowdel Brain knowledge base.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          limit: { type: 'number', description: 'Max results (default 5)', default: 5 },
        },
        required: ['query'],
      },
    },
    {
      name: 'brain_list_notes',
      description: 'List notes in the Brain. Filter by tag.',
      inputSchema: {
        type: 'object',
        properties: {
          tag: { type: 'string', description: 'Filter by tag (optional)' },
          limit: { type: 'number', description: 'Max notes to return (default 20)', default: 20 },
        },
      },
    },
    {
      name: 'brain_get_note',
      description: 'Get a specific note by slug.',
      inputSchema: {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'Note slug' },
        },
        required: ['slug'],
      },
    },
    {
      name: 'brain_create_note',
      description: 'Create a new note in the Brain knowledge base.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Note title' },
          content: { type: 'string', description: 'Note content in Markdown' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Tags for the note' },
        },
        required: ['title', 'content'],
      },
    },
    {
      name: 'brain_run_workflow',
      description: 'Run a Ruflo-style multi-agent workflow on a task. Modes: auto, analyze, organize, synthesize, deep_dive.',
      inputSchema: {
        type: 'object',
        properties: {
          input: { type: 'string', description: 'The task or question for the agents' },
          mode: {
            type: 'string',
            enum: ['auto', 'analyze', 'organize', 'synthesize', 'deep_dive'],
            description: 'Swarm mode (default: auto)',
            default: 'auto',
          },
          context: { type: 'string', description: 'Additional context (optional)' },
        },
        required: ['input'],
      },
    },
    {
      name: 'code_review_scan',
      description: 'Scan a GitHub repo with code-review-graph. Builds a structural dependency graph (~8x token savings). Optionally saves results to Brain.',
      inputSchema: {
        type: 'object',
        properties: {
          repoUrl: { type: 'string', description: 'GitHub repo URL (e.g. https://github.com/owner/repo)' },
          saveAsNote: { type: 'boolean', description: 'Save analysis as a Brain note', default: true },
        },
        required: ['repoUrl'],
      },
    },
  ],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params
  const a = args as Record<string, unknown>

  try {
    switch (name) {
      case 'meowdel_chat': {
        const data = await api('POST', '/chat', {
          message: a.message,
          conversationHistory: a.conversationHistory ?? [],
        })
        return { content: [{ type: 'text', text: String(data.message) }] }
      }

      case 'brain_search': {
        const data = await api('POST', '/brain/search', { query: a.query, limit: a.limit ?? 5 })
        const results = Array.isArray(data) ? data : (data.results ?? [])
        if (!results.length) return { content: [{ type: 'text', text: 'No matching notes found.' }] }
        const text = (results as Array<{ title?: string; summary?: string; score?: number; slug?: string }>)
          .map((r, i) => `${i + 1}. **${r.title}** (score: ${(Number(r.score ?? 0) * 100).toFixed(0)}%)\n   ${r.summary ?? ''}\n   Slug: \`${r.slug}\``)
          .join('\n\n')
        return { content: [{ type: 'text', text }] }
      }

      case 'brain_list_notes': {
        const params = new URLSearchParams()
        if (a.tag) params.set('tag', String(a.tag))
        if (a.limit) params.set('limit', String(a.limit))
        const data = await api('GET', `/brain/notes?${params}`)
        const notes = Array.isArray(data) ? data : []
        if (!notes.length) return { content: [{ type: 'text', text: 'No notes found.' }] }
        const text = (notes as Array<{ title?: string; slug?: string; tags?: string[]; updatedAt?: string }>)
          .map(n => `- **${n.title}** (\`${n.slug}\`) [${(n.tags ?? []).join(', ')}] — ${n.updatedAt ? new Date(n.updatedAt).toLocaleDateString() : ''}`)
          .join('\n')
        return { content: [{ type: 'text', text }] }
      }

      case 'brain_get_note': {
        const data = await api('GET', `/brain/notes?limit=100`)
        const notes = Array.isArray(data) ? data : []
        const note = (notes as Array<{ slug?: string; title?: string; content?: string }>)
          .find(n => n.slug === a.slug)
        if (!note) return { content: [{ type: 'text', text: `Note \`${a.slug}\` not found.` }] }
        return { content: [{ type: 'text', text: `# ${note.title}\n\n${note.content}` }] }
      }

      case 'brain_create_note': {
        const data = await api('POST', '/brain/notes', {
          title: a.title,
          content: a.content,
          tags: a.tags ?? [],
        })
        const note = data as { slug?: string; title?: string }
        return { content: [{ type: 'text', text: `Note created: **${note.title}** (\`${note.slug}\`)` }] }
      }

      case 'brain_run_workflow': {
        const data = await api('POST', '/brain/workflow', {
          input: a.input,
          mode: a.mode ?? 'auto',
          context: a.context,
        })
        const result = data as { summary?: string; agents?: Record<string, unknown>; mode?: string }
        let text = `**Workflow complete** (mode: ${result.mode ?? a.mode ?? 'auto'})\n\n`
        if (result.summary) text += result.summary
        else text += JSON.stringify(data, null, 2)
        return { content: [{ type: 'text', text }] }
      }

      case 'code_review_scan': {
        const data = await api('POST', '/code-review', {
          repoUrl: a.repoUrl,
          saveAsNote: a.saveAsNote ?? true,
        })
        const r = data as { repoOwner?: string; repoName?: string; nodeCount?: number; edgeCount?: number; fileCount?: number; estimatedTokenSavings?: number; summaryText?: string; brainNoteId?: string }
        let text = `**Code graph built for ${r.repoOwner}/${r.repoName}**\n`
        text += `- ${r.fileCount} files, ${r.nodeCount} nodes, ${r.edgeCount} edges\n`
        if (r.estimatedTokenSavings) text += `- Estimated token savings: ~${(r.estimatedTokenSavings / 1000).toFixed(0)}k tokens\n`
        if (r.brainNoteId) text += `- Saved to Brain: \`${r.brainNoteId}\`\n`
        if (r.summaryText) text += `\n${r.summaryText}`
        return { content: [{ type: 'text', text }] }
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new McpError(ErrorCode.InternalError, msg)
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  process.stderr.write('Meowdel MCP server running — *purr*\n')
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err}\n`)
  process.exit(1)
})
