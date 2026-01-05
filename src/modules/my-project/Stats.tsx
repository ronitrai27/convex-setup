"use client";
import { useQuery } from "@tanstack/react-query";
import React from "react";
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
} from "lucide-react";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";

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
}: {
  repoName: string;
  repoOwner: string;
}) => {
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
      <div className="p-4">
        <p>Loading project stats...</p>
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
    <div className="space-y-5">
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
              // onClick={() => setOpen(true)}
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
    </div>
  );
};

export default StatsTab;
