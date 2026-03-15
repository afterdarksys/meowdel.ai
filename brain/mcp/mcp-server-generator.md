---
tags:
  - #mcp-server
  - #architecture-blueprint
---
# 🔌 MCP Server Generator Blueprint

This document acts as the master template for generating new Model Context Protocol (MCP) servers for the Meowdel/AfterDark ecosystem.

## Core Philosophy

MCP Servers exist to extend context boundaries securely. They bridge the gap between autonomous agents and external/local systems (like a Postgres database, a local git repo, or a third-party API) by providing standardize `tools` and `resources`.

## Generation Checklist

When tasked with "Generate an MCP Server for X", agents must output the following structure:

1.  **Language Check:** Default to **TypeScript** utilizing the `@modelcontextprotocol/sdk`. (Python is acceptable only for heavy data science/ML wrappers).
2.  **Initialize:** `npm init -y` and install the SDK.
3.  **`index.ts` Boilerplate:**
    *   Initialize `Server` with name and version.
    *   Setup `StdioServerTransport`.
    *   Implement `CallToolRequestSchema` handler.
    *   Implement `ListToolsRequestSchema` handler.
    *   Implement `ListResourcesRequestSchema` handler (if the server exposes static/dynamic text blobs).

## Example Template: The Absolute Minimum

\`\`\`typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "example-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "example_tool",
        description: "Does something amazing",
        inputSchema: {
          type: "object",
          properties: {
            arg1: { type: "string" },
          },
          required: ["arg1"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "example_tool") {
    // Implement logic here
    return { content: [{ type: "text", text: "Success!" }] };
  }
  throw new Error("Tool not found");
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.log("Server running on stdio");
\`\`\`

## Review Instructions

Before declaring an MCP server "complete", the agent generating it must ensure:
1.  All errors are caught and returned gracefully as `text` blocks in the response, never crashing the stdio transport.
2.  `build` steps are clearly documented in a local `README.md`.
