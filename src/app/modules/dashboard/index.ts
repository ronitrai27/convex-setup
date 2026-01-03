"use server";

import { auth } from "@clerk/nextjs/server";
import { fetchUserContributions, getGithubAccessToken } from "../github/action";
import { Octokit } from "octokit";

// =====================================
// GETTING DASHBOARD STATS (count of all)
// =====================================

export async function getDahboardStats(
  accessToken: string,
  githubName: string
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const calendar = await fetchUserContributions(accessToken, githubName);
    const totalCommits = calendar?.totalContributions || 0;

    const octokit = new Octokit({ auth: accessToken });

    // Count PRs from github
    const { data: pr } = await octokit.rest.search.issuesAndPullRequests({
      q: `author:${githubName} type:pr`,
      per_page: 1,
    });
    const totalpr = pr?.total_count || 0;

    // Count closed issues
    const { data: issues } = await octokit.rest.search.issuesAndPullRequests({
      q: `author:${githubName} type:issue is:closed`,
      per_page: 1,
    });
    const totalIssuesClosed = issues?.total_count || 0;

    // Count code review comments
    const { data: reviews } = await octokit.rest.search.issuesAndPullRequests({
      q: `commenter:${githubName} type:pr`,
      per_page: 1,
    });
    const totalReviews = reviews?.total_count || 0;

    // Get user account creation date for age calculation
    const { data: user } = await octokit.rest.users.getByUsername({
      username: githubName,
    });
    const accountCreatedAt = new Date(user.created_at);
    const accountAgeInYears =
      (Date.now() - accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24 * 365);

    return {
      totalCommits,
      totalPRs: totalpr,
      totalIssuesClosed,
      totalReviews,
      accountAgeInYears,
      accountCreatedAt: user.created_at,
    };
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch dashboard stats");
  }
}

// ==================================
// GET HEATMAPS CONTRIBUTION
// ==================================
export async function getContributionStats(githubName: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const accessToken = await getGithubAccessToken();
    const calendar = await fetchUserContributions(accessToken, githubName);

    if (!calendar) {
      return [];
    }

    const contributions = calendar.weeks.flatMap((week: any) =>
      week.contributionDays.map((day: any) => ({
        date: day.date,
        count: day.contributionCount,
        level: Math.min(4, Math.floor(day.contributionCount / 3)),
      }))
    );

    return {
      contributions,
      totalContributions: calendar.totalContributions,
    };
  } catch (error) {
    console.log(error);
    return {
      contributions: [],
      totalContributions: 0,
    };
  }
}
