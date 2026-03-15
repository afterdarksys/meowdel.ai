'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { FileText, Database, RefreshCw, CheckCircle2, AlertCircle, ArrowLeft, Upload, FileArchive } from 'lucide-react'

export default function ImportersPage() {
    const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, platform: string) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoadingPlatform(platform)
        setError(null)
        setResult(null)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('source', platform)

        try {
            const res = await fetch('/api/brain/import', {
                method: 'POST',
                body: formData
            })
            
            const data = await res.json()
            if (res.ok && data.success) {
                setResult(data)
            } else {
                setError(data.error || 'Failed to import files')
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected network error occurred')
        } finally {
            setLoadingPlatform(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
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
                            Universal Importer
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
                            <p className="text-sm opacity-80">{result.message} Return to chat to see your new knowledge!</p>
                        </div>
                    </div>
                )}

                {/* Hidden File Input */}
                <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   accept=".zip,.md,.txt" 
                   onChange={(e) => handleFileChange(e, 'Generic')} 
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Obsidian Card */}
                    <div className="backdrop-blur-xl bg-purple-500/10 border border-purple-500/30 rounded-3xl p-8 shadow-xl relative overflow-hidden group hover:border-purple-500/50 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Database className="w-32 h-32" />
                        </div>
                        <div className="flex items-center mb-4">
                            <div className="p-3 bg-purple-500 text-white rounded-xl mr-4 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                                <Database className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">Obsidian Vault</h2>
                        </div>
                        <p className="text-gray-400 text-sm mb-6 relative z-10 h-16">
                            Zip your entire Obsidian Vault directory and upload it here. We will ingest all markdown files and maintain your existing wikilinks.
                        </p>
                        
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loadingPlatform !== null}
                            className="w-full py-4 bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-50 text-purple-200 font-bold rounded-xl transition-all border border-purple-500/50 flex items-center justify-center space-x-2 shadow-lg relative z-10"
                        >
                            {loadingPlatform === 'Generic' ? (
                                <><RefreshCw className="w-5 h-5 animate-spin" /> <span>Extracting...</span></>
                            ) : (
                                <><FileArchive className="w-5 h-5" /> <span>Upload Vault (.zip)</span></>
                            )}
                        </button>
                    </div>

                    {/* Notion Card */}
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-xl relative overflow-hidden group hover:border-white/20 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <FileText className="w-32 h-32" />
                        </div>
                        <div className="flex items-center mb-4">
                            <div className="p-3 bg-black border border-white/20 text-white rounded-xl mr-4 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                <span className="font-serif font-bold text-xl px-1">N</span>
                            </div>
                            <h2 className="text-2xl font-bold">Notion Export</h2>
                        </div>
                        <p className="text-gray-400 text-sm mb-6 relative z-10 h-16">
                            Export your Notion workspace as "Markdown & CSV", zip the folder, and upload it here to migrate your data.
                        </p>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loadingPlatform !== null}
                            className="w-full py-4 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-bold rounded-xl transition-all border border-white/20 flex items-center justify-center space-x-2 shadow-lg relative z-10"
                        >
                            <Upload className="w-5 h-5" /> <span>Upload Export (.zip)</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}
