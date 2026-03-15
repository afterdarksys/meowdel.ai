"use client"

import { useState } from "react"
import { DownloadCloud, FileArchive, ArrowRight, Loader2, Globe, FileText, CheckCircle2 } from "lucide-react"

export default function ExportPage() {
  const [exporting, setExporting] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleExport = async (format: string) => {
     setExporting(format)
     setSuccess(false)
     
     try {
       const res = await fetch('/api/brain/export', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ format })
       })
       
       if (!res.ok) throw new Error("Export failed")
       
       // Handle binary stream download
       const blob = await res.blob()
       const url = window.URL.createObjectURL(blob)
       const a = document.createElement('a')
       a.href = url
       // Extract filename from headers if possible, or fallback
       const disposition = res.headers.get('content-disposition')
       let filename = 'meowdel-export.zip'
       if (disposition && disposition.indexOf('filename=') !== -1) {
           filename = disposition.split('filename=')[1].replace(/"/g, '')
       }
       
       a.download = filename
       document.body.appendChild(a)
       a.click()
       window.URL.revokeObjectURL(url)
       a.remove()
       
       setSuccess(true)
       setTimeout(() => setSuccess(false), 5000)

     } catch (e) {
       console.error(e)
       alert("Failed to export your brain. Please try again.")
     } finally {
       setExporting(null)
     }
  }

  return (
    <div className="flex-1 w-full overflow-y-auto p-12 max-w-5xl mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3">
          <DownloadCloud className="w-8 h-8 text-primary" /> Smart Export
        </h1>
        <p className="text-muted-foreground text-lg">Your data is yours. Export your knowledge graph at any time.</p>
      </div>

      {success && (
         <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5" />
            <p className="font-medium">Export successful! Your download should begin shortly.</p>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* Full Archive Export */}
         <div className="bg-card border rounded-3xl p-8 relative overflow-hidden group hover:border-primary/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <FileArchive className="w-48 h-48" />
            </div>
            
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 border border-primary/20">
               <FileArchive className="w-7 h-7" />
            </div>
            
            <h2 className="text-2xl font-bold mb-3 relative z-10">Full Brain Archive</h2>
            <p className="text-muted-foreground mb-8 relative z-10 max-w-sm">
               Download a complete ZIP file containing all your markdown notes exactly as they appear on disk. Highly recommended for daily backups.
            </p>
            
            <button 
              onClick={() => handleExport('zip')}
              disabled={exporting !== null}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 font-bold rounded-xl hover:bg-primary/90 transition-colors relative z-10 disabled:opacity-50"
            >
               {exporting === 'zip' ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Packaging Vault...</>
               ) : (
                  <>Generate `.zip` Archive <ArrowRight className="w-4 h-4" /></>
               )}
            </button>
         </div>

         <div className="space-y-6">
            {/* HTML Site Export Hook */}
            <div className="bg-card border rounded-3xl p-6 relative overflow-hidden opacity-60 cursor-not-allowed">
               <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20">
                     <Globe className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold">Static HTML Site</h3>
                  <span className="px-2 py-0.5 bg-muted text-xs font-bold uppercase rounded ml-auto">Soon</span>
               </div>
               <p className="text-sm text-muted-foreground mb-4">Export your brain as an interactive, deployable website (like Quartz or Hugo).</p>
               <button disabled className="w-full py-2 bg-muted text-muted-foreground font-medium rounded-lg border border-border/50">Coming Soon</button>
            </div>

            {/* Print / PDF Hook */}
            <div className="bg-card border rounded-3xl p-6 relative overflow-hidden opacity-60 cursor-not-allowed">
               <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                     <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold">Print to PDF</h3>
                  <span className="px-2 py-0.5 bg-muted text-xs font-bold uppercase rounded ml-auto">Soon</span>
               </div>
               <p className="text-sm text-muted-foreground mb-4">Compile all connected notes into a single, formatted PDF book.</p>
               <button disabled className="w-full py-2 bg-muted text-muted-foreground font-medium rounded-lg border border-border/50">Coming Soon</button>
            </div>
         </div>
      </div>
    </div>
  )
}
