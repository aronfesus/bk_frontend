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
import { Toaster } from "@/components/ui/sonner"

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
            <Toaster />
          </Providers>
          <script>
            {`
              window.fbAsyncInit = function() {
                FB.init({
                  appId      : '1424159448564691',
                  cookie     : true,
                  xfbml      : true,
                  version    : 'v21.0'
                });
                
                FB.AppEvents.logPageView();   
              };

              (function(d, s, id){
                 var js, fjs = d.getElementsByTagName(s)[0];
                 if (d.getElementById(id)) {return;}
                 js = d.createElement(s); js.id = id;
                 js.src = "https://connect.facebook.net/en_US/sdk.js";
                 fjs.parentNode.insertBefore(js, fjs);
               }(document, 'script', 'facebook-jssdk'));
            `}
          </script>
        </body>
      </html>
    </ClerkProvider>
  )
}

