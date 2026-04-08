'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, Music, FileArchive, CheckCircle2, Loader2, Youtube, Globe } from 'lucide-react'

const ACCEPTED = '.pdf,.docx,.txt,.md,.csv,.epub,.mp3,.m4a,.wav,.ogg,.webm'

interface ImportResult {
  id?: string
  slug?: string
  title: string
  wordCount?: number
  error?: string
}

export default function ImportPage() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [webUrl, setWebUrl] = useState('')
  const [importingUrl, setImportingUrl] = useState(false)

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true)
    setResult(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/brain/docengine', { method: 'POST', body: form })
      const data = await res.json()
      setResult(data)
      if (data.slug) {
        setTimeout(() => router.push(`/brain/notes/${data.slug}`), 1500)
      }
    } catch {
      setResult({ title: file.name, error: 'Upload failed. Please try again.' })
    } finally {
      setUploading(false)
    }
  }, [router])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  const handleYoutube = async () => {
    if (!youtubeUrl.trim()) return
    setImportingUrl(true)
    setResult(null)
    try {
      const res = await fetch('/api/brain/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl }),
      })
      const data = await res.json()
      setResult(data)
      if (data.slug) setTimeout(() => router.push(`/brain/notes/${data.slug}`), 1500)
    } catch {
      setResult({ title: youtubeUrl, error: 'YouTube import failed.' })
    } finally {
      setImportingUrl(false)
    }
  }

  const handleWebClip = async () => {
    if (!webUrl.trim()) return
    setImportingUrl(true)
    setResult(null)
    try {
      const res = await fetch('/api/brain/clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webUrl }),
      })
      const data = await res.json()
      setResult(data)
      if (data.slug) setTimeout(() => router.push(`/brain/notes/${data.slug}`), 1500)
    } catch {
      setResult({ title: webUrl, error: 'Web clip failed.' })
    } finally {
      setImportingUrl(false)
    }
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto bg-background p-8 pt-20">
      <div className="max-w-2xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Upload className="w-8 h-8 text-primary" />
            Import to Brain
          </h1>
          <p className="text-muted-foreground">Import documents, audio, web pages, and YouTube videos as notes.</p>
        </div>

        {/* File Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
            isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-zinc-700 hover:border-zinc-500'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-lg font-medium">Parsing document...</p>
              <p className="text-sm text-muted-foreground">This may take a moment for large files</p>
            </div>
          ) : result ? (
            <div className="flex flex-col items-center gap-3">
              {result.error ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-red-400" />
                  </div>
                  <p className="text-red-400 font-medium">{result.error}</p>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-12 h-12 text-green-400" />
                  <p className="text-lg font-medium">Imported: {result.title}</p>
                  {result.wordCount && <p className="text-sm text-muted-foreground">{result.wordCount.toLocaleString()} words · redirecting to note…</p>}
                </>
              )}
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center gap-4">
              <div className="flex gap-4">
                <FileText className="w-10 h-10 text-zinc-500" />
                <FileArchive className="w-10 h-10 text-zinc-500" />
                <Music className="w-10 h-10 text-zinc-500" />
              </div>
              <div>
                <p className="text-lg font-medium">Drop a file here or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">PDF, DOCX, TXT, MD, CSV, EPUB, MP3, M4A, WAV (Pro)</p>
              </div>
              <input type="file" accept={ACCEPTED} onChange={handleFileChange} className="hidden" />
            </label>
          )}
        </div>

        {/* YouTube Import */}
        <div className="bg-card border rounded-xl p-6 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-400" />
            YouTube Transcript (Pro)
          </h2>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleYoutube()}
              className="flex-1 bg-background border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleYoutube}
              disabled={importingUrl || !youtubeUrl.trim()}
              className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              {importingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Import'}
            </button>
          </div>
        </div>

        {/* Web Clipper */}
        <div className="bg-card border rounded-xl p-6 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            Web Clipper
          </h2>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://example.com/article"
              value={webUrl}
              onChange={(e) => setWebUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleWebClip()}
              className="flex-1 bg-background border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleWebClip}
              disabled={importingUrl || !webUrl.trim()}
              className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-colors disabled:opacity-50"
            >
              {importingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Clip'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
