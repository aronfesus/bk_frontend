import { AppHeader } from "@/components/app-header"
import { IntegrationsTab } from "@/components/integrations-tab"

export default function IntegrationsPage() {
  return (
    <>
      <AppHeader title="Integrációk" />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <IntegrationsTab />
      </main>
    </>
  )
}

