import { FileBrowser } from "@/components/file-browser"

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full w-full">
      <FileBrowser />
      <div className="flex-1 min-w-0 bg-background relative z-0">
        {children}
      </div>
    </div>
  )
}
