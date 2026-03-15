# Meowdel API Documentation

Meowdel provides a comprehensive REST API for AI chat, brain knowledge management, and combined operations.

## Base URL

```
https://meowdel.ai/api/v1
```

## Authentication

All API requests require an API key sent in the Authorization header:

```bash
Authorization: Bearer meow_YOUR_API_KEY
```

Get your API key at: https://meowdel.ai/profile/api-keys

## Rate Limits

- **Free tier**: 20 requests/minute
- **Pro tier**: 100 requests/minute
- **Enterprise**: Custom limits

## Endpoints

### POST /v1/chat

Chat with AI personalities with optional brain context.

**Request:**

```json
{
  "message": "Tell me about quantum computing",
  "personality": "professor",
  "useBrainContext": true,
  "conversationHistory": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi there!" }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Quantum computing is...",
    "personality": {
      "id": "professor",
      "name": "Professor Whiskers"
    },
    "brainContext": [
      { "id": "quantum-notes", "relevance": 0.95 }
    ],
    "usage": {
      "inputTokens": 150,
      "outputTokens": 450
    },
    "timestamp": "2026-03-15T12:00:00Z"
  }
}
```

### GET /v1/chat

List available personalities.

**Response:**

```json
{
  "success": true,
  "data": {
    "personalities": [
      {
        "id": "mittens",
        "name": "Mittens",
        "breed": "Tabby",
        "personality": "Playful and friendly",
        "greeting": "Meow! Ready to code together? *purrs*"
      }
    ]
  }
}
```

### POST /v1/combine

Execute combined operations in sequence.

**Operations:**
- `search-brain` - Search brain for relevant context
- `chat-primary` - Chat with primary personality
- `chat-secondary` - Chat with secondary personality
- `multi-agent-debate` - Run 2-round debate between personalities
- `synthesize` - Synthesize all results into final answer

**Request:**

```json
{
  "query": "Should I use TypeScript or JavaScript?",
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

**Response:**

```json
{
  "success": true,
  "data": {
    "query": "Should I use TypeScript or JavaScript?",
    "operations": [
      {
        "operation": "search-brain",
        "success": true,
        "result": {
          "found": 3,
          "snippets": [...]
        },
        "startedAt": "2026-03-15T12:00:00Z",
        "completedAt": "2026-03-15T12:00:01Z"
      },
      {
        "operation": "chat-primary",
        "success": true,
        "result": {
          "personality": "Professor Whiskers",
          "response": "TypeScript provides...",
          "tokens": { "inputTokens": 200, "outputTokens": 400 }
        }
      },
      {
        "operation": "multi-agent-debate",
        "success": true,
        "result": {
          "rounds": [
            {
              "round": 1,
              "Professor Whiskers": "TypeScript is superior because...",
              "Shadow (Ninja)": "JavaScript offers more flexibility..."
            },
            {
              "round": 2,
              "Professor Whiskers": "I see your point about flexibility...",
              "Shadow (Ninja)": "Fair point on type safety..."
            }
          ]
        }
      },
      {
        "operation": "synthesize",
        "success": true,
        "result": {
          "synthesis": "Based on the debate and brain knowledge, here's a balanced view: ...",
          "tokens": { "inputTokens": 800, "outputTokens": 600 }
        }
      }
    ],
    "timestamp": "2026-03-15T12:00:10Z"
  }
}
```

## Brain API

### GET /api/brain/search

Search brain knowledge.

```bash
GET /api/brain/search?q=machine+learning
```

### GET /api/brain/graph

Get knowledge graph.

```bash
GET /api/brain/graph
```

**Response:**

```json
{
  "nodes": [
    { "id": "ml-intro", "name": "Machine Learning Intro", "connections": 5 }
  ],
  "links": [
    { "source": "ml-intro", "target": "neural-networks" }
  ]
}
```

### GET /api/brain/notes

List all notes.

### POST /api/brain/notes

Create a new note.

```json
{
  "title": "My Note",
  "content": "# My Note\n\nContent here",
  "tags": ["ai", "learning"]
}
```

## Existing Pet API

For backward compatibility, the original pet API remains available:

```bash
POST /api/pets/{petId}/chat
GET /api/pets/{petId}
```

## Error Responses

**400 Bad Request:**

```json
{
  "error": "Invalid request",
  "details": [
    { "field": "message", "message": "Message cannot be empty" }
  ]
}
```

**401 Unauthorized:**

```json
{
  "error": "Invalid or missing API key",
  "message": "Include header: Authorization: Bearer meow_YOUR_KEY"
}
```

**404 Not Found:**

```json
{
  "error": "Personality 'invalid' not found",
  "availablePersonalities": ["mittens", "luna", "professor", ...]
}
```

**429 Rate Limit:**

```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

**500 Internal Server Error:**

```json
{
  "error": "Internal server error",
  "details": "Error message here"
}
```

## Example Usage

### cURL

```bash
# Chat request
curl -X POST https://meowdel.ai/api/v1/chat \
  -H "Authorization: Bearer meow_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello!",
    "personality": "mittens"
  }'

# Combined operations
curl -X POST https://meowdel.ai/api/v1/combine \
  -H "Authorization: Bearer meow_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Explain recursion",
    "operations": ["search-brain", "chat-primary", "synthesize"],
    "primaryPersonality": "professor"
  }'
```

### JavaScript/TypeScript

```typescript
const response = await fetch('https://meowdel.ai/api/v1/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer meow_YOUR_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Hello!',
    personality: 'mittens',
    useBrainContext: false,
  }),
})

const data = await response.json()
console.log(data.data.message)
```

### Python

```python
import requests

response = requests.post(
    'https://meowdel.ai/api/v1/chat',
    headers={'Authorization': 'Bearer meow_YOUR_KEY'},
    json={
        'message': 'Hello!',
        'personality': 'mittens',
    }
)

data = response.json()
print(data['data']['message'])
```

## Webhooks (Coming Soon)

Subscribe to events:
- `chat.completed`
- `brain.note.created`
- `brain.note.updated`

## SDKs

Official SDKs coming soon for:
- JavaScript/TypeScript
- Python
- Go
- Ruby

## Support

- Documentation: https://meowdel.ai/docs
- API Status: https://status.meowdel.ai
- Support: support@afterdarksys.com
