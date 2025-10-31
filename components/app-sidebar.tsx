"use client"

import * as React from "react"
import {
  IconInnerShadowTop,
} from "@tabler/icons-react"

import { UserButton, SignedIn, useUser } from "@clerk/nextjs"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-3 p-4">
          <SignedIn>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
            {user && (
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium truncate">
                  {user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress}
                </span>
                {user.primaryEmailAddress && user.fullName && (
                  <span className="text-xs text-muted-foreground truncate">
                    {user.primaryEmailAddress.emailAddress}
                  </span>
                )}
              </div>
            )}
          </SignedIn>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
