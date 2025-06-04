import { AppHeader } from "@/components/app-header"
import { MessagesTabV2 } from "@/components/messages-tab-v2"
import { MessagesTabInfinite } from "@/components/messages-tab-infinite"

export default function MessagesPage() {
  return (
    <>
      <AppHeader title="Üzenetek megtekintése" />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <MessagesTabInfinite />
      </main>
    </>
  )
}

