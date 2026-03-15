---
tags:
  - #skill-template
  - #agent-instruction
---
# 🛠️ Skill Creator Guidelines

When given a prompt to "Create a new Skill", agents must follow this strict format to ensure compatibility with our infrastructure. A "Skill" is a modular, self-contained set of instructions and Python/TS scripts that grant the LLM new capabilities.

## Directory Structure

Every new skill must be housed in its own directory under `{.agents,.agent}/workflows/skills/[skill-name]/`.

*   **`[skill-name].md`**: The primary instruction file. MUST contain YAML frontmatter with `name` and `description`.
*   **`/scripts`**: Helper scripts extending capabilities (e.g., Python scripts for parsing a specific log format).
*   **`/examples`**: Reference implementations or expected inputs/outputs.

## The Instruction Markdown (The "Skill File")

The core of a skill is its instruction file. It must rigidly adhere to this format:

\`\`\`markdown
---
name: [Clear, hyphenated skill name, e.g., aws-log-parser]
description: [Short, 1-2 sentence description of what the skill allows the agent to do]
---

# Instructions
[Provide a numbered, step-by-step algorithmic guide on how the agent should USE this skill.]
1. Read the input file.
2. If X, do Y.

# Security Considerations
[Mandatory section. List any destructive actions (like \`rm\`, \`drop table\`) that require explicit human approval before execution.]

# Example Usage
[Provide a clear example of how the user invokes this, and how the agent responds.]
\`\`\`

## Core Directives for Agent Implementers

1.  **Do Not Improvise:** If a skill defines a behavior, execute it exactly as written.
2.  **Absolute Paths Only:** Ensure any bash scripts or file manipulations explicitly use absolute paths (e.g., `/Users/ryan/development/...`).
3.  **Read Before Writing:** Always `cat` or `view_file` the target before modifying it within a skill's script.
