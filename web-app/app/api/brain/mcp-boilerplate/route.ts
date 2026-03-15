import { NextResponse } from 'next/server'
import * as fs from 'fs/promises'
import * as path from 'path'

export async function POST(req: Request) {
  try {
    const { pluginName } = await req.json()
    
    if (!pluginName) {
      return NextResponse.json({ error: 'Plugin name required' }, { status: 400 })
    }

    const slug = pluginName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const boilerplate = `
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "${slug}-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools here
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "example_tool",
        description: "An example tool definition.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      }
    ],
  };
});

// Implement tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "example_tool") {
     return {
         content: [{ type: "text", text: "Tool executed successfully." }]
     };
  }
  throw new McpError(ErrorCode.MethodNotFound, "Unknown tool");
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("${slug} MCP server running on stdio");
}

main().catch(console.error);
`
    // In a real app we'd write this to a specific directory or return it
    // For now we'll write it to local tmp folder just to demonstrate
    const outPath = path.join(process.cwd(), 'tmp', `${slug}-server.ts`)
    await fs.mkdir(path.dirname(outPath), { recursive: true })
    await fs.writeFile(outPath, boilerplate.trim())

    return NextResponse.json({ success: true, path: outPath, code: boilerplate.trim() })
  } catch (error) {
    console.error('MCP Generate failed', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
