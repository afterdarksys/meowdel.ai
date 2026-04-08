"use client"

/**
 * MermaidRenderer — renders mermaid code blocks as interactive SVG diagrams.
 *
 * Usage in note preview: scan rendered markdown for <code class="language-mermaid">
 * blocks, replace them with <MermaidRenderer code={...} />.
 *
 * npm install mermaid
 *
 * Tier: free
 */

import { useEffect, useRef, useState, useId } from 'react'

interface MermaidRendererProps {
  code: string
  className?: string
}

export function MermaidRenderer({ code, className }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [svg, setSvg] = useState<string | null>(null)
  const id = useId().replace(/:/g, '-')
  const diagramId = `mermaid-${id}`

  useEffect(() => {
    if (!code.trim()) return

    let cancelled = false

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default

        mermaid.initialize({
          startOnLoad: false,
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: 'inherit',
        })

        const { svg: rendered } = await mermaid.render(diagramId, code.trim())
        if (!cancelled) {
          setSvg(rendered)
          setError(null)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Diagram render failed')
        }
      }
    }

    render()
    return () => { cancelled = true }
  }, [code, diagramId])

  if (error) {
    return (
      <div className={`rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive ${className}`}>
        <p className="font-semibold mb-1">Mermaid syntax error</p>
        <pre className="whitespace-pre-wrap opacity-80">{error}</pre>
        <pre className="mt-2 text-foreground/60 whitespace-pre-wrap">{code}</pre>
      </div>
    )
  }

  if (!svg) {
    return (
      <div className={`rounded-lg border bg-muted/20 p-4 animate-pulse ${className}`}>
        <div className="h-20 bg-muted/40 rounded" />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-x-auto rounded-lg bg-card border p-4 ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
