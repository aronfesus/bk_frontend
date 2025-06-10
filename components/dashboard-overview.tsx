"use client"

import { AvatarFallback, AvatarImage, Avatar } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpRight, Users, Briefcase, MessageSquare, Mic, Clock } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { SummaryStats, ConversationActivity, ApplicantsByJob } from "@/lib/api/stats"
import { timeAgo } from "@/lib/utils"

// TODO: Move these type definitions to the actual type definition files
// These are created based on the API plan in dashboard-implementation-plan.md
interface Applicant {
  id: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  latest_job_application_title?: string;
};

interface Message {
    id: string;
    content: string;
    created_at: string;
    applicant: Applicant;
};

interface Call {
    id: string;
    summary?: string;
    created_at: string;
    applicant: Applicant;
};

interface DashboardOverviewProps {
  summaryStats: SummaryStats;
  conversationActivity: ConversationActivity[];
  applicantsByJob: ApplicantsByJob[];
  recentApplicants: Applicant[];
  recentMessages: Message[];
  recentCalls: Call[];
}

export function DashboardOverview({
  summaryStats,
  conversationActivity,
  applicantsByJob,
  recentApplicants,
  recentMessages,
  recentCalls,
}: DashboardOverviewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Összes jelentkező</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.total_applicants.current}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 flex items-center">
                +{summaryStats.total_applicants.change_percent}% <ArrowUpRight className="h-3 w-3 ml-1" />
              </span>{" "}
              elöző hónaphoz képest
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktív munkák</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.active_jobs.current}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 flex items-center">
                +{summaryStats.active_jobs.change} <ArrowUpRight className="h-3 w-3 ml-1" />
              </span>{" "}
              elöző hónaphoz képest
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Üzenetek</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.total_messages.current}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 flex items-center">
                +{summaryStats.total_messages.change_percent}% <ArrowUpRight className="h-3 w-3 ml-1" />
              </span>{" "}
              elöző hónaphoz képest
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hívások</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.total_calls.current}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 flex items-center">
                +{summaryStats.total_calls.change_percent}% <ArrowUpRight className="h-3 w-3 ml-1" />
              </span>{" "}
              elöző hónaphoz képest
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Áttekintés</TabsTrigger>
          <TabsTrigger value="analytics">Részletes statisztikák</TabsTrigger>
          <TabsTrigger value="reports">Jelentések</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Üzenet és hívás aktivitás</CardTitle>
                <CardDescription>Üzenet és hívás aktivitás a héten</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={conversationActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="messages" stroke="#8884d8" name="Messages" />
                    <Line type="monotone" dataKey="calls" stroke="#82ca9d" name="Voice" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Jelentkezők munka szerint</CardTitle>
                <CardDescription>Jelentkezők eloszlása munka pozíciók szerint</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={applicantsByJob} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="job_title" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" name="Applicants" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Utoljára jelentkezett jelentkezők</CardTitle>
                <CardDescription>Utoljára jelentkezett jelentkezők</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentApplicants.map((applicant, index) => (
                    <div key={`${applicant.id}-${index}`} className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={applicant.avatar_url ?? undefined} />
                        <AvatarFallback>{applicant.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{applicant.name}</p>
                        <p className="text-xs text-muted-foreground">Applied for {applicant.latest_job_application_title || 'N/A'}</p>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {timeAgo(applicant.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Utoljára üzenetet küldő jelentkezők</CardTitle>
                <CardDescription>Utoljára üzenetet küldő jelentkezők</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentMessages.map((message, index) => (
                    <div key={`${message.id}-${index}`} className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={message.applicant.avatar_url ?? undefined} />
                        <AvatarFallback>{message.applicant.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{message.applicant.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {message.content}
                        </p>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {timeAgo(message.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Utoljára hívott jelentkezők</CardTitle>
                <CardDescription>Utoljára hívott jelentkezők</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCalls.map((call, index) => (
                    <div key={`${call.id}-${index}`} className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={call.applicant.avatar_url ?? undefined} />
                        <AvatarFallback>{call.applicant.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{call.applicant.name}</p>
                        <p className="text-xs text-muted-foreground">{call.summary || 'N/A'}</p>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {timeAgo(call.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="h-[400px] flex items-center justify-center text-muted-foreground">
          Részletes statisztikák itt jelennek meg
        </TabsContent>
        <TabsContent value="reports" className="h-[400px] flex items-center justify-center text-muted-foreground">
          Jelentések itt jelennek meg
        </TabsContent>
      </Tabs>
    </div>
  )
}

