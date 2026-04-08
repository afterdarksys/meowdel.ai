'use client'

import { useState, useEffect } from 'react'
import { ScanSearch, GitBranch, CheckCircle2, XCircle, Loader2, ExternalLink, FileText, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

interface Scan {
  id: string
  repoUrl: string
  repoOwner: string
  repoName: string
  status: 'pending' | 'building' | 'complete' | 'failed'
  nodeCount: number | null
  edgeCount: number | null
  fileCount: number | null
  estimatedTokenSavings: number | null
  summaryText: string | null
  errorMessage: string | null
  brainNoteId: string | null
  createdAt: string
  completedAt: string | null
}

export default function CodeReviewPage() {
  const [repoUrl, setRepoUrl] = useState('')
  const [saveAsNote, setSaveAsNote] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [scans, setScans] = useState<Scan[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedScan, setExpandedScan] = useState<string | null>(null)

  const fetchScans = async () => {
    try {
      const res = await fetch('/api/brain/code-review')
      if (res.ok) setScans(await res.json())
    } catch { /* silent */ }
    finally { setLoadingHistory(false) }
  }

  useEffect(() => { fetchScans() }, [])

  const runScan = async () => {
    if (!repoUrl.trim()) return
    setScanning(true)
    setError(null)
    try {
      const res = await fetch('/api/brain/code-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: repoUrl.trim(), saveAsNote }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? data.error)
      setRepoUrl('')
      await fetchScans()
      setExpandedScan(data.scanId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <ScanSearch className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold">Code Review Graph</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Builds a structural dependency graph of any GitHub repo — reduces AI token usage by ~8x by sending only relevant files to Claude instead of the whole codebase.
        </p>
      </div>

      {/* Scan form */}
      <div className="bg-card border rounded-xl p-5 mb-8">
        <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Scan a Repository</h2>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="url"
              value={repoUrl}
              onChange={e => setRepoUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runScan()}
              placeholder="https://github.com/owner/repo"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            onClick={runScan}
            disabled={!repoUrl.trim() || scanning}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanSearch className="w-4 h-4" />}
            {scanning ? 'Scanning…' : 'Scan Repo'}
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={saveAsNote}
            onChange={e => setSaveAsNote(e.target.checked)}
            className="rounded"
          />
          Save results as a Brain note
        </label>

        {scanning && (
          <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground bg-blue-500/5 border border-blue-500/20 rounded-lg px-4 py-3">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400 flex-shrink-0" />
            <span>Cloning repo and building dependency graph… this usually takes 10–60 seconds.</span>
          </div>
        )}

        {error && (
          <div className="mt-4 text-sm text-red-500 bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3">
            {error}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-sm">
        {[
          { step: '1', title: 'Parse', desc: 'Tree-sitter extracts every function, class & import across 19 languages' },
          { step: '2', title: 'Graph', desc: 'Builds a SQLite dependency graph — who calls what, what imports whom' },
          { step: '3', title: 'Focus', desc: 'Blast-radius analysis finds only the files relevant to a change — ~8x fewer tokens' },
        ].map(s => (
          <div key={s.step} className="bg-card border rounded-lg p-4">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mb-2">{s.step}</div>
            <div className="font-medium mb-1">{s.title}</div>
            <div className="text-muted-foreground text-xs">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Scan history */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Scan History</h2>
        <button onClick={fetchScans} className="text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loadingHistory ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : scans.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <ScanSearch className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No scans yet. Enter a GitHub URL above to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {scans.map(scan => {
            const isExpanded = expandedScan === scan.id
            const isComplete = scan.status === 'complete'
            const isFailed = scan.status === 'failed'

            return (
              <div key={scan.id} className="bg-card border rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
                  onClick={() => setExpandedScan(isExpanded ? null : scan.id)}
                >
                  {scan.status === 'building' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />}
                  {isComplete && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                  {isFailed && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{scan.repoOwner}/{scan.repoName}</div>
                    {isComplete && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {scan.fileCount} files · {scan.nodeCount} nodes · {scan.edgeCount} edges
                        {scan.estimatedTokenSavings && (
                          <span className="text-green-500 ml-2">~{(scan.estimatedTokenSavings / 1000).toFixed(0)}k tokens saved</span>
                        )}
                      </div>
                    )}
                    {isFailed && <div className="text-xs text-red-400 mt-0.5 truncate">{scan.errorMessage}</div>}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {scan.brainNoteId && (
                      <a
                        href={`/brain/notes/${scan.brainNoteId}`}
                        onClick={e => e.stopPropagation()}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        title="View brain note"
                      >
                        <FileText className="w-4 h-4" />
                      </a>
                    )}
                    <a
                      href={scan.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <span className="text-xs text-muted-foreground">{new Date(scan.createdAt).toLocaleDateString()}</span>
                    {isComplete && (isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </button>

                {isExpanded && isComplete && scan.summaryText && (
                  <div className="px-4 pb-4 border-t border-border/50 pt-3">
                    <pre className="text-xs bg-secondary rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {scan.summaryText}
                    </pre>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
