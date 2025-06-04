import { AppHeader } from "@/components/app-header"

export default function SettingsPage() {
  return (
    <>
      <AppHeader title="Settings" />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
          <p className="text-muted-foreground">Configure application settings and preferences</p>

          <div className="rounded-lg border p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Settings Page</h3>
            <p className="text-muted-foreground">This is a placeholder for the system settings page.</p>
          </div>
        </div>
      </main>
    </>
  )
}

