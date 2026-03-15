import { TimelineViz } from "@/components/timeline-viz"

export default function TimelinePage() {
  return (
    <div className="flex flex-col h-full w-full bg-background relative overflow-y-auto w-full custom-scrollbar">
      {/* Subtle background gradient to distinguish pages */}
      <div className="absolute inset-0 bg-gradient-to-bl from-amber-500/5 via-transparent to-transparent pointer-events-none z-0" />
      
      <div className="w-full max-w-5xl mx-auto relative z-10 px-4 md:px-8 py-8">
         <TimelineViz />
      </div>
    </div>
  )
}
