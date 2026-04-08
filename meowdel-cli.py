#!/usr/bin/env python3
"""
Meowdel CLI - Chat with Meowdel from your terminal, with intelligent model routing.

Model tiers (auto-selected based on message complexity):
  🐱 haiku  — casual chat, quick facts, simple questions
  🐈 sonnet — code, research, analysis, debugging
  🦁 opus   — architecture, deep planning, system design

User commands in messages:
  @haiku / @quick       → force Haiku
  @sonnet / @s          → force Sonnet
  @opus / @deep / @plan → force Opus
  #save                 → store this exchange in cascade memory
  #skill:name           → activate a skill (code-reviewer, debug-assistant, architect…)
  #up / #down           → shift one tier up/down

CLI commands (/slash):
  /model [haiku|sonnet|opus|auto]  → set default model tier
  /skills                          → list available skills
  /skill <name>                    → toggle a skill on/off
  /memory                          → show cascade memory stats
  /routing [on|off]                → show/hide routing info
  /save                            → save conversation to file
  /clear                           → clear history
  /history                         → show message count
  /exit                            → quit

Brain / Notes commands:
  /notes [query]                   → list notes (filter by title/tag/summary)
  /note <slug>                     → view a note's full content
  /new [title]                     → create a note (opens $EDITOR)
  /edit <slug>                     → edit a note in $EDITOR
  /rm <slug>                       → delete a note
  /search <query>                  → semantic brain search
  /tags                            → list all tags with counts
  /brain                           → show brain command help
"""

import os
import sys
import re
import json
import argparse
import requests
import subprocess
import tempfile
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Tuple

try:
    from rich.console import Console
    from rich.markdown import Markdown
    from rich.panel import Panel
    from rich.prompt import Prompt
    from rich.table import Table
    from rich import box
    RICH = True
except ImportError:
    RICH = False

# ── Configuration ─────────────────────────────────────────────────────────────

MEOWDEL_API_KEY = os.environ.get("MEOWDEL_API_KEY")
MEOWDEL_API_URL = os.environ.get("MEOWDEL_API_URL", "https://meowdel.ai").rstrip("/")
HISTORY_DIR = Path.home() / ".meowdel" / "history"

# Tier display config
TIER_EMOJI = {"haiku": "🐱", "sonnet": "🐈", "opus": "🦁"}
TIER_COLOR = {"haiku": "cyan", "sonnet": "green", "opus": "magenta"}

# Built-in skill slugs (must match server-side skills.ts)
BUILT_IN_SKILLS = [
    # Productivity
    ("code-reviewer",    "Reviews code for bugs, style, security"),
    ("debug-assistant",  "Systematic debugging — root cause + fix"),
    ("architect",        "System design mode — tradeoffs, patterns (Opus)"),
    ("research",         "Deep research and synthesis (Sonnet)"),
    ("quick-answers",    "Terse, direct responses (Haiku)"),
    ("writing-coach",    "Writing improvement — rewrites + explanations"),
    ("rubber-duck",      "Asks questions to help you think"),
    ("security-auditor", "Security review lens — OWASP, threat modeling"),
    ("teach-me",         "First-principles explanations with analogies"),
    # Social Media
    ("facebook-pro",     "Facebook posts, Groups, Marketplace, ads"),
    ("x-twitter-pro",    "X/Twitter threads, hashtags, algorithm"),
    ("linkedin-pro",     "LinkedIn posts, networking, InMail, job search"),
    ("instagram-pro",    "Captions, Reels, Stories, hashtags, growth"),
    ("reddit-pro",       "Subreddit culture, post titles, karma"),
    ("tiktok-pro",       "TikTok hooks, trending, FYP strategy"),
    # Banking & Finance
    ("chase-banking",    "Chase cards, Ultimate Rewards, disputes"),
    ("citi-banking",     "Citi ThankYou Points, Double Cash, products"),
    ("boa-banking",      "BofA Preferred Rewards, travel, Cash Rewards"),
    ("amex-banking",     "Amex MR, Platinum/Gold, Amex Offers, transfers"),
    ("personal-finance", "Budgeting, debt payoff, investing basics"),
    ("crypto-basics",    "Crypto, wallets, DeFi, taxes, scam awareness"),
    # New York City
    ("nyc-transit",      "Subway, buses, LIRR, Metro-North, OMNY, ferries"),
    ("nyc-services",     "311, SNAP, Medicaid, housing lottery, IDNYC"),
    ("nyc-housing",      "Rent stabilization, tenant rights, DHCR, HPD"),
    ("nyc-food",         "NYC dining, neighborhoods, delivery, reservations"),
    # Documents & Office
    ("word-docs",        "Word formatting, styles, mail merge, track changes"),
    ("excel-pro",        "Excel formulas, pivot tables, Power Query, VBA"),
    ("powerpoint-pro",   "Slide design, structure, animations, delivery"),
    ("google-docs",      "Docs collaboration, suggestions, add-ons"),
    ("google-sheets",    "Sheets formulas, IMPORTRANGE, ARRAYFORMULA, Apps Script"),
    ("pdf-expert",       "PDF analysis, contract review, forms"),
    ("office-365",       "Teams, Outlook, OneDrive, SharePoint, M365"),
    # Legal & Government
    ("legal-plain",      "Contract clauses in plain English — NOT legal advice"),
    ("irs-taxes",        "Tax forms, deductions, Schedule C, IRS notices"),
    ("immigration-assist","USCIS forms, green card, visa types, timelines"),
    # Health
    ("medical-billing",  "EOB breakdown, billing codes, dispute process"),
    ("insurance-navigator","Health plans, deductibles, appeals, open enrollment"),
    # Real Estate
    ("lease-reader",     "Lease clauses, tenant rights, security deposits"),
    ("mortgage-helper",  "Loan types, rates, points, closing costs, PMI"),
    # Business & Career
    ("startup-advisor",  "MVP, PMF, fundraising, pitch decks, cap tables"),
    ("negotiation-pro",  "Salary negotiation, BATNA, anchoring, scripts"),
    ("product-manager",  "PRD writing, user stories, RICE, roadmaps"),
    ("sales-copy",       "AIDA, PAS, email subject lines, landing pages"),
    ("email-pro",        "Professional email, cold outreach, follow-ups"),
    ("grant-writer",     "Grant proposals, needs statements, logic models"),
]

SKILL_CATEGORIES = {
    "Productivity":       ["code-reviewer","debug-assistant","architect","research","quick-answers","writing-coach","rubber-duck","security-auditor","teach-me"],
    "Social Media":       ["facebook-pro","x-twitter-pro","linkedin-pro","instagram-pro","reddit-pro","tiktok-pro"],
    "Banking & Finance":  ["chase-banking","citi-banking","boa-banking","amex-banking","personal-finance","crypto-basics"],
    "New York City":      ["nyc-transit","nyc-services","nyc-housing","nyc-food"],
    "Documents & Office": ["word-docs","excel-pro","powerpoint-pro","google-docs","google-sheets","pdf-expert","office-365"],
    "Legal & Gov":        ["legal-plain","irs-taxes","immigration-assist"],
    "Health":             ["medical-billing","insurance-navigator"],
    "Real Estate":        ["lease-reader","mortgage-helper"],
    "Business & Career":  ["startup-advisor","negotiation-pro","product-manager","sales-copy","email-pro","grant-writer"],
}

console = Console() if RICH else None


def print_out(text: str, style: str = "", markup: bool = True):
    if RICH and console:
        console.print(text, style=style, markup=markup)
    else:
        # Strip rich markup for plain output
        clean = re.sub(r'\[/?[^\]]+\]', '', text)
        print(clean)


# ── Model routing (client-side mirror of server router) ───────────────────────

OPUS_KEYWORDS = [
    "architect", "architecture", "design system", "roadmap", "strategy",
    "comprehensive plan", "long-term", "tradeoffs", "deep analysis",
    "from scratch", "production system", "scalable", "entire codebase",
    "step by step plan", "redesign", "overhaul", "think through",
]
SONNET_KEYWORDS = [
    "code", "bug", "debug", "implement", "function", "class", "refactor",
    "test", "explain", "research", "analyze", "compare", "review",
    "fix", "error", "exception", "performance", "optimize", "database",
    "api", "algorithm", "typescript", "python", "javascript", "rust",
]
HAIKU_KEYWORDS = [
    "hi", "hello", "hey", "thanks", "thank you", "ok", "okay", "got it",
    "what time", "what day", "quick question", "simple question", "yes", "no",
]


def parse_commands(message: str) -> Tuple[str, Optional[str], bool, List[str], int]:
    """Returns (clean_message, forced_tier, save, skill_slugs, shift)"""
    msg = message.strip()
    forced_tier = None
    save = False
    shift = 0
    skills: List[str] = []

    # Leading tier commands
    m = re.match(r'^@(opus|deep|plan|think|o)\b\s*', msg, re.I)
    if m:
        forced_tier = "opus"
        msg = msg[m.end():]
    else:
        m = re.match(r'^@(sonnet|s|normal)\b\s*', msg, re.I)
        if m:
            forced_tier = "sonnet"
            msg = msg[m.end():]
        else:
            m = re.match(r'^@(haiku|quick|h|fast)\b\s*', msg, re.I)
            if m:
                forced_tier = "haiku"
                msg = msg[m.end():]

    # Inline tags
    def strip_tag(pattern, cb):
        nonlocal msg
        msg = re.sub(pattern, lambda _m: (cb(_m), '')[1], msg, flags=re.I)

    msg = re.sub(r'#save\b', lambda _: (setattr(parse_commands, '_save', True), '')[1], msg, flags=re.I)
    save = '#save' in message.lower()
    msg = re.sub(r'#save\b', '', msg, flags=re.I)
    msg = re.sub(r'#up\b', '', msg, flags=re.I)
    msg = re.sub(r'#down\b', '', msg, flags=re.I)

    shift += message.lower().count('#up')
    shift -= message.lower().count('#down')

    for m2 in re.finditer(r'#skill:([\w-]+)', msg, re.I):
        skills.append(m2.group(1))
    msg = re.sub(r'#skill:[\w-]+', '', msg, flags=re.I)

    return msg.strip(), forced_tier, save, skills, shift


def predict_tier(message: str, history_depth: int = 0) -> str:
    """Predict which tier the server will route to (for display before sending)."""
    lower = message.lower()
    words = len(message.split())

    clean_msg, forced, _, _, shift = parse_commands(message)
    if forced:
        tier_rank = {"haiku": 0, "sonnet": 1, "opus": 2}
        tier_list = ["haiku", "sonnet", "opus"]
        idx = max(0, min(2, tier_rank[forced] + shift))
        return tier_list[idx]

    opus_hits = sum(1 for k in OPUS_KEYWORDS if k in lower)
    if opus_hits >= 2 or (opus_hits >= 1 and words > 80):
        return "opus"
    if words > 200:
        return "opus" if opus_hits else "sonnet"
    if "```" in message or "function " in message or "class " in message:
        return "sonnet"
    sonnet_hits = sum(1 for k in SONNET_KEYWORDS if k in lower)
    if sonnet_hits >= 1 and words > 10:
        return "sonnet"
    if history_depth >= 10 and words > 30:
        return "sonnet"
    haiku_hits = sum(1 for k in HAIKU_KEYWORDS if k in lower)
    if haiku_hits >= 1 or words <= 8:
        return "haiku"
    if words > 15:
        return "sonnet"
    return "haiku"


# ── API client ─────────────────────────────────────────────────────────────────

def meowdel_api(endpoint: str, method: str = "POST", body: dict = None) -> dict:
    """Call the Meowdel API."""
    if not MEOWDEL_API_KEY:
        raise RuntimeError("MEOWDEL_API_KEY not set. Get a key from meowdel.ai/brain/api-keys")

    r = requests.request(
        method,
        f"{MEOWDEL_API_URL}/api/v1{endpoint}",
        headers={
            "Authorization": f"Bearer {MEOWDEL_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "meowdel-cli/2.0.0",
        },
        json=body,
        timeout=120,
    )
    if not r.ok:
        try:
            err = r.json().get("error", r.text)
        except Exception:
            err = r.text
        raise RuntimeError(f"API error {r.status_code}: {err}")
    return r.json()


# ── Conversation manager ───────────────────────────────────────────────────────

class ConversationHistory:
    def __init__(self):
        HISTORY_DIR.mkdir(parents=True, exist_ok=True)
        self.messages: List[Dict[str, str]] = []

    def add(self, role: str, content: str):
        self.messages.append({"role": role, "content": content})

    def save(self) -> Path:
        ts = datetime.now().strftime("%Y%m%d-%H%M%S")
        path = HISTORY_DIR / f"meowdel-{ts}.json"
        path.write_text(json.dumps({"timestamp": datetime.now().isoformat(), "messages": self.messages}, indent=2))
        return path

    def load(self, path: Path):
        data = json.loads(path.read_text())
        self.messages = data.get("messages", [])


# ── Brain / Notes manager ─────────────────────────────────────────────────────

def _open_in_editor(initial_content: str = '', suffix: str = '.md') -> str:
    """Open content in $EDITOR, return edited content."""
    editor = os.environ.get('EDITOR', os.environ.get('VISUAL', 'nano'))
    with tempfile.NamedTemporaryFile(suffix=suffix, mode='w', delete=False, encoding='utf-8') as f:
        f.write(initial_content)
        tmppath = f.name
    try:
        subprocess.call([editor, tmppath])
        return Path(tmppath).read_text(encoding='utf-8')
    finally:
        try:
            os.unlink(tmppath)
        except OSError:
            pass


def _time_ago(iso: str) -> str:
    try:
        from datetime import timezone
        dt = datetime.fromisoformat(iso.replace('Z', '+00:00'))
        diff = datetime.now(timezone.utc) - dt
        secs = int(diff.total_seconds())
        if secs < 60: return 'just now'
        if secs < 3600: return f"{secs // 60}m ago"
        if secs < 86400: return f"{secs // 3600}h ago"
        return f"{secs // 86400}d ago"
    except Exception:
        return iso[:10]


class BrainManager:
    """Notes and brain search operations via Meowdel API."""

    def list_notes(self, limit: int = 30, tag: Optional[str] = None) -> List[dict]:
        params = f"?limit={limit}"
        if tag:
            params += f"&tag={tag}"
        return meowdel_api(f"/brain/notes{params}", method="GET")

    def get_note(self, slug: str) -> dict:
        return meowdel_api(f"/brain/notes/{slug}", method="GET")

    def create_note(self, title: str, content: str = '', tags: List[str] = None) -> dict:
        return meowdel_api("/brain/notes", method="POST", body={
            "title": title,
            "content": content or f"# {title}\n\n",
            "tags": tags or [],
        })

    def update_note(self, slug: str, title: Optional[str] = None,
                    content: Optional[str] = None, tags: Optional[List[str]] = None) -> dict:
        body = {}
        if title is not None: body['title'] = title
        if content is not None: body['content'] = content
        if tags is not None: body['tags'] = tags
        return meowdel_api(f"/brain/notes/{slug}", method="PUT", body=body)

    def delete_note(self, slug: str) -> dict:
        return meowdel_api(f"/brain/notes/{slug}", method="DELETE")

    def search(self, query: str, limit: int = 10) -> List[dict]:
        result = meowdel_api("/brain/search", method="POST", body={"query": query, "limit": limit})
        # search returns array or {results: [...]}
        if isinstance(result, list):
            return result
        return result.get('results', result.get('documents', []))


brain = BrainManager()


# ── Main CLI ───────────────────────────────────────────────────────────────────

class MeowdelCLI:
    def __init__(self):
        self.history = ConversationHistory()
        self.default_tier: Optional[str] = None   # None = auto
        self.active_skills: List[str] = []
        self.show_routing = True

    # ── Slash commands ─────────────────────────────────────────────────────────

    def handle_slash(self, cmd: str) -> bool:
        """Returns True if handled, False if unknown."""
        parts = cmd.strip().split()
        base = parts[0].lower()

        if base in ("/exit", "/quit"):
            self._farewell()
            sys.exit(0)

        elif base == "/save":
            path = self.history.save()
            print_out(f"[green]✓[/green] Saved to {path}")

        elif base == "/clear":
            self.history.messages = []
            print_out("[dim]*shakes head* History cleared.[/dim]")

        elif base == "/history":
            print_out(f"[cyan]{len(self.history.messages)}[/cyan] messages in history")

        elif base == "/routing":
            if len(parts) > 1:
                self.show_routing = parts[1].lower() in ("on", "true", "1", "yes")
            print_out(f"Routing display: {'[green]on[/green]' if self.show_routing else '[red]off[/red]'}")

        elif base == "/model":
            if len(parts) > 1 and parts[1] in ("haiku", "sonnet", "opus", "auto"):
                self.default_tier = None if parts[1] == "auto" else parts[1]
                emoji = TIER_EMOJI.get(self.default_tier, "🤖")
                print_out(f"Default model: {emoji} [bold]{self.default_tier or 'auto'}[/bold]")
            else:
                current = self.default_tier or "auto"
                print_out(f"Current: [bold]{current}[/bold] | Usage: /model [haiku|sonnet|opus|auto]")

        elif base == "/skills":
            cat_filter = ' '.join(parts[1:]).lower().strip() if len(parts) > 1 else ''
            if RICH and console:
                from rich.table import Table as RTable3
                for cat_name, slugs in SKILL_CATEGORIES.items():
                    if cat_filter and cat_filter not in cat_name.lower():
                        continue
                    t = RTable3(box=box.SIMPLE_HEAVY, show_header=True, title=f"[bold]{cat_name}[/bold]", expand=True)
                    t.add_column("Skill", style="cyan", no_wrap=True)
                    t.add_column("Description")
                    t.add_column("●", justify="center", width=3)
                    for slug, desc in BUILT_IN_SKILLS:
                        if slug not in slugs:
                            continue
                        active = slug in self.active_skills
                        t.add_row(slug, desc, "[green]●[/green]" if active else "[dim]○[/dim]")
                    console.print(t)
                if self.active_skills:
                    print_out(f"\n[green]Active:[/green] {', '.join(self.active_skills)}")
            else:
                for cat_name, slugs in SKILL_CATEGORIES.items():
                    if cat_filter and cat_filter not in cat_name.lower():
                        continue
                    print(f"\n── {cat_name} ──")
                    for slug, desc in BUILT_IN_SKILLS:
                        if slug not in slugs:
                            continue
                        marker = "● " if slug in self.active_skills else "○ "
                        print(f"  {marker}{slug}: {desc}")

        elif base == "/skill":
            if len(parts) < 2:
                print_out("Usage: /skill <name>  — toggles skill on/off")
            else:
                slug = parts[1]
                known = [s[0] for s in BUILT_IN_SKILLS]
                if slug not in known:
                    print_out(f"[red]Unknown skill:[/red] {slug}. Run /skills to see available skills.")
                elif slug in self.active_skills:
                    self.active_skills.remove(slug)
                    print_out(f"[dim]Skill deactivated:[/dim] {slug}")
                else:
                    self.active_skills.append(slug)
                    print_out(f"[green]Skill activated:[/green] {slug}")

        elif base == "/memory":
            try:
                data = meowdel_api("/brain/cascade-stats", method="GET")
                stats = data.get('stats', data)
                print_out(f"Cascade memory: {TIER_EMOJI['opus']} {stats.get('opusMemories',0)} opus  |  "
                          f"{TIER_EMOJI['sonnet']} {stats.get('sonnetMemories',0)} sonnet  |  "
                          f"{TIER_EMOJI['haiku']} {stats.get('haikuMemories',0)} haiku")
            except Exception as e:
                print_out(f"[dim]Memory stats unavailable: {e}[/dim]")

        # ── Brain / Notes commands ─────────────────────────────────────────────

        elif base == "/notes":
            query = ' '.join(parts[1:]).strip() if len(parts) > 1 else ''
            try:
                notes = brain.list_notes(limit=50)
                if query:
                    q = query.lower()
                    notes = [n for n in notes if
                             q in n.get('title','').lower() or
                             q in ' '.join(n.get('tags') or []).lower() or
                             q in (n.get('summary') or '').lower()]
                if not notes:
                    print_out(f"[dim]No notes{' matching' + repr(query) if query else ''}.[/dim]")
                elif RICH and console:
                    from rich.table import Table as RTable
                    t = RTable(box=box.SIMPLE_HEAVY, show_header=True, expand=True)
                    t.add_column("Slug", style="cyan", no_wrap=True, max_width=30)
                    t.add_column("Title")
                    t.add_column("Tags", style="dim", max_width=22)
                    t.add_column("Words", justify="right", style="dim", no_wrap=True)
                    t.add_column("Updated", justify="right", style="dim", no_wrap=True)
                    for n in notes[:40]:
                        tags = ', '.join((n.get('tags') or [])[:3])
                        t.add_row(
                            n.get('slug',''),
                            n.get('title',''),
                            tags,
                            str(n.get('wordCount') or 0),
                            _time_ago(n.get('updatedAt','')),
                        )
                    console.print(t)
                    if len(notes) > 40:
                        print_out(f"[dim]…and {len(notes)-40} more[/dim]")
                else:
                    for n in notes[:40]:
                        print(f"  {n.get('slug','')}  |  {n.get('title','')}  ({_time_ago(n.get('updatedAt',''))})")
            except Exception as e:
                print_out(f"[red]Error:[/red] {e}")

        elif base == "/note":
            if len(parts) < 2:
                print_out("Usage: /note <slug>")
            else:
                slug = parts[1]
                try:
                    note = brain.get_note(slug)
                    print_out(f"\n[bold cyan]{note.get('title','Untitled')}[/bold cyan]  [dim]{slug}[/dim]")
                    tags = note.get('tags') or []
                    if tags:
                        print_out(f"[dim]Tags: {', '.join(tags)}[/dim]")
                    if note.get('summary'):
                        print_out(f"[dim italic]{note['summary']}[/dim italic]")
                    print_out(f"[dim]{note.get('wordCount',0)}w · updated {_time_ago(note.get('updatedAt',''))}[/dim]\n")
                    content = note.get('content', '')
                    if RICH and console:
                        from rich.markdown import Markdown as RMd
                        console.print(RMd(content))
                    else:
                        print(content)
                except Exception as e:
                    print_out(f"[red]Error:[/red] {e}")

        elif base == "/new":
            title = ' '.join(parts[1:]).strip() if len(parts) > 1 else ''
            if not title:
                try:
                    if RICH and console:
                        from rich.prompt import Prompt as RPrompt
                        title = RPrompt.ask("Note title")
                    else:
                        title = input("Note title: ").strip()
                except (KeyboardInterrupt, EOFError):
                    return True
            if not title:
                return True
            print_out(f"[dim]Opening editor for \"{title}\"…[/dim]")
            initial = f"# {title}\n\n"
            content = _open_in_editor(initial)
            if content.strip() == initial.strip():
                print_out("[dim]No changes — note not created.[/dim]")
                return True
            try:
                result = brain.create_note(title, content)
                slug = result.get('slug', '')
                print_out(f"[green]✓[/green] Created: [cyan]{slug}[/cyan]")
                print_out(f"[dim]  meowdel.ai/brain/notes/{slug}[/dim]")
            except Exception as e:
                print_out(f"[red]Error:[/red] {e}")

        elif base == "/edit":
            if len(parts) < 2:
                print_out("Usage: /edit <slug>")
            else:
                slug = parts[1]
                try:
                    note = brain.get_note(slug)
                    print_out(f"[dim]Opening \"{note.get('title',slug)}\" in editor…[/dim]")
                    content = _open_in_editor(note.get('content', ''))
                    if content == note.get('content', ''):
                        print_out("[dim]No changes.[/dim]")
                    else:
                        brain.update_note(slug, content=content)
                        wc = len(content.split())
                        print_out(f"[green]✓[/green] Saved ({wc} words)")
                except Exception as e:
                    print_out(f"[red]Error:[/red] {e}")

        elif base == "/rm":
            if len(parts) < 2:
                print_out("Usage: /rm <slug>")
            else:
                slug = parts[1]
                try:
                    note = brain.get_note(slug)
                    try:
                        confirm = input(f"Delete \"{note.get('title', slug)}\"? [y/N] ").strip().lower()
                    except (KeyboardInterrupt, EOFError):
                        return True
                    if confirm == 'y':
                        brain.delete_note(slug)
                        print_out(f"[green]✓[/green] Deleted: {slug}")
                    else:
                        print_out("[dim]Cancelled.[/dim]")
                except Exception as e:
                    print_out(f"[red]Error:[/red] {e}")

        elif base == "/search":
            query = ' '.join(parts[1:]).strip()
            if not query:
                print_out("Usage: /search <query>")
            else:
                try:
                    results = brain.search(query)
                    if not results:
                        print_out("[dim]No results.[/dim]")
                    else:
                        print_out(f"[dim]{len(results)} result(s) for \"{query}\":[/dim]\n")
                        for i, r in enumerate(results[:8], 1):
                            title = r.get('title') or r.get('slug') or '?'
                            slug = r.get('slug', '')
                            snippet = (r.get('content') or r.get('summary') or '')[:120].replace('\n', ' ')
                            score = r.get('score', '')
                            score_str = f" [dim](score: {score:.2f})[/dim]" if isinstance(score, float) else ''
                            print_out(f"[bold]{i}.[/bold] [cyan]{title}[/cyan]{score_str}")
                            if slug:
                                print_out(f"   [dim]{slug}[/dim]")
                            if snippet:
                                print_out(f"   {snippet}…")
                            print_out("")
                except Exception as e:
                    print_out(f"[red]Error:[/red] {e}")

        elif base == "/tags":
            try:
                notes = brain.list_notes(limit=500)
                tag_counts: Dict[str, int] = {}
                for n in notes:
                    for t in (n.get('tags') or []):
                        tag_counts[t] = tag_counts.get(t, 0) + 1
                if not tag_counts:
                    print_out("[dim]No tags found.[/dim]")
                elif RICH and console:
                    from rich.table import Table as RTable2
                    t = RTable2(box=box.SIMPLE_HEAVY, show_header=True)
                    t.add_column("Tag", style="cyan")
                    t.add_column("Notes", justify="right")
                    for tag, count in sorted(tag_counts.items(), key=lambda x: -x[1]):
                        t.add_row(tag, str(count))
                    console.print(t)
                else:
                    for tag, count in sorted(tag_counts.items(), key=lambda x: -x[1]):
                        print(f"  {tag}  ({count})")
            except Exception as e:
                print_out(f"[red]Error:[/red] {e}")

        elif base == "/brain":
            print_out(
                "\n[bold]Brain commands:[/bold]\n"
                "  [cyan]/notes [query][/cyan]   — list notes (optional filter)\n"
                "  [cyan]/note <slug>[/cyan]     — view a note\n"
                "  [cyan]/new [title][/cyan]     — create a note (opens \\$EDITOR)\n"
                "  [cyan]/edit <slug>[/cyan]     — edit a note in \\$EDITOR\n"
                "  [cyan]/rm <slug>[/cyan]       — delete a note\n"
                "  [cyan]/search <query>[/cyan]  — semantic brain search\n"
                "  [cyan]/tags[/cyan]            — list all tags with counts\n"
                "  [cyan]/memory[/cyan]          — cascade memory stats\n"
            )

        else:
            print_out(f"[yellow]Unknown command:[/yellow] {cmd}  (type /brain for brain commands, /help for all)")
            return False

        return True

    # ── Chat ───────────────────────────────────────────────────────────────────

    def chat(self, message: str):
        """Send a message and display the response."""
        # Predict tier client-side for immediate feedback
        predicted = self.default_tier or predict_tier(message, len(self.history.messages) // 2)
        _, forced, _, msg_skills, _ = parse_commands(message)

        # Combine session skills + message skills
        all_skills = list(set(self.active_skills + msg_skills))

        if self.show_routing:
            emoji = TIER_EMOJI.get(predicted, "🐈")
            skill_str = f"  skills: {', '.join(all_skills)}" if all_skills else ""
            print_out(f"[dim]{emoji} {predicted}{skill_str}[/dim]")

        # Build the message with session skills injected if not already tagged
        full_message = message
        for skill in self.active_skills:
            if f"#skill:{skill}" not in message:
                full_message = f"{full_message} #skill:{skill}"

        if self.default_tier and f"@{self.default_tier}" not in message.split()[0]:
            # Prepend default tier override if set and not already overridden
            _, msg_forced, _, _, _ = parse_commands(message)
            if not msg_forced:
                full_message = f"@{self.default_tier} {full_message}"

        try:
            data = meowdel_api("/chat", body={
                "message": full_message,
                "conversationHistory": self.history.messages[-20:],  # last 10 turns
            })

            response = data.get("message", "")
            routing = data.get("_routing", {})

            # Store in history
            self.history.add("user", message)  # store clean message
            self.history.add("assistant", response)

            # Display response
            actual_tier = routing.get("tier", predicted)
            actual_emoji = TIER_EMOJI.get(actual_tier, "🐈")

            print_out(f"\n{actual_emoji} [bold]Meowdel[/bold]")
            if RICH and console:
                console.print(Markdown(response))
            else:
                print(response)

            if self.show_routing and routing:
                cascade = routing.get("cascadeMemoriesUsed", 0)
                skills_used = routing.get("activeSkills", [])
                details = []
                if routing.get("reason"):
                    details.append(routing["reason"])
                if cascade:
                    details.append(f"{cascade} cascade memories")
                if skills_used:
                    details.append(f"skills: {', '.join(skills_used)}")
                if details:
                    print_out(f"[dim]  ↳ {' · '.join(details)}[/dim]")

        except Exception as e:
            print_out(f"[red]Error:[/red] {e}")

    def _farewell(self):
        if self.history.messages:
            path = self.history.save()
            print_out(f"\n[dim]Auto-saved to {path}[/dim]")
        print_out("\n*waves paw goodbye* Meow! 🐾")

    # ── Modes ──────────────────────────────────────────────────────────────────

    def single_shot(self, question: str):
        self.chat(question)

    def interactive(self):
        if RICH and console:
            console.print(Panel.fit(
                "[bold cyan]Meowdel CLI[/bold cyan] — Intelligent Cat AI\n"
                "🐱 haiku  🐈 sonnet  🦁 opus  (auto-routed)\n\n"
                "[dim]Chat:   @quick/@deep  |  #skill:name  |  /skills  /model\n"
                "Notes:  /notes  /note <slug>  /new  /edit <slug>  /rm <slug>\n"
                "Brain:  /search <query>  /tags  /memory\n"
                "Other:  /save  /clear  /history  /brain  /exit[/dim]",
                border_style="cyan",
            ))
        else:
            print("Meowdel CLI — /brain for notes help, /exit to quit")

        while True:
            try:
                if RICH and console:
                    tier_label = TIER_EMOJI.get(self.default_tier, "🤖") + " " if self.default_tier else "🐾 "
                    skills_label = f"[{','.join(self.active_skills)}] " if self.active_skills else ""
                    user_input = Prompt.ask(f"\n{skills_label}[green]You[/green]")
                else:
                    user_input = input("\nYou: ")

                if not user_input.strip():
                    continue

                if user_input.startswith("/"):
                    self.handle_slash(user_input)
                    continue

                self.chat(user_input)

            except KeyboardInterrupt:
                print_out("\n[dim]*stretches* Interrupted — type /exit to quit properly.[/dim]")
            except EOFError:
                self._farewell()
                break


# ── Entry point ────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Chat with Meowdel — the AI cat with intelligent model routing",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  meowdel                                    # Interactive mode (auto-routing)
  meowdel "Fix this bug in my code"          # Sonnet (code detected)
  meowdel "@opus Design a microservices arch"# Force Opus
  meowdel "@quick What's 2+2"               # Force Haiku
  meowdel --model sonnet "Explain async/await"

Environment:
  MEOWDEL_API_KEY   Your API key from meowdel.ai/brain/api-keys
  MEOWDEL_API_URL   Override API URL (default: https://meowdel.ai)
        """,
    )
    parser.add_argument("question", nargs="?", help="Single question (omit for interactive mode)")
    parser.add_argument("--model", choices=["haiku", "sonnet", "opus", "auto"], default="auto",
                        help="Default model tier (default: auto)")
    parser.add_argument("--skill", action="append", dest="skills", default=[],
                        help="Activate a skill (repeatable): --skill code-reviewer --skill debug-assistant")
    parser.add_argument("--no-routing", action="store_true", help="Hide routing info")
    parser.add_argument("--load", type=Path, help="Load conversation history file")

    args = parser.parse_args()

    cli = MeowdelCLI()
    cli.default_tier = None if args.model == "auto" else args.model
    cli.active_skills = args.skills
    cli.show_routing = not args.no_routing

    if args.load:
        cli.history.load(args.load)
        print_out(f"[green]✓[/green] Loaded: {args.load}")

    if args.question:
        cli.single_shot(args.question)
    else:
        cli.interactive()


if __name__ == "__main__":
    main()
