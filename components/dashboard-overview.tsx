"use client"

import { AvatarFallback, AvatarImage, Avatar } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpRight, Users, Briefcase, MessageSquare, Mic, Clock } from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { SummaryStats, ConversationActivity, ApplicantsByJob } from "@/lib/api/stats"
import { timeAgo } from "@/lib/utils"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Applicant } from "@/types/applicant"

// Dashboard-specific interfaces that match the expected API response structure
interface DashboardApplicant {
  id?: string;
  applicantId?: string;
  name: string;
  avatar_url?: string;
  created_at?: string;
  latest_job_application_title?: string;
};

interface DashboardMessage {
    id: string;
    content: string;
    created_at: string;
    applicant: DashboardApplicant;
};

interface DashboardCall {
    id: string;
    summary?: string;
    created_at: string;
    applicant: DashboardApplicant;
};

interface DashboardOverviewProps {
  summaryStats: SummaryStats;
  conversationActivity: ConversationActivity[];
  applicantsByJob: ApplicantsByJob[];
  recentApplicants: DashboardApplicant[];
  recentMessages: DashboardMessage[];
  recentCalls: DashboardCall[];
}

const chartConfig = {
  messages: {
    label: "Üzenetek",
    color: "#3b82f6", // Bright blue
  },
  calls: {
    label: "Hívások",
    color: "#8b5cf6", // Vibrant purple
  },
  count: {
    label: "Jelentkezők",
    color: "#06b6d4", // Teal
  },
} satisfies ChartConfig

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
        <Card className="transition-transform hover:scale-[1.02] bg-gray-50/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold ">Összes jelentkező</CardTitle>
            <div className="p-2 bg-primary rounded-md">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summaryStats.total_applicants.current}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 flex items-center">
                +{summaryStats.total_applicants.change_percent}% <ArrowUpRight className="h-3 w-3 ml-1" />
              </span>{" "}
              elöző hónaphoz képest
            </p>
          </CardContent>
        </Card>
        <Card className="transition-transform hover:scale-[1.02] bg-gray-50/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold ">Aktív munkák</CardTitle>
            <div className="p-2 bg-primary rounded-md">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
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
        <Card className="transition-transform hover:scale-[1.02] bg-gray-50/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold ">Üzenetek</CardTitle>
            <div className="p-2 bg-primary rounded-md">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
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
        <Card className="transition-transform hover:scale-[1.02] bg-gray-50/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold ">Hívások</CardTitle>
            <div className="p-2 bg-primary rounded-md">
              <Mic className="h-4 w-4 text-white" />
            </div>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-gray-50/60">
          <CardHeader>
            <CardTitle className="text-2xl font-bold ">Üzenet és hívás aktivitás</CardTitle>
            <CardDescription>Üzenet és hívás aktivitás a héten</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
              <AreaChart
                accessibilityLayer
                data={conversationActivity}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(5)}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <defs>
                  <linearGradient id="fillMessages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-messages)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-messages)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-calls)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-calls)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="calls"
                  type="natural"
                  fill="url(#fillCalls)"
                  fillOpacity={0.4}
                  stroke="var(--color-calls)"
                  stackId="a"
                />
                <Area
                  dataKey="messages"
                  type="natural"
                  fill="url(#fillMessages)"
                  fillOpacity={0.4}
                  stroke="var(--color-messages)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3 bg-gray-50/60">
          <CardHeader>
            <CardTitle className="text-2xl font-bold ">Jelentkezők munka szerint</CardTitle>
            <CardDescription className="text-sm">Jelentkezők eloszlása munka pozíciók szerint</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
              <BarChart data={applicantsByJob} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="job_title"
                  type="category"
                  width={150}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="count" fill="var(--color-messages)" name="Jelentkező" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gray-50/60">
          <CardHeader>
            <CardTitle className="text-2xl font-bold ">Legutóbbi jelentkezések</CardTitle>
            <CardDescription className="text-sm">Utolsó 3 jelentkezés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApplicants.map((applicant, index) => (
                <div key={`${applicant.id || applicant.applicantId || index}`} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={applicant.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/50 text-white">{applicant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1 bg-gray-50/60 p-2 rounded-md">
                    <p className="text-sm font-medium">{applicant.name}</p>
                    <p className="text-xs text-muted-foreground">Jelentkezett a {applicant.latest_job_application_title || 'N/A'} munkára</p>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    {applicant.created_at ? timeAgo(applicant.created_at) : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-50/60">
          <CardHeader>
            <CardTitle className="text-2xl font-bold ">Legutóbbi üzenetek</CardTitle>
            <CardDescription className="text-sm">Utolsó 3 üzenet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMessages.map((message, index) => (
                <div key={`${message.id || index}`} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={message.applicant.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/50 text-white">{message.applicant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1 bg-gray-50/60 p-2 rounded-md">
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
        <Card className="bg-gray-50/60">
          <CardHeader>
            <CardTitle className="text-2xl font-bold ">Legutóbbi hívások</CardTitle>
            <CardDescription className="text-sm">Utolsó 3 hívás</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCalls.map((call, index) => (
                <div key={`${call.id || index}`} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={call.applicant.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/50 text-white">{call.applicant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1 bg-gray-50/60 p-2 rounded-md">
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
    </div>
  )
}

