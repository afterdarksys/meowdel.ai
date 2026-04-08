# Meowdel CLI - Chat with the Cat Who Codes! 🐱

A command-line interface to chat with Meowdel, your AI assistant cat with maximum coding energy!

## Features

- **Interactive Chat Mode**: Have ongoing conversations with Meowdel
- **Single-Shot Mode**: Ask quick questions and get instant answers
- **Brain Vault Integration**: Meowdel searches your `/brain` knowledge base for context
- **Streaming Responses**: Watch Meowdel type responses in real-time
- **Conversation History**: Keep track of your chats within a session
- **Auto-Save**: Conversations are automatically saved when you exit
- **Syntax Highlighting**: Beautiful code formatting in the terminal

## Installation

### 1. Install Dependencies

```bash
pip3 install -r requirements-cli.txt
```

This installs:
- `anthropic` - Claude API client
- `rich` - Beautiful terminal formatting

### 2. Set Your API Key

Get your Anthropic API key from https://console.anthropic.com/

```bash
export ANTHROPIC_API_KEY='your-api-key-here'
```

Add it to your `~/.zshrc` or `~/.bashrc` to make it permanent:

```bash
echo 'export ANTHROPIC_API_KEY="your-api-key-here"' >> ~/.zshrc
source ~/.zshrc
```

### 3. Make It Globally Accessible (Optional)

Option A - Symlink to your PATH:
```bash
ln -s /Users/ryan/development/meowdel.ai/meowdel /usr/local/bin/meowdel
```

Option B - Add to PATH:
```bash
echo 'export PATH="/Users/ryan/development/meowdel.ai:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Now you can run `meowdel` from anywhere!

## Usage

### Interactive Mode

Just run the command without arguments:

```bash
./meowdel
# or if installed globally:
meowdel
```

You'll see:
```
┌──────────────────────────────────────────┐
│ Meowdel - Interactive Mode               │
│ *purrs* Ready to help!                   │
│                                          │
│ Commands: /save, /history, /clear, /exit│
└──────────────────────────────────────────┘

You>
```

### Single-Shot Mode

Ask a single question:

```bash
./meowdel "How do I fix this TypeScript error?"
./meowdel "Explain async/await in JavaScript"
./meowdel "Review this code: const x = () => { ... }"
```

### Interactive Commands

While in interactive mode, you can use these commands:

- `/exit` or `/quit` - Exit the chat (auto-saves conversation)
- `/save` - Save current conversation manually
- `/clear` - Clear conversation history
- `/history` - Show number of messages in current session

### Brain Vault Integration

Meowdel automatically searches your `/brain/knowledge/` directory for relevant context when you ask questions. For example:

```bash
You> How do we handle accessibility in this project?
```

Meowdel will:
1. Search for "accessibility" in your Brain vault
2. Find relevant files like `accessibility-standards.md`
3. Inject that context into the conversation
4. Give you an answer based on your project's standards

*sniffs through the Brain vault archives* 🐱

## Conversation History

All conversations are auto-saved to:
```
~/.meowdel/history/meowdel-chat-YYYYMMDD-HHMMSS.json
```

You can load a previous conversation:

```bash
./meowdel --load ~/.meowdel/history/meowdel-chat-20260315-143022.json
```

## Examples

### Quick Question
```bash
$ ./meowdel "What's the difference between let and const?"

┌─────────────────────────────────────┐
│ Meowdel - The Cat Who Codes         │
│ *meow*                              │
└─────────────────────────────────────┘

Meowdel:
*perks up ears* Great question! *sits down to explain*

`let` and `const` are both block-scoped, but:
...
```

### Interactive Session
```bash
$ ./meowdel

You> I have a bug in my React component
Meowdel: *ears perk up* A bug! *swats at it* Let me help you debug! What's the error message? *purrs helpfully*

You> TypeError: Cannot read property 'map' of undefined
Meowdel: Ah! *tail swish* Classic undefined array issue. Let me dig through the Brain vault... *sniffs around*
...

You> /save
✓ Saved to: /Users/ryan/.meowdel/history/meowdel-chat-20260315-143530.json

You> /exit
*waves paw goodbye* Meow! 👋

Auto-saved conversation to: /Users/ryan/.meowdel/history/meowdel-chat-20260315-143530.json
```

## Customization

### Modify Meowdel's Personality

Edit the system prompt at:
```
prompts/meowdel-system-prompt.md
```

### Configure Brain Vault Location

The script automatically looks for brain files at:
```
/Users/ryan/development/meowdel.ai/brain/knowledge/
```

## Troubleshooting

### "ANTHROPIC_API_KEY environment variable not set"

Make sure you've exported your API key:
```bash
export ANTHROPIC_API_KEY='your-key-here'
```

### Brain Vault Not Found

Make sure the `/brain/knowledge/` directory exists in your project:
```bash
mkdir -p /Users/ryan/development/meowdel.ai/brain/knowledge
```

### Import Errors

Make sure you've installed the requirements:
```bash
pip3 install -r requirements-cli.txt
```

## Tips

1. **Use descriptive questions** - The better your question, the better Meowdel can search the Brain vault
2. **Save important conversations** - Use `/save` during the chat or let it auto-save on exit
3. **Chain questions** - In interactive mode, Meowdel remembers your conversation context
4. **Brain-specific queries** - Ask about topics covered in your Brain vault for the most accurate answers

## Meowdel Says...

*purrs* Happy coding! If you find a bug, I'll swat it right off the counter for you! 🐱

*meow*
