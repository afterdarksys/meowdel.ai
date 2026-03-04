# 🚀 Meowdel Quick Start Guide

*meow* Let's get you up and running with Meowdel! 🐱

## Fastest Way to Try Meowdel (30 seconds)

### Option 1: Slash Command in Claude Code

1. Open this project in Claude Code
2. Type `/meowdel` in the chat
3. *purr* You're now talking to Meowdel!

### Option 2: Run the Web App Locally

```bash
cd ~/development/meowdel.ai/web-app
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and start chatting!

## What Can Meowdel Do?

### Trigger Words
Try saying these in your conversations:

- **"catnip"** - Watch Meowdel go WILD! *ZOOOOM*
- **"mouse"** - "Wait, the COMPUTER mouse?!" 🖱️
- **"laser pointer"** - *pounce pounce pounce*
- **"treats"** - Instant attention! 🦴

### Cat-Style Responses

Meowdel will:
- Randomly meow and purr
- Get distracted mid-sentence
- Swat at things
- Give you actual helpful advice (with cat energy!)
- Use cat metaphors for coding concepts

## Installation Options

### 1. Use as Slash Command (Recommended for Claude Code users)

Already works! Just navigate to this directory and use `/meowdel`

### 2. Install MCP Server

Add cat-themed tools to Claude Desktop:

```bash
cd mcp-server
npm install
npm run build
```

Then add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

Restart Claude Desktop!

### 3. Deploy the Web App

```bash
./deploy.sh
```

Follow the prompts to deploy to Vercel or Docker!

## Examples

**You:** "Help me fix this bug"

**Meowdel:**
```
*stretches*

Meow! Let me hunt down that bug for you... *mrrp*

*gets into pounce position*

Okay, I found it! The issue is in line 42. You're trying to
access a property that doesn't exist. Let me knock that bug
off the counter for you!

*swats*

There! Fixed! *purr* 🐱
```

**You:** "What's the best way to optimize this code?"

**Meowdel:**
```
*licks paw thoughtfully*

Good question! Let me think while I groom...

*thinking*

You know what? This code needs more catnip (optimization)!

Here's what I'd suggest:
1. Cache those repeated calculations
2. Use memoization for the expensive functions
3. Maybe add some lazy loading?

*tail swish*

Try those and your code will be ZOOMING like me at 3 AM! 😸
```

## Next Steps

- Read the full [README.md](../README.md) for all features
- Check out [EXAMPLES.md](./EXAMPLES.md) for more interactions
- Explore the source code to customize Meowdel
- Deploy to meowdel.ai!

## Troubleshooting

**Web app won't start?**
```bash
cd web-app
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**MCP server not showing in Claude Desktop?**
- Check the config file path
- Make sure you ran `npm run build`
- Restart Claude Desktop completely
- Check the logs in Claude Desktop > Settings > Developer

**Slash command not working?**
- Make sure you're in the right directory
- The `.claude/commands/` folder should be present
- Try `/help` to see all available commands

---

*purr* Happy coding with Meowdel! 🐱✨

Questions? Just meow at us! (Or check the docs)
