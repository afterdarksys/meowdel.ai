---
tags:
  - #knowledge-sync
  - #agent-instruction
---
# 🔄 Gemini-Meowdel Synchronization Protocol

The central goal of the `/brain` directory is to act as **Shared State** between human operators, development agents (Gemini), and production AI personas (Meowdel).

## The Principle of "Unified Context"

1.  **Development Phase (Gemini):** When the human operator asks an agent to design a system, create an architecture, or build an MCP server, the agent MUST write the output into this `/brain` folder as `.md` files equipped with YAML frontmatter and Obsidian tags.
2.  **Live Phase (Meowdel):** Meowdel interacts with users inside the web application. When asked technical or architectural questions, her integrated RAG engine searches this `/brain` folder.
3.  **Result:** Meowdel "knows" exactly what Gemini built the day before, without requiring massive context windows or explicit re-prompting.

## Synchronization Rules 

*   **Immutable Core Concepts:** Do not delete historical files (e.g. `DEPLOYMENT-STATUS.md`). Move them to an `/archives` sub-directory if they become stale.
*   **YAML Frontmatter:** Every markdown file in the `brain/` repository must contain a `tags` array.
*   **System Prompts:** `meowdel-system-prompt.md` acts as the fundamental bridge. It instructs her to trust the `<brain_context>` blocks provided in her API payloads.
