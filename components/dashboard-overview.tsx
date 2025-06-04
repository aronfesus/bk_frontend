"use client"

import { AvatarFallback } from "@/components/ui/avatar"

import { AvatarImage } from "@/components/ui/avatar"

import { Avatar } from "@/components/ui/avatar"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpRight, Users, Briefcase, MessageSquare, Mic, Clock } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

// Mock data for charts
const conversationData = [
  { name: "Mon", messages: 40, voice: 25 },
  { name: "Tue", messages: 30, voice: 20 },
  { name: "Wed", messages: 45, voice: 30 },
  { name: "Thu", messages: 55, voice: 35 },
  { name: "Fri", messages: 60, voice: 40 },
  { name: "Sat", messages: 35, voice: 15 },
  { name: "Sun", messages: 25, voice: 10 },
]

const applicantData = [
  { name: "Software Engineer", value: 45 },
  { name: "Product Manager", value: 30 },
  { name: "UX Designer", value: 25 },
  { name: "Data Analyst", value: 20 },
  { name: "Marketing", value: 15 },
]

export function DashboardOverview() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Összes jelentkező</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,248</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 flex items-center">
                +18% <ArrowUpRight className="h-3 w-3 ml-1" />
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
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 flex items-center">
                +2 <ArrowUpRight className="h-3 w-3 ml-1" />
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
            <div className="text-2xl font-bold">3,427</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 flex items-center">
                +12% <ArrowUpRight className="h-3 w-3 ml-1" />
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
            <div className="text-2xl font-bold">1,893</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 flex items-center">
                +8% <ArrowUpRight className="h-3 w-3 ml-1" />
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
                <CardDescription>Üzenet és hívás aktivitás a main napon</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={conversationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="messages" stroke="#8884d8" name="Messages" />
                    <Line type="monotone" dataKey="voice" stroke="#82ca9d" name="Voice" />
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
                  <BarChart data={applicantData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" name="Applicants" />
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
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${i}`} />
                        <AvatarFallback>U{i}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Applicant Name {i}</p>
                        <p className="text-xs text-muted-foreground">Applied for Software Engineer</p>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {i}órája
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
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${i}`} />
                        <AvatarFallback>U{i}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">User {i}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          I'm interested in the Software Engineer position...
                        </p>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {i * 10}perce
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
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${i}`} />
                        <AvatarFallback>U{i}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Caller {i}</p>
                        <p className="text-xs text-muted-foreground">{i + 1} minute call about Product Manager role</p>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {i * 30}perce
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

