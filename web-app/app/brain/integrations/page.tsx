'use client'

import { useState, useEffect } from 'react'
import {
  Link2, BookOpen, Github, Rss, CheckCircle2, AlertCircle,
  Loader2, Trash2, RefreshCw, Plus, ExternalLink, Zap
} from 'lucide-react'

interface Integration {
  id: string
  provider: string
  isActive: boolean
  hasToken: boolean
  lastSyncAt: string | null
  syncedCount: number
  config?: Record<string, unknown>
}

interface IntegrationCardProps {
  title: string
  description: string
  icon: React.ReactNode
  provider: string
  tier: 'free' | 'pro' | 'team'
  integration?: Integration
  tokenLabel: string
  tokenPlaceholder: string
  extraFields?: { key: string; label: string; placeholder: string }[]
  docsUrl?: string
  onSave: (provider: string, token: string, extra: Record<string, string>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onSync: (provider: string) => Promise<void>
}

function IntegrationCard({
  title, description, icon, provider, tier, integration,
  tokenLabel, tokenPlaceholder, extraFields = [], docsUrl,
  onSave, onDelete, onSync
}: IntegrationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [token, setToken] = useState('')
  const [extra, setExtra] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const handleSave = async () => {
    if (!token.trim()) return
    setSaving(true)
    await onSave(provider, token, extra)
    setSaving(false)
    setToken('')
    setExpanded(false)
  }

  const handleSync = async () => {
    setSyncing(true)
    await onSync(provider)
    setSyncing(false)
  }

  const tierColors: Record<string, string> = {
    free: 'bg-zinc-700 text-zinc-300',
    pro: 'bg-purple-900/60 text-purple-300',
    team: 'bg-blue-900/60 text-blue-300',
  }

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{title}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${tierColors[tier]}`}>{tier}</span>
              {integration?.isActive && (
                <span className="flex items-center gap-1 text-[10px] text-green-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            {integration?.lastSyncAt && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                Last sync: {new Date(integration.lastSyncAt).toLocaleString()} · {integration.syncedCount} items synced
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {docsUrl && (
            <a href={docsUrl} target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-md hover:bg-secondary text-muted-foreground transition-colors">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {integration?.isActive && (
            <>
              <button onClick={handleSync} disabled={syncing}
                className="p-2 rounded-md hover:bg-secondary text-muted-foreground transition-colors" title="Sync now">
                {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </button>
              <button onClick={() => onDelete(integration.id)}
                className="p-2 rounded-md hover:bg-destructive/10 text-destructive/70 transition-colors" title="Disconnect">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors bg-secondary hover:bg-secondary/80"
          >
            <Plus className="w-4 h-4" />
            {integration?.isActive ? 'Update' : 'Connect'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-muted/30 p-5 space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">{tokenLabel}</label>
            <input
              type="password"
              placeholder={tokenPlaceholder}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {extraFields.map(field => (
            <div key={field.key} className="space-y-1">
              <label className="text-sm font-medium">{field.label}</label>
              <input
                type="text"
                placeholder={field.placeholder}
                value={extra[field.key] ?? ''}
                onChange={(e) => setExtra(prev => ({ ...prev, [field.key]: e.target.value }))}
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving || !token.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Save & Connect
            </button>
            <button onClick={() => setExpanded(false)}
              className="px-4 py-2 rounded-lg text-sm border hover:bg-secondary transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// RSS Feed Manager
function RssFeedManager({ feeds, onAdd, onDelete }: {
  feeds: { id: string; url: string; title?: string }[]
  onAdd: (url: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [newUrl, setNewUrl] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!newUrl.trim()) return
    setAdding(true)
    await onAdd(newUrl)
    setAdding(false)
    setNewUrl('')
  }

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div className="p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
          <Rss className="w-5 h-5 text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">RSS / Atom Feeds</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-purple-900/60 text-purple-300">Pro</span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Auto-import articles from RSS feeds into your Brain</p>
        </div>
      </div>

      <div className="border-t px-5 py-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://blog.example.com/rss.xml"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button onClick={handleAdd} disabled={adding || !newUrl.trim()}
            className="px-4 py-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg text-sm font-medium hover:bg-orange-500/20 transition-colors disabled:opacity-50">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Feed'}
          </button>
        </div>

        {feeds.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No feeds configured yet</p>
        ) : (
          <div className="space-y-2">
            {feeds.map(feed => (
              <div key={feed.id} className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/30 rounded-lg text-sm">
                <div className="min-w-0">
                  {feed.title && <p className="font-medium truncate">{feed.title}</p>}
                  <p className="text-muted-foreground truncate text-xs">{feed.url}</p>
                </div>
                <button onClick={() => onDelete(feed.id)} className="shrink-0 p-1.5 rounded hover:bg-destructive/10 text-destructive/70 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [rssFeeds, setRssFeeds] = useState<{ id: string; url: string; title?: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadData = async () => {
    try {
      const [intRes, rssRes] = await Promise.all([
        fetch('/api/brain/integrations').then(r => r.json()),
        fetch('/api/brain/integrations/rss').then(r => r.json()),
      ])
      if (Array.isArray(intRes)) setIntegrations(intRes)
      if (Array.isArray(rssRes)) setRssFeeds(rssRes)
    } catch {
      showToast('Failed to load integrations', 'err')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleSave = async (provider: string, token: string, extra: Record<string, string>) => {
    try {
      const res = await fetch('/api/brain/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, accessToken: token, config: extra }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      showToast(`${provider} connected`)
      loadData()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to connect', 'err')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/brain/integrations?id=${id}`, { method: 'DELETE' })
      showToast('Integration removed')
      loadData()
    } catch {
      showToast('Failed to remove', 'err')
    }
  }

  const handleSync = async (provider: string) => {
    try {
      const endpoint = provider === 'notion' ? '/api/brain/integrations/notion'
        : provider === 'github' ? '/api/brain/integrations/github'
        : '/api/brain/integrations'
      const res = await fetch(endpoint, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast(`Synced ${data.syncedCount ?? 0} items`)
      loadData()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Sync failed', 'err')
    }
  }

  const handleAddFeed = async (url: string) => {
    try {
      const res = await fetch('/api/brain/integrations/rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      showToast('Feed added')
      loadData()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to add feed', 'err')
    }
  }

  const handleDeleteFeed = async (id: string) => {
    try {
      await fetch(`/api/brain/integrations/rss?id=${id}`, { method: 'DELETE' })
      showToast('Feed removed')
      loadData()
    } catch {
      showToast('Failed to remove feed', 'err')
    }
  }

  const getIntegration = (provider: string) => integrations.find(i => i.provider === provider)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto bg-background p-8 pt-20">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-primary" />
            Integrations
          </h1>
          <p className="text-muted-foreground">Connect your tools to automatically sync knowledge into your Brain.</p>
        </div>

        {toast && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
            toast.type === 'ok' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {toast.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}

        <IntegrationCard
          title="Notion"
          description="Import Notion pages and databases into Brain notes. Syncs automatically."
          icon={<BookOpen className="w-5 h-5 text-primary" />}
          provider="notion"
          tier="pro"
          integration={getIntegration('notion')}
          tokenLabel="Notion Integration Token"
          tokenPlaceholder="secret_..."
          extraFields={[{ key: 'databaseId', label: 'Database ID (optional)', placeholder: 'Leave blank to sync all pages' }]}
          docsUrl="https://www.notion.so/my-integrations"
          onSave={handleSave}
          onDelete={handleDelete}
          onSync={handleSync}
        />

        <IntegrationCard
          title="GitHub"
          description="Sync README files, issues, and wikis from your repositories into Brain."
          icon={<Github className="w-5 h-5" />}
          provider="github"
          tier="pro"
          integration={getIntegration('github')}
          tokenLabel="GitHub Personal Access Token"
          tokenPlaceholder="ghp_..."
          extraFields={[{ key: 'repo', label: 'Repository (optional)', placeholder: 'owner/repo — leave blank for all repos' }]}
          docsUrl="https://github.com/settings/tokens"
          onSave={handleSave}
          onDelete={handleDelete}
          onSync={handleSync}
        />

        <RssFeedManager
          feeds={rssFeeds}
          onAdd={handleAddFeed}
          onDelete={handleDeleteFeed}
        />

        <div className="bg-muted/30 border rounded-xl p-5 text-sm text-muted-foreground">
          <p className="font-medium mb-1 text-foreground">More integrations coming soon</p>
          <p>Slack, Linear, Jira, Google Drive, and more. Tokens are encrypted at rest.</p>
        </div>
      </div>
    </div>
  )
}
