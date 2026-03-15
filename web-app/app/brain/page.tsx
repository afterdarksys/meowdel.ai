import { Brain, Sparkles, Network } from "lucide-react"
import { BrainGraph } from "@/components/brain-graph"
import Link from "next/link"

export default function BrainHome() {
  return (
    <div className="flex-1 w-full h-full relative">
      <div className="absolute inset-0 z-0">
        <BrainGraph />
      </div>

      {/* Foreground overlay for navigation */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col pt-32 p-12">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex justify-center mb-8 pointer-events-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
              <Brain className="w-32 h-32 text-primary relative z-10" strokeWidth={1} />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-center mb-4 tracking-tight drop-shadow-xl text-white">Meowdel's 10x Brain</h1>
          <p className="text-xl text-white/80 text-center mb-12 max-w-2xl mx-auto drop-shadow-lg">
            The central nervous system for the After Dark AI pets. A massively scalable, multi-agent knowledge graph.
          </p>

          <div className="flex justify-center gap-6 pointer-events-auto">
            <Link href="/brain/notes" className="p-6 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md hover:border-primary/50 transition-colors group cursor-pointer w-64 text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-white font-semibold mb-2">Create New Note</h2>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

