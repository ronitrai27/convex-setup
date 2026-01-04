/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import { useTheme } from "next-themes";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { getContributionStats } from ".";
import { useQuery as useConvexQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const ContributionGraph2 = () => {
  const { theme } = useTheme();
  const user = useConvexQuery(api.users.getCurrentUser);

  const { data, isLoading } = useQuery<{
    contributions: any[];
    totalContributions: number;
  }>({
    queryKey: ["contribution-graph"],
    queryFn: () => getContributionStats(user?.githubUsername || "") as any,
    staleTime: 720 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <Skeleton className="h-40 w-full mx-auto" />;
  }

  if (!data || !data?.contributions?.length) {
    return (
      <div className="text-center text-muted-foreground">
        <h1>No contribution data available</h1>
      </div>
    );
  }

  const getColor = (level: number) => {
    if (theme === "dark") {
      const colors = ["#1f2937", "#1e3a8a", "#1d4ed8", "#2563eb", "#3b82f6"];
      return colors[level] || colors[0];
    } else {
      const colors = ["#f3f4f6", "#bfdbfe", "#60a5fa", "#3b82f6", "#2563eb"];
      return colors[level] || colors[0];
    }
  };

  // Group contributions by week
  const weeks: any[][] = [];
  let currentWeek: any[] = [];

  data.contributions.forEach((day, index) => {
    const dayOfWeek = new Date(day.date).getDay();

    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);

    if (index === data.contributions.length - 1) {
      weeks.push(currentWeek);
    }
  });

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const getMonthLabel = (weekIndex: number) => {
    if (weekIndex >= weeks.length) return null;
    const firstDay = weeks[weekIndex][0];
    if (!firstDay) return null;
    const date = new Date(firstDay.date);
    if (date.getDate() <= 7) {
      return months[date.getMonth()];
    }
    return null;
  };

  return (
    <div className="flex w-full  flex-col items-center gap-3">
      <div className="text-muted-foreground text-sm ">
        <span>{data?.totalContributions} contributions in the last year</span>
      </div>

      <div className="w-full ">
        <div className="flex flex-col gap-1 text-xs">
          {/* Month labels */}
          <div className="flex gap-[2px] pl-8 mb-1">
            {weeks.map((_, index) => {
              const label = getMonthLabel(index);
              return (
                <div
                  key={index}
                  className="w-[10px] text-muted-foreground text-[9px]"
                >
                  {label}
                </div>
              );
            })}
          </div>

          {/* Days grid */}
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-[2px] text-muted-foreground text-[9px] justify-around pr-1">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            {/* Contribution boxes */}
            <div className="flex gap-[3px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[4px]">
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    const day = week.find(
                      (d) => new Date(d.date).getDay() === dayIndex
                    );
                    return (
                      <div
                        key={dayIndex}
                        className="w-[11px] h-[11px] rounded-sm transition-all hover:ring-1 hover:ring-blue-400 cursor-pointer"
                        style={{
                          backgroundColor: day
                            ? getColor(day.level)
                            : "transparent",
                        }}
                        title={
                          day ? `${day.count} contributions on ${day.date}` : ""
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-2 text-muted-foreground text-[10px]">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className="w-[10px] h-[10px] rounded-sm"
                style={{ backgroundColor: getColor(level) }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributionGraph2;
