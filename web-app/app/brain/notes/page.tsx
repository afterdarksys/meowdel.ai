import { TemplateGallery } from "@/components/template-gallery"
import { SmartReminders } from "@/components/smart-reminders"

export default function NotesPage() {
  return (
    <div className="flex flex-col items-center justify-start h-full p-8 bg-background relative overflow-y-auto w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="w-full max-w-5xl z-10 flex flex-col gap-8">
        <SmartReminders />
        <TemplateGallery />
      </div>
    </div>
  )
}
