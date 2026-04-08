'use client'

import { useState, useEffect } from 'react'
import { KeyRound, Plus, Trash2, Copy, CheckCircle2, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  permissions: string[]
  lastUsedAt: string | null
  usageCount: number
  expiresAt: string | null
  createdAt: string
}

const PERMISSION_OPTIONS = [
  { id: 'chat', label: 'Chat', desc: 'Send messages to Meowdel' },
  { id: 'brain:read', label: 'Brain Read', desc: 'Read notes, search, embeddings' },
  { id: 'brain:write', label: 'Brain Write', desc: 'Create and edit notes' },
  { id: 'workflows', label: 'Workflows', desc: 'Trigger agent workflows' },
  { id: 'code-review', label: 'Code Review', desc: 'Run code graph scans' },
]

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [selectedPerms, setSelectedPerms] = useState<string[]>(['chat', 'brain:read'])
  const [expiresInDays, setExpiresInDays] = useState<number | ''>('')
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/brain/api-keys')
      if (res.ok) setKeys(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchKeys() }, [])

  const createKey = async () => {
    if (!newKeyName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/brain/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          permissions: selectedPerms,
          expiresInDays: expiresInDays || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNewKeyValue(data.key)
      setNewKeyName('')
      setShowForm(false)
      await fetchKeys()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to create key')
    } finally {
      setCreating(false)
    }
  }

  const revokeKey = async (id: string) => {
    if (!confirm('Revoke this API key? This cannot be undone.')) return
    setRevoking(id)
    try {
      await fetch('/api/brain/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setKeys(prev => prev.filter(k => k.id !== id))
    } finally {
      setRevoking(null)
    }
  }

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const togglePerm = (perm: string) => {
    setSelectedPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm])
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <KeyRound className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold">API Keys</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Authenticate API clients — AI assistants, scripts, integrations — using <code className="bg-secondary px-1 rounded text-xs">Authorization: Bearer mwdl_…</code>
        </p>
      </div>

      {/* Newly created key — shown once */}
      {newKeyValue && (
        <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-700 dark:text-green-400">API key created</p>
              <p className="text-xs text-muted-foreground mt-0.5">Copy it now — it will never be shown again.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-background border rounded-lg px-4 py-2.5 font-mono text-sm">
            <span className="flex-1 truncate">{newKeyValue}</span>
            <button onClick={() => copyKey(newKeyValue)} className="text-muted-foreground hover:text-foreground flex-shrink-0 transition-colors">
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={() => setNewKeyValue(null)} className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors">
            Dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm ? (
        <div className="bg-card border rounded-xl p-5 mb-6">
          <h2 className="font-semibold mb-4">New API Key</h2>
          <input
            type="text"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g. Claude Code, CI Pipeline)"
            className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
          />

          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Permissions</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PERMISSION_OPTIONS.map(p => (
                <label key={p.id} className="flex items-start gap-2 p-3 rounded-lg border cursor-pointer hover:bg-secondary/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedPerms.includes(p.id)}
                    onChange={() => togglePerm(p.id)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-medium">{p.label}</div>
                    <div className="text-xs text-muted-foreground">{p.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Expires in (days, optional)
            </label>
            <input
              type="number"
              value={expiresInDays}
              onChange={e => setExpiresInDays(e.target.value ? parseInt(e.target.value) : '')}
              placeholder="Never"
              min={1}
              className="w-32 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={createKey}
              disabled={!newKeyName.trim() || creating}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {creating ? 'Creating…' : 'Create Key'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-lg text-sm border hover:bg-secondary transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-secondary transition-colors mb-6"
        >
          <Plus className="w-4 h-4" />
          New API Key
        </button>
      )}

      {/* Usage note */}
      <div className="bg-secondary/50 border rounded-lg p-4 mb-6 text-sm">
        <p className="font-medium mb-1 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-muted-foreground" /> Usage</p>
        <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
{`# Chat with Meowdel
curl https://meowdel.ai/api/pets/meowdel/chat \\
  -H "Authorization: Bearer mwdl_..." \\
  -H "Content-Type: application/json" \\
  -d '{"message":"Hello Meowdel!"}'

# Brain search
curl https://meowdel.ai/api/brain/search \\
  -H "Authorization: Bearer mwdl_..." \\
  -d '{"query":"TypeScript patterns"}'`}
        </pre>
      </div>

      {/* Key list */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : keys.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <KeyRound className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No API keys yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map(key => (
            <div key={key.id} className="bg-card border rounded-lg px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{key.name}</span>
                  <code className="text-xs bg-secondary px-1.5 py-0.5 rounded font-mono">{key.keyPrefix}…</code>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {key.permissions.map(p => (
                    <span key={p} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{p}</span>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Used {key.usageCount}× · Created {new Date(key.createdAt).toLocaleDateString()}
                  {key.lastUsedAt && ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                  {key.expiresAt && ` · Expires ${new Date(key.expiresAt).toLocaleDateString()}`}
                </div>
              </div>
              <button
                onClick={() => revokeKey(key.id)}
                disabled={revoking === key.id}
                className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0 p-1.5 rounded hover:bg-red-500/10"
                title="Revoke key"
              >
                {revoking === key.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
