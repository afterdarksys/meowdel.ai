'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag, Leaf, Sparkles, Star, Award } from 'lucide-react'

// Define the shape of a badge based on our API
export interface Badge {
  id: string
  name: string
  description: string
  icon: string
}

export default function CatnipStore() {
    const [meowcoins, setMeowcoins] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [unlockedBadges, setUnlockedBadges] = useState<any[]>([])
    const [availableBadges, setAvailableBadges] = useState<Badge[]>([])
    const [achievementsLoading, setAchievementsLoading] = useState(true)

    useEffect(() => {
        // Fetch Meowcoins
        fetch('/api/profile/rewards')
            .then(r => r.json())
            .then(data => {
                setMeowcoins(data.meowcoins || 0)
                setLoading(false)
            })
            .catch(() => setLoading(false))

        // Fetch Gamification Badges
        fetch('/api/brain/achievements')
            .then(r => r.json())
            .then(data => {
                if (data.achievements && data.available) {
                    setUnlockedBadges(data.achievements)
                    setAvailableBadges(data.available)
                }
                setAchievementsLoading(false)
            })
            .catch(() => setAchievementsLoading(false))
    }, [])

    const handleBuy = async (price: number) => {
        if (meowcoins === null || meowcoins < price) {
            alert("Not enough Meowcoins! Keep chatting with Meowdel to earn more.")
            return
        }

        const res = await fetch('/api/profile/rewards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: price, action: 'spend' })
        })
        const data = await res.json()
        if (data.success) {
            setMeowcoins(data.newBalance)
            alert("Purchase successful! (Note: Cosmetic application pending in v2)")
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-[#1a0f2e] text-white p-8 font-sans">
            <div className="max-w-4xl mx-auto relative z-10">
                <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl shadow-2xl gap-6 md:gap-0">
                    <div className="flex items-center">
                        <Link href="/profile" className="p-3 mr-6 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all duration-300">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-extrabold flex items-center gap-3">
                                <Leaf className="w-8 h-8 text-emerald-400" />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200">
                                    Catnip Store & Achievements
                                </span>
                            </h1>
                            <p className="text-gray-300 mt-2 font-medium">Spend your hard-earned Meowcoins and track your Brain milestones.</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 bg-black/40 border border-emerald-500/30 px-4 py-2 rounded-2xl shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                            <Sparkles className="w-5 h-5 text-emerald-400" />
                            <span className="text-2xl font-black text-emerald-400">
                                {loading ? '...' : meowcoins}
                            </span>
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">MC</span>
                        </div>
                    </div>
                </header>

                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Award className="w-6 h-6 text-purple-400" /> Digital Catnip Badges
                </h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-16">
                     {achievementsLoading ? (
                         <div className="col-span-full py-8 text-center text-gray-400 animate-pulse">Loading achievements...</div>
                     ) : availableBadges.map((badge: any) => {
                         const isUnlocked = unlockedBadges.some((unlocked: any) => unlocked.badgeId === badge.id)
                         return (
                             <div 
                                key={badge.id}
                                className={`relative flex flex-col items-center p-4 rounded-2xl border transition-all ${
                                    isUnlocked 
                                        ? 'bg-gradient-to-br from-white/10 to-white/5 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                                        : 'bg-black/20 border-white/5 opacity-50 grayscale hover:grayscale-0 hover:opacity-100'
                                }`}
                             >
                                 <div className="text-4xl mb-2">{badge.icon}</div>
                                 <h4 className="font-bold text-sm text-center mb-1 leading-tight">{badge.name}</h4>
                                 <p className="text-[10px] text-center text-gray-400 leading-tight">{badge.description}</p>
                                 {isUnlocked && (
                                     <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                                         <Award className="w-3 h-3" />
                                     </div>
                                 )}
                             </div>
                         )
                     })}
                </div>

                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <ShoppingBag className="w-6 h-6 text-emerald-400" /> Meowcoin Store
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Item 1 */}
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                        <div className="w-24 h-24 mb-4 rounded-full flex justify-center items-center bg-gradient-to-tr from-pink-500 to-orange-400 shadow-lg">
                            <Star className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Neon Kitty Theme</h3>
                        <p className="text-sm text-gray-400 mb-6 flex-1">Unlocks an aggressively vibrant neon pink and orange UI theme.</p>
                        <button onClick={() => handleBuy(50)} className="w-full py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 border border-emerald-500/50 font-bold transition-all">
                            Buy for 50 MC
                        </button>
                    </div>

                    {/* Item 2 */}
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                        <div className="w-24 h-24 mb-4 rounded-full flex justify-center items-center bg-gradient-to-tr from-blue-600 to-indigo-900 shadow-lg">
                            <Award className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Aristocat Badge</h3>
                        <p className="text-sm text-gray-400 mb-6 flex-1">Displays a fancy golden monocle badge next to your profile.</p>
                         <button onClick={() => handleBuy(200)} className="w-full py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 border border-emerald-500/50 font-bold transition-all">
                            Buy for 200 MC
                        </button>
                    </div>

                    {/* Item 3 */}
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center hover:bg-white/10 transition-colors opacity-50">
                        <div className="w-24 h-24 mb-4 rounded-full flex justify-center items-center bg-gray-800 shadow-lg">
                            <ShoppingBag className="w-10 h-10 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Mystery Box</h3>
                        <p className="text-sm text-gray-400 mb-6 flex-1">Who knows what Meowdel found under the couch?</p>
                        <button disabled className="w-full py-3 rounded-xl bg-gray-500/10 text-gray-500 border border-gray-500/20 font-bold">
                            Out of Stock
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
