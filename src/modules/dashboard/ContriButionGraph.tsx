/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import { ActivityCalendar } from "react-activity-calendar";
import { useTheme } from "next-themes";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { getContributionStats } from ".";
import { useQuery as useConvexQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const ContributionGraph = () => {
  const { theme } = useTheme();

  const user = useConvexQuery(api.users.getCurrentUser);

  const userName = user?.githubUsername;

  const { data, isLoading } = useQuery<{
    contributions: any[];
    totalContributions: number;
  }>({
    queryKey: ["contribution-graph"],
    queryFn: () => getContributionStats(userName || "") as any,
    enabled: !!userName, // 🔥 wait for username
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: true,
  });

  console.log("contribution-data from Client:", data);

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!data || !data?.contributions?.length) {
    return (
      <div>
        <h1>No contribution data available</h1>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="text-muted-foreground text-sm">
        <span>{data?.totalContributions} in the last year</span>
      </div>

      <div className="w-full">
        <div
          className="scrollbar-hide flex justify-center overflow-x-auto scale-100 2xl:scale-105"
          style={{
            width: "100%",
            transformOrigin: "center",
          }}
        >
          <ActivityCalendar
            data={data?.contributions}
            theme={{
              light: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
              dark: ["#161b22", "#255c35", "#3dae58", "#4cd36a", "#5ef87f"],
            }}
            colorScheme={theme === "dark" ? "dark" : "light"}
            blockSize={12}
            blockMargin={5}
            fontSize={14}
            // showWeekdayLabels
            showColorLegend
            showTotalCount
            showMonthLabels
          />
        </div>
      </div>
    </div>
  );
};

export default ContributionGraph;
