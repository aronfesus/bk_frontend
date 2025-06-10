"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageCircle, Calendar, ChevronDown } from "lucide-react"
import { messagesApi } from "@/lib/api/messages"
import { Message } from "@/types/message"
import { Badge } from "@/components/ui/badge"

interface ApplicantMessagesProps {
  messages: Message[]
  isLoading: boolean
  totalMessages: number
  applicantId: string
}

export function ApplicantMessages({ messages: initialMessages, isLoading, totalMessages, applicantId }: ApplicantMessagesProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [allMessages, setAllMessages] = useState<Message[]>(initialMessages)

  // Load more messages when needed
  const { data: moreMessagesData, isLoading: isLoadingMore } = useQuery({
    queryKey: ["applicantMessages", applicantId, currentPage],
    queryFn: () => messagesApi.getMessagesByApplicantIdPaginated(applicantId, currentPage, 20),
    enabled: currentPage > 1,
  })

  // Update all messages when more data is loaded
  if (moreMessagesData && currentPage > 1) {
    const newMessages = moreMessagesData.messages.filter(
      newMsg => !allMessages.some(existingMsg => existingMsg.messageId === newMsg.messageId)
    )
    if (newMessages.length > 0) {
      setAllMessages(prev => [...prev, ...newMessages])
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hu-HU', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1)
  }

  const canLoadMore = allMessages.length < totalMessages

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            Üzenetek
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2 rounded-lg border p-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          Üzenetek ({totalMessages})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {allMessages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">Nincsenek üzenetek</h3>
            <p className="text-sm text-muted-foreground mt-1">Még nem történt üzenetváltás a jelentkezővel.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allMessages.map((message) => (
              <div
                key={message.messageId}
                className="border rounded-lg p-4 space-y-3 bg-white dark:bg-slate-900 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium">{formatDate(message.timestamp)}</span>
                  
                  {message.role && (
                    <Badge variant={message.role === 'user' ? 'secondary' : 'outline'}>
                      {message.role === 'user' ? 'Felhasználó' : 'Rendszer'}
                    </Badge>
                  )}
                </div>
                
                <div className="text-sm text-slate-700 dark:text-slate-300">
                  {message.text ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  ) : (
                    <p className="italic">Nincs üzenet tartalom</p>
                  )}
                </div>
              </div>
            ))}
            
            {canLoadMore && (
              <div className="text-center pt-6">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="w-full sm:w-auto"
                >
                  {isLoadingMore ? (
                    "Betöltés..."
                  ) : (
                    <>
                      <ChevronDown className="mr-2 h-4 w-4" />
                      Továbbiak betöltése
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Megjelenítve: {allMessages.length} / {totalMessages} üzenet
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 