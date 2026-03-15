'use client'

import { useState, useEffect } from 'react'
import { Github, Save, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function GithubIntegration() {
  const [isLinked, setIsLinked] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [tokenInput, setTokenInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/profile/github')
      if (res.ok) {
        const data = await res.json()
        setIsLinked(data.linked)
        if (data.updatedAt) setUpdatedAt(data.updatedAt)
      }
    } catch (err) {
      console.error('Failed to fetch github status', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tokenInput.trim()) return

    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/profile/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pat: tokenInput.trim() })
      })
      const data = await res.json()
      
      if (data.success) {
        setIsLinked(true)
        setTokenInput('')
        setUpdatedAt(new Date().toISOString())
      } else {
        setError(data.error || 'Failed to save token')
      }
    } catch (err) {
      setError('Network error occurred.')
    } finally {
      setSaving(false)
    }
  }

  const handleRevoke = async () => {
    if (!confirm('Are you sure you want to remove your GitHub token? Meowdel will lose access to your repositories.')) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/profile/github', { method: 'DELETE' })
      if (res.ok) {
        setIsLinked(false)
        setUpdatedAt(null)
      }
    } catch (err) {
      console.error('Failed to revoke github pat', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-gray-400 animate-pulse mt-8">Loading GitHub Status...</div>

  return (
    <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden mt-8">
      <div className="absolute bottom-0 right-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
      
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="text-2xl font-bold flex items-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
          <Github className="w-6 h-6 mr-3 text-blue-400" /> GitHub Integration
        </h3>
        
        {isLinked ? (
          <span className="flex items-center text-sm text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
            <CheckCircle2 className="w-4 h-4 mr-2" /> Connected
          </span>
        ) : (
          <span className="flex items-center text-sm text-gray-400 bg-gray-400/10 px-3 py-1 rounded-full border border-gray-400/20">
            Not Connected
          </span>
        )}
      </div>

      <div className="space-y-6 relative z-10">
        <p className="text-gray-300 text-sm">
          Provide a GitHub Personal Access Token (PAT) so Meowdel can natively read your private and public repositories during chat. We only require `repo` scope to read code.
        </p>

        {error && (
            <div className="flex items-center p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
        )}

        {!isLinked ? (
          <form onSubmit={handleSaveToken} className="flex gap-4 items-center">
            <input 
              type="password" 
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50 text-white placeholder-gray-500 transition-colors font-mono"
              required
            />
            <button 
              type="submit" 
              disabled={saving || !tokenInput.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {saving ? 'Verifying...' : <><Save className="w-4 h-4" /> Save Token</>}
            </button>
          </form>
        ) : (
          <div className="bg-white/5 border border-white/5 rounded-xl p-5 flex items-center justify-between transition-colors">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h4 className="font-semibold text-gray-200">GitHub Access Token</h4>
                <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-gray-400 border border-white/5">
                  ghp_•••••••••••••••••••••••••••••
                </span>
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                 <span>Last updated: {updatedAt ? new Date(updatedAt).toLocaleDateString() : 'Unknown'}</span>
              </div>
            </div>
            
            <button 
              onClick={handleRevoke}
              disabled={saving}
              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
              title="Remove Integration"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
