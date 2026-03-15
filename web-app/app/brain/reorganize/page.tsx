import { ReorganizeWizard } from "@/components/reorganize-wizard"

export default function ReorganizePage() {
  return (
    <div className="flex flex-col items-center justify-start h-full p-8 bg-background relative overflow-y-auto w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      <ReorganizeWizard />
    </div>
  )
}
