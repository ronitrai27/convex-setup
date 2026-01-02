"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

import {
  Bell,
  Bot,
  ChevronDown,
  ChevronRight,
  ChevronsLeftRight,
  ChevronsRight,
  ChevronsUpDown,
  Compass,
  CreditCard,
  FileText,
  Folder,
  Gift,
  GitBranch,
  Github,
  GithubIcon,
  LayoutDashboard,
  Link2,
  LogOutIcon,
  LucideGitBranch,
  LucideGrip,
  LucideLayoutDashboard,
  LucideListTodo,
  LucideRocket,
  LucideWandSparkles,
  Mic,
  Moon,
  Play,
  Plus,
  Settings2,
  SparklesIcon,
  Star,
  Stars,
  Store,
  Sun,
  User,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "../../../components/ui/button";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// interface UsersType {
//   _id: Id<"users">;
//   _creationTime: number;

//   name: string;
//   tokenIdentifier: string; // Clerk user ID
//   email: string;

//   imageUrl?: string;
//   hasCompletedOnboarding: boolean;

//   githubUsername?: string;
//   githubAccessToken?: string;

//   last_sign_in?: number; // unix timestamp
//   inviteLink?: string;

//   createdAt: number;
//   updatedAt: number;
// }

export const AppSidebar = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Exact TS type of a user row (auto-generated from schema)
  // Fetch Current User
  const user: Doc<"users"> | undefined | null = useQuery(
    api.users.getCurrentUser
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (url: string) => {
    return pathname === url || pathname.startsWith(url + "/dashbaord");
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center justify-between px-2 py-3">
          <div className="w-9 h-9 flex items-center justify-center rounded bg-primary text-primary-foreground">
            <p className="font-extrabold text-xl"> W</p>
          </div>
          <h1 className="font-bold text-xl">
            We<span className="italic">Kraft</span>
          </h1>
          {/* DROPDOWN ICON TO CHOOSE AMON USER CREATED PROJECTS  */}
          <Button size="icon-sm" variant="outline" className="cursor-pointer">
            <ChevronsUpDown className="h-5 w-5" />
          </Button>
        </div>
        {/* SHOWING GITHUB CONNECTED ACCOUNT */}
        {user === undefined ? (
          <div className="flex items-center gap-4 my-1 mx-auto border px-6 py-2 bg-sidebar-accent/30 rounded-md w-full">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex flex-col space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 my-0.5 mx-auto border px-6 py-2 bg-sidebar-accent/30 rounded-md">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback>UN</AvatarFallback>
            </Avatar>

            <div className="flex flex-col space-y-0.5">
              <h2 className="flex gap-2 text-sm items-center truncate">
                <Github className="h-4 w-4" /> {user?.githubUsername}
              </h2>
              <p className="text-xs text-muted-foreground ml-3">
                Account Synced
              </p>
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className="flex flex-col px-3 py-3 relative overflow-y-scroll scroll-smooth">
        <SidebarMenu className="flex flex-col gap-3">
          <SidebarMenuButton
            asChild
            data-active={isActive("/dashboard")}
            className="group relative overflow-hidden"
          >
            <Link
              href="/dashboard"
              className="relative z-10 flex items-center gap-3 px-3 py-2 data-[active=true]:text-white text-muted-foreground"
            >
              <LucideLayoutDashboard className="h-5 w-5" />
              <span className="text-base">Dashboard</span>

              {/* Gradient Active Indicator */}
              <span
                className="
        pointer-events-none absolute inset-0 -z-10
        opacity-0 transition-opacity
        group-data-[active=true]:opacity-100
        bg-linear-to-l from-blue-600/50 via-transparent  to-transparent
      "
              />
            </Link>
          </SidebarMenuButton>

          {/* MARKETPLACE */}
          <SidebarMenuButton
            asChild
            data-active={isActive("/dashboard/marketplace")}
            className="group relative overflow-hidden"
          >
            <Link
              href="/dashboard/marketplace"
              className="relative z-10 flex items-center gap-3 px-3 py-2 data-[active=true]:text-white text-muted-foreground"
            >
              <Store className="h-5 w-5" />
              <span className="text-base">Marketplace</span>

              <span
                className="
        pointer-events-none absolute inset-0 -z-10
        opacity-0 transition-opacity
        group-data-[active=true]:opacity-100
        bg-linear-to-l from-blue-600/50 via-transparent  to-transparent
      "
              />
            </Link>
          </SidebarMenuButton>

          {/* Community with hover popover fields */}
          <Popover>
            <PopoverTrigger asChild>
              <SidebarMenuButton
                data-active={isActive("/dashboard/community")}
                className="group relative overflow-hidden"
              >
                <div className="relative z-10 flex items-center gap-3 w-full text-muted-foreground">
                  <Users className="h-5 w-5" />
                  <span className="text-base">Community</span>
                  <ChevronRight className="h-4 w-4 ml-auto" />

                  <span
                    className="
            pointer-events-none absolute inset-0 -z-10
            opacity-0 transition-opacity
            group-data-[active=true]:opacity-100
             bg-linear-to-l from-blue-600/50 via-transparent  to-transparent
          "
                  />
                </div>
              </SidebarMenuButton>
            </PopoverTrigger>

            <PopoverContent side="right" className="w-56 p-2">
              <div className="flex flex-col gap-1">
                <Link
                  href="/community/discover"
                  className="flex items-center gap-2 rounded px-2 py-1 text-sm text-base hover:bg-accent"
                >
                  <Compass className="h-4 w-4" />
                  Discover Projects
                </Link>

                <Link
                  href="/community/bounties"
                  className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
                >
                  <Gift className="h-4 w-4" />
                  Open Bounties
                </Link>

                <Link
                  href="/community/teammates"
                  className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
                >
                  <UserPlus className="h-4 w-4" />
                  Find Teammates
                </Link>
              </div>
            </PopoverContent>
          </Popover>

          {/* MY PROJECTS WITH 2 TABS  MY CREATION | Team PROJECT*/}
          <div className="px-1 my-2">
            <h3 className="mb-2 text-base font-semibold text-muted-foreground capitalize text-center">
              My Projects
            </h3>

            <Tabs defaultValue="my" className="w-full">
              <TabsList className="grid grid-cols-2 h-8 mx-auto w-full">
                <TabsTrigger value="my" className="text-xs">
                  My Creations
                </TabsTrigger>
                <TabsTrigger value="team" className="text-xs">
                  Team Projects
                </TabsTrigger>
              </TabsList>

              {/* FIXED HEIGHT + SCROLL */}
              <div className="mt-2 h-40 overflow-y-auto rounded-md border bg-sidebar-accent/30">
                {/* MY CREATIONS */}
                <TabsContent value="my" className="m-0 p-2">
                  {/* ADDTION PROJECT CTA */}
                  <div className="flex items-center justify-center">
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Create Project
                    </Button>
                  </div>
                </TabsContent>

                {/* TEAM PROJECTS */}
                <TabsContent value="team" className="m-0 p-2">
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      No team projects
                    </p>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Collab Now
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
          {/* QUICK ACCESS */}
          <div className="">
            <p className="mb-2 text-center text-base text-muted-foreground">
              Quick Access
            </p>

            <div className="space-y-3">
              {/* FAVORITES */}
              <SidebarMenuButton
                asChild
                data-active={isActive("/dashboard/favorites")}
                className="group relative overflow-hidden"
              >
                <Link
                  href="/dashboard/favorites"
                  className="relative z-10 flex items-center gap-3 px-3 py-2 data-[active=true]:text-white text-muted-foreground"
                >
                  <Star className="h-5 w-5" />
                  <span className="text-base">Favorites</span>

                  <span
                    className="
        pointer-events-none absolute inset-0 -z-10
        opacity-0 transition-opacity
        group-data-[active=true]:opacity-100
        bg-linear-to-l from-blue-600/50 via-transparent  to-transparent
      "
                  />
                </Link>
              </SidebarMenuButton>

              {/* NOTIFICATIONS */}
              <SidebarMenuButton
                asChild
                data-active={isActive("/dashboard/notifications")}
                className="group relative overflow-hidden"
              >
                <Link
                  href="/dashboard/notifications"
                  className="relative z-10 flex items-center gap-3 px-3 py-2 data-[active=true]:text-white text-muted-foreground"
                >
                  <Bell className="h-5 w-5" />
                  <span className="text-base">Notifications</span>

                  <span
                    className="
        pointer-events-none absolute inset-0 -z-10
        opacity-0 transition-opacity
        group-data-[active=true]:opacity-100
        bg-linear-to-l from-blue-600/50 via-transparent  to-transparent
      "
                  />
                </Link>
              </SidebarMenuButton>

              {/* AI ASSISTANT (POPOVER) */}
              <Popover>
                <PopoverTrigger asChild>
                  <SidebarMenuButton
                    data-active={isActive("/dashboard/ai")}
                    className="group relative overflow-hidden"
                  >
                    <div className="relative z-10 flex items-center gap-3 px-1  w-full text-base text-muted-foreground">
                      <Bot className="h-4 w-4" />
                      <span>AI Assistant</span>
                      <ChevronRight className="h-4 w-4 ml-auto" />

                      <span
                        className="
              pointer-events-none absolute inset-0 -z-10
              opacity-0 transition-opacity
              group-data-[active=true]:opacity-100
              bg-gradient-to-r from-blue-600/20 via-blue-600/5 to-transparent
            "
                      />
                    </div>
                  </SidebarMenuButton>
                </PopoverTrigger>

                <PopoverContent side="right" className="w-64 p-2">
                  <div className="flex flex-col gap-1">
                    <Link
                      href="/dashboard/ai/notion"
                      className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
                    >
                      <Link2 className="h-4 w-4" />
                      Connect to Notion
                    </Link>

                    <Link
                      href="/dashboard/ai/voice"
                      className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
                    >
                      <Mic className="h-4 w-4" />
                      Ask via Voice
                    </Link>

                    <Link
                      href="/dashboard/ai/project"
                      className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
                    >
                      <FileText className="h-4 w-4" />
                      Get Project Details
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>

              {/* PROFILE */}
              <SidebarMenuButton
                asChild
                data-active={isActive("/dashboard/profile")}
                className="group relative overflow-hidden"
              >
                <Link
                  href="/dashboard/profile"
                  className="relative z-10 flex items-center gap-3 px-3 py-2 data-[active=true]:text-white text-muted-foreground"
                >
                  <User className="h-5 w-5" />
                  <span className="text-base">Profile</span>

                  <span
                    className="
        pointer-events-none absolute inset-0 -z-10
        opacity-0 transition-opacity
        group-data-[active=true]:opacity-100
        bg-linear-to-l from-blue-600/50 via-transparent  to-transparent
      "
                  />
                </Link>
              </SidebarMenuButton>

              {/* BILLING */}
              <SidebarMenuButton
                asChild
                data-active={isActive("/dashboard/billing")}
                className="group relative overflow-hidden"
              >
                <Link
                  href="/dashboard/billing"
                  className="relative z-10 flex items-center gap-3 px-3 py-2 data-[active=true]:text-white text-muted-foreground"
                >
                  <Wallet className="h-5 w-5" />
                  <span className="text-base">Billing</span>

                  <span
                    className="
        pointer-events-none absolute inset-0 -z-10
        opacity-0 transition-opacity
        group-data-[active=true]:opacity-100
        bg-linear-to-l from-blue-600/50 via-transparent  to-transparent
      "
                  />
                </Link>
              </SidebarMenuButton>
            </div>
          </div>

        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t px-2 py-3">
        <div className="rounded-md bg-linear-to-br from-blue-600/30 via-indigo-400/30 to-transparent px-3 py-3 space-y-3 ">
          {/* TOP MESSAGE (only if NOT elite) */}
          {user?.type !== "elite" && (
            <div className="flex items-start gap-2">
              <SparklesIcon className="h-4 w-4 text-blue-500 mt-0.5" />
              <div className="text-sm leading-snug">
                <p className="font-medium text-foreground">
                  Boost productivity with AI
                </p>
                <p className="text-muted-foreground text-sm italic">
                  Understand projects much faster with Elite.
                </p>
              </div>
            </div>
          )}

          {/* USAGE */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="capitalize">{user?.type} tier</span>
              <span>1 / {user?.limit}</span>
            </div>

            <Progress
              value={Math.min((1 / (user?.limit ?? 1)) * 100, 100)}
              className="h-1.5"
            />
          </div>

          {/* CTA */}
          {user?.type !== "elite" && (
            <Button size="sm" variant="default" className="w-full text-xs h-8">
              Upgrade now
            </Button>
          )}

          {/* ELITE STATE */}
          {user?.type === "elite" && (
            <p className="text-xs text-muted-foreground text-center">
              You’re on{" "}
              <span className="font-medium text-foreground">Elite</span> 🚀
            </p>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
