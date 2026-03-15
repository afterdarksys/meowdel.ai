"use client"

import { useState, useEffect } from "react"
import { History, Clock, FileText, ChevronRight, Loader2, ArrowLeftRight } from "lucide-react"

interface NoteVersion {
   id: string
   timestamp: string
   content: string
}

interface VersionHistoryProps {
  slug: string
  currentContent: string
  onRestore: (content: string) => void
  onClose: () => void
}

export function VersionHistory({ slug, currentContent, onRestore, onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<NoteVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null)

  useEffect(() => {
    const fetchVersions = async () => {
       try {
          const res = await fetch(`/api/brain/versions?slug=${slug}`)
          const data = await res.json()
          setVersions(data)
       } catch (e) {
          console.error("Failed to load versions", e)
       } finally {
          setLoading(false)
       }
    }
    fetchVersions()
  }, [slug])

  return (
    <div className="w-80 border-l bg-card flex flex-col h-full animate-in slide-in-from-right-8 z-20 shadow-2xl">
      <div className="p-4 border-b flex items-center justify-between bg-muted/30">
        <h3 className="font-bold flex items-center gap-2">
           <History className="w-4 h-4 text-primary" /> Version History
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded-md text-muted-foreground transition-colors">
           <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
         {loading ? (
             <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mb-2 text-primary" />
                <span className="text-xs font-medium">Loading snapshots...</span>
             </div>
         ) : versions.length === 0 ? (
             <div className="p-4 text-center text-sm text-muted-foreground">
                <FileText className="w-8 h-8 opacity-20 mx-auto mb-2" />
                No previous versions found for this note.
             </div>
         ) : (
            versions.map((v) => (
              <div 
                key={v.id}
                onClick={() => setSelectedVersion(v)}
                className={`p-3 rounded-lg cursor-pointer border transition-colors ${selectedVersion?.id === v.id ? 'bg-primary/10 border-primary shadow-sm' : 'bg-transparent border-transparent hover:bg-muted'}`}
              >
                 <div className="flex items-start justify-between">
                    <div>
                       <div className="text-sm font-bold text-foreground">
                           {new Date(v.timestamp).toLocaleDateString()}
                       </div>
                       <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                           <Clock className="w-3 h-3" />
                           {new Date(v.timestamp).toLocaleTimeString()}
                       </div>
                    </div>
                 </div>
              </div>
            ))
         )}
      </div>

      {selectedVersion && (
         <div className="p-4 border-t bg-muted/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Snapshot Preview</h4>
            
            {/* Very simple, naive "diff" logic for MVP. We just show length diff. */}
            <div className="text-xs mb-4 flex items-center gap-2 bg-background border p-2 rounded-md">
               <ArrowLeftRight className="w-4 h-4 text-primary" />
               <span className="flex-1 truncate">
                  {selectedVersion.content.length} chars (was {currentContent.length})
               </span>
            </div>

            <button 
              onClick={() => {
                 if(confirm("Are you sure you want to revert to this version? Your current unsaved changes will be lost.")) {
                     onRestore(selectedVersion.content)
                     onClose()
                 }
              }}
              className="w-full py-2 bg-primary text-primary-foreground font-bold text-sm rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
            >
               Restore This Version
            </button>
            <p className="text-[10px] text-center text-muted-foreground mt-2 px-2">
               Warning: Restoring cannot be undone.
            </p>
         </div>
      )}
    </div>
  )
}
