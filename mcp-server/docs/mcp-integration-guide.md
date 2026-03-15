# 🧠 Meowdel Brain MCP Integration Guide

The Meowdel Brain Vault (`/brain/knowledge`) is fully exposed via the open **Model Context Protocol (MCP)**. This allows any modern AI client to securely read your markdown architecture tomes and adapt to your specific engineering, DevOps, and accessibility standards.

This guide covers how to connect the Brain Vault to popular AI tools and how to build programmatic pipelines.

---

## 1. Local Clients

### Claude Desktop Integration
To grant the official Claude Desktop app for Mac native access to the Brain Vault, update your Claude configuration file.

**File Location:** `~/Library/Application Support/Claude/claude_desktop_config.json`

Add the `meowdel-brain` server to the `mcpServers` object:

```json
{
  "mcpServers": {
    "meowdel-brain": {
      "command": "node",
      "args": [
        "YOUR_ABSOLUTE_PATH_TO/meowdel.ai/mcp-server/dist/index.js"
      ]
    }
  }
}
```
*Note: You must restart Claude Desktop after saving the file. Once loaded, click the "Plug" icon in the chat bar to verify the Brain Vault tools are connected.*

### Claude Code (CLI) Integration
If you are using Anthropic's terminal-based `claude-code`, you can attach the Brain Vault instantly.

Run this command inside your terminal:
```bash
claude mcp add meowdel-brain -- node YOUR_ABSOLUTE_PATH_TO/meowdel.ai/mcp-server/dist/index.js
```

---

## 2. IDE Integration

### Cursor IDE
Cursor natively supports MCP servers, allowing the AI autocomplete and Composer to read your `coding-architecture.md` rules instantly.

1. Open Cursor Settings (Cmd + ,)
2. Navigate to **Features** -> **MCP**
3. Click **+ Add New MCP Server**
4. Configure as follows:
   - **Type:** `command`
   - **Name:** `Meowdel Brain`
   - **Command:** `node YOUR_ABSOLUTE_PATH_TO/meowdel.ai/mcp-server/dist/index.js`
5. Click **Save** and verify the green "Connected" dot appears.

---

## 3. Programmatic SDK Integration (OpenAI, Gemini, Custom Agents)

Because APIs like OpenAI (ChatGPT / Codex) and Google Gemini do not have "Desktop Apps" that parse MCP out of the box, you must act as the "Client Broker". 

You do this using the official `@modelcontextprotocol/sdk`. Here is a complete TypeScript example of securely fetching the Brain tools and passing them to OpenAI.

### Install Dependencies
```bash
npm install @modelcontextprotocol/sdk openai
```

### Integration Code (`mcp-proxy.ts`)
```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from "openai";

async function runAIAgent() {
  // 1. Connect to the Meowdel Brain via StdIO
  const transport = new StdioClientTransport({
    command: "node",
    args: ["/absolute/path/to/meowdel.ai/mcp-server/dist/index.js"]
  });

  const client = new Client({ name: "my-custom-agent", version: "1.0.0" });
  await client.connect(transport);

  // 2. Fetch all tools exposed by the Brain Vault
  const { tools } = await client.listTools();

  // 3. Convert MCP Tools into OpenAI Function Calling format
  const openaiTools = tools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
    },
  }));

  // 4. Initialize OpenAI
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // 5. Send Prompt + Tools to OpenAI
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [{ role: "user", content: "What are our internal Devops Standards?" }],
    tools: openaiTools, // Give ChatGPT the powers of the Brain
    tool_choice: "auto",
  });

  // 6. Handle the Tool Call Response
  const message = response.choices[0].message;
  
  if (message.tool_calls) {
    for (const toolCall of message.tool_calls) {
      // Execute the Brain Tool locally on behalf of ChatGPT
      console.log(`ChatGPT executed: ${toolCall.function.name}`);
      const result = await client.callTool({
        name: toolCall.function.name,
        arguments: JSON.parse(toolCall.function.arguments)
      });
      console.log("Brain Vault Content Data:", result.content);
      
      // (Optional) Feed the Brain knowledge back into ChatGPT for the final answer!
    }
  }
}

runAIAgent().catch(console.error);
```

---

## 4. Specific Monetization / Pipeline Use Cases

By exposing the Brain via MCP, After Dark Systems can build powerful internal CI/CD tooling or monetize the vault for B2B customers.

### Use Case A: Automated PR Review Pipeline (GitHub Actions)
You can hook the MCP Server up to an AI Action in your CI/CD pipeline. 
When a developer opens a Pull Request modifying a Frontend React file, the AI Agent connects to the Brain MCP, executes `read_brain_document("knowledge/accessibility-standards.md")`, and automatically scans the PR to ensure ARIA tags and semantic HTML rules are enforced.

### Use Case B: B2B "Vault Subscription" (Monetization)
Since the Brain Vault operates over standard APIs, you can provision remote access.
A B2B client subscribes to the "After Dark Architecture Vault" via Stripe. You generate an API Key. Their custom internal AI tools query your externally hosted `api/brain/search` endpoints (wrapped in the same MCP standard logic) to ensure their own developers are coding according to Meowdel's premium, certified architectural standards.
