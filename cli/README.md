# Meowdel CLI 🐱

Chat with your AI cat personalities from the terminal!

## Installation

```bash
cd cli
npm install
npm run build
npm link
```

## Configuration

Set your API key:

```bash
meowdel config YOUR_API_KEY
```

Get your API key from https://meowdel.ai/profile/api-keys

## Commands

### Interactive Chat

Start an interactive chat session:

```bash
meowdel chat
meowdel chat --personality luna
meowdel chat --brain  # Enable brain context
```

### Console Mode

Launch a rich terminal UI with chat interface:

```bash
meowdel console
meowdel console --personality professor
```

**Keyboard Shortcuts:**
- `Ctrl+S` or `Enter` - Send message
- `Shift+Enter` - New line
- `Ctrl+C` or `q` - Quit

### Ask a Question

Get a one-off answer:

```bash
meowdel ask "What's the weather like?"
meowdel ask "Explain quantum computing" --personality professor
meowdel ask "Search my notes" --brain --json
```

### Brain Operations

Query your knowledge graph:

```bash
# Search notes
meowdel brain search "project ideas"

# List all notes
meowdel brain list

# View graph stats
meowdel brain graph
```

### List Personalities

See available AI personalities:

```bash
meowdel personalities
```

Available personalities:
- `mittens` - Playful and friendly
- `luna` - Elegant and sophisticated
- `professor` - Scholarly and analytical
- `ninja` - Stealthy and mysterious
- `zoomies` - Hyper and energetic
- And 5 more!

## API Usage

The CLI uses the Meowdel REST API. You can also use it directly:

```bash
curl https://meowdel.ai/api/v1/chat \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello!",
    "personality": "mittens",
    "useBrainContext": false
  }'
```

## Examples

```bash
# Quick question
meowdel ask "What's 2+2?"

# Chat with brain context
meowdel chat --brain --personality professor

# Export conversation as JSON
meowdel ask "Explain AI" --json > response.json

# Search your notes
meowdel brain search "machine learning"
```

## Development

```bash
# Install dependencies
npm install

# Run in dev mode
npm run dev

# Build
npm run build

# Link for local testing
npm link
```

## Environment Variables

- `MEOWDEL_API_URL` - Override API base URL (default: https://meowdel.ai)
- `MEOWDEL_API_KEY` - Set API key via environment

## Troubleshooting

**401 Unauthorized**
- Make sure you've set your API key: `meowdel config YOUR_KEY`

**Connection refused**
- Check your internet connection
- Verify API URL is accessible: `curl https://meowdel.ai/api/health`

**Module not found**
- Rebuild the CLI: `npm run build && npm link`

## License

MIT - After Dark Systems, LLC
