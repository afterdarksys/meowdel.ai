"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FileText, Plus, Loader2, Sparkles, AlertCircle } from "lucide-react"

export interface BrainTemplate {
  slug: string;
  title: string;
  content: string;
}

export function TemplateGallery() {
  const [templates, setTemplates] = useState<BrainTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/brain/templates')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setTemplates(data.templates || [])
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleCreateFromTemplate = async (template: BrainTemplate) => {
    setIsCreating(true)
    try {
      const defaultTitle = `New ${template.title}`
      const req = await fetch('/api/brain/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           title: defaultTitle,
           template: template.slug, 
           content: ""
        })
      })
      const res = await req.json()
      
      if (res.error) throw new Error(res.error)
      
      if (res.slug) {
         router.push(`/brain/notes/${res.slug}`)
      }
    } catch (err: any) {
      console.error(err)
      alert(`Failed to create note: ${err.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateEmpty = async () => {
    setIsCreating(true)
    try {
      const now = Date.now()
      const defaultTitle = `Untitled Note ${now}`
      const req = await fetch('/api/brain/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           title: defaultTitle,
           content: ""
        })
      })
      const res = await req.json()
      
      if (res.error) throw new Error(res.error)
      
      if (res.slug) {
         router.push(`/brain/notes/${res.slug}`)
      }
    } catch (err: any) {
      console.error(err)
      alert(`Failed to create note: ${err.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  if (loading) {
     return (
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
           <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
           <p>Loading Templates...</p>
        </div>
     )
  }

  if (error) {
     return (
        <div className="flex flex-col items-center justify-center p-12 text-destructive">
           <AlertCircle className="w-8 h-8 mb-4" />
           <p>Failed to load templates: {error}</p>
        </div>
     )
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-8 relative z-20">
      <div className="mb-8 flex items-center justify-between">
         <div>
            <h2 className="text-3xl font-bold tracking-tight">Template Gallery</h2>
            <p className="text-muted-foreground mt-2">Start a new note from a template or create a blank one.</p>
         </div>
         <button 
           onClick={handleCreateEmpty}
           disabled={isCreating}
           className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm"
         >
           {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
           Blank Note
         </button>
      </div>

      {templates.length === 0 ? (
         <div className="text-center p-12 border border-dashed rounded-xl bg-muted/20">
             <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
             <h3 className="text-lg font-medium">No Templates Found</h3>
             <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto">
                Create markdown files in your `brain/templates` directory (e.g. `Weekly-Review.md`) to see them here. Variables like {'{{title}}'} and {'{{date}}'} are supported!
             </p>
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
               <div key={template.slug} className="group relative flex flex-col bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:border-primary/50">
                  <div className="p-5 flex-1 relative z-10">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                       <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{template.title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-3">
                       {template.content.replace(/((^#+ )|(```[\s\S]*?```))/gm, '').substring(0, 100)}...
                    </p>
                  </div>
                  <div className="p-4 border-t bg-muted/10 relative z-10">
                     <button 
                       onClick={() => handleCreateFromTemplate(template)}
                       disabled={isCreating}
                       className="w-full flex items-center justify-center gap-2 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors text-sm font-medium border"
                     >
                       {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                       Use Template
                     </button>
                  </div>
               </div>
            ))}
         </div>
      )}
    </div>
  )
}
