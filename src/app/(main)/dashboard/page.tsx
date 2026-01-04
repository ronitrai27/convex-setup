"use client";

import { Button } from "@/components/ui/button";
import { SignOutButton } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useQuery as useConvexQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  getContributionStats,
  getDahboardStats,
} from "../../../modules/dashboard";
import {
  PieChartVariant1,
  ScoreDetailsDialog,
} from "@/modules/dashboard/PieDisplay1";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LucideGitBranch, LucideGitCommit, Stars } from "lucide-react";
import { useState } from "react";
import ContributionGraph from "@/modules/dashboard/ContriButionGraph";
import ContributionGraph2 from "@/modules/dashboard/CustomGraph";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { BsStars } from "react-icons/bs";

const DashboardPage = () => {
  const user = useConvexQuery(api.users.getCurrentUser);
  const { open: sidebarOpen, isMobile } = useSidebar();

  const {
    data: dashboardStats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboardStats", user?.githubAccessToken, user?.githubUsername],
    queryFn: () =>
      getDahboardStats(
        user?.githubAccessToken || "",
        user?.githubUsername || ""
      ),
    staleTime: 10 * 60 * 1000, // 5 min || 10 min
    refetchOnWindowFocus: false,
    enabled: !!user?.githubAccessToken && !!user?.githubUsername,
  });

  // 🔥 TESTING - Play with these numbers!
  // const testStats = {
  //   totalCommits: 4000,
  //   totalPRs: 110,
  //   totalIssuesClosed: 50,
  //   totalReviews: 50,
  //   accountAgeInYears: 3,
  // };

  const [activeTab, setActiveTab] = useState("stats");

  return (
    <div className="w-full h-full">
      {/* ========================= */}
      {/* USER NAME */}
      {/* ========================= */}
      <div className="px-4 flex items-center gap-8">
        <h1 className="text-3xl font-semibold ">Welcome {user?.name}</h1>

        {/* <div className="w-10 h-10 bg-linear-to-br from-blue-600/10 via-indigo-400/30 to-white/30 flex items-center justify-center rounded-full shadow-md shadow-blue-600 hover:scale-105 hover:-translate-y-1 transition-all duration-300">
          <BsStars className="h-6 w-6 animate-pulse duration-500" />{" "}
        </div> */}
      </div>
      {/* ========================= */}
      {/* CARDS */}
      {/* ========================= */}
      <div className="grid grid-cols-3 gap-10 w-full my-5 px-8">
        <Card className="bg-linear-to-br from-accent/90 to-transparent dark:to-black  min-w-[260px]">
          <CardHeader>
            <CardTitle>Commits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-2xl font-semibold">
                  {dashboardStats?.totalCommits || "..."}
                </p>
                <p className="text-sm text-muted-foreground">Total Commits</p>
              </div>
              <Separator orientation="vertical" className="mx-2" />
              <LucideGitCommit className="h-10 w-10" />
            </div>
          </CardContent>
        </Card>
        {/* TOTAL PR*/}
        <Card className="bg-linear-to-br from-accent/90 to-transparent dark:to-black  min-w-[260px]">
          <CardHeader>
            <CardTitle>Pull Requests </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-2xl font-semibold">
                  {dashboardStats?.totalPRs || "..."}
                </p>
                <p className="text-sm text-muted-foreground">Total PRs</p>
              </div>
              <Separator orientation="vertical" className="mx-2" />
              <LucideGitBranch className="h-9 w-9" />
            </div>
          </CardContent>
        </Card>
        {/* DEMO FAKE DATA IDK */}
        <Card className="relative  min-w-[260px] bg-linear-to-br from-blue-600/60 via-indigo-500/30 to-transparent">
          <CardHeader>
            <CardTitle>Demo Fake Data </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-2xl font-semibold">27</p>
                <p className="text-sm text-muted-foreground">Its Fake</p>
              </div>
              <Image
                src="/ca1.png"
                alt="inteliigence"
                width={150}
                height={150}
                className=" absolute object-contain -bottom-16  -right-5"
              />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* ========================= */}
      {/* TABS FOR STATS || DISCOVER || WORKSPACE */}
      {/* ========================= */}
      <div className="py-6 ">
        {/* Tab Header */}
        <div className="flex gap-8">
          <Button
            size="sm"
            variant={activeTab === "stats" ? "default" : "outline"}
            onClick={() => setActiveTab("stats")}
          >
            Stats
          </Button>
          <Button
            size="sm"
            variant={activeTab === "discover" ? "default" : "outline"}
            onClick={() => setActiveTab("discover")}
          >
            Discover
          </Button>
          <Button
            size="sm"
            variant={activeTab === "workspaces" ? "default" : "outline"}
            onClick={() => setActiveTab("workspaces")}
          >
            Workspaces
          </Button>
        </div>
        <Separator className="max-w-[80%] mx-auto my-5" />

        {activeTab === "stats" && (
          <div
            className={cn(
              "grid transition-all duration-150 ",
              sidebarOpen
                ? "grid-cols-[minmax(0,1fr)_320px] gap-5"
                : "grid-cols-[minmax(0,1fr)_360px] gap-10"
            )}
          >
            {/* LEFT */}
            <Card className="w-full flex items-center justify-center mx-auto overflow-x-auto bg-linear-to-b from-accent/40 to-transparent dark:to-black">
              <CardContent>
                <ContributionGraph />
              </CardContent>
            </Card>

            {/* RIGHT */}
            <div className="w-full">
              {dashboardStats ? (
                <Card className="p-1 bg-linear-to-b from-accent/40 to-transparent dark:to-black">
                  <CardHeader></CardHeader>
                  <CardContent>
                    <PieChartVariant1 stats={dashboardStats} />
                    <div className="flex items-center justify-center">
                      <ScoreDetailsDialog stats={dashboardStats} />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div>
                  <Skeleton className="w-full h-60" />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "discover" && (
          <div className="grid grid-cols-2 gap-6">
            <div>Discover left content</div>
            <div>Discover right content</div>
          </div>
        )}

        {activeTab === "workspaces" && (
          <div className="grid grid-cols-2 gap-6">
            <div>Workspaces left content</div>
            <div>Workspaces right content</div>
          </div>
        )}
      </div>

      <SignOutButton>
        <Button variant="outline">Sign Out</Button>
      </SignOutButton>
    </div>
  );
};

export default DashboardPage;
