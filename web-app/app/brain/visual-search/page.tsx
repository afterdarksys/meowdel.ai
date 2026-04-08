"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, Image as ImageIcon, Search, Loader2, Brain } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

import { BrainNote } from "@/app/api/brain/notes/route"

export default function VisualSearchPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<(BrainNote & { score: number })[]>([])
  
  const [notes, setNotes] = useState<BrainNote[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch all notes to pass to the search endpoint
  useEffect(() => {
    fetch('/api/brain/notes')
      .then(res => res.json())
      .then(data => setNotes(Array.isArray(data) ? data : []))
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
      setExtractedText("")
      setSearchResults([])
    }
  }

  const handleSearch = async () => {
    if (!file) return

    setLoading(true)
    try {
      // 1. Extract text using OCR via /api/brain/visual-search
      const formData = new FormData()
      formData.append('image', file)
      
      const ocrRes = await fetch('/api/brain/visual-search', {
        method: 'POST',
        body: formData,
      })
      const ocrData = await ocrRes.json()
      
      if (!ocrRes.ok) throw new Error(ocrData.error || 'OCR failed')
      
      const text = ocrData.text || ''
      setExtractedText(text)

      if (!text.trim()) {
         toast.error("No text could be extracted from the image.")
         setLoading(false)
         return
      }

      // 2. Perform semantic search using the extracted text
      const searchRes = await fetch('/api/brain/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, notes }),
      })
      
      const searchData = await searchRes.json()
      if (searchRes.ok) {
        setSearchResults(searchData)
        toast.success("Found related notes!")
      } else {
         throw new Error(searchData.error || 'Search failed')
      }

    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to search")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-start h-full p-8 bg-background relative overflow-y-auto w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="w-full max-w-4xl z-10 space-y-8">
        <Card className="border-primary/20 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <ImageIcon className="h-6 w-6 text-primary" />
              Visual Search
            </CardTitle>
            <CardDescription>
              Upload a screenshot or image to find related notes in your brain.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {preview ? (
                    <img src={preview} alt="Upload preview" className="max-h-48 object-contain rounded" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-8 w-8 mb-2" />
                      <span>Click to upload image</span>
                      <span className="text-xs">Supports PNG, JPG</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                  />
                </div>
                <Button 
                  className="w-full" 
                  disabled={!file || loading}
                  onClick={handleSearch}
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing Image...</>
                  ) : (
                    <><Search className="mr-2 h-4 w-4" /> Start Visual Search</>
                  )}
                </Button>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="rounded-md border bg-muted/30 p-4 h-full min-h-[200px] flex flex-col">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2 uppercase tracking-wider">Extracted Text</h3>
                  {loading && !extractedText ? (
                    <div className="flex-1 flex items-center justify-center">
                       <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : extractedText ? (
                    <ScrollArea className="flex-1">
                      <div className="text-sm opacity-80 whitespace-pre-wrap">{extractedText}</div>
                    </ScrollArea>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground italic">
                      Upload an image with text to see extraction results...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Results Section */}
            {searchResults.length > 0 && (
              <div className="pt-6 border-t mt-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" /> 
                  Related Notes
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {searchResults.map((note) => (
                    <Link key={note.slug} href={`/brain/notes/${note.slug}`}>
                      <Card className="h-full hover:border-primary/50 transition-all cursor-pointer bg-background/50 hover:bg-muted/20">
                        <CardHeader className="p-4 pb-2">
                           <div className="flex justify-between items-start">
                             <CardTitle className="text-lg">{note.title}</CardTitle>
                             <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                               Match: {Math.round(note.score * 100)}%
                             </span>
                           </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <p className="text-sm text-muted-foreground line-clamp-2">{note.summary ?? 'No summary yet'}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
