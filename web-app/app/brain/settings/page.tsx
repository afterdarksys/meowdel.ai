'use client'

import { useState, useEffect } from 'react'
import { Save, Brain, Zap, FileText, Layout, ChevronDown } from 'lucide-react'

interface UserSettings {
  customSystemPrompt: string | null
  meowdelPersonaName: string | null
  preferredModel: string | null
  defaultSwarmMode: string | null
  autoEmbedNotes: boolean
  autoLinkNotes: boolean
  autoSummarizeNotes: boolean
  editorTheme: string | null
  sidebarCollapsed: boolean
  showWordCount: boolean
  defaultNoteView: string | null
}

const DEFAULT_SETTINGS: UserSettings = {
  customSystemPrompt: '',
  meowdelPersonaName: '',
  preferredModel: 'auto',
  defaultSwarmMode: 'auto',
  autoEmbedNotes: true,
  autoLinkNotes: true,
  autoSummarizeNotes: false,
  editorTheme: 'dark',
  sidebarCollapsed: false,
  showWordCount: true,
  defaultNoteView: 'editor',
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/brain/user-settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await fetch('/api/brain/user-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  function set<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Loading settings...
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Meowdel AI */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">
          <Brain className="w-4 h-4" /> Meowdel AI
        </h2>
        <div className="space-y-3 bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Preferred Model</label>
            <select
              value={settings.preferredModel ?? 'auto'}
              onChange={e => set('preferredModel', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="auto">Auto (intelligent routing)</option>
              <option value="haiku">Always Haiku (fastest, cheapest)</option>
              <option value="sonnet">Always Sonnet (balanced)</option>
              <option value="opus">Always Opus (most capable)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Persona Name</label>
            <input
              type="text"
              value={settings.meowdelPersonaName ?? ''}
              onChange={e => set('meowdelPersonaName', e.target.value)}
              placeholder="e.g. Mittens, Whiskers..."
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Custom System Prompt</label>
            <textarea
              value={settings.customSystemPrompt ?? ''}
              onChange={e => set('customSystemPrompt', e.target.value)}
              placeholder="Add custom instructions that Meowdel will always follow..."
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm placeholder-gray-500 resize-none"
            />
          </div>
        </div>
      </section>

      {/* Workflows */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">
          <Zap className="w-4 h-4" /> Agent Workflows
        </h2>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <label className="block text-sm text-gray-300 mb-1">Default Swarm Mode</label>
          <select
            value={settings.defaultSwarmMode ?? 'auto'}
            onChange={e => set('defaultSwarmMode', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="auto">Auto</option>
            <option value="analyze">Analyze</option>
            <option value="organize">Organize</option>
            <option value="synthesize">Synthesize</option>
            <option value="deep_dive">Deep Dive</option>
          </select>
        </div>
      </section>

      {/* Notes */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">
          <FileText className="w-4 h-4" /> Notes
        </h2>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-3">
          {[
            { key: 'autoEmbedNotes' as const, label: 'Auto-embed notes on save', desc: 'Automatically index notes for semantic search' },
            { key: 'autoLinkNotes' as const, label: 'Auto-link related notes', desc: 'Suggest backlinks when creating notes' },
            { key: 'autoSummarizeNotes' as const, label: 'Auto-summarize on import', desc: 'Generate summaries when importing documents' },
            { key: 'showWordCount' as const, label: 'Show word count', desc: 'Display word count in the editor' },
          ].map(({ key, label, desc }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!settings[key]}
                onChange={e => set(key, e.target.checked)}
                className="mt-0.5 accent-purple-500"
              />
              <div>
                <div className="text-sm text-white">{label}</div>
                <div className="text-xs text-gray-500">{desc}</div>
              </div>
            </label>
          ))}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Default Note View</label>
            <select
              value={settings.defaultNoteView ?? 'editor'}
              onChange={e => set('defaultNoteView', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="editor">Editor</option>
              <option value="preview">Preview</option>
              <option value="split">Split</option>
            </select>
          </div>
        </div>
      </section>

      {/* Editor */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">
          <Layout className="w-4 h-4" /> Editor
        </h2>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Theme</label>
            <select
              value={settings.editorTheme ?? 'dark'}
              onChange={e => set('editorTheme', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="dracula">Dracula</option>
              <option value="monokai">Monokai</option>
            </select>
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.sidebarCollapsed}
              onChange={e => set('sidebarCollapsed', e.target.checked)}
              className="mt-0.5 accent-purple-500"
            />
            <div>
              <div className="text-sm text-white">Start with sidebar collapsed</div>
              <div className="text-xs text-gray-500">Sidebar will be hidden on page load</div>
            </div>
          </label>
        </div>
      </section>
    </div>
  )
}
