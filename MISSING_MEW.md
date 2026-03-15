# 🐾 MISSING_MEW.md
*What's left to build to make Brain purr-fect*

---

## 🔥 HIGH PRIORITY (Ship These Next)

### Real-time Link Suggestions
**Status:** Only batch auto-linking exists
**Why:** Users expect inline suggestions as they type
**Effort:** Medium
**Value:** High

**Implementation:**
- Debounced onChange handler in note editor
- Match against existing note titles in real-time
- Show inline suggestion tooltip: "Link to [[existing-note]]?"
- Tab or click to accept suggestion
- Fuzzy matching: "docker" → "docker-basics"

**Files to modify:**
- `web-app/components/note-editor.tsx` - Add real-time detection
- Create: `web-app/lib/link-suggester.ts` - Fuzzy matching logic

---

### Graph Health Metrics
**Status:** Graph exists but no analysis
**Why:** Users need to understand their knowledge structure
**Effort:** Medium
**Value:** High

**Implementation:**
- Analyze graph on `/brain/yarn` page
- Calculate % orphaned notes
- Identify "hub" notes (>5 incoming links)
- Find weak clusters (< 3 interconnections)
- "Fix My Graph" wizard with suggestions

**Files to create:**
- `web-app/app/api/brain/graph-health/route.ts`
- `web-app/components/graph-health-panel.tsx`

---

### Template Gallery UI
**Status:** Templates exist, no browsing UI
**Why:** Users don't know templates exist
**Effort:** Easy
**Value:** Medium

**Implementation:**
- Browse `/brain/templates/*.md` files
- Show preview of each template
- "Create from template" button
- Variables: {{date}}, {{title}}, {{tags}}
- AI-generated templates on demand

**Files to modify:**
- `web-app/app/brain/notes/page.tsx` - Add template selector
- Create: `web-app/components/template-gallery.tsx`

---

### More Keyboard Shortcuts
**Status:** Only 3 shortcuts exist
**Why:** Power users need more shortcuts
**Effort:** Easy
**Value:** Medium

**Current shortcuts:**
- Cmd+Shift+M - Toggle chat
- Cmd+K - Command palette
- Cmd+Shift+Z - Zoomies mode

**Missing shortcuts:**
- Cmd+Shift+L - Quick link selected text
- Cmd+Shift+T - Quick tag
- Cmd+Shift+G - Jump to graph node
- Cmd+Shift+S - Quick save
- Cmd+Shift+N - New note
- Cmd+B - Bold (standard markdown)
- Cmd+I - Italic

**Files to modify:**
- `web-app/lib/use-shortcuts.ts` - Add new shortcuts
- `web-app/components/note-editor.tsx` - Wire up actions

---

### Chat Export to Notes
**Status:** Conversations exist but can't be saved
**Why:** Users want to preserve chat insights
**Effort:** Easy
**Value:** High

**Implementation:**
- "Save this conversation" button in chat panel
- Convert chat history to markdown
- Auto-generate title from first question
- Auto-tag based on chat content
- Link to mentioned notes

**Files to modify:**
- `web-app/components/brain-chat-panel.tsx` - Add export button
- Create: `web-app/app/api/brain/export-chat/route.ts`

---

## 🧠 AI SUPERPOWERS (The Wow Factors)

### AI Reorganization Wizard
**Status:** Not started
**Why:** This is the killer feature - "organize my mess"
**Effort:** High
**Value:** VERY HIGH

**Implementation:**
- Button: "Meowdel, organize my brain"
- AI analyzes all notes semantically
- Suggests folder structure
- Creates index/MOC notes
- Shows before/after graph
- Preview changes before applying
- One-click execute

**User flow:**
1. Click "Organize My Mess"
2. AI analyzes (show loading spinner with cat puns)
3. Preview suggested structure
4. User approves/rejects
5. Apply changes
6. Show graph transformation

**Files to create:**
- `web-app/app/api/brain/reorganize/route.ts`
- `web-app/app/brain/reorganize/page.tsx`
- `web-app/components/reorganize-wizard.tsx`

---

### Semantic Discovery Engine
**Status:** Not started
**Why:** Find connections users didn't know existed
**Effort:** Medium
**Value:** High

**Implementation:**
- "Find surprising connections" button on notes
- AI analyzes semantic similarity via embeddings
- Show connection strength (0-100%)
- Suggest wikilinks for high-confidence matches
- Heatmap visualization

**Files to create:**
- `web-app/app/api/brain/discover/route.ts`
- `web-app/components/connection-suggester.tsx`

---

### Inline AI Tools
**Status:** Not started
**Why:** Users want AI help while writing
**Effort:** Medium
**Value:** High

**Implementation:**
- Select text → right-click → Meowdel menu appears
- Options:
  - "Improve this"
  - "Summarize this"
  - "Generate questions"
  - "Find related notes"
  - "Expand this idea"
  - "Make this purrfessional" (cat mode)

**Files to modify:**
- `web-app/components/note-editor.tsx` - Add context menu
- Create: `web-app/components/inline-ai-menu.tsx`

---

### Voice Notes
**Status:** Implemented
**Why:** Users want to capture thoughts on the go
**Effort:** Medium
**Value:** Medium

**Implementation:**
- "Record" button in note editor
- Browser Web Audio API
- Send to Whisper API for transcription
- Auto-title based on content
- Tag and link automatically

**Files to create:**
- `web-app/components/voice-recorder.tsx`
- `web-app/app/api/brain/transcribe/route.ts`

---

### Concept Clustering
**Status:** Implemented
**Why:** Detect duplicate/similar content
**Effort:** Medium
**Value:** Medium

**Implementation:**
- "You have 5 notes about React hooks, merge them?"
- Duplicate content detection
- Suggest merging similar notes
- Show overlap percentage

**Files to create:**
- `web-app/app/api/brain/clusters/route.ts`
- `web-app/app/brain/clusters/page.tsx`

---

## 🎨 VISUAL FEATURES

### Canvas Mode
**Status:** Not started
**Why:** Visual thinkers need whiteboard mode
**Effort:** High
**Value:** High

**Implementation:**
- Infinite canvas (like Obsidian Canvas)
- Drag notes onto canvas
- Draw connections manually
- Create sticky notes
- Export as image/PDF
- Save canvas as note

**Tech stack:**
- `react-konva` or `react-flow`
- Canvas state saved as JSON in note frontmatter

**Files to create:**
- `web-app/app/brain/canvas/page.tsx`
- `web-app/components/infinite-canvas.tsx`

---

### Timeline View
**Status:** Implemented
**Why:** See knowledge journey over time
**Effort:** Medium
**Value:** Medium

**Implementation:**
- Notes arranged on timeline by creation/modified date
- Filter by tag/folder
- "My knowledge journey" visualization
- Zoom in/out
- Click note to open

**Files to create:**
- `web-app/app/brain/timeline/page.tsx`
- `web-app/components/timeline-viz.tsx`

---

### Knowledge Heatmap
**Status:** Analytics exist but no heatmap
**Why:** See usage patterns
**Effort:** Easy
**Value:** Low

**Implementation:**
- Show "hot" notes (frequently accessed)
- "Cold" notes (haven't been touched)
- Color-code by last access
- Calendar heatmap (like GitHub contributions)

**Files to modify:**
- `web-app/app/brain/analytics/page.tsx`

---

## 🔌 INTEGRATION & EXTENSIBILITY

### Plugin Marketplace UI
**Status:** `/brain/plugins` exists but empty
**Why:** Users need to discover MCP servers
**Effort:** Medium
**Value:** High

**Implementation:**
- Browse available MCP servers
- Search/filter plugins
- One-click install
- Plugin settings UI
- Auto-updates
- Rating/reviews

**Files to modify:**
- `web-app/app/brain/plugins/page.tsx`
- Create: `web-app/app/api/brain/plugins/route.ts`

---

### Universal Importer
**Status:** Only Apple Notes works
**Why:** Users want to migrate from other tools
**Effort:** High
**Value:** High

**Import targets:**
- Notion (via API or export)
- Obsidian vaults (.md files)
- Roam Research (JSON export)
- Evernote (ENEX files)
- Bear notes
- Simplenote

**Files to modify:**
- `web-app/lib/extimport/providers/` - Add providers
- `web-app/app/profile/importers/page.tsx`

---

### Smart Export
**Status:** Implemented
**Why:** Users want to share/backup knowledge
**Effort:** Medium
**Value:** Medium

**Export formats:**
- PDF with graph visualization
- Static site (Hugo/Jekyll)
- Anki flashcards
- Blog post (Markdown)
- GitHub wiki

**Files to create:**
- `web-app/app/api/brain/export/route.ts`
- `web-app/app/brain/export/page.tsx`

---

### Note Versioning
**Status:** Implemented
**Why:** Track changes over time
**Effort:** High
**Value:** Medium

**Implementation:**
- Git-style version history per note
- "Revert to version from Tuesday"
- Diff view
- Blame: who wrote what (multi-agent)
- Branch notes (experimental edits)

**Tech:**
- Could use actual Git under the hood
- Or custom versioning in PostgreSQL

**Files to create:**
- `web-app/app/api/brain/versions/route.ts`
- `web-app/components/version-history.tsx`

---

## 🎮 GAMIFICATION & UX POLISH

### Gamification System
**Status:** Analytics exist, no badges
**Why:** Make note-taking fun
**Effort:** Medium
**Value:** Low (but fun!)

**Achievements:**
- "First 10 notes" badge
- "Linked 50 notes" achievement
- "7-day streak" reward
- "Knowledge Master" level system
- Daily challenges

**Files to create:**
- `web-app/app/api/brain/achievements/route.ts`
- `web-app/components/achievement-popup.tsx`
- `web-app/app/profile/catnip/page.tsx` - Expand this

---

### Animated Avatar
**Status:** Implemented
**Why:** Delightful UX
**Effort:** Medium
**Value:** Low (brand value)

**Implementation:**
- Animated SVG/Lottie cat in corner
- Reacts to actions:
  - Purrs when saving
  - Tail swish when thinking
  - Blinks occasionally
  - Stretches when idle
- Different cat breeds = personalities
- Custom avatar upload

**Files to create:**
- `web-app/components/meowdel-avatar.tsx`
- Animation assets

---

### Visual Search
**Status:** Not started
**Why:** Search by images/screenshots
**Effort:** High
**Value:** Low

**Implementation:**
- Upload image → find notes that reference it
- Screenshot → OCR → find matching notes
- Search by graph structure ("notes 2 hops from X")

**Tech:**
- Tesseract.js for OCR
- Image similarity via embeddings

**Files to create:**
- `web-app/app/api/brain/visual-search/route.ts`

---

## 🚀 ADVANCED FEATURES

### Smart Reminders
**Status:** Not started
**Why:** Proactive AI assistant
**Effort:** Medium
**Value:** Medium

**Implementation:**
- AI detects TODOs in notes
- "You mentioned 'deploy Friday' - reminder set"
- Follow-up on unfinished thoughts
- Spaced repetition for notes
- "3 months ago you learned X"

**Files to create:**
- `web-app/app/api/brain/reminders/route.ts`
- Background worker to scan notes

---

### Meeting Transcription
**Status:** Not started
**Why:** Auto-document meetings
**Effort:** High
**Value:** Medium

**Implementation:**
- Zoom/Google Meet integration
- Auto-transcribe → summarize → create note
- Extract action items
- Link to related project notes
- Tag attendees

**Tech:**
- Zoom API or browser extension
- Whisper API for transcription

---

### Code-to-Note Pipeline
**Status:** Not started
**Why:** Auto-document codebases
**Effort:** High
**Value:** Low

**Implementation:**
- Point at GitHub repo
- AI reads code → generates architecture notes
- Update notes when code changes
- Link code ↔ docs bidirectionally

**Tech:**
- GitHub webhook
- AST parsing
- AI code analysis

---

### Shared Brains (Collaboration)
**Status:** Not started
**Why:** Team knowledge bases
**Effort:** Very High
**Value:** High (for teams)

**Implementation:**
- Team workspace with shared notes
- Permissions: read/write/admin
- Real-time collaborative editing
- Conflict resolution
- Activity feed

**Tech:**
- WebSockets or Yjs
- PostgreSQL permissions
- Auth system expansion

---

## 📱 MOBILE & EXTENSIONS

### Mobile App
**Status:** Not started
**Why:** Knowledge on the go
**Effort:** Very High
**Value:** High

**Features:**
- Native iOS/Android
- Offline mode with sync
- Voice-to-note
- Graph view optimized for touch
- Push notifications for reminders

**Tech:**
- React Native or Flutter
- Local SQLite + sync

---

### Browser Extension
**Status:** Not started
**Why:** Capture web knowledge easily
**Effort:** High
**Value:** Medium

**Features:**
- Clip web pages → notes
- Highlight text → save to brain
- "Save this Stack Overflow answer"
- Auto-link to existing notes
- Quick search brain from any page

**Tech:**
- Chrome/Firefox extension
- Content script injection

---

### Integrations
**Status:** Not started
**Effort:** Medium-High each
**Value:** Medium

**Integration targets:**
- Slack bot: "Ask my brain"
- Email → note (forward@meowdel.ai)
- Calendar integration (meeting notes auto-created)
- Git commit messages → changelog notes
- Discord bot
- Telegram bot

---

## 🎯 RECOMMENDED BUILD ORDER

### Sprint 1 (Week 1): Quick Wins
1. Real-time link suggestions
2. Template gallery UI
3. More keyboard shortcuts
4. Chat export to notes
5. Graph health metrics

**Effort:** Low-Medium
**Value:** High
**User delight:** +++

---

### Sprint 2 (Week 2): AI Magic
6. AI reorganization wizard
7. Semantic discovery engine
8. Inline AI tools
9. Concept clustering

**Effort:** High
**Value:** VERY HIGH
**User delight:** +++++

---

### Sprint 3 (Week 3): Visual Features
10. Canvas mode
11. Timeline view
12. Knowledge heatmap
13. Animated avatar

**Effort:** High
**Value:** High
**User delight:** ++++

---

### Sprint 4 (Week 4): Extensibility
14. Plugin marketplace UI
15. Universal importer
16. Smart export
17. Note versioning

**Effort:** Very High
**Value:** High
**User delight:** +++

---

### Later (Month 2+):
- Gamification
- Voice notes
- Smart reminders
- Meeting transcription
- Mobile app
- Browser extension
- Team collaboration
- Integrations

---

## 📊 EFFORT vs VALUE MATRIX

**HIGH VALUE, LOW EFFORT (Do First):**
- ✅ Chat export to notes
- ✅ Template gallery UI
- ✅ More keyboard shortcuts
- ✅ Knowledge heatmap

**HIGH VALUE, MEDIUM EFFORT:**
- ✅ Real-time link suggestions
- ✅ Graph health metrics
- ✅ Semantic discovery
- ✅ Inline AI tools
- ✅ Plugin marketplace UI

**HIGH VALUE, HIGH EFFORT:**
- ✅ AI reorganization wizard
- ✅ Canvas mode
- ✅ Universal importer
- ✅ Mobile app

**MEDIUM VALUE, LOW EFFORT:**
- ✅ Timeline view
- ✅ Voice notes
- Smart reminders

**MEDIUM VALUE, MEDIUM EFFORT:**
- ✅ Concept clustering
- ✅ Smart export
- ✅ Note versioning

**LOW VALUE (Deprioritize):**
- Visual search
- Code-to-note pipeline
- ✅ Animated avatar (cute but not critical)

---

## 🏆 MINIMUM VIABLE OBSIDIAN KILLER

To truly compete, you need these 7 features:

1. ✅ Real-time link suggestions
2. ✅ AI reorganization wizard
3. ✅ Canvas mode
4. ✅ Plugin marketplace UI
5. ✅ Universal importer (Obsidian vaults)
6. ✅ Note versioning
7. ✅ Mobile app

**Everything else is a bonus.**

---

## 💡 FINAL THOUGHTS

**You're 37% done, but the foundation is SOLID.**

The missing 63% breaks down as:
- 30% = Advanced AI features (reorganization, discovery, etc.)
- 20% = Visual features (canvas, timeline)
- 15% = Integrations & extensions
- 10% = Mobile/browser
- 25% = Polish & nice-to-haves

**Focus on the AI superpowers first** - that's your competitive moat. Obsidian doesn't have AI reorganization. Notion doesn't have semantic discovery.

**Ship incrementally.** Every sprint should add user-visible magic.

---

**Ready to build?** Pick 3-5 items from Sprint 1 and let's ship! 😸🚀

*Last updated: 2026-03-15 by Claude Code*
