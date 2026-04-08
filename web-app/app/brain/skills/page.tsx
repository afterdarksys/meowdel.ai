'use client'

import { useState, useMemo, useEffect } from 'react'
import { BUILT_IN_SKILLS, SKILL_CATEGORIES, Skill } from '@/lib/intelligence/skills'
import { Search, Zap, Check, Copy, ChevronRight } from 'lucide-react'

const TIER_BADGE: Record<string, { label: string; color: string }> = {
  haiku:  { label: '🐱 Haiku',  color: 'bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20' },
  sonnet: { label: '🐈 Sonnet', color: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' },
  opus:   { label: '🦁 Opus',   color: 'bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20' },
}

function SkillCard({
  skill,
  active,
  onToggle,
}: {
  skill: Skill
  active: boolean
  onToggle: () => void
}) {
  const [copied, setCopied] = useState(false)
  const cat = SKILL_CATEGORIES.find(c => c.slug === skill.category)
  const tier = TIER_BADGE[skill.preferredTier]

  function copyTag() {
    navigator.clipboard.writeText(`#skill:${skill.slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border p-5 transition-all duration-200 cursor-default
        ${active
          ? 'bg-primary/5 border-primary/40 shadow-sm shadow-primary/10'
          : 'bg-card/50 border-border hover:border-border/80 hover:bg-card'
        }`}
    >
      {/* Active glow */}
      {active && (
        <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/30 pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl shrink-0">{cat?.emoji ?? '⚡'}</span>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground leading-tight truncate">{skill.name}</h3>
            <span className="text-xs text-muted-foreground">{cat?.label}</span>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={onToggle}
          className={`shrink-0 w-9 h-5 rounded-full transition-all duration-200 relative
            ${active ? 'bg-primary' : 'bg-muted'}`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200
              ${active ? 'left-[18px]' : 'left-0.5'}`}
          />
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-4">
        {skill.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 mt-auto">
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${tier.color}`}>
          {tier.label}
        </span>
        <button
          onClick={copyTag}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded hover:bg-secondary"
          title={`Copy #skill:${skill.slug}`}
        >
          {copied
            ? <><Check className="w-3 h-3 text-green-400" /> Copied</>
            : <><Copy className="w-3 h-3" /> #{skill.slug}</>
          }
        </button>
      </div>
    </div>
  )
}

export default function SkillsPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeSkills, setActiveSkills] = useState<Set<string>>(new Set())
  const [settingsSaved, setSettingsSaved] = useState(false)

  // Load active skills from user settings
  useEffect(() => {
    fetch('/api/brain/user-settings')
      .then(r => r.json())
      .then(data => {
        const extra = data?.settings?.extra as Record<string, unknown> | null
        const slugs: string[] = Array.isArray(extra?.skills) ? extra.skills as string[] : []
        setActiveSkills(new Set(slugs))
      })
      .catch(() => {})
  }, [])

  async function saveSkills(next: Set<string>) {
    setActiveSkills(next)
    await fetch('/api/brain/user-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ extra: { skills: [...next] } }),
    }).catch(() => {})
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 1500)
  }

  function toggle(slug: string) {
    const next = new Set(activeSkills)
    if (next.has(slug)) next.delete(slug)
    else next.add(slug)
    saveSkills(next)
  }

  const filtered = useMemo(() => {
    let skills = BUILT_IN_SKILLS
    if (activeCategory !== 'all') {
      skills = skills.filter(s => s.category === activeCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      skills = skills.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.includes(q)) ||
        s.slug.includes(q)
      )
    }
    return skills
  }, [search, activeCategory])

  const countByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    BUILT_IN_SKILLS.forEach(s => { map[s.category] = (map[s.category] ?? 0) + 1 })
    return map
  }, [])

  const activeList = BUILT_IN_SKILLS.filter(s => activeSkills.has(s.slug))

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Left sidebar — categories */}
      <aside className="w-52 shrink-0 border-r border-border flex flex-col overflow-y-auto py-4 bg-card/20">
        <div className="px-4 mb-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categories</h2>
        </div>
        <nav className="flex flex-col gap-0.5 px-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors
              ${activeCategory === 'all'
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
          >
            <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5" /> All skills</span>
            <span className="text-xs opacity-60">{BUILT_IN_SKILLS.length}</span>
          </button>
          {SKILL_CATEGORIES.map(cat => (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors
                ${activeCategory === cat.slug
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
            >
              <span className="flex items-center gap-2 truncate">
                <span>{cat.emoji}</span>
                <span className="truncate">{cat.label}</span>
              </span>
              <span className="text-xs opacity-60 shrink-0">{countByCategory[cat.slug] ?? 0}</span>
            </button>
          ))}
        </nav>

        {/* Active skills */}
        {activeList.length > 0 && (
          <div className="mt-auto px-4 pt-4 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Active ({activeList.length})
            </p>
            <div className="flex flex-col gap-1">
              {activeList.map(s => {
                const cat = SKILL_CATEGORIES.find(c => c.slug === s.category)
                return (
                  <div key={s.slug} className="flex items-center gap-1.5 text-xs text-foreground">
                    <span>{cat?.emoji}</span>
                    <span className="truncate">{s.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Skill Library
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Activate skills to give Meowdel specialized knowledge for your session.
                Use <code className="bg-secondary px-1 rounded text-[11px]">#skill:name</code> in chat, or toggle below.
              </p>
            </div>
            {settingsSaved && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search skills by name, description, or tag..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Zap className="w-10 h-10 text-muted-foreground/20 mb-3" />
              <p className="text-muted-foreground text-sm">No skills match your search.</p>
            </div>
          ) : (
            <>
              {search && (
                <p className="text-xs text-muted-foreground mb-4">
                  {filtered.length} skill{filtered.length !== 1 ? 's' : ''} matching "{search}"
                </p>
              )}
              {/* Grouped by category when showing all without search */}
              {activeCategory === 'all' && !search ? (
                SKILL_CATEGORIES.map(cat => {
                  const catSkills = filtered.filter(s => s.category === cat.slug)
                  if (catSkills.length === 0) return null
                  return (
                    <div key={cat.slug} className="mb-8">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">{cat.emoji}</span>
                        <h2 className="text-sm font-semibold text-foreground">{cat.label}</h2>
                        <span className="text-xs text-muted-foreground">({catSkills.length})</span>
                        <button
                          onClick={() => setActiveCategory(cat.slug)}
                          className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          See all <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {catSkills.map(skill => (
                          <SkillCard
                            key={skill.slug}
                            skill={skill}
                            active={activeSkills.has(skill.slug)}
                            onToggle={() => toggle(skill.slug)}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filtered.map(skill => (
                    <SkillCard
                      key={skill.slug}
                      skill={skill}
                      active={activeSkills.has(skill.slug)}
                      onToggle={() => toggle(skill.slug)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
