'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Maximize, Minimize, RefreshCw, ZoomIn, ZoomOut, Activity } from 'lucide-react'
import { GraphHealthPanel } from '@/components/graph-health-panel'

// Import ForceGraph2D dynamically so it doesn't break SSR (depends on window)
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

export default function YarnBallPage() {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] })
    const [loading, setLoading] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showHealthPanel, setShowHealthPanel] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const fgRef = useRef<any>(null)
    const router = useRouter()

    useEffect(() => {
        fetchGraph()
    }, [])

    const fetchGraph = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/brain/graph')
            const data = await res.json()
            setGraphData(data)
        } catch (e) {
            console.error('Failed to load graph data', e)
        } finally {
            setLoading(false)
        }
    }

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen()
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }

    const handleNodeClick = useCallback((node: any) => {
        if (node.tags?.includes('Unresolved')) {
            alert(`This node "${node.name}" doesn't exist yet! Let's pretend Meowdel is generating it now...`)
        } else {
            router.push(`/brain/notes/${node.id}`)
        }
    }, [router])

    return (
        <div ref={containerRef} className="w-full h-full bg-black relative flex flex-col">
            <div className={`absolute top-0 right-0 p-6 z-20 flex gap-4 ${isFullscreen ? 'opacity-10 hover:opacity-100 transition-opacity' : ''}`}>
                <button onClick={() => {
                        fgRef.current?.zoom(fgRef.current.zoom() * 1.2, 400)
                    }} 
                    className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white backdrop-blur-md">
                    <ZoomIn className="w-5 h-5" />
                </button>
                <button onClick={() => {
                        fgRef.current?.zoom(fgRef.current.zoom() / 1.2, 400)
                    }} 
                    className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white backdrop-blur-md">
                    <ZoomOut className="w-5 h-5" />
                </button>
                <button onClick={fetchGraph} className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white backdrop-blur-md">
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-pink-500' : ''}`} />
                </button>
                <button onClick={() => setShowHealthPanel(!showHealthPanel)} className={`p-3 border rounded-xl backdrop-blur-md transition-colors ${showHealthPanel ? 'bg-white text-black border-white' : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'}`}>
                    <Activity className="w-5 h-5" />
                </button>
                <button onClick={toggleFullscreen} className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white backdrop-blur-md">
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
            </div>

            {showHealthPanel && (
              <div className="absolute top-24 right-6 z-30">
                 <GraphHealthPanel />
              </div>
            )}

            <div className="absolute bottom-10 left-10 z-20 pointer-events-none">
                <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
                    The Yarn Ball
                </h1>
                <p className="text-gray-400 text-sm mt-2">Every string attached in your Brain.</p>
                
                <div className="mt-4 flex gap-3 text-xs">
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-[#a855f7] mr-2 shadow-[0_0_10px_#a855f7]"></span> Default</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-[#ef4444] mr-2 shadow-[0_0_10px_#ef4444]"></span> Orphan</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-[#6b7280] mr-2"></span> Unresolved</div>
                </div>
            </div>

            <div className="flex-1 w-full h-full relative cursor-move">
                {typeof window !== 'undefined' && !loading && (
                    <ForceGraph2D
                        ref={fgRef}
                        graphData={graphData}
                        nodeLabel="name"
                        nodeColor={(node: any) => node.color}
                        nodeRelSize={4}
                        linkColor={() => 'rgba(255,255,255,0.1)'}
                        linkWidth={1.5}
                        linkDirectionalParticles={2}
                        linkDirectionalParticleSpeed={(d: any) => d.value * 0.001}
                        onNodeClick={handleNodeClick}
                        backgroundColor="#000000"
                        enableNodeDrag={true}
                        enableZoomInteraction={true}
                        enablePanInteraction={true}
                    />
                )}
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-gray-500 animate-pulse text-2xl tracking-widest uppercase">
                        Untangling Yarn...
                    </div>
                )}
            </div>
        </div>
    )
}
