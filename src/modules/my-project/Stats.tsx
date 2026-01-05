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
import { LucideActivity, LucideCalendar, LucideGitBranch, LucideGitBranchPlus, LucideMerge } from "lucide-react";

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
    <div>
      {/* Health Data Section */}
      <Card>
        <CardHeader>
          <CardTitle>Project Health</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Project Health Indicator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4">
            <div className=" flex items-center justify-between mb-5">
              <p>
                Velocity <LucideActivity className="w-4 h-4 inline " />
              </p>
              <p>{healthData?.commitsLast60Days} Commits / 60 Days</p>
            </div>

            <div className="mt-3 flex gap-0.5 h-20 items-end">
              {Array.from({ length: 15 }).map((_, i) => {
                const height = Math.random() * 60 + 40;
                const isRecent = i >= 9;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-sm transition-all duration-300 hover:opacity-70"
                    style={{
                      height: `${height}%`,
                      background: isRecent
                        ? "linear-gradient(to top, #C17100, #E1A836)"
                        : "#e5e7eb",
                    }}
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
              <p className="whitespace-nowrap bg-red-500/25 hover:bg-red-500/50 p-3 rounded-lg px-6 "><LucideGitBranch className="w-4 h-4 inline mr-1 -mt-1"/> Open Issues: {healthData?.openIssuesCount}</p>
              <p className="whitespace-nowrap bg-blue-500/25 hover:bg-blue-500/50 p-3 rounded-lg px-6"><LucideGitBranchPlus className="w-4 h-4 inline mr-1 -mt-1"/> Closed Issues: {healthData?.closedIssuesCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">🗣️ Tech Stack</h3>
        <div className="space-y-2">
          {languagesData?.map((lang) => (
            <div key={lang.name} className="flex justify-between items-center">
              <span>{lang.name}</span>
              <span className="font-semibold">{lang.percentage}%</span>
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
};

export default StatsTab;
//  <div className="border rounded-lg p-4">
//         <h3 className="text-lg font-semibold mb-4">📊 Project Health</h3>
//         <div className="space-y-2">
//           <p>Open Issues: {healthData?.openIssuesCount}</p>
//           <p>Closed Issues: {healthData?.closedIssuesCount}</p>
//   <p>
//     Last Commit:{" "}
//     {healthData?.lastCommitDate
//       ? new Date(healthData.lastCommitDate).toLocaleDateString()
//       : "N/A"}
//   </p>
//           <p>Commits (Last 60 Days): {healthData?.commitsLast60Days}</p>
//   <p>PR Merge Rate: {healthData?.prMergeRate}%</p>
//         </div>
//       </div>
