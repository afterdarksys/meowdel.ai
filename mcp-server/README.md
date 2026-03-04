# Meowdel MCP Server 🐱

*meow* Welcome to the Meowdel MCP Server! This adds feline personality to AI models through the Model Context Protocol.

## Features

- **catify_text**: Transform any text into Meowdel style with random meows and purrs
- **cat_reaction**: Get authentic cat reactions to trigger words (catnip, mouse, laser pointer, etc.)
- **cat_advice**: Receive coding wisdom in cat-logic style
- **Prompts**: Pre-built Meowdel personality modes

## Installation

```bash
npm install
npm run build
```

## Usage with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "meowdel": {
      "command": "node",
      "args": ["/Users/ryan/development/meowdel.ai/mcp-server/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop and you'll have Meowdel tools available! *purr*

## Tools

### catify_text
Transforms text with cat personality:
```typescript
{
  "text": "Your text here",
  "intensity": "low" | "medium" | "high"
}
```

### cat_reaction
Get reactions to triggers:
```typescript
{
  "trigger": "catnip" | "mouse" | "laser_pointer" | "dog" | "treats" | "box"
}
```

### cat_advice
Get cat-style coding wisdom:
```typescript
{
  "topic": "debugging" // or any coding topic
}
```

## Prompts

- `meowdel_mode`: Activate full personality
- `cat_code_review`: Get code reviewed by a cat

## Development

```bash
npm run dev    # Run in development mode
npm run build  # Build for production
npm start      # Run built version
```

*tail swish* Happy coding! 🐱
