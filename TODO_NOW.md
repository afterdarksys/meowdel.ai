# 🧠 Brain System - Obsidian Competitor Roadmap

**Vision**: Transform the `/brain` directory into a full AI-native knowledge management platform that powers the entire After Dark AI pet ecosystem.

---

## What Makes This Different from Obsidian

| Feature | Obsidian | Your "Brain" System |
|---------|----------|---------------------|
| **Users** | Humans only | Humans + AI agents collaborating |
| **Search** | Text search | RAG-powered semantic search |
| **Editing** | Manual | AI-assisted (auto-tagging, linking) |
| **Plugins** | Community plugins | MCP servers (standardized) |
| **Purpose** | Personal knowledge | Multi-agent shared memory |
| **Personality** | Neutral | Cat-themed, playful |

---

## Phase 1: Core Editor (Foundation) 📝

**Goal**: Build the fundamental markdown editing experience

### Tasks:
- [ ] **Markdown Editor Component**
  - Use `@uiw/react-md-editor` or `react-markdown` + `react-simplemde-editor`
  - Live preview (split view)
  - Syntax highlighting
  - Keyboard shortcuts (Cmd+B for bold, etc.)

- [ ] **File Browser/Vault Navigation**
  - Tree view of `/brain` directory structure
  - Folder expansion/collapse
  - File creation/deletion
  - Drag & drop file organization

- [ ] **Tag Management**
  - Parse YAML frontmatter for tags
  - Tag autocomplete in editor
  - Tag sidebar/filter
  - Click tag to see all notes with that tag

- [ ] **Wikilink Support `[[note-name]]`**
  - Parse `[[note-name]]` syntax
  - Auto-complete note names
  - Click to navigate between notes
  - Backlinks panel (shows what links TO current note)

- [ ] **File Metadata**
  - Parse YAML frontmatter
  - Display creation/modified dates
  - Word count, reading time

---

## Phase 2: AI Features (Differentiator) 🤖

**Goal**: Leverage AI to make knowledge management effortless

### Tasks:
- [ ] **RAG-Powered Semantic Search**
  - Meowdel searches brain via vector embeddings
  - "Ask Meowdel" search bar
  - Natural language queries ("show me all notes about MCP servers")
  - Relevant context snippets in results

- [ ] **AI Auto-Tagging**
  - Analyze note content
  - Suggest tags based on content
  - One-click to apply suggested tags

- [ ] **AI Auto-Linking**
  - Detect potential wikilinks
  - Suggest `[[connections]]` between notes
  - "This note mentions concepts from [[other-note]]"

- [ ] **AI Summarization**
  - Generate TL;DR for long notes
  - Create note outlines
  - Extract key concepts

- [ ] **Multi-Agent Collaboration**
  - Different AI personalities can edit notes
  - Meowdel adds coding wisdom
  - Other cats add personality-specific insights
  - Track "who wrote what" (AI attribution)

---

## Phase 3: Visualization (Graph) 📊

**Goal**: See the knowledge network visually

### Tasks:
- [ ] **Knowledge Graph View**
  - Use `react-force-graph` or `vis-network`
  - Nodes = notes
  - Edges = wikilinks between notes
  - Click node to open note
  - Zoom/pan/filter

- [ ] **Tag Clouds**
  - Visual representation of tag frequency
  - Click tag to filter graph

- [ ] **Connection Visualization**
  - Highlight related notes
  - Show "orphaned" notes (no connections)
  - Suggest connections

- [ ] **Daily/Weekly Activity View**
  - Show what was edited when
  - Contribution timeline
  - Growth metrics (notes over time)

---

## Phase 4: MCP Plugin System 🔌

**Goal**: Extensibility via standardized MCP servers

### Tasks:
- [ ] **Plugin Marketplace**
  - Browse available MCP servers
  - One-click install
  - Plugin management UI

- [ ] **MCP Server Integration**
  - Load MCP servers as "brain extensions"
  - Call MCP tools from within notes
  - Live data from external sources (GitHub, databases, APIs)

- [ ] **Custom Tool Palette**
  - Cmd+K command palette
  - Quick actions via MCP tools
  - "Transform this note with X tool"

- [ ] **Plugin Templates**
  - Use `/brain/mcp/mcp-server-generator.md` to scaffold new plugins
  - Auto-generate boilerplate

---

## Current Assets

### What You Already Have ✅
- ✅ Markdown-based knowledge base with tags & wikilinks
- ✅ Semantic structure (`knowledge/`, `skills/`, `mcp/`)
- ✅ RAG integration (Meowdel searches the brain)
- ✅ MCP servers (could become plugins)
- ✅ Unique AI personality layer (Meowdel)
- ✅ Feline psychology framework
- ✅ MCP server generator blueprint
- ✅ Next.js web app infrastructure

### Directory Structure
```
meowdel.ai/
├── brain/                    # The knowledge base
│   ├── knowledge/            # Core concepts
│   ├── skills/               # Skill templates
│   ├── mcp/                  # MCP blueprints
│   └── README.md
├── web-app/                  # Next.js frontend
│   ├── app/
│   ├── components/
│   └── lib/
├── mcp-server/               # Current MCP implementation
└── vision-engine/            # Computer vision
```

---

## Tech Stack Recommendations

### Editor
- **`@uiw/react-md-editor`** - Full-featured markdown editor
- **`react-markdown`** - Rendering markdown to HTML
- **`remark-gfm`** - GitHub Flavored Markdown support
- **`rehype-highlight`** - Code syntax highlighting

### File System
- **Next.js API routes** - CRUD operations on `/brain` files
- **`fs/promises`** - Node.js file system
- **`gray-matter`** - Parse YAML frontmatter

### Graph Visualization
- **`react-force-graph`** - Interactive force-directed graphs
- **`d3`** - Custom visualizations

### Search/RAG
- **Current RAG pipeline** - Already exists in Meowdel
- **Vector embeddings** - OpenAI embeddings or local model
- **`chromadb`** or **`pinecone`** - Vector database

---

## Immediate Next Steps

1. **Create `/app/brain` route in web-app**
   - New page at `meowdel.ai/brain`
   - Brain editor UI

2. **Build MarkdownEditor component**
   - Split view (edit | preview)
   - Load note from API
   - Save changes

3. **Create API routes**
   - `GET /api/brain/notes` - List all notes
   - `GET /api/brain/notes/[slug]` - Get note content
   - `PUT /api/brain/notes/[slug]` - Update note
   - `POST /api/brain/notes` - Create new note

4. **Add file browser sidebar**
   - Tree view of `/brain` structure
   - Click to load note

5. **Implement basic search**
   - Text search across all notes
   - Tag filtering

---

## Success Metrics

- [ ] Can create/edit markdown notes in browser
- [ ] Can navigate between notes via wikilinks
- [ ] Can search notes semantically (RAG)
- [ ] Can visualize knowledge graph
- [ ] AI agents can read/write to brain
- [ ] Meowdel uses brain for context in conversations

---

## Competitive Advantages

**vs Obsidian:**
- 🤖 **AI-native** - Built for human-AI collaboration
- 🐱 **Personality** - Playful, engaging UX
- 🔌 **MCP standardization** - Better plugin ecosystem
- 🌐 **Web-first** - No app download required
- 🧠 **RAG-powered** - Semantic search, not just text

**vs Notion:**
- 📝 **Markdown-native** - No vendor lock-in
- 🔓 **Open format** - Files are yours
- 🚀 **Lightweight** - No bloat

---

**Let's build something better than everyone hates!** 😸✨
