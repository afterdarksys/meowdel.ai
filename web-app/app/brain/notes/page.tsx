import { FileCode, Plus } from "lucide-react"

export default function NotesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mb-6 shadow-sm border relative z-10">
        <FileCode className="w-10 h-10 text-muted-foreground" />
      </div>
      
      <h2 className="text-2xl font-bold mb-2 relative z-10">Select a Note</h2>
      <p className="text-muted-foreground max-w-sm mb-8 relative z-10">
        Choose a note from the Vault Explorer on the left, or create a new one to start writing.
      </p>
      
      <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 relative z-10">
        <Plus className="w-5 h-5" />
        New Note
      </button>
    </div>
  )
}
