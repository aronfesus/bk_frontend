import { AppHeader } from "@/components/app-header"
import { DashboardOverview } from "@/components/dashboard-overview"

export default function DashboardPage() {
  return (
    <>
      <AppHeader title="Statisztikák" />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <DashboardOverview />
      </main>
    </>
  )
}

