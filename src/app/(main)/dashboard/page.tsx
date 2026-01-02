"use client";

import { Button } from "@/components/ui/button";
import { SignOutButton } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useQuery as useConvexQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { getDahboardStats } from "../../modules/dashboard";
import { ImpactScoreDisplay } from "@/app/modules/dashboard/ImpactDisplay";

const DashboardPage = () => {
  const user = useConvexQuery(api.users.getCurrentUser);

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
    enabled: !!user?.githubAccessToken && !!user?.githubUsername,
  });

   // 🔥 TESTING - Play with these numbers!
  const testStats = {
    totalCommits: 4000,
    totalPRs: 110,
    totalIssuesClosed: 50,
    totalReviews: 50,
    accountAgeInYears: 3,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <SignOutButton>
          <Button>Sign Out</Button>
        </SignOutButton>
      </div>

      <div className="">
        {isLoading && <div>Loading stats...</div>}
        {error && <div>Error loading stats</div>}

        {!isLoading && !dashboardStats && (
          <div>
            No stats available. Make sure you have connected your GitHub
            account.
          </div>
        )}

        {dashboardStats && (
          <>
            <h1>total commits : {dashboardStats.totalCommits}</h1>
            <h1>total prs : {dashboardStats.totalPRs}</h1>
            <h1>total issues closed : {dashboardStats.totalIssuesClosed}</h1>
            <h1>total reviews : {dashboardStats.totalReviews}</h1>
            <h1>
              account age : {Math.floor(dashboardStats.accountAgeInYears)}{" "}
            </h1>

            <ImpactScoreDisplay stats={testStats} />
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
