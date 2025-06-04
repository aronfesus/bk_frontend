import { AppHeader } from "@/components/app-header"
import { JobsTab } from "@/components/jobs-tab"

export default function JobsPage() {
  return (
    <>
      <AppHeader title="Munkák kezelése" />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <JobsTab />
      </main>
    </>
  )
}

