import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";

// The Brain directory is located assuming we are running from meowdel.ai/mcp-server/dist
const BRAIN_DIR = path.resolve(process.cwd(), '../brain');

const server = new Server(
  { name: "meowdel-brain", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {} } }
);

/**
 * Helper to recursively map the directory structure
 */
function walk(dir: string, results: string[] = []) {
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      walk(filePath, results);
    } else if (file.endsWith('.md')) {
      results.push(filePath);
    }
  });
  return results;
}

// 1. Expose MCP Resources (making the brain files directly readable)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    try {
        const files = walk(BRAIN_DIR);
        const resources = files.map(file => {
            const relPath = path.relative(BRAIN_DIR, file);
            return {
                uri: `brain://${relPath.replace(/\\/g, '/')}`,
                name: path.basename(file),
                mimeType: "text/markdown",
                description: `Knowledge vault document: ${relPath}`
            };
        });
        return { resources };
    } catch (e) {
        return { resources: [] };
    }
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    if (!uri.startsWith('brain://')) {
        throw new Error("Invalid URI protocol. Must be brain://");
    }

    const relPath = uri.replace('brain://', '');
    const absolutePath = path.join(BRAIN_DIR, relPath);

    // Security check to prevent path traversal
    if (!absolutePath.startsWith(BRAIN_DIR)) {
        throw new Error("Access denied.");
    }

    if (!fs.existsSync(absolutePath)) {
        throw new Error("Document not found.");
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
    return {
        contents: [{
            uri,
            mimeType: "text/markdown",
            text: content
        }]
    };
});

// 2. Expose MCP Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_brain_knowledge",
        description: "Lists all available markdown documents in the Meowdel Brain Vault.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "read_brain_document",
        description: "Reads the contents of a specific markdown document from the Brain Vault.",
        inputSchema: {
          type: "object",
          properties: {
            path: { 
                type: "string", 
                description: "The relative path to the document (e.g. knowledge/feline-psychology.md)" 
            },
          },
          required: ["path"],
        },
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
      if (request.params.name === "list_brain_knowledge") {
        const files = walk(BRAIN_DIR).map(f => path.relative(BRAIN_DIR, f));
        return { 
            content: [{ 
                type: "text", 
                text: JSON.stringify(files, null, 2) 
            }] 
        };
      }

      if (request.params.name === "read_brain_document") {
        const docPath = String(request.params.arguments?.path);
        const absolutePath = path.join(BRAIN_DIR, docPath);

        // Security check
        if (!absolutePath.startsWith(BRAIN_DIR)) {
            return { content: [{ type: "text", text: "Error: Path traversal detected." }] };
        }

        if (!fs.existsSync(absolutePath)) {
             return { content: [{ type: "text", text: "Error: File not found." }] };
        }

        const content = fs.readFileSync(absolutePath, 'utf-8');
        return { content: [{ type: "text", text: content }] };
      }

      throw new Error("Tool not found");
  } catch (error: any) {
      return {
          content: [{
              type: "text",
              text: `Error executing tool: ${error.message}`
          }]
      };
  }
});

// Connect stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Meowdel Brain MCP Server running on stdio"); // Send status to stderr so stdio isn't polluted
