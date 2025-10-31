"use client"

import * as React from "react"
import {
  IconDashboard,
  IconFileDescription,
  IconKey,
  IconUsers,
  IconWebhook,
} from "@tabler/icons-react"
import { UserButton } from "@clerk/nextjs"
import { LogoIcon } from "@/components/logo"
import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: IconDashboard,
    },
    {
      title: "Api Keys",
      url: "#",
      icon: IconKey,
    },
    {
      title: "Scrapers",
      url: "#",
      icon: IconFileDescription,
    },
    {
      title: "My Profiles",
      url: "#",
      icon: IconUsers,
    },
    {
      title: "Webhook Guide",
      url: "#",
      icon: IconWebhook,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
                <LogoIcon />
                <span className="text-base font-semibold">LynkTrace</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 p-2">
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-8 h-8"
              }
            }}
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
