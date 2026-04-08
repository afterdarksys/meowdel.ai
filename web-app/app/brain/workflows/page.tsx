'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bot, Play, RefreshCw, Clock, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

type JobStatus = 'pending' | 'running' | 'completed' | 'failed'

interface Job {
  id: string
  jobType: string
  agentName: string | null
  status: JobStatus
  priority: number
  payload: Record<string, unknown>
  result: Record<string, unknown> | null
  attempts: number
  createdAt: string
  startedAt: string | null
  completedAt: string | null
}

const MODES = [
  { id: 'auto', label: 'Auto', description: 'Queen decides which agents to use', color: 'purple' },
  { id: 'analyze', label: 'Analyze', description: 'Researcher + Challenger: find connections & stress-test', color: 'blue' },
  { id: 'organize', label: 'Organize', description: 'Librarian + Curator: tag, deduplicate & clean up', color: 'green' },
  { id: 'synthesize', label: 'Synthesize', description: 'Researcher + Synthesizer: merge & distill knowledge', color: 'orange' },
  { id: 'deep_dive', label: 'Deep Dive', description: 'All 5 agents sequentially — thorough but slow', color: 'red' },
] as const

const STATUS_CONFIG: Record<JobStatus, { icon: typeof Clock; label: string; color: string }> = {
  pending:   { icon: Clock,         label: 'Pending',   color: 'text-yellow-500' },
  running:   { icon: Loader2,       label: 'Running',   color: 'text-blue-500' },
  completed: { icon: CheckCircle2,  label: 'Done',      color: 'text-green-500' },
  failed:    { icon: XCircle,       label: 'Failed',    color: 'text-red-500' },
}

export default function WorkflowsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  const [mode, setMode] = useState<string>('auto')
  const [taskInput, setTaskInput] = useState('')
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/brain/agent-jobs')
      if (res.ok) setJobs(await res.json())
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchJobs()
    // Poll while any job is running or pending
    const interval = setInterval(() => {
      setJobs(prev => {
        const hasActive = prev.some(j => j.status === 'pending' || j.status === 'running')
        if (hasActive) fetchJobs()
        return prev
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [fetchJobs])

  const triggerWorkflow = async () => {
    if (!taskInput.trim()) return
    setTriggering(true)
    setError(null)
    try {
      const res = await fetch('/api/brain/swarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, input: taskInput, async: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTaskInput('')
      await fetchJobs()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to trigger workflow')
    } finally {
      setTriggering(false)
    }
  }

  const activeCount = jobs.filter(j => j.status === 'pending' || j.status === 'running').length

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Bot className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold">Agent Workflows</h1>
          {activeCount > 0 && (
            <span className="bg-blue-500/15 text-blue-400 text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> {activeCount} running
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          Ruflo-style multi-agent swarm — Queen orchestrates Librarian, Researcher, Synthesizer, Challenger &amp; Curator
        </p>
      </div>

      {/* Trigger panel */}
      <div className="bg-card border rounded-xl p-5 mb-8">
        <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">New Workflow</h2>

        {/* Mode selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              title={m.description}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all text-left ${
                mode === m.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {MODES.find(m => m.id === mode)?.description}
        </p>

        <textarea
          value={taskInput}
          onChange={e => setTaskInput(e.target.value)}
          placeholder="Describe the task for the swarm… e.g. 'Organize my TypeScript notes and find connections to React patterns'"
          className="w-full resize-none rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3"
          rows={3}
        />

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <button
          onClick={triggerWorkflow}
          disabled={!taskInput.trim() || triggering}
          className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {triggering ? 'Queuing…' : 'Run Workflow'}
        </button>
      </div>

      {/* Job queue */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Job Queue</h2>
        <button onClick={fetchJobs} className="text-muted-foreground hover:text-foreground transition-colors" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No workflows yet. Run your first one above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map(job => {
            const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending
            const Icon = cfg.icon
            const isExpanded = expandedJob === job.id
            const hasResult = job.result && Object.keys(job.result).length > 0

            return (
              <div key={job.id} className="bg-card border rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
                  onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.color} ${job.status === 'running' ? 'animate-spin' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{job.jobType}</span>
                      {job.agentName && (
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{job.agentName}</span>
                      )}
                    </div>
                    {job.payload?.input != null && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{String(job.payload.input)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-xs text-muted-foreground">{new Date(job.createdAt).toLocaleTimeString()}</span>
                    {hasResult && (isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </button>

                {isExpanded && hasResult && (
                  <div className="px-4 pb-4 border-t border-border/50 pt-3">
                    <pre className="text-xs bg-secondary rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {JSON.stringify(job.result, null, 2)}
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
