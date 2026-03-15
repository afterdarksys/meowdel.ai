'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Apple, FileText, Database, RefreshCw, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'

export default function ImportersPage() {
    const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleImport = async (platform: string, credentials?: any) => {
        setLoadingPlatform(platform)
        setError(null)
        setResult(null)

        try {
            const res = await fetch('/api/brain/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform, credentials })
            })
            
            const data = await res.json()
            if (res.ok && data.success) {
                setResult(data.result)
            } else {
                setError(data.error || 'Failed to import notes')
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected network error occurred')
        } finally {
            setLoadingPlatform(null)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-8 font-sans selection:bg-pink-500 selection:text-white">
            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <header className="flex items-center mb-12 backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl shadow-2xl">
                    <Link href="/profile" className="p-3 mr-6 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all duration-300">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400 tracking-tight">
                            External Importers
                        </h1>
                        <p className="text-gray-300 mt-2 font-medium">Ingest your brain data from other platforms seamlessly.</p>
                    </div>
                </header>

                {error && (
                    <div className="mb-8 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center text-red-300">
                        <AlertCircle className="w-6 h-6 mr-3 shrink-0" />
                        <div>
                            <h4 className="font-bold">Import Failed</h4>
                            <p className="text-sm opacity-80">{error}</p>
                        </div>
                    </div>
                )}

                {result && (
                    <div className="mb-8 p-5 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center text-green-300 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                        <CheckCircle2 className="w-6 h-6 mr-3 shrink-0" />
                        <div>
                            <h4 className="font-bold">Import Successful</h4>
                            <p className="text-sm opacity-80">Imported {result.successCount} of {result.total} items. Failed: {result.errorCount}. Return to chat to see your new knowledge!</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Apple Notes Card */}
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Apple className="w-32 h-32" />
                        </div>
                        <div className="flex items-center mb-4">
                            <div className="p-3 bg-white text-black rounded-full mr-4 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                <Apple className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">Apple Notes</h2>
                        </div>
                        <p className="text-gray-400 text-sm mb-6 relative z-10 h-16">
                            Native zero-configuration import. Meowdel will locally command your Mac via AppleScript to securely extract all Apple Notes into Markdown.
                        </p>
                        
                        <button 
                            onClick={() => handleImport('apple')}
                            disabled={loadingPlatform !== null}
                            className="w-full py-4 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-bold rounded-xl transition-all border border-white/20 flex items-center justify-center space-x-2 shadow-lg relative z-10"
                        >
                            {loadingPlatform === 'apple' ? (
                                <><RefreshCw className="w-5 h-5 animate-spin" /> <span>Extracting...</span></>
                            ) : (
                                <span>Start Import</span>
                            )}
                        </button>
                    </div>

                    {/* Notion Card */}
                    <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-3xl p-8 shadow-xl relative overflow-hidden opacity-50 cursor-not-allowed">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Database className="w-32 h-32" />
                        </div>
                        <div className="flex items-center mb-4">
                            <div className="p-3 bg-black border border-white/20 text-white rounded-xl mr-4">
                                <span className="font-serif font-bold text-xl">N</span>
                            </div>
                            <h2 className="text-2xl font-bold">Notion</h2>
                            <span className="ml-3 px-2 py-1 bg-white/10 rounded text-xs">Soon</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-6 relative z-10 h-16">
                            Provide an Internal Integration Token to extract all pages from your Notion workspace into Meowdel.
                        </p>
                        <button disabled className="w-full py-4 bg-white/5 text-gray-500 font-bold rounded-xl border border-white/5">
                            Coming Soon
                        </button>
                    </div>

                    {/* Google Docs/Keep Card */}
                     <div className="backdrop-blur-xl bg-[#4285F4]/5 border border-[#4285F4]/20 rounded-3xl p-8 shadow-xl relative overflow-hidden opacity-50 cursor-not-allowed">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <FileText className="w-32 h-32 text-[#4285F4]" />
                        </div>
                        <div className="flex items-center mb-4">
                            <div className="p-3 bg-white text-[#4285F4] rounded-xl mr-4 shadow-lg">
                                <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" /></svg>
                            </div>
                            <h2 className="text-2xl font-bold">Google</h2>
                            <span className="ml-3 px-2 py-1 bg-[#4285F4]/20 text-[#4285F4] rounded text-xs">Soon</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-6 relative z-10 h-16">
                            Upload a Google Takeout export (.zip) to ingest your Google Keep notes and Google Docs securely without sending data to the cloud.
                        </p>
                        <button disabled className="w-full py-4 bg-[#4285F4]/10 text-[#4285F4]/50 font-bold rounded-xl border border-[#4285F4]/10">
                            Coming Soon
                        </button>
                    </div>

                    {/* Microsoft OneNote Card */}
                    <div className="backdrop-blur-xl bg-[#7719AA]/5 border border-[#7719AA]/20 rounded-3xl p-8 shadow-xl relative overflow-hidden opacity-50 cursor-not-allowed">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <FileText className="w-32 h-32 text-[#7719AA]" />
                        </div>
                        <div className="flex items-center mb-4">
                            <div className="p-3 bg-[#7719AA] text-white rounded-xl mr-4 shadow-lg shadow-[#7719AA]/50">
                                <span className="font-bold">N</span>
                            </div>
                            <h2 className="text-2xl font-bold">OneNote</h2>
                            <span className="ml-3 px-2 py-1 bg-[#7719AA]/20 text-[#7719AA] rounded text-xs">Soon</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-6 relative z-10 h-16">
                            Authenticate via Azure AD to index your personal or enterprise Microsoft OneNote notebooks.
                        </p>
                         <button disabled className="w-full py-4 bg-[#7719AA]/10 text-[#7719AA]/50 font-bold rounded-xl border border-[#7719AA]/10">
                            Coming Soon
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}
