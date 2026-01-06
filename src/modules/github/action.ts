"use server";

import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { Octokit } from "octokit";

// ========================================
// GETTING GITHUB ACCESS TOKEN FROM CLERK
// ========================================
export async function getGithubAccessToken() {
  const { userId } = await auth();
  //   Read the request’s cookies sent from the browser
  // Validate the session from that cookie
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const client = await clerkClient();

  const tokens = await client.users.getUserOauthAccessToken(userId, "github");

  // Returns an array of tokens
  const accessToken = tokens.data[0]?.token;
  // console.log("accessToken", accessToken);
  return accessToken;
}

// ============================================
// GETTING GITHUB REPOSITORIES
// ============================================
export const getRepositories = async (
  page: number = 1,
  perPage: number = 10
) => {
  const token = await getGithubAccessToken();

  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "updated",
    direction: "desc",
    visibility: "all",
    page: page,
    per_page: perPage,
  });

  return data;
};

// ===============================
// GETTING THE USER CONTRIBUTIONS.
// ================================
export async function fetchUserContributions(token: string, username: string) {
  console.log("token for fetching contribution:", token);
  console.log("username for fetching contribution:", username);
  // const newToken = await getGithubAccessToken();
  // console.log("newToken", newToken);
  const accessToken = token || (await getGithubAccessToken());
  const octokit = new Octokit({
    auth: accessToken,
  });

  const query = `
    query($username:String!){
        user(login:$username){
            contributionsCollection{
                contributionCalendar{
                    totalContributions
                    weeks{
                        contributionDays{
                            contributionCount
                            date
                            color
                        }
                    }
                }
            }
        }
    }`;

  try {
    const response: any = await octokit.graphql(query, {
      username: username,
    });

    console.log("contribution collected successfully by - github.ts");
    return response.user.contributionsCollection.contributionCalendar;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getUserGithubToken(userId: string) {
  const client = await clerkClient();
  const tokens = await client.users.getUserOauthAccessToken(userId, "github");
  return tokens.data[0]?.token;
}

// =================================
// GETTING REPO ALL FILES (TEXT PART)
// =================================

export async function getRepoFileContents(
  owner: string,
  repo: string,
  accessToken?: string,
  path: string = ""
): Promise<{ path: string; content: string }[]> {
  const token = accessToken || (await getGithubAccessToken());
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
  });

  // JUST A CHECK
  if (!Array.isArray(data)) {
    if (data.type === "file" && data.content) {
      return [
        {
          path: data.path,
          content: Buffer.from(data.content, "base64").toString("utf-8"),
        },
      ];
    }
    return [];
  }

  let files: { path: string; content: string }[] = [];

  for (const item of data) {
    if (item.type === "file") {
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: item.path,
      });

      // CHECKING
      if (
        !Array.isArray(fileData) &&
        fileData.type === "file" &&
        fileData.content
      ) {
        // FILTER OUT NON-CODE FILES IF NEEDD (IMAGES ETC)
        if (!item.path.match(/\.(png|jpg|jpeg|gif|ico|tar|gz|pdf|zip|svg)$/i)) {
          files.push({
            path: item.path,
            content: Buffer.from(fileData.content, "base64").toString("utf-8"),
          });
        }
      }
    } else if (item.type === "dir") {
      const subFiles = await getRepoFileContents(
        owner,
        repo,
        accessToken,
        item.path
      );

      files = files.concat(subFiles);
    }
  }

  return files;
}

// ============================================
// GETTING PROJECT HEALTH DATA
// openIssuesCount
// closedIssuesCount
// lastCommitDate
// commitsLast60Days
// prMergeRate
// ============================================
export const getProjectHealthData = async (owner: string, repo: string) => {
  console.log(`📊 Fetching health data for: ${owner}/${repo}`);

  const token = await getGithubAccessToken();
  const octokit = new Octokit({ auth: token });

  try {
    // 1️⃣ Get open issues count
    console.log("🔍 Fetching open issues...");
    const { data: openIssuesData } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: "open",
      per_page: 1, // We only need the count
    });
    const openIssuesCount = openIssuesData.length;
    console.log(`✅ Open issues: ${openIssuesCount}`);

    // 2️⃣ Get closed issues count
    console.log("🔍 Fetching closed issues...");
    const { data: closedIssuesData } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: "closed",
      per_page: 1, // We only need the count
    });
    const closedIssuesCount = closedIssuesData.length;
    console.log(`✅ Closed issues: ${closedIssuesCount}`);

    // 3️⃣ Get last commit date
    console.log("🔍 Fetching last commit date...");
    const { data: repoData } = await octokit.rest.repos.get({
      owner,
      repo,
    });
    const lastCommitDate = repoData.pushed_at;
    console.log(`✅ Last commit date: ${lastCommitDate}`);

    // 4️⃣ Get commits from last 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    console.log("🔍 Fetching commits from last 60 days...");
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      since: sixtyDaysAgo.toISOString(),
      per_page: 100,
    });
    const commitsLast60Days = commits.length;
    console.log(`✅ Commits in last 60 days: ${commitsLast60Days}`);

    // 5️⃣ Get PR merge rate
    console.log("🔍 Fetching pull requests...");
    const { data: allPRs } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: "all",
      per_page: 100,
    });

    const totalPRs = allPRs.length;
    const mergedPRs = allPRs.filter((pr) => pr.merged_at !== null).length;
    const prMergeRate = totalPRs > 0 ? (mergedPRs / totalPRs) * 100 : 0;

    console.log(`✅ Total PRs: ${totalPRs}, Merged: ${mergedPRs}`);
    console.log(`✅ PR merge rate: ${prMergeRate.toFixed(1)}%`);

    return {
      openIssuesCount,
      closedIssuesCount,
      lastCommitDate,
      commitsLast60Days,
      prMergeRate: Math.round(prMergeRate),
    };
  } catch (error) {
    console.error("❌ Error fetching health data:", error);
    throw new Error("Failed to fetch project health data");
  }
};
// ============================================
// GETTING PROJECT LANGUAGES
// Array of { name, bytes, percentage } sorted by usage
// ============================================
export const getProjectLanguages = async (owner: string, repo: string) => {
  console.log(`🗣️ Fetching languages for: ${owner}/${repo}`);

  const token = await getGithubAccessToken();
  const octokit = new Octokit({ auth: token });

  try {
    console.log("🔍 Fetching languages...");
    const { data: languages } = await octokit.rest.repos.listLanguages({
      owner,
      repo,
    });

    console.log("✅ Raw language data:", languages);

    // Calculate total bytes
    const totalBytes = Object.values(languages).reduce(
      (sum, bytes) => sum + bytes,
      0
    );

    // Convert to array with percentages
    const languageData = Object.entries(languages).map(([name, bytes]) => ({
      name,
      bytes,
      percentage: parseFloat(((bytes / totalBytes) * 100).toFixed(2)),
    }));

    // Sort by percentage descending
    languageData.sort((a, b) => b.percentage - a.percentage);

    console.log("✅ Languages with percentages:");
    languageData.forEach((lang) => {
      console.log(`   ${lang.name}: ${lang.percentage}%`);
    });

    return languageData;
  } catch (error) {
    console.error("❌ Error fetching languages:", error);
    throw new Error("Failed to fetch project languages");
  }
};
