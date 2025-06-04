"use client"

import { useState, useRef, useEffect } from "react"
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { applicantsApi } from "@/lib/api/applicants"
import { messagesApi } from "@/lib/api/messages"
import { jobApplicationsApi } from "@/lib/api/job-applications"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Bot, Search, ChevronDown, Mail, Phone, Calendar, MapPin } from "lucide-react"
import { useIntersection } from "@mantine/hooks"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ApplicantOrigin, ApplicantType } from "@/types/applicant"

interface MessagesTabInfiniteProps {}

const USERS_PAGE_SIZE = 20
const MESSAGES_PAGE_SIZE = 20

export function MessagesTabInfinite({}: MessagesTabInfiniteProps) {
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showApplicantDetails, setShowApplicantDetails] = useState(false)
  const [selectedApplicantForDetails, setSelectedApplicantForDetails] = useState<any>(null)
  const queryClient = useQueryClient()

  // Add query for job applications when viewing applicant details
  const { data: jobApplications = [] } = useQuery({
    queryKey: ["jobApplications", selectedApplicantForDetails?.applicantId],
    queryFn: () => selectedApplicantForDetails 
      ? jobApplicationsApi.getApplicationsByApplicant(selectedApplicantForDetails.applicantId)
      : Promise.resolve([]),
    enabled: !!selectedApplicantForDetails,
  })

  // Add mutation for toggling AI responses
  const toggleAiResponsesMutation = useMutation({
    mutationFn: async ({ applicantId, enabled }: { applicantId: string; enabled: boolean }) => {
      const result = await applicantsApi.updateAiResponse(applicantId, enabled)
      return result
    },
    onSuccess: (updatedApplicant) => {
      // Update the local state
      queryClient.setQueryData<{ pages: { applicants: any[]; total: number }[] }>(["applicants-infinite", searchTerm], (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            applicants: page.applicants.map(applicant => 
              applicant.applicantId === updatedApplicant.applicantId 
                ? updatedApplicant
                : applicant
            )
          }))
        }
      })
      toast.success(`AI válaszok ${updatedApplicant.aiResponse ? 'engedélyezve' : 'tiltva'} a beszélgetésben`)
    },
    onError: (error) => {
      console.error('Error updating AI response:', error)
      toast.error("Sikertelen AI válasz beállítás módosítás")
    }
  })

  const toggleAiResponses = async (applicantId: string) => {
    const applicant = users.find(u => u.applicantId === applicantId)
    if (!applicant) return

    const currentValue = applicant.aiResponse ?? false
    toggleAiResponsesMutation.mutate({ 
      applicantId, 
      enabled: !currentValue
    })
  }

  // Infinite users
  const {
    data: usersPages,
    fetchNextPage: fetchNextUsers,
    hasNextPage: hasMoreUsers,
    isFetchingNextPage: isLoadingMoreUsers,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useInfiniteQuery({
    queryKey: ["applicants-infinite", searchTerm],
    queryFn: async ({ pageParam = 1 }) =>
      applicantsApi.getApplicantsPaginated(Number(pageParam), USERS_PAGE_SIZE, searchTerm),
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce((acc, page) => acc + page.applicants.length, 0)
      return totalLoaded < lastPage.total ? allPages.length + 1 : undefined
    },
    staleTime: 1000 * 60 * 5,
    initialPageParam: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  // Infinite messages for selected user
  const {
    data: messagesPages,
    fetchNextPage: fetchNextMessages,
    hasNextPage: hasMoreMessages,
    isFetchingNextPage: isLoadingMoreMessages,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useInfiniteQuery({
    queryKey: ["messages-infinite", selectedApplicantId],
    queryFn: async ({ pageParam = 1 }) => {
      if (!selectedApplicantId) return { messages: [], total: 0 }
      return messagesApi.getMessagesByApplicantIdPaginated(selectedApplicantId, Number(pageParam), MESSAGES_PAGE_SIZE)
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce((acc, page) => acc + page.messages.length, 0)
      return totalLoaded < lastPage.total ? allPages.length + 1 : undefined
    },
    enabled: !!selectedApplicantId,
    staleTime: 1000 * 60 * 5,
    initialPageParam: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  // Flattened lists
  const users = usersPages?.pages.flatMap(page => page.applicants) ?? []
  const messages = messagesPages?.pages.flatMap(page => page.messages) ?? []

  // Find selected user
  const selectedUser = users.find(u => u.applicantId === selectedApplicantId)

  // Get the current AI response state for the selected applicant
  const currentAiResponse = selectedUser?.aiResponse ?? false

  const viewApplicantDetails = (applicant: any) => {
    setSelectedApplicantForDetails(applicant)
    setShowApplicantDetails(true)
  }

  const getTypeColor = (type: ApplicantType) => {
    switch (type) {
      case ApplicantType.NORMAL:
        return "bg-blue-700"
      case ApplicantType.STUDENT:
        return "bg-green-700"
      case ApplicantType.ELDER:
        return "bg-purple-700"
      default:
        return "bg-gray-500"
    }
  }

  const getOriginColor = (origin: ApplicantOrigin) => {
    switch (origin) {
      case ApplicantOrigin.FACEBOOK:
        return "bg-blue-700"
      case ApplicantOrigin.PHONE:
        return "bg-green-700"
      case ApplicantOrigin.OTHER:
        return "bg-purple-700"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 items-center mb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Jelentkező keresése..."
            className="pl-8 w-[200px]"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex h-[calc(100vh-200px)] bg-[#f7f8fa] rounded-lg border">
        {/* Sidebar */}
        <aside className="w-80 border-r bg-white flex flex-col h-full min-h-0">
          <div className="px-6 py-4 border-b bg-white">
            <span className="font-semibold text-lg">Összes jelentkező</span>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            {isLoadingUsers ? (
              <div className="p-4 space-y-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded" />
                ))}
              </div>
            ) : usersError ? (
              <div className="p-4 text-red-500">A jelentkezők betöltése sikertelen</div>
            ) : users.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center p-4 text-center">
                <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Nincs találat</p>
                <p className="text-xs text-muted-foreground">Próbáljon meg más keresési kifejezést használni</p>
              </div>
            ) : (
              <ul className="divide-y">
                {users.map(user => (
                  <li
                    key={user.applicantId}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedApplicantId === user.applicantId ? "bg-muted/50" : ""
                    }`}
                    onClick={() => setSelectedApplicantId(user.applicantId)}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${user.name?.charAt(0) || 'U'}`} />
                      <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="truncate font-medium text-base">{user.name || 'Unknown User'}</span>
                        <Badge className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold" variant="secondary">2</Badge>
                      </div>
                      <span className="truncate text-xs text-muted-foreground">{user.email || 'No email'}</span>
                    </div>
                  </li>
                ))}
                {hasMoreUsers && (
                  <div className="p-4 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchNextUsers()}
                      disabled={isLoadingMoreUsers}
                      className="w-full"
                    >
                      {isLoadingMoreUsers ? "Betöltés..." : "Továbbiak betöltése"}
                    </Button>
                  </div>
                )}
              </ul>
            )}
          </ScrollArea>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${selectedUser?.name?.charAt(0) || 'U'}`} />
                <AvatarFallback>{selectedUser?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-lg">{selectedUser?.name || 'Válasszon egy jelentkezőt'}</div>
                <div className="text-sm text-muted-foreground">{selectedUser?.email || ''}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {selectedUser && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => viewApplicantDetails(selectedUser)}
                >
                  Profil megtekintése
                </Button>
              )}
              {selectedApplicantId && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">AI válasz</span>
                  <Switch
                    checked={currentAiResponse}
                    onCheckedChange={() => toggleAiResponses(selectedApplicantId)}
                    disabled={toggleAiResponsesMutation.isPending}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-[#f7f8fa] p-6">
            {!selectedApplicantId ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Válasszon egy jelentkezőt a beszélgetések megtekintéséhez</p>
              </div>
            ) : isLoadingMessages ? (
              <div className="flex h-full items-center justify-center">
                <p>Betöltés...</p>
              </div>
            ) : messagesError ? (
              <div className="flex h-full items-center justify-center text-red-500">
                A beszélgetések betöltése sikertelen
              </div>
            ) : (
              <div className="flex flex-col min-h-full space-y-4">
                {hasMoreMessages && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchNextMessages()}
                      disabled={isLoadingMoreMessages}
                    >
                      {isLoadingMoreMessages ? "Betöltés..." : "Továbbiak betöltése"}
                    </Button>
                  </div>
                )}
                {[...messages].reverse().map(message => (
                  <div
                    key={message.messageId}
                    className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[70%] flex flex-col ${message.role === 'user' ? '' : 'items-end'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {message.role === 'user' ? (
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${selectedUser?.name?.charAt(0) || 'U'}`} />
                            <AvatarFallback>{selectedUser?.name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <Bot className="h-5 w-5 text-primary" />
                        )}
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(message.timestamp).toLocaleString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`rounded-xl px-4 py-3 text-sm whitespace-pre-wrap break-words shadow-sm ${
                          message.role === 'user'
                            ? 'bg-white text-foreground border'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && selectedApplicantId && (
                  <div className="flex h-full items-center justify-center p-4 text-center">
                    <div>
                      <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium">Még nincsenek üzenetek</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Applicant Details Dialog */}
      <Dialog open={showApplicantDetails} onOpenChange={setShowApplicantDetails}>
        {selectedApplicantForDetails && (
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Jelentkező adatai</DialogTitle>
              <DialogDescription>Részletes információk a jelentkezőről.</DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={`/placeholder.svg?height=80&width=80&text=${selectedApplicantForDetails.name.charAt(0)}`} />
                  <AvatarFallback>{selectedApplicantForDetails.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-bold mb-1">{selectedApplicantForDetails.name}</h3>
                  <p className="text-muted-foreground text-lg">{selectedApplicantForDetails.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="flex w-fit items-center gap-1 font-normal text-sm">
                      <span className={`h-2 w-2 rounded-full ${getTypeColor(selectedApplicantForDetails.applicantType)}`}></span>
                      {selectedApplicantForDetails.applicantType}
                    </Badge>
                    <Badge variant="outline" className="flex w-fit items-center gap-1 font-normal text-sm">
                      <span className={`h-2 w-2 rounded-full ${getOriginColor(selectedApplicantForDetails.origin)}`}></span>
                      {selectedApplicantForDetails.origin}
                    </Badge>
                    {selectedApplicantForDetails.hasEKG && (
                      <Badge variant="outline" className="flex w-fit items-center gap-1 font-normal text-sm">
                        <span className="h-2 w-2 rounded-full bg-green-600"></span>
                        EÜ Kiskönyv
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-base font-bold">Munkák</p>
                <div className="rounded-lg border p-4">
                  <div className="space-y-3">
                    {selectedApplicantForDetails.jobs?.map((job: any, index: number) => {
                      const application = jobApplications.find(app => app.job_id === job.jobId);
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <Badge variant="secondary" className="mr-2 text-sm py-1.5">
                            {job.title}
                          </Badge>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>Applied: {application ? new Date(application.application_date).toLocaleDateString('hu-HU') : 'N/A'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-base font-bold">Kapcsolat</p>
                  <div className="space-y-2">
                    <div className="text-base flex items-center gap-3">
                      <Mail className="h-5 w-5" />
                      <span>{selectedApplicantForDetails.email}</span>
                    </div>
                    <div className="text-base flex items-center gap-3">
                      <Phone className="h-5 w-5" />
                      <span>{selectedApplicantForDetails.phoneNumber}</span>
                    </div>
                    {selectedApplicantForDetails.dateOfBirth && (
                      <div className="text-base flex items-center gap-3">
                        <Calendar className="h-5 w-5" />
                        <span>{new Date(selectedApplicantForDetails.dateOfBirth).toLocaleDateString('hu-HU')}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-base font-bold">Cím</p>
                  <div className="text-base flex items-center gap-3">
                    <MapPin className="h-5 w-5" />
                    <span>{selectedApplicantForDetails.address}</span>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
} 