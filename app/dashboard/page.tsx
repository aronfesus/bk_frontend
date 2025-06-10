import { AppHeader } from "@/components/app-header"
import { DashboardOverview } from "@/components/dashboard-overview"
import { applicantsApi } from "@/lib/api/applicants"
import { callsApi } from "@/lib/api/calls"
import { messagesApi } from "@/lib/api/messages"
import { statsApi } from "@/lib/api/stats"
import { Suspense } from "react"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"

export default async function DashboardPage() {
  return (
    <>
      <AppHeader title="Statisztikák" />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardData />
        </Suspense>
      </main>
    </>
  )
}

async function DashboardData() {
  try {
    const [
      summaryStats,
      conversationActivity,
      applicantsByJob,
      recentApplicants,
      recentMessages,
      recentCalls
    ] = await Promise.all([
      statsApi.getSummaryStats(),
      statsApi.getConversationActivity("7d"),
      statsApi.getApplicantsByJob(),
      applicantsApi.getRecentApplicants(3),
      messagesApi.getRecentMessages(3),
      callsApi.getRecentCalls(3)
    ])

    return (
      <DashboardOverview
        summaryStats={summaryStats}
        conversationActivity={conversationActivity}
        applicantsByJob={applicantsByJob}
        recentApplicants={recentApplicants as any}
        recentMessages={recentMessages as any}
        recentCalls={recentCalls as any}
      />
    )
  } catch (error) {
    console.error("Failed to load dashboard data:", error)
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-red-500">Failed to load dashboard data. Please check if the backend is running and try again later.</p>
      </div>
    )
  }
}

