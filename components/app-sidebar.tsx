"use client"

import * as React from "react"
import {
<<<<<<< HEAD
  IconInnerShadowTop,
} from "@tabler/icons-react"

import { UserButton, SignedIn, useUser } from "@clerk/nextjs"
=======
  IconDashboard,
  IconFileDescription,
  IconKey,
  IconUsers,
  IconWebhook,
} from "@tabler/icons-react"
import { UserButton } from "@clerk/nextjs"
import { LogoIcon } from "@/components/logo"
import { NavMain } from "@/components/nav-main"
>>>>>>> 9b453125c3e3a45131fa6ae1130716a7a67c4fac
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

<<<<<<< HEAD
=======
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

>>>>>>> 9b453125c3e3a45131fa6ae1130716a7a67c4fac
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
                <LogoIcon />
                <span className="text-base font-semibold">LynkTrace</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
<<<<<<< HEAD
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
=======
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
>>>>>>> 9b453125c3e3a45131fa6ae1130716a7a67c4fac
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
