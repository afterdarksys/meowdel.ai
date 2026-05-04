'use client'

import { useState, useEffect } from 'react'

const EVENTS = [
  { id: 'note.created', label: 'Note Created', desc: 'Fires when a new note is saved' },
  { id: 'note.updated', label: 'Note Updated', desc: 'Fires when a note is edited' },
  { id: 'note.deleted', label: 'Note Deleted', desc: 'Fires when a note is deleted' },
  { id: 'note.published', label: 'Note Published', desc: 'Fires when isPublic is set to true' },
  { id: 'note.tagged', label: 'Note Tagged', desc: 'Fires when tags are added or changed' },
]

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  isActive: boolean
  lastTriggeredAt: string | null
  lastStatusCode: number | null
  failureCount: number
  secret: string
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/brain/webhooks')
      .then(r => r.json())
      .then(data => { setWebhooks(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function toggleEvent(id: string) {
    setSelectedEvents(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  async function createWebhook() {
    setError('')
    if (!name.trim() || !url.trim() || selectedEvents.length === 0) {
      setError('Name, URL, and at least one event are required.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/brain/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, events: selectedEvents }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create'); return }
      setWebhooks(prev => [...prev, data])
      setShowForm(false)
      setName(''); setUrl(''); setSelectedEvents([])
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(webhook: Webhook) {
    const res = await fetch('/api/brain/webhooks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: webhook.id, isActive: !webhook.isActive }),
    })
    if (res.ok) {
      const updated = await res.json()
      setWebhooks(prev => prev.map(w => w.id === webhook.id ? updated : w))
    }
  }

  async function deleteWebhook(id: string) {
    if (!confirm('Delete this webhook?')) return
    await fetch(`/api/brain/webhooks?id=${id}`, { method: 'DELETE' })
    setWebhooks(prev => prev.filter(w => w.id !== id))
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Outbound Webhooks</h1>
          <p className="text-zinc-400 text-sm mt-1">Send note events to external services like Zapier, Make, or your own API</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-semibold transition-colors"
        >
          + New Webhook
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">New Webhook</h2>
          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="space-y-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Zapier trigger"
                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Endpoint URL</label>
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://hooks.zapier.com/..."
                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-2 block">Trigger Events</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {EVENTS.map(ev => (
                  <label key={ev.id} className="flex items-start gap-2.5 p-3 rounded-xl border border-zinc-700 hover:border-zinc-500 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(ev.id)}
                      onChange={() => toggleEvent(ev.id)}
                      className="mt-0.5 accent-purple-500"
                    />
                    <div>
                      <p className="text-sm font-medium">{ev.label}</p>
                      <p className="text-xs text-zinc-500">{ev.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={createWebhook}
              disabled={saving}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors"
            >
              {saving ? 'Creating…' : 'Create Webhook'}
            </button>
            <button
              onClick={() => { setShowForm(false); setError('') }}
              className="px-4 py-2 border border-zinc-700 hover:border-zinc-500 rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Webhook List */}
      {loading ? (
        <p className="text-zinc-500 text-sm">Loading…</p>
      ) : webhooks.length === 0 ? (
        <div className="text-center py-16 text-zinc-600">
          <p className="text-4xl mb-3">🔗</p>
          <p className="font-medium">No webhooks yet</p>
          <p className="text-sm mt-1">Connect Meowdel to Zapier, Make, or any webhook endpoint</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map(hook => (
            <div key={hook.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${hook.isActive ? 'bg-green-400' : 'bg-zinc-600'}`} />
                    <p className="font-semibold truncate">{hook.name}</p>
                    {hook.failureCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-xs">
                        {hook.failureCount} failures
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-500 text-xs mt-0.5 truncate ml-4">{hook.url}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(hook)}
                    className="px-3 py-1 border border-zinc-700 hover:border-zinc-500 rounded-lg text-xs transition-colors"
                  >
                    {hook.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => deleteWebhook(hook.id)}
                    className="px-3 py-1 border border-red-800/50 hover:border-red-600 text-red-400 rounded-lg text-xs transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {hook.events.map(ev => (
                  <span key={ev} className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md text-xs">
                    {ev}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-500">
                {hook.lastTriggeredAt && (
                  <span>Last fired {new Date(hook.lastTriggeredAt).toLocaleString()}</span>
                )}
                {hook.lastStatusCode && (
                  <span className={hook.lastStatusCode < 300 ? 'text-green-500' : 'text-red-400'}>
                    HTTP {hook.lastStatusCode}
                  </span>
                )}
                <button
                  onClick={() => setRevealedSecrets(prev => {
                    const next = new Set(prev)
                    prev.has(hook.id) ? next.delete(hook.id) : next.add(hook.id)
                    return next
                  })}
                  className="text-zinc-600 hover:text-zinc-400 transition-colors ml-auto"
                >
                  {revealedSecrets.has(hook.id) ? 'Hide secret' : 'Show secret'}
                </button>
              </div>

              {revealedSecrets.has(hook.id) && (
                <div className="bg-black/40 rounded-xl px-3 py-2">
                  <p className="text-xs text-zinc-400 mb-1">Signing secret (verify X-Meowdel-Signature header)</p>
                  <code className="text-xs text-green-400 break-all">{hook.secret}</code>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 text-sm text-zinc-400 space-y-2">
        <p className="font-medium text-zinc-300">How it works</p>
        <p>Meowdel sends a <code className="text-purple-400">POST</code> request with a JSON payload to your endpoint when the selected events fire.</p>
        <p>Verify authenticity with the <code className="text-purple-400">X-Meowdel-Signature</code> header (HMAC-SHA256 of the request body using your secret).</p>
        <p>Works with <strong>Zapier</strong>, <strong>Make</strong>, <strong>n8n</strong>, and any custom webhook endpoint.</p>
      </div>
    </div>
  )
}
