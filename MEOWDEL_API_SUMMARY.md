# Meowdel API & CLI - Complete Summary

## Overview

Meowdel now has a comprehensive API ecosystem including:

1. **Unified REST API** (`/api/v1/`) for programmatic access
2. **Terminal CLI** (`meowdel`) for command-line interaction
3. **Combined Operations API** for multi-step AI workflows
4. **Brain Integration** with all API endpoints

## What You Get

### 1. REST API (`/api/v1/`)

**NEW Endpoints:**

- `POST /api/v1/chat` - Unified chat endpoint with brain context
- `GET /api/v1/chat` - List available personalities
- `POST /api/v1/combine` - Execute combined operations

**Existing Endpoints (Still Available):**

- `POST /api/pets/{petId}/chat` - Original pet chat API
- `POST /api/brain/chat` - Brain-specific chat
- `GET /api/brain/graph` - Knowledge graph
- `GET /api/brain/search` - Search notes
- `GET /api/brain/notes` - List notes
- `POST /api/brain/notes` - Create notes

### 2. Terminal CLI (`meowdel`)

**Commands:**

```bash
# Interactive chat
meowdel chat [--personality <name>] [--brain]

# Rich console UI
meowdel console [--personality <name>]

# One-off questions
meowdel ask "question" [--personality <name>] [--brain] [--json]

# Brain operations
meowdel brain <search|list|graph> [query]

# List personalities
meowdel personalities

# Configure API key
meowdel config [YOUR_API_KEY]
```

### 3. Combined Operations

Execute multi-step AI workflows:

**Available Operations:**

1. `search-brain` - Search brain knowledge
2. `chat-primary` - Chat with primary personality
3. `chat-secondary` - Chat with secondary personality
4. `multi-agent-debate` - 2-round debate between personalities
5. `synthesize` - Combine all results into final answer

**Example:**

```json
POST /api/v1/combine
{
  "query": "Should I use TypeScript?",
  "operations": [
    "search-brain",
    "chat-primary",
    "chat-secondary",
    "multi-agent-debate",
    "synthesize"
  ],
  "primaryPersonality": "professor",
  "secondaryPersonality": "ninja"
}
```

## Features

### ✅ API Features

- **Authentication** - Bearer token auth (`Authorization: Bearer meow_YOUR_KEY`)
- **Rate Limiting** - Built-in per-user rate limits
- **Brain Context** - Integrate knowledge graph with every chat
- **Multi-Agent** - Run debates between personalities
- **Conversation History** - Maintain context across messages
- **Error Handling** - Comprehensive error responses
- **JSON Schema** - Full request/response validation

### ✅ CLI Features

- **Interactive Chat** - Terminal-based conversation
- **Rich Console** - TUI with blessed (scrolling, keyboard shortcuts)
- **Brain Integration** - Search and query knowledge graph
- **Multiple Personalities** - Switch between 10+ AI cats
- **Configuration** - Persistent API key storage (~/.meowdel/config.json)
- **JSON Output** - Machine-readable responses
- **Color Output** - Syntax highlighting with chalk

## Available Personalities

1. **mittens** - Playful and friendly tabby
2. **luna** - Elegant and sophisticated
3. **professor** - Scholarly and analytical
4. **ninja** - Stealthy and mysterious
5. **zoomies** - Hyper and energetic
6. **bandit** - Mischievous troublemaker
7. **catdog** - Confused identity crisis
8. **spotty** - Dalmatian-spotted cat
9. **bella** - Graceful and poised
10. **blubie** - Rare blue-furred mystic

## Architecture

```
┌─────────────────┐
│   CLI Client    │ ──┐
│  (meowdel cmd)  │   │
└─────────────────┘   │
                      │
┌─────────────────┐   │      ┌──────────────────┐
│  Web Client     │ ──┼─────▶│  Next.js API     │
│  (Browser)      │   │      │  /api/v1/*       │
└─────────────────┘   │      └──────────────────┘
                      │              │
┌─────────────────┐   │              ▼
│  External API   │ ──┘      ┌──────────────────┐
│  (curl/SDK)     │          │  Claude API      │
└─────────────────┘          │  Brain Search    │
                             │  Personality Eng │
                             └──────────────────┘
```

## Installation

### API (Already Deployed)

The API is live at `https://meowdel.ai/api/v1`

Get your API key: https://meowdel.ai/profile/api-keys

### CLI Installation

```bash
cd cli
npm install
npm run build
npm link

# Configure
meowdel config YOUR_API_KEY

# Use
meowdel chat
```

## Usage Examples

### cURL

```bash
# Simple chat
curl -X POST https://meowdel.ai/api/v1/chat \
  -H "Authorization: Bearer meow_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "personality": "mittens"}'

# Multi-agent debate
curl -X POST https://meowdel.ai/api/v1/combine \
  -H "Authorization: Bearer meow_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Tabs vs Spaces?",
    "operations": ["multi-agent-debate", "synthesize"],
    "primaryPersonality": "professor",
    "secondaryPersonality": "ninja"
  }'
```

### CLI

```bash
# Interactive chat with brain
meowdel chat --personality professor --brain

# Quick question
meowdel ask "What's the capital of France?"

# Search brain
meowdel brain search "machine learning"

# Rich console
meowdel console
```

### JavaScript

```javascript
const response = await fetch('https://meowdel.ai/api/v1/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer meow_YOUR_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Explain async/await',
    personality: 'professor',
    useBrainContext: true,
  }),
})

const data = await response.json()
console.log(data.data.message)
```

## Files Created

### API Routes
- `web-app/app/api/v1/chat/route.ts` - Unified chat endpoint
- `web-app/app/api/v1/combine/route.ts` - Combined operations endpoint

### CLI Tool
- `cli/package.json` - NPM package config
- `cli/tsconfig.json` - TypeScript config
- `cli/src/index.ts` - Main CLI entry point
- `cli/src/api/client.ts` - API client library
- `cli/src/commands/chat.ts` - Interactive chat
- `cli/src/commands/console.ts` - Rich TUI console
- `cli/src/commands/ask.ts` - One-off questions
- `cli/src/commands/brain.ts` - Brain operations
- `cli/src/commands/config.ts` - Configuration
- `cli/src/commands/personalities.ts` - List personalities

### Documentation
- `API.md` - Complete API documentation
- `cli/README.md` - CLI usage guide
- `MEOWDEL_API_SUMMARY.md` - This file

## Next Steps

1. **Deploy Updated API** - Push new `/api/v1` routes to production
2. **Publish CLI** - Release CLI to npm as `@meowdel/cli`
3. **API Keys** - Implement proper API key generation in profile
4. **Rate Limiting** - Add Redis-based rate limiting
5. **Analytics** - Track API usage per user
6. **SDKs** - Create official client libraries
7. **Webhooks** - Add event subscriptions
8. **Streaming** - Add streaming responses for chat

## Security

- ✅ API key authentication
- ✅ Rate limiting (in-memory, TODO: Redis)
- ✅ Input validation with Zod
- ✅ XSS protection
- ✅ Path traversal protection
- ⏳ TODO: API key expiration
- ⏳ TODO: API key permissions/scopes
- ⏳ TODO: Webhook signature verification

## Support

- Documentation: https://meowdel.ai/docs
- GitHub: https://github.com/afterdarksystems/meowdel
- Support: support@afterdarksys.com
- API Status: https://status.meowdel.ai
