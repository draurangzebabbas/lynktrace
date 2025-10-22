import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

import data from "./data.json"

export default async function Page() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/')
  }

  const user = await getCurrentUser()

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {user && (
                <div className="px-4 lg:px-6">
                  <div className="rounded-lg border p-4 bg-card">
                    <h2 className="text-lg font-semibold mb-2">Welcome back!</h2>
                    <p className="text-sm text-muted-foreground">
                      Hello {user.first_name} {user.last_name}! Your account is synced with Supabase.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Email: {user.email}
                    </p>
                  </div>
                </div>
              )}
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
