import Link from 'next/link'

export default function PublicProfilePage({ params }: { params: { username: string } }) {
    // In a real app, fetch statistics based on username param
    if (!params?.username) {
        return <div className="min-h-screen flex items-center justify-center">
            <p>Invalid profile</p>
        </div>
    }
    const username = params.username.replace('%40', '@') // simple decode
    const cleanName = username.startsWith('@') ? username.substring(1) : username;

    const stats = {
        bugsSolved: 847,
        rank: 'Code Whisperer',
        favoriteLanguage: 'TypeScript',
        affinityWithMeowdel: 99
    }

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans selection:bg-purple-500 flex justify-center items-center relative overflow-hidden">

            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-purple-900/40 via-pink-900/20 to-transparent rounded-full mix-blend-screen filter blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-900/40 via-blue-900/20 to-transparent rounded-full mix-blend-screen filter blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-2xl relative z-10 backdrop-blur-2xl bg-white/5 border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">

                    {/* Avatar Area */}
                    <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-40 h-40 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-full p-1.5 shadow-[0_0_30px_rgba(236,72,153,0.3)]">
                            <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-6xl font-black">
                                {cleanName.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <h1 className="text-3xl font-bold tracking-tight">@{cleanName}</h1>
                            <p className="text-pink-400 font-medium mt-1">{stats.rank}</p>
                        </div>
                    </div>

                    {/* Stats Area */}
                    <div className="flex-1 w-full space-y-6 mt-4 md:mt-0">
                        <h2 className="text-xl font-semibold text-gray-300 border-b border-white/10 pb-2">Meowdel Co-Op Stats</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors group">
                                <p className="text-gray-400 text-sm font-medium">Bugs Squashed</p>
                                <p className="text-3xl font-bold text-green-400 mt-1">{stats.bugsSolved}</p>
                            </div>

                            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors group">
                                <p className="text-gray-400 text-sm font-medium">Affinity Score</p>
                                <p className="text-3xl font-bold text-purple-400 mt-1">{stats.affinityWithMeowdel}%</p>
                            </div>

                            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl col-span-2 hover:bg-white/10 transition-colors">
                                <p className="text-gray-400 text-sm font-medium">Top Language</p>
                                <div className="flex mt-2 gap-2">
                                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-sm font-bold shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                                        {stats.favoriteLanguage}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end">
                            <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors border-b border-transparent hover:border-white pb-1 font-medium">
                                Want your own Meowdel?
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
