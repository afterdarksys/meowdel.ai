'use client'

import { useState, useEffect } from 'react'
import { Key, Plus, Trash2, Check, Copy, Eye, EyeOff } from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  lastUsedAt: string | null
  createdAt: string
  usageCount: number
}

export default function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [newKeyName, setNewKeyName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/profile/api-keys')
      const data = await res.json()
      if (data.success) setKeys(data.keys)
    } catch (e) {
      console.error('Failed to fetch keys', e)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim()) return

    setGenerating(true)
    try {
      const res = await fetch('/api/profile/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName })
      })
      const data = await res.json()
      if (data.success) {
        setNewlyGeneratedKey(data.rawKey)
        setKeys(prev => [...prev, data.key])
        setNewKeyName('')
      }
    } catch (e) {
      console.error('Failed to generate key', e)
    } finally {
      setGenerating(false)
    }
  }

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return
    
    try {
      const res = await fetch('/api/profile/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const data = await res.json()
      if (data.success) {
        setKeys(prev => prev.filter(k => k.id !== id))
      }
    } catch (e) {
      console.error('Failed to revoke key', e)
    }
  }

  const copyToClipboard = () => {
    if (newlyGeneratedKey) {
      navigator.clipboard.writeText(newlyGeneratedKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) return <div className="text-gray-400 animate-pulse">Loading API Keys...</div>

  return (
    <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden mt-8">
      <div className="absolute top-0 right-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"></div>
      
      <h3 className="text-2xl font-bold mb-6 flex items-center bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
        <Key className="w-6 h-6 mr-3 text-pink-400" /> API Keys
      </h3>

      <div className="space-y-6 relative z-10">
        <p className="text-gray-300 text-sm">
          Use these keys to access Meowdel's "Brain" API endpoints outside of the UI. Keep them secret, keep them safe. *purr*
        </p>

        {/* Create Key Form */}
        <form onSubmit={handleGenerate} className="flex gap-4 items-center">
          <input 
            type="text" 
            placeholder="Key Name (e.g. My Nextjs App)" 
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-pink-500/50 text-white placeholder-gray-500 transition-colors"
            required
            maxLength={50}
          />
          <button 
            type="submit" 
            disabled={generating || !newKeyName.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-pink-500/20 disabled:opacity-50 flex items-center gap-2 transition-all"
          >
            {generating ? 'Generating...' : <><Plus className="w-4 h-4" /> Create Key</>}
          </button>
        </form>

        {/* Newly Generated Key Alert */}
        {newlyGeneratedKey && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 relative">
            <h4 className="text-green-400 font-bold mb-2">New Key Generated!</h4>
            <p className="text-sm text-gray-300 mb-4">
              Please copy this key now. For your security, <strong className="text-white">it will never be shown again</strong>.
            </p>
            <div className="flex items-center gap-2">
              <code className="bg-black/50 text-green-300 px-4 py-3 rounded-lg flex-1 font-mono text-sm break-all">
                {newlyGeneratedKey}
              </code>
              <button 
                onClick={copyToClipboard}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/10"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-300" />}
              </button>
            </div>
            <button 
              onClick={() => setNewlyGeneratedKey(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* List Keys */}
        <div className="space-y-3 mt-6">
          {keys.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-xl">
              No API keys generated yet.
            </div>
          ) : (
            keys.map(key => (
              <div key={key.id} className="bg-white/5 border border-white/5 hover:border-white/10 rounded-xl p-5 flex items-center justify-between transition-colors group">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-semibold text-gray-200">{key.name}</h4>
                    <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-gray-400 border border-white/5">
                      {key.keyPrefix}••••••••••••
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                    <span>Last used: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleRevoke(key.id)}
                  className="p-2 text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                  title="Revoke Key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
