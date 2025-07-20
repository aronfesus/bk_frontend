"use client"

import { useState, useEffect } from "react"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { BarChart3, Briefcase, Users, Share2, MessageSquare, Mic, User, Settings, Heart } from "lucide-react"
import { DashboardOverview } from "@/components/dashboard-overview"
import { JobsTab } from "@/components/jobs-tab"
import { ApplicantsTab } from "@/components/applicants-tab"
import { IntegrationsTab } from "@/components/integrations-tab"
import { MessagesTab } from "@/components/messages-tab"
import { VoiceTab } from "@/components/voice-tab"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { statsApi, SummaryStats, ConversationActivity, ApplicantsByJob } from "@/lib/api/stats"
import { applicantsApi } from "@/lib/api/applicants"
import { messagesApi } from "@/lib/api/messages"
import { callsApi } from "@/lib/api/calls"
import { Applicant } from "@/types/applicant"
import { Message } from "@/types/message"
import { Call } from "@/types/call"

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState<{
    summaryStats: SummaryStats | null
    conversationActivity: ConversationActivity[]
    applicantsByJob: ApplicantsByJob[]
    recentApplicants: Applicant[]
    recentMessages: Message[]
    recentCalls: Call[]
  }>({
    summaryStats: null,
    conversationActivity: [],
    applicantsByJob: [],
    recentApplicants: [],
    recentMessages: [],
    recentCalls: [],
  })

  // Transform functions to convert API data to dashboard format
  const transformApplicantForDashboard = (applicant: Applicant) => ({
    id: applicant.id || applicant.applicantId,
    applicantId: applicant.applicantId,
    name: applicant.name,
    avatar_url: applicant.avatar_url,
    created_at: applicant.created_at,
    latest_job_application_title: applicant.latest_job_application_title,
  })

  const transformMessageForDashboard = (message: Message) => ({
    id: message.messageId,
    content: message.text,
    created_at: message.timestamp,
    applicant: {
      id: message.applicantId,
      name: "Unknown User", // This will need to be populated by the API
      avatar_url: undefined,
      created_at: undefined,
      latest_job_application_title: undefined,
    },
  })

  const transformCallForDashboard = (call: Call) => ({
    id: call.callId,
    summary: undefined, // This will need to be added to the Call type
    created_at: call.createdAt,
    applicant: {
      id: call.applicantId,
      name: call.callerName || "Unknown Caller",
      avatar_url: undefined,
      created_at: undefined,
      latest_job_application_title: undefined,
    },
  })
  
  const [isLoading, setIsLoading] = useState(false)

  // Fetch dashboard data when dashboard tab is active
  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchDashboardData()
    }
  }, [activeTab])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const [
        summaryStats,
        conversationActivity,
        applicantsByJob,
        recentApplicants,
        recentMessages,
        recentCalls,
      ] = await Promise.all([
        statsApi.getSummaryStats(),
        statsApi.getConversationActivity(),
        statsApi.getApplicantsByJob(),
        applicantsApi.getRecentApplicants(3),
        messagesApi.getRecentMessages(3),
        callsApi.getRecentCalls(3),
      ])

      setDashboardData({
        summaryStats,
        conversationActivity,
        applicantsByJob,
        recentApplicants,
        recentMessages,
        recentCalls,
      })
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
            <SidebarTrigger className="text-primary hover:bg-primary/10 hover:text-primary" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">
                {activeTab === "dashboard" && "Dashboard"}
                {activeTab === "jobs" && "Jobs Management"}
                {activeTab === "applicants" && "Applicants"}
                {activeTab === "integrations" && "Integrations"}
                {activeTab === "messages" && "Message Conversations"}
                {activeTab === "voice" && "Voice Conversations"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-9 w-9 border-2 border-primary/20">
                      <AvatarImage src="/placeholder.svg?height=36&width=36" alt="User" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                  <DropdownMenuItem className="rounded-lg cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg cursor-pointer text-red-500 focus:text-red-500">
                    <Heart className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {activeTab === "dashboard" && (
              isLoading || !dashboardData.summaryStats ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg">Loading dashboard...</div>
                </div>
              ) : (
                <DashboardOverview
                  summaryStats={dashboardData.summaryStats}
                  conversationActivity={dashboardData.conversationActivity}
                  applicantsByJob={dashboardData.applicantsByJob}
                  recentApplicants={dashboardData.recentApplicants.map(transformApplicantForDashboard)}
                  recentMessages={dashboardData.recentMessages.map(transformMessageForDashboard)}
                  recentCalls={dashboardData.recentCalls.map(transformCallForDashboard)}
                />
              )
            )}
            {activeTab === "jobs" && <JobsTab />}
            {activeTab === "applicants" && <ApplicantsTab />}
            {activeTab === "integrations" && <IntegrationsTab />}
            {activeTab === "messages" && <MessagesTab />}
            {activeTab === "voice" && <VoiceTab />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

function AppSidebar({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "jobs", label: "Jobs", icon: Briefcase },
    { id: "applicants", label: "Applicants", icon: Users },
    { id: "integrations", label: "Integrations", icon: Share2 },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "voice", label: "Voice", icon: Mic },
  ]

  return (
    <Sidebar className="bg-blue-50 dark:bg-blue-950/30">
      <SidebarHeader className="flex items-center px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary p-2 shadow-md">
            <MessageSquare className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            BotMonitor
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.id} className="mb-1 px-2">
              <SidebarMenuButton
                onClick={() => setActiveTab(item.id)}
                isActive={activeTab === item.id}
                tooltip={item.label}
                className={`text-lg py-2.5 rounded-xl transition-all ${
                  activeTab === item.id
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-900/50 dark:hover:text-blue-400 shadow-sm"
                    : "hover:bg-blue-100/50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
                }`}
              >
                <item.icon className={`h-5 w-5 ${activeTab === item.id ? "text-blue-600 dark:text-blue-300" : ""}`} />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="pb-6">
        <SidebarMenu>
          <SidebarMenuItem className="mb-1 px-2">
            <SidebarMenuButton
              asChild
              className="text-lg py-2.5 rounded-xl transition-all hover:bg-blue-100/50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
            >
              <button>
                <User className="h-5 w-5" />
                <span>Account</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="px-2">
            <SidebarMenuButton
              asChild
              className="text-lg py-2.5 rounded-xl transition-all hover:bg-blue-100/50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
            >
              <button>
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

