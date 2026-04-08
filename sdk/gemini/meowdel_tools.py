"""
Meowdel plugin for Gemini API

Usage:
    import google.generativeai as genai
    from meowdel_tools import MeowdelPlugin

    plugin = MeowdelPlugin(api_key="mwdl_...")
    model = genai.GenerativeModel("gemini-1.5-pro", tools=plugin.tools)
    chat = model.start_chat(enable_automatic_function_calling=True)
    response = chat.send_message("Search my brain notes about TypeScript")
"""

import os
import json
import requests
from typing import Any

import google.generativeai as genai


BASE_URL = os.environ.get("MEOWDEL_API_URL", "https://meowdel.ai").rstrip("/")


def _api(api_key: str, method: str, path: str, body: dict | None = None) -> dict:
    """Call the Meowdel API."""
    r = requests.request(
        method,
        f"{BASE_URL}/api/v1{path}",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "meowdel-gemini/1.0.0",
        },
        json=body,
        timeout=60,
    )
    r.raise_for_status()
    return r.json()


class MeowdelPlugin:
    """
    Meowdel tools for the Gemini API function calling interface.

    Example:
        plugin = MeowdelPlugin(api_key="mwdl_...")

        model = genai.GenerativeModel(
            "gemini-1.5-pro",
            tools=plugin.tools,
            system_instruction=plugin.system_instruction,
        )
        chat = model.start_chat(enable_automatic_function_calling=True)
        response = chat.send_message("What are my recent notes about Python?")
    """

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.environ.get("MEOWDEL_API_KEY")
        if not self.api_key:
            raise ValueError("MEOWDEL_API_KEY env var or api_key argument required")

    # ── Tool implementations ──────────────────────────────────────────────────

    def meowdel_chat(self, message: str, conversation_history: list[dict] | None = None) -> str:
        """Chat with Meowdel AI, with automatic Brain context retrieval."""
        data = _api(self.api_key, "POST", "/chat", {
            "message": message,
            "conversationHistory": conversation_history or [],
        })
        return data.get("message", "")

    def brain_search(self, query: str, limit: int = 5) -> str:
        """Semantic search across Brain notes."""
        data = _api(self.api_key, "POST", "/brain/search", {"query": query, "limit": limit})
        results = data if isinstance(data, list) else data.get("results", [])
        if not results:
            return "No matching notes found."
        return "\n\n".join(
            f"**{r.get('title')}** ({int(float(r.get('score', 0)) * 100)}% match)\n{r.get('summary', '')}\nSlug: `{r.get('slug')}`"
            for r in results
        )

    def brain_list_notes(self, tag: str | None = None, limit: int = 20) -> str:
        """List Brain notes, optionally filtered by tag."""
        params = f"?limit={limit}" + (f"&tag={tag}" if tag else "")
        notes = _api(self.api_key, "GET", f"/brain/notes{params}")
        if not notes:
            return "No notes found."
        return "\n".join(
            f"- **{n.get('title')}** (`{n.get('slug')}`) [{', '.join(n.get('tags') or [])}]"
            for n in notes
        )

    def brain_create_note(self, title: str, content: str, tags: list[str] | None = None) -> str:
        """Create a new Brain note."""
        note = _api(self.api_key, "POST", "/brain/notes", {"title": title, "content": content, "tags": tags or []})
        return f"Note created: **{note.get('title')}** (`{note.get('slug')}`)"

    def brain_run_workflow(self, input: str, mode: str = "auto", context: str | None = None) -> str:
        """Run a multi-agent Brain workflow (analyze, organize, synthesize, deep_dive, auto)."""
        data = _api(self.api_key, "POST", "/brain/workflow", {"input": input, "mode": mode, "context": context})
        if "summary" in data:
            return f"Workflow ({mode}):\n\n{data['summary']}"
        return json.dumps(data, indent=2)

    def code_review_scan(self, repo_url: str, save_as_note: bool = True) -> str:
        """Scan a GitHub repo with code-review-graph for structural dependency analysis."""
        data = _api(self.api_key, "POST", "/code-review", {"repoUrl": repo_url, "saveAsNote": save_as_note})
        lines = [
            f"Code graph: {data.get('repoOwner')}/{data.get('repoName')}",
            f"- {data.get('fileCount')} files, {data.get('nodeCount')} nodes, {data.get('edgeCount')} edges",
        ]
        if data.get("estimatedTokenSavings"):
            lines.append(f"- ~{data['estimatedTokenSavings'] // 1000}k estimated token savings")
        if data.get("summaryText"):
            lines.append(f"\n{data['summaryText']}")
        return "\n".join(lines)

    # ── Gemini tool definitions ───────────────────────────────────────────────

    @property
    def tools(self) -> list[genai.protos.Tool]:
        """Gemini-compatible tool definitions for function calling."""
        return [genai.protos.Tool(function_declarations=[
            genai.protos.FunctionDeclaration(
                name="meowdel_chat",
                description="Chat with Meowdel AI. Automatically retrieves context from your Brain knowledge base.",
                parameters=genai.protos.Schema(
                    type=genai.protos.Type.OBJECT,
                    properties={
                        "message": genai.protos.Schema(type=genai.protos.Type.STRING, description="Your message"),
                    },
                    required=["message"],
                ),
            ),
            genai.protos.FunctionDeclaration(
                name="brain_search",
                description="Semantic search across all notes in the Meowdel Brain knowledge base.",
                parameters=genai.protos.Schema(
                    type=genai.protos.Type.OBJECT,
                    properties={
                        "query": genai.protos.Schema(type=genai.protos.Type.STRING, description="Search query"),
                        "limit": genai.protos.Schema(type=genai.protos.Type.INTEGER, description="Max results (default 5)"),
                    },
                    required=["query"],
                ),
            ),
            genai.protos.FunctionDeclaration(
                name="brain_list_notes",
                description="List notes in the Brain, optionally filtered by tag.",
                parameters=genai.protos.Schema(
                    type=genai.protos.Type.OBJECT,
                    properties={
                        "tag": genai.protos.Schema(type=genai.protos.Type.STRING, description="Filter by tag"),
                        "limit": genai.protos.Schema(type=genai.protos.Type.INTEGER, description="Max results"),
                    },
                ),
            ),
            genai.protos.FunctionDeclaration(
                name="brain_create_note",
                description="Create a new note in the Brain knowledge base.",
                parameters=genai.protos.Schema(
                    type=genai.protos.Type.OBJECT,
                    properties={
                        "title": genai.protos.Schema(type=genai.protos.Type.STRING, description="Note title"),
                        "content": genai.protos.Schema(type=genai.protos.Type.STRING, description="Note content in Markdown"),
                        "tags": genai.protos.Schema(type=genai.protos.Type.ARRAY, items=genai.protos.Schema(type=genai.protos.Type.STRING), description="Tags"),
                    },
                    required=["title", "content"],
                ),
            ),
            genai.protos.FunctionDeclaration(
                name="brain_run_workflow",
                description="Run a multi-agent workflow on a task. Modes: auto, analyze, organize, synthesize, deep_dive.",
                parameters=genai.protos.Schema(
                    type=genai.protos.Type.OBJECT,
                    properties={
                        "input": genai.protos.Schema(type=genai.protos.Type.STRING, description="Task description"),
                        "mode": genai.protos.Schema(type=genai.protos.Type.STRING, description="Swarm mode: auto, analyze, organize, synthesize, deep_dive"),
                        "context": genai.protos.Schema(type=genai.protos.Type.STRING, description="Additional context"),
                    },
                    required=["input"],
                ),
            ),
            genai.protos.FunctionDeclaration(
                name="code_review_scan",
                description="Scan a GitHub repo to build a code dependency graph. Reduces AI context by ~8x.",
                parameters=genai.protos.Schema(
                    type=genai.protos.Type.OBJECT,
                    properties={
                        "repo_url": genai.protos.Schema(type=genai.protos.Type.STRING, description="GitHub repo URL"),
                        "save_as_note": genai.protos.Schema(type=genai.protos.Type.BOOLEAN, description="Save results to Brain"),
                    },
                    required=["repo_url"],
                ),
            ),
        ])]

    @property
    def system_instruction(self) -> str:
        return (
            "You are Meowdel, an AI coding cat assistant powered by Gemini. "
            "You have access to the user's Brain knowledge base and can search, read, and create notes. "
            "Use brain_search to find relevant context before answering questions. "
            "Use brain_run_workflow for complex analysis tasks. "
            "*meow* Always be helpful, playful, and precise."
        )

    def handle_function_call(self, name: str, args: dict) -> Any:
        """Dispatch a Gemini function call to the appropriate method."""
        handlers = {
            "meowdel_chat": lambda a: self.meowdel_chat(a["message"], a.get("conversation_history")),
            "brain_search": lambda a: self.brain_search(a["query"], a.get("limit", 5)),
            "brain_list_notes": lambda a: self.brain_list_notes(a.get("tag"), a.get("limit", 20)),
            "brain_create_note": lambda a: self.brain_create_note(a["title"], a["content"], a.get("tags")),
            "brain_run_workflow": lambda a: self.brain_run_workflow(a["input"], a.get("mode", "auto"), a.get("context")),
            "code_review_scan": lambda a: self.code_review_scan(a["repo_url"], a.get("save_as_note", True)),
        }
        handler = handlers.get(name)
        if not handler:
            raise ValueError(f"Unknown function: {name}")
        return handler(args)
