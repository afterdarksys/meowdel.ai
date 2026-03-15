"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plug, Key, Copy, CheckCircle2, ChevronLeft, RefreshCw, KeyRound, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface CatImage {
  id: string;
  url: string;
  width: number;
  height: number;
  tier: string;
}

export default function CatApiPluginPage() {
  const [apiKey, setApiKey] = useState("meow_dev_demo_key_777")
  const [copied, setCopied] = useState(false)
  const [demoTier, setDemoTier] = useState("day")
  const [demoCat, setDemoCat] = useState<CatImage | null>(null)
  const [loading, setLoading] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    toast.success("API Key copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const fetchDemoCat = async (tier: string) => {
    setLoading(true)
    setDemoTier(tier)
    try {
       const url = tier === 'premium' ? `/api/catapi?api_key=${apiKey}` : `/api/catapi?tier=${tier}`
       const res = await fetch(url)
       if (!res.ok) throw new Error("Failed to fetch cat from API")
       const data = await res.json()
       if (data && data.length > 0) {
           setDemoCat(data[0])
       }
    } catch (e) {
       toast.error("Error fetching cat. (Did you try premium without a key?)")
    } finally {
       setLoading(false)
    }
  }

  return (
    <div className="flex-1 w-full overflow-y-auto p-12 max-w-6xl mx-auto space-y-8">
      <Link href="/brain/plugins" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 w-fit transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Plugins
      </Link>

      <div>
        <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3">
          <ImageIcon className="w-8 h-8 text-primary" /> Cat API Clone
        </h1>
        <p className="text-muted-foreground text-lg">Your one-stop shop for Cats-as-a-Service.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Docs & Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/20 bg-background/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                 <KeyRound className="w-5 h-5" /> API Access Keys
              </CardTitle>
              <CardDescription>
                Use this key to access the premium random cat endpoints without rate limits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                 <Input value={apiKey} readOnly className="font-mono text-muted-foreground" />
                 <Button variant="secondary" onClick={copyToClipboard} className="shrink-0 w-24">
                   {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                   {copied ? 'Copied' : 'Copy'}
                 </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>Endpoints and parameters for integrating CatAPI into your apps.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div>
                  <h3 className="font-semibold text-sm mb-2">Base URL</h3>
                  <code className="bg-muted px-2 py-1 rounded text-sm text-primary">GET /api/catapi</code>
               </div>

               <div>
                  <h3 className="font-semibold text-sm mb-2">Free Tiers (Temporal & Seasonal)</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                     Free tiers return a consistent cat image based on the chosen time period or season. No API key required.
                  </p>
                  <ScrollArea className="h-48 border rounded-md bg-muted/20 p-4">
                     <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-[120px_1fr] gap-4 pb-3 border-b border-border/50">
                          <code className="text-primary font-bold">?tier=hour</code>
                          <span className="text-muted-foreground">Changes every hour at the top of the hour.</span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-4 pb-3 border-b border-border/50">
                          <code className="text-primary font-bold">?tier=day</code>
                          <span className="text-muted-foreground">The official Cat of the Day. Changes at midnight UTC.</span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-4 pb-3 border-b border-border/50">
                          <code className="text-primary font-bold">?tier=week</code>
                          <span className="text-muted-foreground">Consistent for the entire calendar week.</span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-4 pb-3 border-b border-border/50">
                          <code className="text-primary font-bold">?tier=month</code>
                          <span className="text-muted-foreground">Cat of the Month.</span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-4 pb-3 border-b border-border/50">
                          <code className="text-primary font-bold">?tier=winter</code>
                          <span className="text-muted-foreground">A cozy winter and snow themed cat.</span>
                        </div>
                     </div>
                  </ScrollArea>
               </div>

               <div>
                  <h3 className="font-semibold text-sm mb-2">Premium Tiers</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                     Fetch a completely random, high-quality cat at any time. Requires the <code>x-api-key</code> header or the <code>?api_key=</code> URL parameter.
                  </p>
                  <code className="bg-muted px-2 py-1 rounded text-sm text-primary block w-fit">
                    curl -H "x-api-key: your_key_here" https://api.10xbrain.ai/api/catapi
                  </code>
               </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Col: Interactive Playground */}
        <div className="space-y-6">
           <Card className="sticky top-8 bg-gradient-to-br from-card to-primary/5 border-primary/20">
              <CardHeader>
                 <CardTitle>API Playground</CardTitle>
                 <CardDescription>Test the endpoints live.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 
                 <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant={demoTier === 'hour' ? 'default' : 'secondary'} 
                      className="cursor-pointer hover:bg-primary/80"
                      onClick={() => fetchDemoCat('hour')}
                    >Cat of the Hour</Badge>
                    <Badge 
                      variant={demoTier === 'day' ? 'default' : 'secondary'} 
                      className="cursor-pointer hover:bg-primary/80"
                      onClick={() => fetchDemoCat('day')}
                    >Cat of the Day</Badge>
                    <Badge 
                      variant={demoTier === 'winter' ? 'default' : 'secondary'} 
                      className="cursor-pointer hover:bg-primary/80"
                      onClick={() => fetchDemoCat('winter')}
                    >Winter Cat</Badge>
                    <Badge 
                      variant={demoTier === 'premium' ? 'default' : 'outline'} 
                      className="cursor-pointer hover:bg-primary/80 border-primary"
                      onClick={() => fetchDemoCat('premium')}
                    >Premium Random</Badge>
                 </div>

                 <div className="relative aspect-video rounded-lg overflow-hidden border bg-black/5 flex items-center justify-center">
                    {loading ? (
                        <div className="flex flex-col items-center text-muted-foreground animate-pulse">
                           <RefreshCw className="w-8 h-8 mb-2 animate-spin" />
                           <span className="text-xs font-semibold uppercase tracking-widest">Fetching...</span>
                        </div>
                    ) : demoCat ? (
                        <img src={demoCat.url} alt="Cat API Result" className="w-full h-full object-cover transition-opacity duration-300" />
                    ) : (
                        <div className="text-muted-foreground/50 text-sm">Select a tier above to test</div>
                    )}
                 </div>

                 {demoCat && (
                   <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                     <pre>
{JSON.stringify([demoCat], null, 2)}
                     </pre>
                   </div>
                 )}

              </CardContent>
           </Card>
        </div>

      </div>
    </div>
  )
}
