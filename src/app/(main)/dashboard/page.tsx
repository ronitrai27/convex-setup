"use client";

import { Button } from "@/components/ui/button";
import { SignOutButton } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useQuery as useConvexQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  getContributionStats,
  getDahboardStats,
  getMonthlyActivity,
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
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const DashboardPage = () => {
  const user = useConvexQuery(api.users.getCurrentUser);
  const { open: sidebarOpen, isMobile } = useSidebar();

  const {
    data: dashboardStats,
    isLoading,
    error,
    // refetch,
  } = useQuery({
    queryKey: ["dashboardStats", user?.githubAccessToken, user?.githubUsername],
    queryFn: () => getDahboardStats(user?.githubUsername || ""),
    staleTime: 30 * 60 * 1000, // 10 min || 30 min
    gcTime: 30 * 60 * 1000, // 30 min
    refetchOnWindowFocus: false,
    enabled: !!user?.githubUsername,
  });

  // Query 2 --------------
  const { data: monthlyActivity, isLoading: isLoadingActivity } = useQuery({
    queryKey: ["monthly-activity"],
    queryFn: async () => await getMonthlyActivity(),
    staleTime: 12 * 60 * 60 * 1000, // 12 hr
    gcTime: 12 * 60 * 60 * 1000, // 12 hr
    refetchOnWindowFocus: false,
    enabled: !!user?.githubUsername,
  });

  const [range, setRange] = useState<"past" | "current">("past");
  type ViewMode = "normal" | "stacked" | "expand";
  const [viewMode, setViewMode] = useState<ViewMode>("stacked");

  const stackId = viewMode === "normal" ? undefined : "activity";

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
    <div className="w-full h-full p-6 2xl:py-7 2xl:px-10">
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
        {/* COMMIT */}
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
            <CardTitle className="flex items-center justify-between">
              <p>Pull Requests</p>
              <p>Merged PRs</p>{" "}
            </CardTitle>
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
              <div className="flex flex-col">
                <p className="text-2xl font-semibold">
                  {dashboardStats?.totalMergedPRs || "..."}
                </p>
                <p className="text-sm text-muted-foreground">Merged PRs</p>
              </div>
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
        <div className="flex gap-6 px-10">
          <Button
            size="sm"
            className="px-10"
            variant={activeTab === "stats" ? "default" : "outline"}
            onClick={() => setActiveTab("stats")}
          >
            Stats
          </Button>
          <Button
            size="sm"
            className="px-10"
            variant={activeTab === "discover" ? "default" : "outline"}
            onClick={() => setActiveTab("discover")}
          >
            Discover
          </Button>
          {/* <Button
            size="sm"
            variant={activeTab === "workspaces" ? "default" : "outline"}
            onClick={() => setActiveTab("workspaces")}
          >
            Workspaces
          </Button> */}
        </div>
        <Separator className="max-w-[80%] mx-auto my-5" />

        {activeTab === "stats" && (
          <div className="space-y-10">
            <div
              className={cn(
                "grid transition-all duration-150 ",
                sidebarOpen
                  ? "grid-cols-[minmax(0,1fr)_320px] gap-5 2xl:gap-10"
                  : "grid-cols-[minmax(0,1fr)_360px] gap-10 2xl:gap-14"
              )}
            >
              {/* LEFT */}
              <Card className="p-4 bg-linear-to-b from-accent/40 to-transparent dark:to-black">
                <CardContent className="pt-6">
                  <ContributionGraph />
                </CardContent>
              </Card>

              {/* RIGHT */}
              <div className="w-full">
                {dashboardStats ? (
                  <Card className="p-2 bg-linear-to-b from-accent/40 to-transparent dark:to-black">
                    {/* <CardHeader></CardHeader> */}
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
            {/* ================================= */}
            {/* HERE NOW  LEFT SIDE ACTIVITY AND RIGHT SIDE NOTIFICATION */}
            {/* ================================= */}
            <div
              className={cn(
                "grid transition-all duration-150 ",
                sidebarOpen
                  ? "grid-cols-[minmax(0,1fr)_320px] gap-5 2xl:gap-10"
                  : "grid-cols-[minmax(0,1fr)_360px] gap-10 2xl:gap-14"
              )}
            >
              {/* LEFT SIDE 6 MONTHS ACTIVITY */}
              <div className="">
                <Card className="bg-linear-to-b from-accent/40 to-transparent dark:to-black">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        Activity Overview
                      </CardTitle>
                      <p className="text-muted-foreground text-xs">
                        Monthly Breakdown of Commits , PR and AI Data (Last 6
                        Months )
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={viewMode === "normal" ? "default" : "outline"}
                        onClick={() => setViewMode("normal")}
                        className="text-xs"
                      >
                        Normal
                      </Button>

                      <Button
                        size="sm"
                        variant={viewMode === "stacked" ? "default" : "outline"}
                        onClick={() => setViewMode("stacked")}
                        className="text-xs"
                      >
                        Stacked
                      </Button>

                      <Button
                        size="sm"
                        variant={viewMode === "expand" ? "default" : "outline"}
                        onClick={() => setViewMode("expand")}
                        className="text-xs"
                      >
                        Expand
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {isLoadingActivity ? (
                      <p className="text-muted-foreground text-xs">
                        Loading activity data...
                      </p>
                    ) : (
                      <div className="h-[300px] w-full">
                        <ChartContainer
                          config={{
                            commits: {
                              label: "Commits",
                              color: "hsl(217, 91%, 60%)",
                            },
                            prs: {
                              label: "Pull Requests",
                              color: "hsl(271, 91%, 65%)",
                            },
                            reviews: {
                              label: "AI Data",
                              color: "hsl(160, 84%, 39%)",
                            },
                          }}
                          className="h-full w-full"
                        >
                          <AreaChart
                            data={monthlyActivity || []}
                            stackOffset={
                              viewMode === "expand" ? "expand" : "none"
                            }
                            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient
                                id="colorCommits"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="hsl(217, 91%, 60%)"
                                  stopOpacity={0.8}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="hsl(217, 91%, 60%)"
                                  stopOpacity={0.1}
                                />
                              </linearGradient>
                              <linearGradient
                                id="colorPrs"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="hsl(271, 91%, 65%)"
                                  stopOpacity={0.8}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="hsl(271, 91%, 65%)"
                                  stopOpacity={0.1}
                                />
                              </linearGradient>
                              <linearGradient
                                id="colorReviews"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="hsl(160, 84%, 39%)"
                                  stopOpacity={0.8}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="hsl(160, 84%, 39%)"
                                  stopOpacity={0.1}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              className="stroke-muted/20"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="name"
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              className="text-[10px]"
                              tick={{ fill: "hsl(var(--muted-foreground))" }}
                            />
                            <ChartTooltip
                              content={<ChartTooltipContent className="w-40" />}
                              cursor={{
                                stroke: "hsl(var(--border))",
                                strokeWidth: 1,
                              }}
                            />

                            <Area
                              type="monotone"
                              dataKey="commits"
                              stackId={stackId}
                              stroke="hsl(217, 91%, 60%)"
                              strokeWidth={2}
                              fill="url(#colorCommits)"
                              dot={false}
                            />

                            <Area
                              type="monotone"
                              dataKey="prs"
                              stackId={stackId}
                              stroke="hsl(271, 91%, 65%)"
                              strokeWidth={2}
                              fill="url(#colorPrs)"
                              dot={false}
                            />

                            <Area
                              type="monotone"
                              dataKey="reviews"
                              stackId={stackId}
                              stroke="hsl(160, 84%, 39%)"
                              strokeWidth={2}
                              fill="url(#colorReviews)"
                              dot={false}
                            />

                            <YAxis
                              tickLine={false}
                              axisLine={false}
                              width={30}
                              tick={{
                                fontSize: 10,
                                fill: "hsl(var(--muted-foreground))",
                              }}
                              domain={[
                                0,
                                (dataMax: number) => Math.ceil(dataMax * 1.2),
                              ]}
                            />
                          </AreaChart>
                        </ChartContainer>
                        <div className="mt-3 flex items-center justify-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-[hsl(217,91%,60%)]" />
                            <span className="text-muted-foreground text-xs">
                              Commits
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-[hsl(271,91%,65%)]" />
                            <span className="text-muted-foreground text-xs">
                              Pull Requests
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-[hsl(160,84%,39%)]" />
                            <span className="text-muted-foreground text-xs">
                              AI Data
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              {/* RIGHT SIDE NOTIFICATIONS */}
              <div className="w-full bg-linear-to-b from-accent/40 to-transparent dark:to-black p-4 rounded-xl">
                <h2>Notifications</h2>
              </div>
            </div>
          </div>
        )}

        {activeTab === "discover" && (
          <div className="grid grid-cols-2 gap-6">
            <div>Discover left content</div>
            <div>Discover right content</div>
          </div>
        )}

        {/* {activeTab === "workspaces" && (
          <div className="grid grid-cols-2 gap-6">
            <div>Workspaces left content</div>
            <div>Workspaces right content</div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default DashboardPage;

{/* <SignOutButton>
  <Button variant="outline">Sign Out</Button>
</SignOutButton> */}
