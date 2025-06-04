import { AppHeader } from "@/components/app-header"
import { VoiceTab } from "@/components/voice-tab"
import { VoiceTableTab } from "@/components/voice-table-tab"

export default function VoicePage() {
  return (
    <>
      <AppHeader title="Hívások kezelése" />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <VoiceTableTab />
      </main>
    </>
  )
}

