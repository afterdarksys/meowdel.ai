"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Github, Webhook, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export function CodeToNoteSetup() {
  const [repo, setRepo] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSetup = async () => {
    if (!repo.includes('/')) {
        toast.error("Please enter a valid repository format (owner/repo)")
        return
    }

    setLoading(true)
    // In a real app we'd call an API to automatically configure the GitHub webhook
    // For this demonstration, we'll simulate the configuration success
    setTimeout(() => {
        setLoading(false)
        setSuccess(true)
        toast.success(`Webhook configured for ${repo}`)
    }, 1500)
  }

  return (
    <Card className="border-primary/20 bg-background/50 backdrop-blur-sm mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          Code-to-Note Pipeline
        </CardTitle>
        <CardDescription>
          Automatically generate architecture notes in your brain whenever you push code to GitHub.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
             <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                 <CheckCircle2 className="h-6 w-6 text-green-500" />
             </div>
             <div>
                 <p className="font-semibold text-green-500">Pipeline Active!</p>
                 <p className="text-sm text-muted-foreground mt-1">
                     Listening for pushes on <strong>{repo}</strong>. New architecture notes will appear in <code>/brain/architecture/{repo.split('/')[1]}</code>.
                 </p>
             </div>
             <Button variant="outline" onClick={() => { setSuccess(false); setRepo(""); }}>Configure another</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
               <label className="text-sm font-medium">Repository to monitor</label>
               <div className="flex gap-3">
                 <Input 
                   placeholder="e.g. afterdarksys/meowdel.ai" 
                   value={repo}
                   onChange={(e) => setRepo(e.target.value)}
                 />
                 <Button disabled={!repo || loading} onClick={handleSetup} className="shrink-0 gap-2">
                    {loading ? <Webhook className="h-4 w-4 animate-spin" /> : <Webhook className="h-4 w-4" />}
                    Setup Webhook
                 </Button>
               </div>
            </div>
            <div className="rounded border border-dashed p-4 text-xs text-muted-foreground bg-muted/20">
               <p><strong>How it works:</strong> We will configure a GitHub webhook for your repository pointing to <code>/api/brain/code-to-note</code>.</p>
               <p className="mt-1">When you commit code, Meowdel will analyze the changes and automatically write a markdown architectural summary directly into your Brain.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
