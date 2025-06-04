"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Phone, Clock, Calendar, MapPin, FileText, CheckCircle, XCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useQuery, useMutation, useQueryClient, UseQueryOptions, useInfiniteQuery } from "@tanstack/react-query"
import { callsApi } from "@/lib/api/calls"
import { applicantsApi } from "@/lib/api/applicants"
import { messagesApi } from "@/lib/api/messages"
import { jobApplicationsApi } from "@/lib/api/job-applications"
import { jobsApi } from "@/lib/api/jobs"
import { Call } from "@/types/call"
import { toast } from "sonner"
import { Job } from "@/types/job"
import { Applicant } from "@/types/applicant"
import { Message } from "@/types/message"
import { JobApplication } from "@/types/job-application"

interface EnhancedCall extends Omit<Call, 'applicant'> {
  applicant?: Applicant;
}

const PAGE_SIZE = 10

export function VoiceTab() {
  const [selectedCall, setSelectedCall] = useState<EnhancedCall | null>(null)
  const [showCallDetails, setShowCallDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [jobFilter, setJobFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isSearching, setIsSearching] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  const queryClient = useQueryClient()

  const {
    data: callsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingCalls,
    error: callsError,
  } = useInfiniteQuery<{ calls: Call[]; total: number }, Error>({
    queryKey: ["calls", searchTerm, jobFilter, statusFilter],
    queryFn: ({ pageParam }) =>
      callsApi.getCalls(
        typeof pageParam === "number" ? pageParam : 1,
        PAGE_SIZE,
        searchTerm,
        jobFilter,
        statusFilter
      ),
    initialPageParam: 1,
    getNextPageParam: (
      lastPage: { calls: Call[]; total: number },
      allPages: { calls: Call[]; total: number }[]
    ) => {
      const loaded = allPages.flatMap(page => page.calls).length
      return loaded < lastPage.total ? allPages.length + 1 : undefined
    },
  })

  // Flatten all calls
  const allCalls = callsData?.pages?.flatMap(page => page.calls) ?? []
  const totalCalls = callsData?.pages?.[0]?.total ?? 0

  // Fetch applicants for the calls
  const { data: applicants = [], isLoading: isLoadingApplicants } = useQuery({
    queryKey: ["applicants"],
    queryFn: applicantsApi.getApplicants,
    enabled: allCalls.length > 0, // Only fetch applicants if we have calls
  })

  // Fetch all jobs
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: jobsApi.getJobs,
  })

  // Fetch job applications for selected applicant
  const { data: jobApplications = [], isLoading: isLoadingJobApplications } = useQuery({
    queryKey: ["jobApplications", selectedCall?.applicantId],
    queryFn: async () => {
      if (!selectedCall?.applicantId) return []
      console.log('Fetching job applications for applicant:', selectedCall.applicantId)
      const applications = await jobApplicationsApi.getApplicationsByApplicant(selectedCall.applicantId)
      console.log('Received job applications:', applications)
      // Combine applications with job details
      return applications.map(app => ({
        ...app,
        job: jobs.find(job => job.jobId === app.job_id)
      }))
    },
    enabled: !!selectedCall?.applicantId,
  })

  // Fetch messages for selected call
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["messages", selectedCall?.applicantId],
    queryFn: () => selectedCall?.applicantId ? messagesApi.getMessagesByApplicantId(selectedCall.applicantId) : Promise.resolve([]),
    enabled: !!selectedCall?.applicantId,
  })

  // Get all job applications for filtering
  const { data: allJobApplications = [], isLoading: isLoadingAllJobApplications } = useQuery({
    queryKey: ["allJobApplications"],
    queryFn: async () => {
      if (allCalls.length === 0) return []
      const applicantIds = allCalls.map((call: Call) => call.applicantId)
      try {
        const applications = await Promise.all(
          applicantIds.map((id: string) => jobApplicationsApi.getApplicationsByApplicant(id))
        )
        const flatApplications = applications.flat()
        // Combine with job details
        return flatApplications.map((app: any) => ({
          ...app,
          job: jobs.find((job: Job) => job.jobId === app.job_id)
        }))
      } catch (error) {
        console.error('Error fetching job applications:', error)
        return []
      }
    },
    enabled: allCalls.length > 0 && jobs.length > 0, // Only run after jobs are loaded
  })

  // Combine calls with their applicants
  const callsWithApplicants = useMemo(() => {
    return allCalls.map((call: Call) => ({
      ...call,
      applicant: applicants.find((applicant: Applicant) => applicant.applicantId === call.applicantId)
    }))
  }, [allCalls, applicants])

  const updateCallMutation = useMutation({
    mutationFn: ({ callId, updates }: { callId: string; updates: Partial<Call> }) =>
      callsApi.updateCall(callId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calls"] })
      toast.success("Call status updated successfully")
    },
    onError: () => {
      toast.error("Failed to update call status")
    },
  })

  const viewCallDetails = (call: EnhancedCall) => {
    if (!call.applicant) {
      toast.error("No applicant data available for this call")
      return
    }
    setSelectedCall(call)
    setShowCallDetails(true)
  }

  // Add logging for the filtered calls
  const filteredCalls = useMemo(() => {
    console.log('[Render] Filtering calls:', {
      allCalls: allCalls.length,
      searchTerm,
      jobFilter,
      statusFilter
    })
    
    return callsWithApplicants.filter((call: EnhancedCall) => {
      if (!call.applicant) return false;

      const applicantJobApplications = Array.isArray(allJobApplications) 
        ? allJobApplications.filter((app: any) => app.applicant_id === call.applicantId)
        : []

      const matchesSearch =
        searchTerm === "" ||
        call.applicant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.applicant.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        applicantJobApplications.some((app: any) => app.job?.title.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesJob = jobFilter === "all" || applicantJobApplications.some((app: any) => app.job?.title === jobFilter)
      const matchesStatus = statusFilter === "all" || call.status === statusFilter

      return matchesSearch && matchesJob && matchesStatus
    })
  }, [callsWithApplicants, searchTerm, jobFilter, statusFilter, allJobApplications])

  // Get unique job titles for filter
  const jobTitles = useMemo(() => {
    if (!Array.isArray(allJobApplications)) return []
    const titles = allJobApplications
      .map(app => app.job?.title)
      .filter((title): title is string => title !== undefined)
    return Array.from(new Set(titles)).sort()
  }, [allJobApplications])

  // Get unique statuses for filter
  const statuses = useMemo(() => {
    return Array.from(new Set(callsWithApplicants.map((call: EnhancedCall) => call.status)))
  }, [callsWithApplicants])

  const handleStatusUpdate = (callId: string, success: boolean) => {
    updateCallMutation.mutate({
      callId,
      updates: {
        call_success: success,
        status: success ? "Successful" : "Failed"
      }
    })
  }

  // Handle search input changes with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setIsSearching(true)
    
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }
    
    // Set new timeout
    searchTimeout.current = setTimeout(() => {
      setIsSearching(false)
    }, 500) // 500ms debounce
  }

  // Handle filter changes
  const handleFilterChange = () => {
    // Reset to first page when filters change
  }

  // Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (
          target.isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage &&
          !isLoadingCalls &&
          !isSearching
        ) {
          fetchNextPage()
        }
      },
      {
        threshold: 0.5,
        rootMargin: '100px',
      }
    )
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current)
    }
  }, [hasNextPage, isFetchingNextPage, isLoadingCalls, isSearching, fetchNextPage])

  if (isLoadingCalls || isLoadingApplicants || isLoadingJobApplications || isLoadingMessages || isLoadingAllJobApplications) {
    console.log('[Render] Loading state')
    return <div>Hívások betöltése...</div>
  }

  if (callsError) {
    console.log('[Render] Error state:', callsError)
    return <div>Nem sikerült betölteni a hívásokat: {(callsError as Error).message}</div>
  }

  console.log('[Render] Rendering calls:', {
    totalCalls,
    filteredCalls: filteredCalls.length,
    hasNextPage,
    isFetchingNextPage
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hívások</h2>
          <p className="text-muted-foreground">Be és kimenő hívások kezelése</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Hívások keresése..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <Select value={jobFilter} onValueChange={(value) => {
          setJobFilter(value)
          handleFilterChange()
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Szűrés munka szerint" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Összes munka</SelectItem>
            {jobTitles.map((job) => (
              <SelectItem key={job} value={job}>
                {job}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value)
          handleFilterChange()
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Állapot szerinti szűrés" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Összes állapot</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={String(status)} value={String(status)}>
                {String(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <CardTitle>
              {totalCalls} Hívás
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="min-h-[200px]">
              {filteredCalls.length > 0 ? (
                filteredCalls.map((call) => {
                  console.log('[Render] Rendering call:', call.callId)
                  return (
                    <div
                      key={call.callId}
                      className="flex cursor-pointer items-center gap-4 border-b p-4 transition-colors hover:bg-muted/50"
                      onClick={() => viewCallDetails(call)}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${call.applicant?.name?.charAt(0) || 'U'}`} />
                        <AvatarFallback>{call.applicant?.name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{call.applicant?.name || 'Nincs név'}</h3>
                          <Badge variant={call.call_success ? "default" : "destructive"} className="ml-2">
                            {call.call_success ? "Sikeres" : "Sikertelen"}
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="mr-1 h-4 w-4" />
                            <span>{call.applicant?.phoneNumber || 'Nincs telefonszám'}</span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="mr-1 h-4 w-4" />
                            <span>{call.duration} másodperc</span>
                          </div>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            {call.applicant?.jobs?.[0]?.title || "Nincs munka"}
                          </Badge>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="mr-1 h-3 w-3" />
                            <span>{new Date(call.createdAt).toLocaleString('hu-HU')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="flex h-40 flex-col items-center justify-center p-4 text-center">
                  <Phone className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Nincs találat</p>
                  <p className="text-xs text-muted-foreground">Próbálja meg megváltoztatni a szűrőket vagy a keresési kifejezést</p>
                </div>
              )}
              {hasNextPage && (
                <div 
                  ref={observerTarget} 
                  className="h-20 flex items-center justify-center"
                >
                  {isFetchingNextPage && (
                    <p className="text-sm text-muted-foreground">Betöltés...</p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={showCallDetails} onOpenChange={setShowCallDetails}>
        {selectedCall && selectedCall.applicant && (
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Hívás részletei</DialogTitle>
              <DialogDescription>Hívás információk</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* User Information Section */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${selectedCall.applicant.name?.charAt(0) || 'U'}`} />
                  <AvatarFallback>{selectedCall.applicant.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{selectedCall.applicant.name || 'Unknown User'}</h3>
                  <p className="text-muted-foreground">{selectedCall.applicant.email || 'No email'}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={selectedCall.call_success ? "default" : "destructive"}>
                      {"Sikeres"}
                    </Badge>
                    {isLoadingJobApplications ? (
                      <Badge variant="outline">Loading jobs...</Badge>
                    ) : jobApplications.length === 0 ? (
                      <Badge variant="outline">No jobs found</Badge>
                    ) : (
                      jobApplications.map((app) => (
                        <Badge key={app.application_id} variant="outline">
                          {app.job?.title || 'Unknown Job'}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Call Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Kapcsolat</p>
                  <div className="text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedCall.applicant.phoneNumber || 'Nincs telefonszám'}</span>
                  </div>
                  <div className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedCall.applicant.address || 'No address'}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Hívás részletei</p>
                  <div className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(selectedCall.createdAt).toLocaleString('hu-HU')}</span>
                  </div>
                  <div className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Idő: {selectedCall.duration} másodperc</span>
                  </div>
                </div>
              </div>

              {/* Call Transcript */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Beszélgetés előzménye</p>
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <ScrollArea className="h-[300px]">
                      {isLoadingMessages ? (
                        <div className="flex h-full items-center justify-center p-4">
                          <p>Hívások betöltése...</p>
                        </div>
                      ) : messages.length > 0 ? (
                        <div className="space-y-4 p-4">
                          {messages.map((message) => (
                            <div
                              key={message.messageId}
                              className={`flex ${
                                message.role === 'assistant' ? 'justify-start' : 'justify-end'
                              }`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  message.role === 'assistant'
                                    ? 'bg-secondary text-secondary-foreground'
                                    : 'bg-primary text-primary-foreground'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium">
                                    {message.role === 'assistant' ? 'Aszisztens' : 'Ügyfél'}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                                <p className="mt-1 text-xs opacity-70">
                                  {new Date(message.timestamp).toLocaleString('hu-HU')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                          <h3 className="text-lg font-medium">Nincs üzenet</h3>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {selectedCall?.status === "Failed"
                              ? "Ez a hívás sikertelen volt és nincs üzenete."
                              : "Nincs üzenet a beszélgetésben."}
                          </p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

