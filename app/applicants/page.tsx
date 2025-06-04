import { AppHeader } from "@/components/app-header"
import { ApplicantsTab } from "@/components/applicants-tab"

export default function ApplicantsPage() {
  return (
    <>
      <AppHeader title="Jelentkezők kezelése" />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <ApplicantsTab />
      </main>
    </>
  )
}

