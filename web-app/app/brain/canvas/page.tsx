import { InfiniteCanvas } from "@/components/infinite-canvas"

export default function CanvasPage() {
  return (
    <div className="flex flex-col h-full w-full bg-background relative overflow-hidden">
      {/* Subtle background glow for aesthetics */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-background to-cyan-500/5 pointer-events-none z-0" />
      
      {/* The ReactFlow canvas must have a defined height, which it gets from the flex parent */}
      <div className="flex-1 relative z-10 w-full h-full">
         <InfiniteCanvas />
      </div>
    </div>
  )
}
