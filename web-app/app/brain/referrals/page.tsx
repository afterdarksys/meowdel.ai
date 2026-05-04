'use client'

import { useState, useEffect } from 'react'

interface ReferralStats {
  code: string
  total: number
  signedUp: number
  converted: number
  totalCoinsEarned: number
  referrals: Array<{
    id: string
    status: string
    signedUpAt: string | null
    convertedAt: string | null
    referrerRewardCoins: number
  }>
}

export default function ReferralsPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/brain/referrals')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const referralLink = stats
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://meowdel.ai'}/signup?ref=${stats.code}`
    : ''

  function copy() {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-zinc-500">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Refer Friends, Earn Meowcoins</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Get <span className="text-yellow-400 font-semibold">100 Meowcoins</span> for each signup,{' '}
          <span className="text-yellow-400 font-semibold">500 more</span> when they upgrade to Pro.
        </p>
      </div>

      {/* Referral Code Card */}
      <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-500/30 rounded-3xl p-6 space-y-4">
        <div className="text-center">
          <p className="text-xs text-zinc-400 uppercase tracking-widest mb-2">Your Referral Code</p>
          <p className="text-4xl font-black tracking-widest text-white font-mono">{stats?.code}</p>
        </div>

        <div className="bg-black/40 rounded-2xl flex items-center gap-2 p-3">
          <p className="flex-1 text-sm text-zinc-300 truncate font-mono">{referralLink}</p>
          <button
            onClick={copy}
            className="flex-shrink-0 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-semibold transition-all"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="flex gap-2 justify-center">
          <a
            href={`https://twitter.com/intent/tweet?text=I%20use%20Meowdel%20for%20my%20AI%20second%20brain%20%F0%9F%90%B1%20Join%20me%20and%20get%20a%20bonus%3A%20${encodeURIComponent(referralLink)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-sky-900/40 border border-sky-700/50 hover:border-sky-500 rounded-xl text-xs font-semibold transition-colors"
          >
            Share on X
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{stats?.total ?? 0}</p>
          <p className="text-xs text-zinc-500 mt-1">Invited</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{stats?.signedUp ?? 0}</p>
          <p className="text-xs text-zinc-500 mt-1">Signed Up</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{stats?.totalCoinsEarned ?? 0}</p>
          <p className="text-xs text-zinc-500 mt-1">Meowcoins Earned</p>
        </div>
      </div>

      {/* How it works */}
      <div className="space-y-3">
        <h2 className="font-semibold text-zinc-200">How it works</h2>
        <div className="space-y-2">
          {[
            { emoji: '🔗', step: 'Share your link', desc: 'Send your referral link to friends or post it online' },
            { emoji: '✨', step: 'They sign up', desc: 'You both get 100 Meowcoins instantly' },
            { emoji: '🚀', step: 'They go Pro', desc: 'You both earn 500 bonus Meowcoins' },
            { emoji: '🎁', step: 'Spend Meowcoins', desc: 'Unlock themes, badges, and premium features in the Catnip store' },
          ].map(({ emoji, step, desc }) => (
            <div key={step} className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-3">
              <span className="text-2xl">{emoji}</span>
              <div>
                <p className="text-sm font-semibold">{step}</p>
                <p className="text-xs text-zinc-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent referrals */}
      {stats && stats.referrals.filter(r => r.status !== 'pending').length > 0 && (
        <div>
          <h2 className="font-semibold text-zinc-200 mb-3">Recent Referrals</h2>
          <div className="space-y-2">
            {stats.referrals
              .filter(r => r.status !== 'pending')
              .map(r => (
                <div key={r.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${r.status === 'converted' ? 'bg-yellow-400' : 'bg-green-400'}`} />
                    <span className="text-sm capitalize">{r.status.replace('_', ' ')}</span>
                    {r.signedUpAt && (
                      <span className="text-xs text-zinc-500">{new Date(r.signedUpAt).toLocaleDateString()}</span>
                    )}
                  </div>
                  {r.referrerRewardCoins > 0 && (
                    <span className="text-yellow-400 text-sm font-semibold">+{r.referrerRewardCoins} coins</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
