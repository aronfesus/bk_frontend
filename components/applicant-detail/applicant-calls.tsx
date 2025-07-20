"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Phone, PhoneIncoming, PhoneOutgoing, Clock, Calendar } from "lucide-react"
import { Call } from "@/types/call"

interface ApplicantCallsProps {
  calls: Call[]
  isLoading: boolean
  totalCalls: number
}

export function ApplicantCalls({ calls, isLoading, totalCalls }: ApplicantCallsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hu-HU', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0s"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  const getDirectionIcon = (direction: string) => {
    switch (direction.toLowerCase()) {
      case 'inbound':
        return <PhoneIncoming className="h-4 w-4" />
      case 'outbound':
        return <PhoneOutgoing className="h-4 w-4" />
      default:
        return <Phone className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default'
      case 'busy':
        return 'secondary'
      case 'no-answer':
        return 'outline'
      case 'failed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-50/60">
        <CardHeader className="border-b bg-gray-200/40">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <Phone className="h-4 w-4 text-muted-foreground" />
            Hívásnapló
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-50/60">
      <CardHeader className="border-b -mt-6 p-4 bg-gray-200/40">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <Phone className="h-4 w-4 text-muted-foreground" />
          Hívásnapló ({totalCalls})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {calls.length === 0 ? (
          <div className="text-center py-12">
            <Phone className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">Nincs hívásnapló</h3>
            <p className="text-sm text-muted-foreground mt-1">Nincsenek rögzített hívások a jelentkezővel.</p>
          </div>
        ) : (
          <div className="space-y-2 -mx-2">
            {calls.map((call) => (
              <div
                key={call.callId}
                className="flex items-center gap-4 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${call.callDirection === 'inbound' ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'}`}>
                  {getDirectionIcon(call.callDirection || 'unknown')}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-slate-800 dark:text-slate-100">
                      {call.callDirection === 'inbound' ? 'Bejövő hívás' : 'Kimenő hívás'}
                    </p>
                    <Badge variant={getStatusColor(call.status)} className="capitalize text-xs">
                      {call.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>{formatDate(call.createdAt)}</span>
                    {call.duration && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span>{formatDuration(call.duration)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {calls.length < totalCalls && (
              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                  Megjelenítve: {calls.length} / {totalCalls} hívás
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 