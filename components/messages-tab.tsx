"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Bot, MessageSquare, ArrowUpRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data for conversations
const initialConversations = [
  {
    id: 1,
    user: {
      id: 1,
      name: "Alex Johnson",
      avatar: "/placeholder.svg?height=40&width=40&text=AJ",
    },
    lastMessage: "I'm interested in the Software Engineer position. What are the requirements?",
    timestamp: "10:32 AM",
    unread: true,
    job: "Software Engineer",
    platform: "Website",
    messages: [
      {
        id: 1,
        sender: "user",
        text: "Hi there! I saw your job posting for a Software Engineer position.",
        timestamp: "10:30 AM",
      },
      {
        id: 2,
        sender: "bot",
        text: "Hello! Thanks for your interest in the Software Engineer position at Acme Corp. How can I help you today?",
        timestamp: "10:31 AM",
      },
      {
        id: 3,
        sender: "user",
        text: "I'm interested in the Software Engineer position. What are the requirements?",
        timestamp: "10:32 AM",
      },
    ],
  },
  {
    id: 2,
    user: {
      id: 2,
      name: "Jamie Smith",
      avatar: "/placeholder.svg?height=40&width=40&text=JS",
    },
    lastMessage: "Thanks for the information. I'll submit my application today.",
    timestamp: "Yesterday",
    unread: false,
    job: "Product Manager",
    platform: "Facebook",
    messages: [
      {
        id: 1,
        sender: "user",
        text: "Hello, I'd like to know more about the Product Manager role.",
        timestamp: "Yesterday, 2:15 PM",
      },
      {
        id: 2,
        sender: "bot",
        text: "Hi Jamie! I'd be happy to tell you about our Product Manager position. This role requires 5+ years of experience in product management, preferably in a tech company.",
        timestamp: "Yesterday, 2:16 PM",
      },
      {
        id: 3,
        sender: "bot",
        text: "You'll be responsible for defining product strategy, working with engineering teams, and ensuring successful product launches.",
        timestamp: "Yesterday, 2:16 PM",
      },
      {
        id: 4,
        sender: "user",
        text: "That sounds perfect for my background. What's the application process like?",
        timestamp: "Yesterday, 2:18 PM",
      },
      {
        id: 5,
        sender: "bot",
        text: "Great! You can apply through our careers page. The process typically includes an initial screening, a take-home assignment, and 2-3 interviews with the team.",
        timestamp: "Yesterday, 2:19 PM",
      },
      {
        id: 6,
        sender: "user",
        text: "Thanks for the information. I'll submit my application today.",
        timestamp: "Yesterday, 2:20 PM",
      },
    ],
  },
  {
    id: 3,
    user: {
      id: 3,
      name: "Taylor Wilson",
      avatar: "/placeholder.svg?height=40&width=40&text=TW",
    },
    lastMessage: "Do you offer remote work options for the UX Designer role?",
    timestamp: "Yesterday",
    unread: true,
    job: "UX Designer",
    platform: "Website",
    messages: [
      {
        id: 1,
        sender: "user",
        text: "Hi, I'm interested in the UX Designer position.",
        timestamp: "Yesterday, 11:45 AM",
      },
      {
        id: 2,
        sender: "bot",
        text: "Hello Taylor! Thanks for your interest in our UX Designer role. This position requires a strong portfolio and 3+ years of experience in user-centered design.",
        timestamp: "Yesterday, 11:46 AM",
      },
      {
        id: 3,
        sender: "user",
        text: "Do you offer remote work options for the UX Designer role?",
        timestamp: "Yesterday, 11:47 AM",
      },
    ],
  },
  {
    id: 4,
    user: {
      id: 4,
      name: "Morgan Lee",
      avatar: "/placeholder.svg?height=40&width=40&text=ML",
    },
    lastMessage: "I've submitted my application for the Data Analyst position.",
    timestamp: "2 days ago",
    unread: false,
    job: "Data Analyst",
    platform: "LinkedIn",
    messages: [
      {
        id: 1,
        sender: "user",
        text: "Hello, I'm interested in the Data Analyst position.",
        timestamp: "2 days ago, 3:30 PM",
      },
      {
        id: 2,
        sender: "bot",
        text: "Hi Morgan! Thanks for reaching out about our Data Analyst role. This position requires SQL proficiency and experience with data visualization tools.",
        timestamp: "2 days ago, 3:31 PM",
      },
      {
        id: 3,
        sender: "user",
        text: "That's perfect for me. I have 3 years of experience with SQL and Tableau.",
        timestamp: "2 days ago, 3:33 PM",
      },
      {
        id: 4,
        sender: "bot",
        text: "Great to hear! You can apply through our careers page. Make sure to highlight your SQL and Tableau experience in your resume.",
        timestamp: "2 days ago, 3:34 PM",
      },
      {
        id: 5,
        sender: "user",
        text: "I've submitted my application for the Data Analyst position.",
        timestamp: "2 days ago, 4:15 PM",
      },
    ],
  },
  {
    id: 5,
    user: {
      id: 5,
      name: "Casey Brown",
      avatar: "/placeholder.svg?height=40&width=40&text=CB",
    },
    lastMessage: "What skills are required for the Marketing Specialist role?",
    timestamp: "3 days ago",
    unread: false,
    job: "Marketing Specialist",
    platform: "Twitter",
    messages: [
      {
        id: 1,
        sender: "user",
        text: "Hi there, I saw your job posting for a Marketing Specialist.",
        timestamp: "3 days ago, 10:15 AM",
      },
      {
        id: 2,
        sender: "bot",
        text: "Hello Casey! Thanks for your interest in our Marketing Specialist position. How can I help you with this role?",
        timestamp: "3 days ago, 10:16 AM",
      },
      {
        id: 3,
        sender: "user",
        text: "What skills are required for the Marketing Specialist role?",
        timestamp: "3 days ago, 10:17 AM",
      },
    ],
  },
]

export function MessagesTab() {
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedConversation, setSelectedConversation] = useState(conversations[0])
  const [searchTerm, setSearchTerm] = useState("")
  const [jobFilter, setJobFilter] = useState("all")
  const [platformFilter, setPlatformFilter] = useState("all")
  const [newMessage, setNewMessage] = useState("")

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const updatedConversations = conversations.map((conv) => {
      if (conv.id === selectedConversation.id) {
        const updatedMessages = [
          ...conv.messages,
          {
            id: conv.messages.length + 1,
            sender: "bot",
            text: newMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]
        return {
          ...conv,
          messages: updatedMessages,
          lastMessage: newMessage,
          timestamp: "Just now",
        }
      }
      return conv
    })

    setConversations(updatedConversations)
    setSelectedConversation(
      updatedConversations.find((conv) => conv.id === selectedConversation.id) || selectedConversation,
    )
    setNewMessage("")
  }

  // Filter conversations based on search term, job filter, and platform filter
  const filteredConversations = conversations.filter((conversation) => {
    const matchesSearch =
      searchTerm === "" ||
      conversation.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.job.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesJob = jobFilter === "all" || conversation.job === jobFilter
    const matchesPlatform = platformFilter === "all" || conversation.platform === platformFilter

    return matchesSearch && matchesJob && matchesPlatform
  })

  // Get unique job titles for filter
  const jobTitles = Array.from(new Set(conversations.map((conversation) => conversation.job)))

  // Get unique platforms for filter
  const platforms = Array.from(new Set(conversations.map((conversation) => conversation.platform)))

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Message Conversations</h2>
        <p className="text-muted-foreground">View and manage text conversations between users and your bots</p>
      </div>

      <div className="grid h-[calc(100vh-220px)] grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Conversations</CardTitle>
              <Badge variant="outline" className="ml-2">
                {filteredConversations.length}
              </Badge>
            </div>
            <div className="mt-2 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={jobFilter} onValueChange={setJobFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Filter by job" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                    {jobTitles.map((job) => (
                      <SelectItem key={job} value={job}>
                        {job}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Filter by platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    {platforms.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-350px)]">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`flex cursor-pointer items-center gap-3 border-b p-4 transition-colors hover:bg-muted/50 ${
                    selectedConversation.id === conversation.id ? "bg-muted" : ""
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <Avatar>
                    <AvatarImage src={conversation.user.avatar} />
                    <AvatarFallback>{conversation.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{conversation.user.name}</h4>
                      <span className="text-xs text-muted-foreground">{conversation.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="truncate text-sm text-muted-foreground">{conversation.lastMessage}</p>
                      {conversation.unread && <Badge variant="default" className="ml-1 h-2 w-2 rounded-full p-0" />}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {conversation.job}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {conversation.platform}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              {filteredConversations.length === 0 && (
                <div className="flex h-40 flex-col items-center justify-center p-4 text-center">
                  <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">No conversations found</p>
                  <p className="text-xs text-muted-foreground">Try adjusting your filters or search term</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedConversation.user.avatar} />
                    <AvatarFallback>{selectedConversation.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{selectedConversation.user.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {selectedConversation.job}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {selectedConversation.platform}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    View Profile
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex h-[calc(100vh-380px)] flex-col p-0">
                <Tabs defaultValue="chat" className="flex-1">
                  <TabsList className="mx-4 mt-2 grid w-[200px] grid-cols-2">
                    <TabsTrigger value="chat">Chat</TabsTrigger>
                    <TabsTrigger value="info">Info</TabsTrigger>
                  </TabsList>
                  <TabsContent value="chat" className="flex h-full flex-col">
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {selectedConversation.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender === "user" ? "justify-start" : "justify-end"}`}
                          >
                            <div
                              className={`flex max-w-[80%] flex-col ${
                                message.sender === "user" ? "items-start" : "items-end"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {message.sender === "user" ? (
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={selectedConversation.user.avatar} />
                                    <AvatarFallback>{selectedConversation.user.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <Bot className="h-5 w-5 text-primary" />
                                )}
                                <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                              </div>
                              <div
                                className={`mt-1 rounded-lg p-3 ${
                                  message.sender === "user"
                                    ? "bg-muted text-foreground"
                                    : "bg-primary text-primary-foreground"
                                }`}
                              >
                                <p className="text-sm">{message.text}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="border-t p-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSendMessage()
                            }
                          }}
                        />
                        <Button onClick={handleSendMessage}>Send</Button>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="info" className="p-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium">User Information</h3>
                        <div className="mt-2 rounded-lg border p-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-muted-foreground">Name:</div>
                            <div>{selectedConversation.user.name}</div>
                            <div className="text-muted-foreground">Job Interest:</div>
                            <div>{selectedConversation.job}</div>
                            <div className="text-muted-foreground">Platform:</div>
                            <div>{selectedConversation.platform}</div>
                            <div className="text-muted-foreground">First Contact:</div>
                            <div>3 days ago</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Conversation Stats</h3>
                        <div className="mt-2 rounded-lg border p-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-muted-foreground">Total Messages:</div>
                            <div>{selectedConversation.messages.length}</div>
                            <div className="text-muted-foreground">User Messages:</div>
                            <div>{selectedConversation.messages.filter((m) => m.sender === "user").length}</div>
                            <div className="text-muted-foreground">Bot Messages:</div>
                            <div>{selectedConversation.messages.filter((m) => m.sender === "bot").length}</div>
                            <div className="text-muted-foreground">Last Activity:</div>
                            <div>{selectedConversation.timestamp}</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Actions</h3>
                        <div className="mt-2 flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            Export Chat
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            Mark as Resolved
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No conversation selected</h3>
              <p className="mt-2 text-sm text-muted-foreground">Select a conversation from the list to view messages</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

