"use client"

import { AppHeader } from "@/components/app-header"
import { DashboardOverview } from "@/components/dashboard-overview"
import { applicantsApi } from "@/lib/api/applicants"
import { callsApi } from "@/lib/api/calls"
import { messagesApi } from "@/lib/api/messages"
import { statsApi } from "@/lib/api/stats"
import { Suspense } from "react"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"
import { useQuery } from "@tanstack/react-query"

export default function DashboardPage() {
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

function DashboardData() {
  const { data: summaryStats, isLoading: loadingStats } = useQuery({
    queryKey: ["summaryStats"],
    queryFn: () => statsApi.getSummaryStats(),
  })

  const { data: conversationActivity, isLoading: loadingActivity } = useQuery({
    queryKey: ["conversationActivity"],
    queryFn: () => statsApi.getConversationActivity("7d"),
  })

  const { data: applicantsByJob, isLoading: loadingApplicantsByJob } = useQuery({
    queryKey: ["applicantsByJob"],
    queryFn: () => statsApi.getApplicantsByJob(),
  })

  const { data: recentApplicants, isLoading: loadingApplicants } = useQuery({
    queryKey: ["recentApplicants"],
    queryFn: () => applicantsApi.getRecentApplicants(3),
  })

  const { data: recentMessages, isLoading: loadingMessages } = useQuery({
    queryKey: ["recentMessages"],
    queryFn: () => messagesApi.getRecentMessages(3),
  })

  const { data: recentCalls, isLoading: loadingCalls } = useQuery({
    queryKey: ["recentCalls"],
    queryFn: () => callsApi.getRecentCalls(3),
  })

  const isLoading = loadingStats || loadingActivity || loadingApplicantsByJob || 
                   loadingApplicants || loadingMessages || loadingCalls

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const hasError = !summaryStats || !conversationActivity || !applicantsByJob

  if (hasError) {
    return (
      <div className="flex h-full w-full items-center justify-center flex-col gap-4">
        <svg
          className="h-12 w-12 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div className="text-center">
          <p className="text-lg font-semibold text-red-500">Hiba történt az adatok betöltése közben</p>
          <p className="text-sm text-gray-600">Kérjük ellenőrizze, hogy a háttérrendszer működik-e és próbálja újra később</p>
        </div>
      </div>
    )
  }

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
}

