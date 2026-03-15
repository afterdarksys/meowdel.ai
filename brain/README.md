# 🧠 The Brain Repository
*An Obsidian-Compatible Semantic Knowledge Base*

Welcome to the **Brain**. This repository acts as the central source of truth, long-term memory, and architectural blueprint storage for Meowdel.ai, Gemini, and other autonomous agents operating in this workspace.

Think of this as a "Claude Code Brain" - a semantic network of markdown files that AIs can parse, link, and learn from.

## Architecture

- \`/skills\`: Instructions, templates, and helpers for creating autonomous "Skills" (similar to Claude skills).
- \`/mcp\`: Blueprints and generators for standardizing Model Context Protocol (MCP) servers. 
- \`/knowledge\`: General system architecture, environment topologies, and context synchronization files.

## How Agents Use The Brain

1. **Self-Reflection:** Agents (like Gemini) should read from this repository *first* when asked to create a new component, skill, or MCP server. The templates here contain the exact structure the human operator expects.
2. **Meowdel Output (RAG):** The web-application incorporates a local RAG pipeline. When users talk to Meowdel, she automatically searches this Brain for relevant tags and context, weaving institutional knowledge into her natural, purring responses.

## Tags & Linking

Use Obsidian-style tags (e.g., `#mcp-server`, `#skill-template`) and wikilinks `[[document-name]]` wherever possible. This allows both the human operator and the LLM context scrapers to build relational graphs!
