"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Bot, MessageSquare, Mail, Phone, Calendar, MapPin } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { messagesApi } from "@/lib/api/messages"
import { applicantsApi } from "@/lib/api/applicants"
import { jobApplicationsApi } from "@/lib/api/job-applications"
import { Message } from "@/types/message"
import { Applicant, ApplicantOrigin, ApplicantType } from "@/types/applicant"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"

interface EnhancedMessage extends Message {
  applicant?: Applicant;
}

export function MessagesTabV2() {
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showApplicantDetails, setShowApplicantDetails] = useState(false)
  const [selectedApplicantForDetails, setSelectedApplicantForDetails] = useState<Applicant | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // Fetch Facebook applicants
  const { data: applicants = [], isLoading: isLoadingApplicants } = useQuery({
    queryKey: ["applicants", "facebook"],
    queryFn: () => applicantsApi.getApplicantsByOrigin(ApplicantOrigin.FACEBOOK),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Fetch messages for selected applicant
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["messages", selectedApplicantId],
    queryFn: () => {
      if (!selectedApplicantId) return Promise.resolve([])
      return messagesApi.getMessagesByApplicantId(selectedApplicantId)
    },
    enabled: !!selectedApplicantId, // Only run when an applicant is selected
  })

  // Combine messages with their applicants
  const messagesWithApplicants = useMemo(() => {
    if (!selectedApplicantId) return []
    const selectedApplicant = applicants.find(applicant => applicant.applicantId === selectedApplicantId)
    return messages.map(message => ({
      ...message,
      applicant: selectedApplicant
    }))
  }, [messages, applicants, selectedApplicantId])

  // Get unique applicants from the applicants list
  const uniqueApplicants = useMemo(() => {
    return applicants.map(applicant => ({
      applicantId: applicant.applicantId,
      applicant
    }))
  }, [applicants])

  // Filter applicants based on search term
  const filteredApplicants = useMemo(() => {
    return uniqueApplicants.filter(item => {
      if (!item.applicant) return false
      return item.applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             item.applicant.email.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }, [uniqueApplicants, searchTerm])

  // Add mutation for toggling AI responses
  const toggleAiResponsesMutation = useMutation({
    mutationFn: async ({ applicantId, enabled }: { applicantId: string; enabled: boolean }) => {
      console.log('Toggling AI response:', { applicantId, enabled })
      const result = await applicantsApi.updateAiResponse(applicantId, enabled)
      console.log('Toggle result:', result)
      return result
    },
    onSuccess: (updatedApplicant) => {
      console.log('Mutation success, updated applicant:', updatedApplicant)
      // Update the local state
      queryClient.setQueryData<Applicant[]>(["applicants", "facebook"], (old) => {
        if (!old) return old
        return old.map(applicant => 
          applicant.applicantId === updatedApplicant.applicantId 
            ? updatedApplicant
            : applicant
        )
      })
      toast.success(`AI responses ${updatedApplicant.aiResponse ? 'enabled' : 'disabled'} for this conversation`)
    },
    onError: (error) => {
      console.error('Error updating AI response:', error)
      toast.error("Failed to update AI response settings")
    }
  })

  const toggleAiResponses = async (applicantId: string) => {
    const applicant = applicants.find(a => a.applicantId === applicantId)
    if (!applicant) return

    const currentValue = applicant.aiResponse ?? false
    console.log('Current AI response value:', currentValue)
    
    toggleAiResponsesMutation.mutate({ 
      applicantId, 
      enabled: !currentValue
    })
  }

  // Get the current AI response state for the selected applicant
  const currentAiResponse = useMemo(() => {
    if (!selectedApplicantId) return false
    const applicant = applicants.find(a => a.applicantId === selectedApplicantId)
    return applicant?.aiResponse ?? false
  }, [selectedApplicantId, applicants])

  // Scroll to bottom when messages change or when selecting a new applicant
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, selectedApplicantId])

  // Sort messages in chronological order (oldest to newest)
  const sortedMessages = useMemo(() => {
    return [...messagesWithApplicants].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  }, [messagesWithApplicants])

  // Add query for job applications when viewing applicant details
  const { data: jobApplications = [] } = useQuery({
    queryKey: ["jobApplications", selectedApplicantForDetails?.applicantId],
    queryFn: () => selectedApplicantForDetails 
      ? jobApplicationsApi.getApplicationsByApplicant(selectedApplicantForDetails.applicantId)
      : Promise.resolve([]),
    enabled: !!selectedApplicantForDetails,
  })

  const viewApplicantDetails = (applicant: Applicant) => {
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

  if (isLoadingApplicants) {
    return <div>Loading applicants...</div>
  }

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Sidebar */}
      <Card className="w-80">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <CardTitle>Messages</CardTitle>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-300px)]">
            {filteredApplicants.map((item) => (
              <div
                key={item.applicantId}
                className={`flex cursor-pointer items-center gap-4 border-b p-4 transition-colors hover:bg-muted/50 ${
                  selectedApplicantId === item.applicantId ? "bg-muted/50" : ""
                }`}
                onClick={() => setSelectedApplicantId(item.applicantId)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${item.applicant?.name?.charAt(0) || 'U'}`} />
                  <AvatarFallback>{item.applicant?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="truncate font-medium">{item.applicant?.name || 'Unknown User'}</h3>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {item.applicant?.email || 'No email'}
                  </p>
                </div>
              </div>
            ))}
            {filteredApplicants.length === 0 && (
              <div className="flex h-40 flex-col items-center justify-center p-4 text-center">
                <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">No messages found</p>
                <p className="text-xs text-muted-foreground">Try changing your search term</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Window */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="p-4 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle>
              {selectedApplicantId ? (
                <button
                  onClick={() => {
                    const applicant = applicants.find(a => a.applicantId === selectedApplicantId)
                    if (applicant) viewApplicantDetails(applicant)
                  }}
                  className="hover:underline focus:outline-none"
                >
                  {applicants.find(a => a.applicantId === selectedApplicantId)?.name || 'Unknown User'}
                </button>
              ) : (
                'Select a conversation'
              )}
            </CardTitle>
            {selectedApplicantId && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">AI Responses</span>
                  <Switch
                    checked={applicants.find(a => a.applicantId === selectedApplicantId)?.aiResponse ?? false}
                    onCheckedChange={() => {
                      if (selectedApplicantId) {
                        toggleAiResponses(selectedApplicantId)
                      }
                    }}
                  />
                </div>
                <Badge variant={applicants.find(a => a.applicantId === selectedApplicantId)?.aiResponse ? "default" : "secondary"}>
                  {applicants.find(a => a.applicantId === selectedApplicantId)?.aiResponse ? 'AI Active' : 'AI Disabled'}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          {isLoadingMessages ? (
            <div className="flex h-full items-center justify-center">
              <p>Loading messages...</p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="flex flex-col justify-end min-h-full">
                <div className="space-y-4 p-4">
                  {sortedMessages.map((message) => (
                    <div
                      key={message.messageId}
                      className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`flex max-w-[80%] flex-col ${
                          message.role === 'user' ? 'items-start' : 'items-end'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {message.role === 'user' ? (
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${message.applicant?.name?.charAt(0) || 'U'}`} />
                              <AvatarFallback>{message.applicant?.name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <Bot className="h-5 w-5 shrink-0 text-primary" />
                          )}
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(message.timestamp).toLocaleString('hu-HU')}
                          </span>
                        </div>
                        <div
                          className={`mt-1 rounded-lg p-3 break-words whitespace-pre-wrap ${
                            message.role === 'user'
                              ? 'bg-muted text-foreground'
                              : 'bg-primary text-primary-foreground'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              {messagesWithApplicants.length === 0 && selectedApplicantId && (
                <div className="flex h-full items-center justify-center p-4 text-center">
                  <div>
                    <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">No messages yet</p>
                    <p className="text-xs text-muted-foreground">Start a conversation with this user</p>
                  </div>
                </div>
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>

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
                            <span>Jelentkezett: {application ? new Date(application.application_date).toLocaleDateString('hu-HU') : 'N/A'}</span>
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
                  <p className="text-base font-bold">Lakhely</p>
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