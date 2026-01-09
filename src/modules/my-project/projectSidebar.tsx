"use client"

import Link from "next/link"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

import {
  CheckSquare,
  Clock,
  Activity,
  Settings,
  ArrowLeft,
} from "lucide-react"

export default function ProjectSidebar() {
  return (
    <Sidebar collapsible="icon" className="">
      {/* ───────── HEADER ───────── */}
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">
            Project
          </span>
          <span className="font-semibold text-base">
            Test Project 🚀
          </span>
        </div>
      </SidebarHeader>

      {/* ───────── CONTENT ───────── */}
      <SidebarContent className="px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="#">
                <CheckSquare className="h-4 w-4" />
                <span>Todo</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="#">
                <Clock className="h-4 w-4" />
                <span>Time Tracker</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="#">
                <Activity className="h-4 w-4" />
                <span>Activity</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="#">
                <Settings className="h-4 w-4" />
                <span>Actions</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      {/* ───────── FOOTER ───────── */}
      <SidebarFooter className="border-t px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard/my-projects">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Projects</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
