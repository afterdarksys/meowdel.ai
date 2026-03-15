import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ApiKeyManager from '@/components/ApiKeyManager'

export default async function ProfilePage() {
    const cookieStore = await cookies()
    const token = cookieStore.get('oauth_token')?.value

    // Middleware handles protection, but we add a safety redirect
    if (!token) {
        redirect('/api/auth/login')
    }

    // Mock fetching user profile context for display
    const user = {
        name: 'Ryan (Dev)',
        email: 'ryan@afterdarktech.com',
        tier: 'Roar (Unlimited)',
        browserId: 'a1b2c3d4...',
        stats: {
            bugsSolvedTogether: 142,
            affinity: 95,
            trustLevel: 98,
            sessions: 42,
        },
        preferences: {
            meowFrequency: 'moderate',
            personalityMode: 'playful'
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-8 font-sans selection:bg-pink-500 selection:text-white">

            {/* Dynamic Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <header className="flex justify-between items-center mb-12 backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl shadow-2xl">
                    <div>
                        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400 tracking-tight">
                            My Profile
                        </h1>
                        <p className="text-gray-300 mt-2 font-medium">Manage your After Dark account and Meowdel preferences.</p>
                    </div>
                    <div className="flex space-x-4">
                        <Link href="/chat" className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all duration-300 font-semibold shadow-lg backdrop-blur-sm">
                            Back to Chat
                        </Link>
                        <a href="/api/auth/logout" className="px-6 py-2.5 bg-gradient-to-r from-red-500/80 to-pink-600/80 hover:from-red-500 hover:to-pink-600 rounded-xl transition-all duration-300 shadow-lg font-semibold overflow-hidden relative group">
                            <span className="relative z-10">Logout</span>
                            <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                        </a>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Identity Card */}
                    <div className="col-span-1 md:col-span-1 space-y-8">
                        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute -right-8 -top-8 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl group-hover:bg-pink-500/30 transition-colors duration-500"></div>

                            <div className="flex flex-col items-center">
                                <div className="w-28 h-28 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full p-1 shadow-lg mb-6">
                                    <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center text-4xl font-bold">
                                        {user.name.charAt(0)}
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold">{user.name}</h2>
                                <p className="text-gray-400">{user.email}</p>

                                <div className="mt-6 w-full pt-6 border-t border-white/10 flex justify-between items-center">
                                    <span className="text-sm text-gray-400 font-medium">Subscription</span>
                                    <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-xs font-bold rounded-full shadow-lg">
                                        {user.tier}
                                    </span>
                                </div>
                                <div className="mt-4 w-full flex justify-between items-center">
                                    <span className="text-sm text-gray-400 font-medium">BrowserID</span>
                                    <span className="px-2 py-1 bg-white/5 border border-white/10 rounded font-mono text-xs text-gray-300">
                                        {user.browserId}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Account Settings */}
                        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-xl hover:bg-white/10 transition-colors duration-300 cursor-pointer">
                            <h3 className="text-lg font-semibold mb-4 text-purple-300">Account Settings</h3>
                            <ul className="space-y-3 text-sm text-gray-300">
                                <li className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full bg-green-400"></span> <span>Manage Subscription</span></li>
                                <li className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full bg-blue-400"></span> <span>SSO Security</span></li>
                                <li className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full bg-pink-400"></span> <span>Export My Data</span></li>
                            </ul>
                        </div>
                    </div>

                    {/* Statistics and Preferences */}
                    <div className="col-span-1 md:col-span-2 space-y-8">

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            {[
                                { label: 'Bugs Solved Together', value: user.stats.bugsSolvedTogether, icon: '🐛', color: 'text-green-400' },
                                { label: 'Memory / Affinity', value: `${user.stats.affinity}%`, icon: '💜', color: 'text-pink-400' },
                                { label: 'Trust Level', value: `${user.stats.trustLevel}/100`, icon: '🛡️', color: 'text-blue-400' },
                                { label: 'Total Sessions', value: user.stats.sessions, icon: '⏱️', color: 'text-amber-400' },
                            ].map((stat, i) => (
                                <div key={i} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-start hover:-translate-y-1 hover:bg-white/10 transition-all duration-300 group shadow-lg">
                                    <span className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{stat.icon}</span>
                                    <span className="text-gray-400 text-sm font-medium tracking-wide">{stat.label}</span>
                                    <span className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Meowdel Preferences Matrix */}
                        <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>

                            <h3 className="text-2xl font-bold mb-6 flex items-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                                Meowdel Preferences
                                <span className="ml-3 px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg text-xs font-bold text-blue-300">EXPERIMENTAL</span>
                            </h3>

                            <div className="space-y-6 relative z-10">
                                <div className="bg-white/5 border border-white/5 rounded-xl p-5 hover:border-white/20 transition-colors">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold text-gray-200">Meow Frequency</span>
                                        <span className="text-xs text-pink-400 font-mono bg-pink-400/10 px-2 py-1 rounded">{user.preferences.meowFrequency.toUpperCase()}</span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-2 mt-4 overflow-hidden border border-gray-700">
                                        <div className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full w-2/3 shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
                                    </div>
                                </div>

                                <div className="bg-white/5 border border-white/5 rounded-xl p-5 hover:border-white/20 transition-colors">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold text-gray-200">Personality Mode</span>
                                        <span className="text-xs text-indigo-400 font-mono bg-indigo-400/10 px-2 py-1 rounded">{user.preferences.personalityMode.toUpperCase()}</span>
                                    </div>
                                    <div className="flex space-x-2 mt-4">
                                        <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-400 font-medium transition-colors border border-transparent hover:border-white/10">Professional</button>
                                        <button className="flex-1 py-2 bg-indigo-500/30 border border-indigo-500/50 rounded-lg text-sm text-white font-medium shadow-[0_0_15px_rgba(99,102,241,0.3)]">Playful</button>
                                        <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-400 font-medium transition-colors border border-transparent hover:border-white/10">Balanced</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
                
                {/* API Key Manager Component */}
                <ApiKeyManager />
            </div>
        </div >
    )
}
