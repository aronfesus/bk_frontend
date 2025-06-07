"use client"

import { useState, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Phone, CheckCircle, XCircle, Search, Calendar as CalendarIcon, MapPin, FileText, Clock, MessageSquare, Plus } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { useQuery } from "@tanstack/react-query"
import { callsApi } from "@/lib/api/calls"
import { jobsApi } from "@/lib/api/jobs"
import { jobApplicationsApi } from "@/lib/api/job-applications"
import { messagesApi } from "@/lib/api/messages"
import { Call } from "@/types/call"
import { Job } from "@/types/job"
import { Message } from "@/types/message"
import { addDays, startOfToday, endOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

interface TranscriptMessage {
  role: 'agent' | 'user'
  message: string
  time_in_call_secs: number
}

interface EnhancedCall extends Call {
  reason?: string;
  parsedTranscript?: TranscriptMessage[];
}

const PAGE_SIZE = 20

// Utility functions for date ranges
function getTodayRange() {
  return { from: startOfToday(), to: endOfToday() }
}
function getThisWeekRange() {
  return { from: startOfWeek(new Date()), to: endOfWeek(new Date()) }
}
function getThisMonthRange() {
  return { from: startOfMonth(new Date()), to: endOfMonth(new Date()) }
}

export function VoiceTableTab() {
  const [selectedCall, setSelectedCall] = useState<EnhancedCall | null>(null)
  const [showCallDetails, setShowCallDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [directionFilter, setDirectionFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState<{ from: Date; to?: Date } | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // Data fetching
  const {
    data: callsData,
    isLoading: isLoadingCalls,
    error: callsError,
  } = useQuery<{ calls: Call[]; total: number }, Error>({
    queryKey: ["calls", searchTerm, directionFilter, statusFilter, dateRange, page],
    queryFn: () =>
      callsApi.getCalls(
        page,
        PAGE_SIZE,
        searchTerm,
        directionFilter,
        statusFilter,
        dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined
      ),
  })

  const allCalls = callsData?.calls ?? []
  const totalCalls = callsData?.total ?? 0
  const totalPages = Math.ceil(totalCalls / PAGE_SIZE)

  // Status and direction options
  const statusOptions = [
    { value: "all", label: "Összes" },
    { value: "success", label: "Sikeres" },
    { value: "failure", label: "Sikertelen" },
    { value: "callback_request", label: "Visszahívást kért" }
  ]
  const directionOptions = [
    { value: "all", label: "Összes" },
    { value: "Incoming", label: "Bejövő" },
    { value: "Outgoing", label: "Kimenő" }
  ]

  // Filtering (search, direction, status, date)
  const filteredCalls = useMemo(() => {
    return allCalls.filter((call: EnhancedCall) => {
      const lowerSearch = searchTerm.trim().toLowerCase()
      const matchesSearch =
        lowerSearch === "" ||
        (call.callerName && call.callerName.toLowerCase().includes(lowerSearch)) ||
        (call.callerNumber && call.callerNumber.toLowerCase().includes(lowerSearch))
      const matchesDirection = directionFilter === "all" || call.callDirection === directionFilter
      const matchesStatus = statusFilter === "all" || call.status === statusFilter
      let matchesDate = true
      if (dateRange?.from && dateRange?.to) {
        const callDate = new Date(call.createdAt)
        matchesDate = callDate >= dateRange.from && callDate <= dateRange.to
      }
      return matchesSearch && matchesDirection && matchesStatus && matchesDate
    })
  }, [allCalls, searchTerm, directionFilter, statusFilter, dateRange])

  // Handle search input changes with debounce
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setSearchTerm(value)
    setIsSearching(true)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => setIsSearching(false), 500)
  }

  function handleResetFilters() {
    setSearchTerm("")
    setDirectionFilter("all")
    setStatusFilter("all")
    setDateRange(undefined)
    setPage(1)
  }

  function handleDetails(call: EnhancedCall) {
    let parsedTranscript: TranscriptMessage[] = []
    if (call.transcript && Array.isArray(call.transcript.transcript)) {
      parsedTranscript = call.transcript.transcript.map((msg: any) => ({
        role: msg.role,
        message: msg.message,
        time_in_call_secs: msg.time_in_call_secs
      }))
    }
    setSelectedCall({ ...call, parsedTranscript })
    setShowCallDetails(true)
  }

  // Table cell helpers
  function renderDirection(direction: string) {
    if (direction === "inbound") return <Badge variant="secondary" className="text-blue-600"><Phone className="inline h-4 w-4 mr-1" />Bejövő</Badge>
    if (direction === "Outgoing") return <Badge variant="outline" className="text-purple-600"><Phone className="inline h-4 w-4 mr-1 rotate-180" />Kimenő</Badge>
    return <Badge variant="outline">Ismeretlen</Badge>
  }
  function renderStatus(status: string) {
    if (status === "success") return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="inline h-4 w-4 mr-1" />Sikeres</Badge>
    if (status === "failure") return <Badge variant="destructive"><XCircle className="inline h-4 w-4 mr-1" />Sikertelen</Badge>
    if (status === "callback_request") return <Badge variant="default" className="bg-yellow-100 text-yellow-800"><Clock className="inline h-4 w-4 mr-1" />Visszahívást kért</Badge>
    return <Badge variant="outline">{status}</Badge>
  }

  // Pagination controls
  function Pagination() {
    return (
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted">
        <span className="text-sm text-muted-foreground">
            {filteredCalls.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} - {Math.min(page * PAGE_SIZE, totalCalls)} hívás megjelenítve a(z) {totalCalls} hívásból
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Előző</Button>
          <Button variant="outline" size="sm" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>Következő</Button>
        </div>
      </div>
    )
  }

  // Helper to format seconds to m:s
  function formatDuration(seconds?: number) {
    if (!seconds || isNaN(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Handler for date range picker to match expected signature
  function handleDateRangeChange(range: { from?: Date; to?: Date } | undefined) {
    if (range && range.from) {
      setDateRange({ from: range.from, to: range.to })
    } else {
      setDateRange(undefined)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hívások</h2>
          <p className="text-muted-foreground">Hívások kezelése</p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Új hívás
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 items-center mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Hívások keresése..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[260px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}`
                : "Dátum kiválasztása"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateRangeChange as any}
            />
          </PopoverContent>
        </Popover>
        <Button variant="secondary" size="sm" onClick={() => setDateRange(getTodayRange())}>Ma</Button>
        <Button variant="secondary" size="sm" onClick={() => setDateRange(getThisWeekRange())}>Ezen a héten</Button>
        <Button variant="secondary" size="sm" onClick={() => setDateRange(getThisMonthRange())}>Ebben a hónapban</Button>
        <Select value={directionFilter} onValueChange={setDirectionFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Irány" /></SelectTrigger>
          <SelectContent>
            {directionOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Állapot" /></SelectTrigger>
          <SelectContent>
            {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleResetFilters}>Szűrők visszaállítása</Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-background">
        <table className="min-w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Irány</th>
              <th className="px-4 py-2 text-left font-semibold">Dátum és idő</th>
              <th className="px-4 py-2 text-left font-semibold">Telefonszám</th>
              <th className="px-4 py-2 text-left font-semibold">Név</th>
              <th className="px-4 py-2 text-left font-semibold">Állapot</th>
              <th className="px-4 py-2 text-left font-semibold">Idő</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingCalls ? (
              <tr><td colSpan={8} className="text-center py-8">Hívások betöltése...</td></tr>
            ) : filteredCalls.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8">Nincs találat.</td></tr>
            ) : (
              filteredCalls.map(call => (
                <tr
                  key={call.callId}
                  className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleDetails(call)}
                >
                  <td className="px-4 py-2">{renderDirection(call.callDirection || 'Bejövő')}</td>
                  <td className="px-4 py-2">{new Date(call.createdAt).toLocaleString('hu-HU', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="px-4 py-2">{call.callerNumber || '-'}</td>
                  <td className="px-4 py-2">{call.callerName || '-'}</td>
                  <td className="px-4 py-2">{renderStatus(call.status)}</td>
                  <td className="px-4 py-2">{formatDuration(call.duration)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination />
      </div>

      {/* Details Dialog */}
      <Dialog open={showCallDetails} onOpenChange={setShowCallDetails}>
        {selectedCall && (
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Hívás részletei</DialogTitle>
              <DialogDescription>Hívás információk</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* User Information Section */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${selectedCall.callerName?.charAt(0) || 'U'}`} />
                  <AvatarFallback>{selectedCall.callerName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{selectedCall.callerName || 'Unknown User'}</h3>
                  <p className="text-muted-foreground">{selectedCall.callerEmail || 'No email'}</p>
                  <div className="mt-1 flex items-center gap-2">
                    {renderStatus(selectedCall.status)}
                  </div>
                </div>
              </div>

              {/* Call Information */}
              <div className="space-y-1">
                <p className="text-sm font-medium">Hívás részletei</p>
                <div className="text-sm flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(selectedCall.createdAt).toLocaleString('hu-HU')}</span>
                </div>
                <div className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Idő: {selectedCall.duration} másodperc</span>
                </div>
                <div className="text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedCall.callerNumber || 'Nincs telefonszám'}</span>
                </div>
              </div>

              {/* Call Transcript */}
              {selectedCall.parsedTranscript && selectedCall.parsedTranscript.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <p className="text-sm font-medium">Beszélgetés</p>
                  </div>
                  <Card>
                    <CardContent className="p-4">
                      <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-4">
                          {selectedCall.parsedTranscript.map((msg, index) => (
                            <div
                              key={index}
                              className={`flex ${msg.role === 'agent' ? 'justify-start' : 'justify-end'}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  msg.role === 'agent'
                                    ? 'bg-secondary text-secondary-foreground'
                                    : 'bg-primary text-primary-foreground'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium">
                                    {msg.role === 'agent' ? 'Asszisztens' : 'Ügyfél'}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                <p className="mt-1 text-xs opacity-70">
                                  {msg.time_in_call_secs}s
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
} 