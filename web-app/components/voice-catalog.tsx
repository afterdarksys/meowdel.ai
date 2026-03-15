"use client"

import { useState, useEffect } from "react"
import { Play, Pause, Save, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { petRegistry, PetPersonality } from "@/lib/personality/engine"

// Mock data until API is wired up
const MOCK_VOICES = [
  { id: "voice-1", elevenLabsVoiceId: "jBpfuIE2acCO8z3wKNLl", name: "Gigi", category: "playful", previewUrl: "/audio/gigi.mp3", isPremium: false },
  { id: "voice-2", elevenLabsVoiceId: "ErXwobaYiN019PkySvjV", name: "Antoni", category: "professional", previewUrl: "/audio/antoni.mp3", isPremium: true },
  { id: "voice-3", elevenLabsVoiceId: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", category: "caring", previewUrl: "/audio/elli.mp3", isPremium: false },
  { id: "voice-4", elevenLabsVoiceId: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", category: "funny", previewUrl: "/audio/josh.mp3", isPremium: true },
  { id: "voice-5", elevenLabsVoiceId: "VR6AewLTigWG4xSOukaG", name: "Rachel", category: "calm", previewUrl: "/audio/rachel.mp3", isPremium: false },
]

export function VoiceCatalog() {
  const [playing, setPlaying] = useState<string | null>(null)
  const [bindings, setBindings] = useState<Record<string, string>>({}) // personalityId -> voiceId
  const [selectedPersonality, setSelectedPersonality] = useState<string>(Object.keys(petRegistry)[0])
  const [bindingDialogOpen, setBindingDialogOpen] = useState(false)
  const [voiceToBind, setVoiceToBind] = useState<string | null>(null)

  // In a real app, fetch voices and user bindings from the API
  useEffect(() => {
    // simulate fetching bindings
    setBindings({
      "mittens": "voice-1",
      "professor": "voice-2"
    })
  }, [])

  const handlePlayPreview = (voiceId: string) => {
    // In a real implementation, this would play the HTML5 audio element
    if (playing === voiceId) {
      setPlaying(null)
    } else {
      setPlaying(voiceId)
      // Auto stop after 3 seconds for demo
      setTimeout(() => setPlaying(null), 3000)
    }
  }

  const handleBind = () => {
    if (voiceToBind && selectedPersonality) {
      setBindings(prev => ({
        ...prev,
        [selectedPersonality]: voiceToBind
      }))
      setBindingDialogOpen(false)
      // Here you would make an API call to save the binding
    }
  }

  const openBindingDialog = (voiceId: string) => {
    setVoiceToBind(voiceId)
    setBindingDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Voice Catalog</h2>
        <p className="text-muted-foreground">
          Customize how Meowdel sounds in meetings. Bind ElevenLabs voices to your favorite cat personalities.
          Premium voices cost an additional 20 tokens per minute.
        </p>
      </div>

      {Object.keys(bindings).length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Your Active Voice Bindings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(bindings).map(([personalityId, voiceId]) => {
              const voice = MOCK_VOICES.find(v => v.id === voiceId)
              const personality = petRegistry[personalityId]
              
              if (!voice || !personality) return null

              return (
                <div key={personalityId} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🐱</span>
                    <div>
                      <p className="font-semibold">{personality.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">Sounds like {voice.name}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => {
                    const newBindings = { ...bindings }
                    delete newBindings[personalityId]
                    setBindings(newBindings)
                  }}>
                    Unbind
                  </Button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_VOICES.map((voice) => (
          <Card key={voice.id} className="relative overflow-hidden">
            {voice.isPremium && (
               <div className="absolute top-0 right-0 bg-yellow-500/90 text-yellow-950 text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                 PREMIUM
               </div>
            )}
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{voice.name}</CardTitle>
                  <CardDescription className="capitalize mt-1">{voice.category} voice</CardDescription>
                </div>
                <Button 
                  size="icon" 
                  variant={playing === voice.id ? "default" : "secondary"}
                  className="rounded-full h-10 w-10 shrink-0"
                  onClick={() => handlePlayPreview(voice.id)}
                >
                  {playing === voice.id ? <Pause size={18} /> : <Play size={18} className="ml-1" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mt-2">
                 <Badge variant="outline">ElevenLabs</Badge>
                 {voice.isPremium ? (
                   <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700">20 tokens/min</Badge>
                 ) : (
                   <Badge variant="secondary">Free Tier</Badge>
                 )}
              </div>
            </CardContent>
            <CardFooter>
               <Button className="w-full" onClick={() => openBindingDialog(voice.id)}>
                 Bind to Cat
               </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={bindingDialogOpen} onOpenChange={setBindingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bind Voice to Personality</DialogTitle>
            <DialogDescription>
              Select which cat personality should use this voice when speaking in meetings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <Select value={selectedPersonality} onValueChange={(value) => {
              if (value) setSelectedPersonality(value)
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select a cat personality" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(petRegistry).map(([id, p]: [string, PetPersonality]) => (
                  <SelectItem key={id} value={id}>
                    <div className="flex items-center gap-2">
                      <span>🐱</span>
                      <span>{p.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBindingDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleBind}>
              <Save className="mr-2 h-4 w-4" /> Save Binding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
