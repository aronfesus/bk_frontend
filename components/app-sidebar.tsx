"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { BarChart3, Briefcase, Users, Share2, MessageSquare, Phone } from "lucide-react"

export function AppSidebar() {
  const pathname = usePathname()

  const menuItems = [
    { id: "dashboard", label: "Statisztikák", icon: BarChart3, path: "/dashboard" },
    { id: "jobs", label: "Munkák", icon: Briefcase, path: "/jobs" },
    { id: "applicants", label: "Jelentkezők", icon: Users, path: "/applicants" },
    { id: "integrations", label: "Integrációk", icon: Share2, path: "/integrations" },
    { id: "voice", label: "Hívások", icon: Phone, path: "/voice" },
    { id: "messages", label: "Üzenetek", icon: MessageSquare, path: "/messages" },
  ]

  return (
    <Sidebar className="bg-blue-50 dark:bg-blue-950/30">
      <SidebarHeader className="flex items-center px-4 py-5 pb-10">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary p-2 shadow-md">
            <MessageSquare className="h-6 w-6 text-primary-foreground" />
          </div>
          <Link href="/dashboard">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              ChatFlow
            </span>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.id} className="mb-1 px-2">
              <SidebarMenuButton
                asChild
                isActive={pathname === item.path}
                tooltip={item.label}
                className={`text-lg py-2.5 rounded-xl transition-all ${
                  pathname === item.path
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-900/50 dark:hover:text-blue-400 shadow-sm"
                    : "hover:bg-blue-100/50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
                }`}
              >
                <Link href={item.path} className="flex items-center">
                  <item.icon
                    className={`h-5 w-5 ${pathname === item.path ? "text-blue-600 dark:text-blue-300" : ""}`}
                  />
                  <span className="ml-2">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="pb-6">
      </SidebarFooter>
    </Sidebar>
  )
}

