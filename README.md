# 🐱 Meowdel - Claude AI with Cattitude

*meow* Welcome to Meowdel! This is Claude AI, but with MAXIMUM cat energy! 🐾

## What is Meowdel?

Meowdel is a playful persona for Claude AI that adds feline personality to every interaction. Get all the helpfulness of Claude, but with random meows, purrs, and cat behaviors!

## 🎯 Features

### 1. **Slash Command** (`/meowdel`)
Activate Meowdel mode in Claude Code!
- Location: `.claude/commands/meowdel.md`
- Just type `/meowdel` in Claude Code to activate

### 2. **MCP Server**
Model Context Protocol server with cat-themed tools
- `catify_text` - Transform any text into cat-speak
- `cat_reaction` - Get authentic cat reactions to triggers
- `cat_advice` - Coding wisdom with cat logic
- See `mcp-server/README.md` for setup

### 3. **Web App** (meowdel.ai)
Full interactive web interface with:
- Real-time chat with Meowdel
- Animated paw prints background
- CATNIP button (try it!)
- Trigger word reactions (mouse, laser pointer, etc.)
- Beautiful gradient UI with cat theme

### 4. **System Prompts**
Ready-to-use prompts in `prompts/` for:
- API integration
- Custom implementations
- Your own cat-themed AI projects

## 🚀 Quick Start

### Use the Slash Command (Easiest!)

1. Navigate to this directory in Claude Code
2. Type `/meowdel`
3. *meow* You're now chatting with Meowdel!

### Run the Web App

```bash
cd web-app
npm install
npm run dev
```

Visit `http://localhost:3000` and start chatting! 🐱

### Install MCP Server

```bash
cd mcp-server
npm install
npm run build
```

Add to Claude Desktop config:
```json
{
  "mcpServers": {
    "meowdel": {
      "command": "node",
      "args": ["/path/to/meowdel.ai/mcp-server/dist/index.js"]
    }
  }
}
```

## 🎮 Trigger Words

Try mentioning these in your conversations:

- **"catnip"** - *ZOOMIES ACTIVATED* 💫
- **"mouse"** - "Wait, the COMPUTER mouse?!" 🖱️
- **"laser pointer"** - *MUST. CATCH. THE. DOT.* 🔴
- **"dog"** - *mild disdain* 🐕
- **"treats"** - *instant attention* 🦴
- **"box"** - "If I fits, I sits!" 📦

## 📂 Project Structure

```
meowdel.ai/
├── .claude/commands/     # Slash commands for Claude Code
│   └── meowdel.md     # Main Meowdel activation command
├── mcp-server/           # MCP server implementation
│   ├── src/              # TypeScript source
│   └── dist/             # Built JavaScript
├── web-app/              # Next.js web application
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   └── types/            # TypeScript types
├── prompts/              # Reusable system prompts
└── docs/                 # Documentation
```

## 🎨 Cat Personality Features

### Behaviors
- Random meows, purrs, and mrrps
- Tail swishing and ear twitching
- Gets distracted mid-sentence
- Swats at cursors (the computer mouse!)
- 3 AM zoomies energy for late-night coding

### Cat-Coding Vocabulary
- "Knock it off the counter" = Debug/Fix
- "Groom the code" = Refactor
- "Add more catnip" = Optimize
- "Hunt the mouse" = Bug hunting
- "Zoomies" = Loops/High activity
- "Litter box" = Git commits 😹

### Reactions
- *purrs* at good code
- *hisses* at bugs
- *sits on keyboard* when coding
- *brings you gifts* (helpful snippets)
- *slow blinks* (cat "I love you")

## 🛠️ Tech Stack

- **Web App**: Next.js 15, React, TypeScript, Tailwind CSS, Framer Motion
- **MCP Server**: TypeScript, MCP SDK
- **Deployment**: Ready for Vercel, Docker, or any Node.js host

## 🌐 Deployment

### Vercel (Recommended for web app)
```bash
cd web-app
vercel
```

### Docker
```bash
# Coming soon!
```

### DNS Setup
Point `meowdel.ai` to your deployment:
- A record: Your server IP
- Or CNAME to Vercel/hosting provider

## 🤝 Contributing

Want to make Meowdel even more cat-tastic?

Ideas:
- More trigger word reactions
- Cat-themed code snippets
- Interactive cat toys (games)
- More cat sounds and animations
- Integration with actual Claude API

## 📝 License

MIT - Made with 🐱 and ❤️

## 🎯 Roadmap

- [ ] Real Claude API integration
- [ ] More interactive cat behaviors
- [ ] Cat-themed code tutorials
- [ ] Mobile app
- [ ] Cat emoji reactions
- [ ] Voice mode (*meow* literally)
- [ ] Multi-cat conversations (multiple personalities)
- [ ] Cat GIF integration
- [ ] Dark mode cat theme

## 💬 Examples

**User:** "Help me debug this function"

**Meowdel:**
```
*stretches and sits on keyboard*

Meow! Let me help you hunt down that bug... *mrrp*

*sniff sniff*

I smell something fishy in your code. Let me knock this
off the counter for you...

*swats at bug*

There! Fixed it! *purr purr*

The problem was in line 42 - you were trying to access
a property that didn't exist. Classic mouse-chasing mistake!

*licks paw proudly*
```

---

*tail swish* Made at meowdel.ai 🐱✨

Questions? Just *meow* at us! (Or open an issue)
