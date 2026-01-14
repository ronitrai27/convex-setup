"use client";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { getProjectHealthData, getProjectLanguages } from "../github/action";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LucideActivity,
  LucideCalendar,
  LucideGitBranch,
  LucideGitBranchPlus,
  LucideHeart,
  LucideMerge,
  ShieldCheck,
  Zap,
  Users,
  Timer,
  Loader2,
  LucideInfo,
} from "lucide-react";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Doc } from "../../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getProjectHealthScore } from "./index";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

const LANGUAGE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const StatsTab = ({
  repoName,
  repoOwner,
  fullProject,
}: {
  repoName: string;
  repoOwner: string;
  fullProject: Doc<"projects">;
}) => {
  // Use states ------------------------
  const [openHealthDialog, setOpenHealthDialog] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const updateHealthScoreMutation = useMutation(api.projects.updateHealthScore);

  const handleCalculateScore = async () => {
    setCalculating(true);
    try {
      const scoreData = await getProjectHealthScore(fullProject);
      await updateHealthScoreMutation({
        projectId: fullProject._id,
        healthScore: scoreData,
      });
      toast.success("Health score updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to calculate health score.");
    } finally {
      setCalculating(false);
    }
  };

  // Query for health data - stale for 1 hour
  const {
    data: healthData,
    isLoading: healthLoading,
    error: healthError,
  } = useQuery({
    queryKey: ["project-health", repoOwner, repoName],
    queryFn: () => getProjectHealthData(repoOwner, repoName),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Query for languages - stale for 1 hour
  const {
    data: languagesData,
    isLoading: languagesLoading,
    error: languagesError,
  } = useQuery({
    queryKey: ["project-languages", repoOwner, repoName],
    queryFn: () => getProjectLanguages(repoOwner, repoName),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const languageChartData =
    languagesData?.map((lang, index) => ({
      name: lang.name,
      value: lang.percentage,
      fill: LANGUAGE_COLORS[index % LANGUAGE_COLORS.length],
    })) ?? [];

  // Loading state
  if (healthLoading || languagesLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-38 w-full" />
      </div>
    );
  }

  // Error state
  if (healthError || languagesError) {
    return (
      <div className="p-4 text-red-500">
        <p>Error loading stats:</p>
        <p>{healthError?.message || languagesError?.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Health Data Section */}
      <Card className="bg-linear-to-br from-accent/70 dark:to-black to-transparent">
        <CardHeader>
          <CardTitle>Project Health</CardTitle>
          <div className="text-muted-foreground text-sm flex justify-between">
            Project Health Indicator
            {/* VIEW HEALTH STATUS Dilaog Open */}
            <Button
              variant="outline"
              size="sm"
              className=" text-xs cursor-pointer "
              onClick={() => setOpenHealthDialog(true)}
            >
              <LucideHeart className="w-4 h-4 inline mr-1 " /> View Health
              Status
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4">
            <div className=" flex items-center justify-between mb-5">
              <p>
                Velocity <LucideActivity className="w-4 h-4 inline " />
              </p>
              <p>{healthData?.commitsLast60Days} Commits / 60 Days</p>
            </div>

            <div className="mt-3 flex gap-0.5 h-20 items-end px-2">
              {Array.from({ length: 20 }).map((_, i) => {
                const height = Math.random() * 60 + 40;
                const isRecent = i >= 9;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-sm transition-all duration-300 hover:opacity-70"
                    style={{
                      height: `${height}%`,
                      background: isRecent ? "#D5D6D6" : "#D5D6D6",
                    }}
                    // linear-gradient(to top, #C17100, #E1A836)
                  ></div>
                );
              })}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-y-6 w-full gap-x-10">
              <p className="whitespace-nowrap bg-accent/50 hover:bg-accent/70 p-3 rounded-lg px-6">
                <LucideCalendar className="w-4 h-4 inline mr-1 -mt-1" /> Last
                Commit:{" "}
                {healthData?.lastCommitDate
                  ? new Date(healthData.lastCommitDate).toLocaleDateString()
                  : "N/A"}
              </p>
              <p className="whitespace-nowrap bg-emerald-300/25 hover:bg-emerald-300/50 p-3 rounded-lg px-6">
                <LucideMerge className="w-4 h-4 inline mr-1 -mt-1" /> PR Merge
                Rate: {healthData?.prMergeRate}%
              </p>
              <p className="whitespace-nowrap bg-red-500/25 hover:bg-red-500/50 p-3 rounded-lg px-6 ">
                <LucideGitBranch className="w-4 h-4 inline mr-1 -mt-1" /> Open
                Issues: {healthData?.openIssuesCount}
              </p>
              <p className="whitespace-nowrap bg-blue-500/25 hover:bg-blue-500/50 p-3 rounded-lg px-6">
                <LucideGitBranchPlus className="w-4 h-4 inline mr-1 -mt-1" />{" "}
                Closed Issues: {healthData?.closedIssuesCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Languages Data */}
      <Card className="bg-linear-to-br from-accent/70 dark:to-black to-transparent">
        <CardHeader>
          <CardTitle>Project Languages</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Language distribution used in this project
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-8">
            {/* Left side - Pie Chart */}
            <div className="shrink-0">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={languageChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {languageChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(2)}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Right side - Language list */}
            <div className="flex-1 space-y-3">
              {languagesData?.map((lang, index) => (
                <div
                  key={lang.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          LANGUAGE_COLORS[index % LANGUAGE_COLORS.length],
                      }}
                    />
                    <span className="font-medium">{lang.name}</span>
                  </div>
                  <span className="text-muted-foreground font-semibold">
                    {lang.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DIALOG  */}
      <Dialog open={openHealthDialog} onOpenChange={setOpenHealthDialog}>
        <DialogContent className="min-w-[500px]">
          <DialogHeader>
            <DialogTitle>Project Health Status</DialogTitle>
            <DialogDescription>
              Overall quality and activity of this project
            </DialogDescription>
          </DialogHeader>

          {fullProject.healthScore ? (
            <div className="space-y-6 p-4">
              {/* Total Score */}
              <div className="flex flex-col items-center justify-center space-y-4">
                <div
                  className={`flex items-center justify-center p-6 rounded-full shrink-0 ${
                    fullProject.healthScore.totalScore >= 70
                      ? "bg-green-500/25"
                      : fullProject.healthScore.totalScore >= 40
                      ? "bg-yellow-500/25"
                      : "bg-red-500/25"
                  }`}
                >
                  <span className="text-4xl font-bold">
                    {fullProject.healthScore.totalScore}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Last updated: {fullProject.healthScore.lastCalculatedDate}
                </p>
                {/* <Button 
                   variant="ghost" 
                   size="sm" 
                   className="text-xs"
                   onClick={handleCalculateScore}
                   disabled={calculating}
                >
                    {calculating ? (
                        <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Recalculating...</>
                    ) : (
                        "Recalculate Score"
                    )}
                </Button> */}
              </div>

              {/* Breakdown */}
              <div className="grid gap-5">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <LucideActivity className="w-4 h-4 text-blue-500" />{" "}
                      Activity Momentum
                    </span>
                    <span>{fullProject.healthScore.activityMomentum} / 35</span>
                  </div>
                  <Progress
                    value={
                      (fullProject.healthScore.activityMomentum / 35) * 100
                    }
                    className="h-1.5"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-500" />{" "}
                      Maintenance Quality
                    </span>
                    <span>
                      {fullProject.healthScore.maintenanceQuality} / 35
                    </span>
                  </div>
                  <Progress
                    value={
                      (fullProject.healthScore.maintenanceQuality / 35) * 100
                    }
                    className="h-1.5"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" /> Community
                      Trust
                    </span>
                    <span>{fullProject.healthScore.communityTrust} / 20</span>
                  </div>
                  <Progress
                    value={(fullProject.healthScore.communityTrust / 20) * 100}
                    className="h-1.5"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-blue-500" /> Freshness
                    </span>
                    <span>{fullProject.healthScore.freshness} / 10</span>
                  </div>
                  <Progress
                    value={(fullProject.healthScore.freshness / 10) * 100}
                    className="h-1.5"
                  />
                </div>
              </div>

              <p className="text-xs tracking-tight text-muted-foreground">
                <LucideInfo className="w-4 h-4 inline" /> Health Score is
                calculated based on project Activity, proper doc and Maintenance, community trust/virality and momentum.
              </p>
               <p className="text-xs tracking-tight text-muted-foreground">
                <LucideInfo className="w-4 h-4 inline" /> Health score is updated on every 3 days.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
              <div className="p-4 bg-accent/20 rounded-full">
                <LucideHeart className="w-12 h-12 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">No Health Score Yet</h3>
                <p className="text-sm text-muted-foreground max-w-[300px]">
                  Calculate your project's health score based on activity,
                  quality, and community stats.
                </p>
              </div>
              <Button onClick={handleCalculateScore} disabled={calculating}>
                {calculating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Calculating...
                  </>
                ) : (
                  "Calculate Now"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StatsTab;
