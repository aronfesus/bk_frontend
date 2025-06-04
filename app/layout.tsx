import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ClerkProvider, SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import { Metadata } from 'next'
import { Providers } from "./providers"
import { huHU } from '@clerk/localizations'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Bot Monitoring Platform',
  description: 'Monitor your customer service bots',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider localization={huHU}>
      <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
        <head>
          <meta name="description" content="Monitor your customer service bots" />
        </head>
        <body className="antialiased">
          <Providers>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
              <SidebarProvider>
                <div className="flex h-screen w-full overflow-hidden bg-background">
                  <AppSidebar />
                  <div className="flex flex-1 flex-col overflow-hidden">
                    {children}
                  </div>
                </div>
              </SidebarProvider>
            </ThemeProvider>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}

