"use server";

import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { Octokit } from "octokit";
import pLimit from "p-limit";

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
  perPage: number = 10,
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

// ---------------------------------------
// GITHUB TOKEN JUST FOR INNGEST
// -------------------------------------
export async function getUserGithubToken(userId: string) {
  const client = await clerkClient();
  const tokens = await client.users.getUserOauthAccessToken(userId, "github");
  return tokens.data[0]?.token;
}

// =================================
// GETTING REPO ALL FILES (TEXT PART)
// =================================

// export async function getRepoFileContents(
//   owner: string,
//   repo: string,
//   accessToken?: string,
//   path: string = ""
// ): Promise<{ path: string; content: string }[]> {
//   const token = accessToken || (await getGithubAccessToken());
//   const octokit = new Octokit({ auth: token });
//   const { data } = await octokit.rest.repos.getContent({
//     owner,
//     repo,
//     path,
//   });

//   // JUST A CHECK
//   if (!Array.isArray(data)) {
//     if (data.type === "file" && data.content) {
//       return [
//         {
//           path: data.path,
//           content: Buffer.from(data.content, "base64").toString("utf-8"),
//         },
//       ];
//     }
//     return [];
//   }

//   let files: { path: string; content: string }[] = [];

//   for (const item of data) {
//     if (item.type === "file") {
//       const { data: fileData } = await octokit.rest.repos.getContent({
//         owner,
//         repo,
//         path: item.path,
//       });

//       // CHECKING
//       if (
//         !Array.isArray(fileData) &&
//         fileData.type === "file" &&
//         fileData.content
//       ) {
//         // FILTER OUT NON-CODE FILES IF NEEDD (IMAGES ETC)
//         if (!item.path.match(/\.(png|jpg|jpeg|gif|ico|tar|gz|pdf|zip|svg)$/i)) {
//           files.push({
//             path: item.path,
//             content: Buffer.from(fileData.content, "base64").toString("utf-8"),
//           });
//         }
//       }
//     } else if (item.type === "dir") {
//       const subFiles = await getRepoFileContents(
//         owner,
//         repo,
//         accessToken,
//         item.path
//       );

//       files = files.concat(subFiles);
//     }
//   }

//   return files;
// }

export async function getRepoFileContents(
  owner: string,
  repo: string,
  accessToken: string,
  path: string = "",
): Promise<{ path: string; content: string }[]> {
  const token = accessToken;
  console.log("Token for file contents: ", token);
  const octokit = new Octokit({ auth: token });

  // Collect all file paths first (without fetching content)
  const filePaths = await collectFilePaths(octokit, owner, repo, path);
  console.log(`📁 Found ${filePaths.length} files to fetch`);

  //Fetch all file contents in parallel
  const files = await fetchFileContentsParallel(
    octokit,
    owner,
    repo,
    filePaths,
  );
  console.log(`✅ Fetched ${files.length} files`);

  return files;
}

// ========== STEP 1: Collect all file paths (fast, no content) ==========
async function collectFilePaths(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string = "",
): Promise<string[]> {
  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
  });

  // Handle single file
  if (!Array.isArray(data)) {
    if (data.type === "file" && shouldIncludeFile(data.path)) {
      return [data.path];
    }
    return [];
  }

  // Process directories in parallel
  const promises = data.map(async (item) => {
    // Skip excluded directories
    if (item.type === "dir" && shouldSkipDirectory(item.path)) {
      console.log(`⏭️  Skipping directory: ${item.path}`);
      return [];
    }

    // Include file if it passes filter
    if (item.type === "file") {
      if (shouldIncludeFile(item.path)) {
        return [item.path];
      } else {
        console.log(`⏭️  Skipping file: ${item.path}`);
        return [];
      }
    }

    // Recursively collect from subdirectories (in parallel)
    if (item.type === "dir") {
      return collectFilePaths(octokit, owner, repo, item.path);
    }

    return [];
  });

  const results = await Promise.all(promises);
  return results.flat();
}

// ========== STEP 2: Fetch file contents in parallel batches ==========
async function fetchFileContentsParallel(
  octokit: Octokit,
  owner: string,
  repo: string,
  filePaths: string[],
): Promise<{ path: string; content: string }[]> {
  const BATCH_SIZE = 20; //Fetch 20 files at once
  const files: { path: string; content: string }[] = [];

  for (let i = 0; i < filePaths.length; i += BATCH_SIZE) {
    const batch = filePaths.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map(async (filePath) => {
        try {
          const { data: fileData } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: filePath,
          });

          if (
            !Array.isArray(fileData) &&
            fileData.type === "file" &&
            fileData.content
          ) {
            return {
              path: filePath,
              content: Buffer.from(fileData.content, "base64").toString(
                "utf-8",
              ),
            };
          }
          return null;
        } catch (error) {
          console.error(`❌ Failed to fetch ${filePath}:`, error);
          return null;
        }
      }),
    );

    // Add successful results
    batchResults.forEach((result) => {
      if (result.status === "fulfilled" && result.value) {
        files.push(result.value);
      }
    });

    console.log(
      `📥 Fetched batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(filePaths.length / BATCH_SIZE)} (${files.length}/${filePaths.length} files)`,
    );
  }

  return files;
}

function shouldSkipDirectory(path: string): boolean {
  const excludedDirs = [
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    "out",
    "coverage",
    ".turbo",
    ".vercel",
    ".cache",
    "public/assets",
    "public/images",
    ".husky",
    ".vscode",
    ".idea",
  ];

  const dirName = path.split("/").pop() || "";
  return excludedDirs.includes(dirName);
}

function shouldIncludeFile(filePath: string): boolean {
  const fileName = filePath.split("/").pop() || "";

  // Exclude lock files
  const lockFiles = [
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "bun.lockb",
  ];
  if (lockFiles.includes(fileName)) {
    return false;
  }

  const excludedConfigs = [
    "eslint.config.mjs",
    "eslint.config.js",
    ".eslintrc",
    ".eslintrc.js",
    ".eslintrc.json",
    ".prettierrc",
    ".prettierrc.js",
    ".prettierrc.json",
    "prettier.config.js",
    "next.config.mjs",
    "next.config.ts",
    "next.config.js",
    "components.json",
    "postcss.config.js",
    "postcss.config.mjs",
    ".editorconfig",
    ".nvmrc",
    ".npmrc",
    "vercel.json",
  ];
  if (excludedConfigs.includes(fileName)) {
    return false;
  }

  if (fileName === ".gitignore" || fileName === ".gitattributes") {
    return false;
  }
  if (fileName.match(/^\.env/)) {
    return false;
  }

  if (
    filePath.match(
      /\.(png|jpg|jpeg|gif|ico|svg|webp|bmp|tiff|pdf|zip|tar|gz|rar|7z|exe|dmg|woff|woff2|ttf|eot|mp4|mp3|wav|avi|mov)$/i,
    )
  ) {
    return false;
  }

  if (filePath.endsWith(".map")) {
    return false;
  }

  if (fileName.match(/^LICENSE/i) || fileName.match(/^LICENCE/i)) {
    return false;
  }
  if (fileName.match(/^CHANGELOG/i)) {
    return false;
  }

  // Include everything else (code files)
  return true;
}

// ============================================
// GETTING PROJECT HEALTH DATA
// openIssuesCount
// closedIssuesCount
// lastCommitDate
// commitsLast60Days
// prMergeRate
// ============================================
// export const getProjectHealthData = async (owner: string, repo: string) => {
//   console.log(`📊 Fetching health data for: ${owner}/${repo}`);

//   const token = await getGithubAccessToken();
//   const octokit = new Octokit({ auth: token });

//   try {
//     // 1️⃣ Get open issues count
//     console.log("🔍 Fetching open issues...");
//     const { data: openIssuesData } = await octokit.rest.issues.listForRepo({
//       owner,
//       repo,
//       state: "open",
//       per_page: 1, // We only need the count
//     });
//     const openIssuesCount = openIssuesData.length;
//     console.log(`✅ Open issues: ${openIssuesCount}`);

//     // 2️⃣ Get closed issues count
//     console.log("🔍 Fetching closed issues...");
//     const { data: closedIssuesData } = await octokit.rest.issues.listForRepo({
//       owner,
//       repo,
//       state: "closed",
//       per_page: 1, // We only need the count
//     });
//     const closedIssuesCount = closedIssuesData.length;
//     console.log(`✅ Closed issues: ${closedIssuesCount}`);

//     // 3️⃣ Get last commit date
//     console.log("🔍 Fetching last commit date...");
//     const { data: repoData } = await octokit.rest.repos.get({
//       owner,
//       repo,
//     });
//     const lastCommitDate = repoData.pushed_at;
//     console.log(`✅ Last commit date: ${lastCommitDate}`);

//     // 4️⃣ Get commits from last 60 days
//     const sixtyDaysAgo = new Date();
//     sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

//     console.log("🔍 Fetching commits from last 60 days...");
//     const { data: commits } = await octokit.rest.repos.listCommits({
//       owner,
//       repo,
//       since: sixtyDaysAgo.toISOString(),
//       per_page: 100,
//     });
//     const commitsLast60Days = commits.length;
//     console.log(`✅ Commits in last 60 days: ${commitsLast60Days}`);

//     // 5️⃣ Get PR merge rate
//     console.log("🔍 Fetching pull requests...");
//     const { data: allPRs } = await octokit.rest.pulls.list({
//       owner,
//       repo,
//       state: "all",
//       per_page: 100,
//     });

//     const totalPRs = allPRs.length;
//     const mergedPRs = allPRs.filter((pr) => pr.merged_at !== null).length;
//     const prMergeRate = totalPRs > 0 ? (mergedPRs / totalPRs) * 100 : 0;

//     console.log(`✅ Total PRs: ${totalPRs}, Merged: ${mergedPRs}`);
//     console.log(`✅ PR merge rate: ${prMergeRate.toFixed(1)}%`);

//     return {
//       openIssuesCount,
//       closedIssuesCount,
//       lastCommitDate,
//       commitsLast60Days,
//       totalPRs,
//       mergedPRs,
//       prMergeRate: Math.round(prMergeRate),
//     };
//   } catch (error) {
//     console.error("❌ Error fetching health data:", error);
//     throw new Error("Failed to fetch project health data");
//   }
// };

export const getProjectHealthData = async (owner: string, repo: string) => {
  console.log(`📊 Fetching health data for: ${owner}/${repo}`);

  const token = await getGithubAccessToken();
  const octokit = new Octokit({ auth: token });

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  try {
    // 🚀 Execute ALL requests in parallel
    const [
      { data: openIssuesData },
      { data: closedIssuesData },
      { data: repoData },
      { data: commits },
      { data: allPRs },
    ] = await Promise.all([
      octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: "open",
        per_page: 1,
      }),
      octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: "closed",
        per_page: 1,
      }),
      octokit.rest.repos.get({ owner, repo }),
      octokit.rest.repos.listCommits({
        owner,
        repo,
        since: sixtyDaysAgo.toISOString(),
        per_page: 100,
      }),
      octokit.rest.pulls.list({ owner, repo, state: "all", per_page: 100 }),
    ]);

    // Process results
    const openIssuesCount = openIssuesData.length;
    const closedIssuesCount = closedIssuesData.length;
    const lastCommitDate = repoData.pushed_at;
    const commitsLast60Days = commits.length;

    const totalPRs = allPRs.length;
    const mergedPRs = allPRs.filter((pr) => pr.merged_at !== null).length;
    const prMergeRate = totalPRs > 0 ? (mergedPRs / totalPRs) * 100 : 0;

    return {
      openIssuesCount,
      closedIssuesCount,
      lastCommitDate,
      commitsLast60Days,
      totalPRs,
      mergedPRs,
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
      0,
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

// ============================================
// GETTING PROJECT README
// ============================================
export const getReadme = async (owner: string, repo: string) => {
  console.log(`📖 Fetching README for: ${owner}/${repo}`);

  const token = await getGithubAccessToken();
  const octokit = new Octokit({ auth: token });

  try {
    const { data } = await octokit.rest.repos.getReadme({
      owner,
      repo,
      mediaType: {
        format: "raw",
      },
    });

    console.log("✅ README fetched successfully");
    return data as unknown as string;
  } catch (error) {
    console.error("❌ Error fetching README:", error);
    // If README doesn't exist, GitHub API returns 404
    return null;
  }
};

// ============================
// CREATING WEBHOOK
// ============================
export const createWebhook = async (owner: string, repo: string) => {
  console.log("Creating webhook for", owner, repo);
  const token = await getGithubAccessToken();

  const octokit = new Octokit({ auth: token });

  const webhookUrl = `${process.env.NGROK_URL}/api/webhooks/github`;

  const { data: hooks } = await octokit.rest.repos.listWebhooks({
    owner,
    repo,
  });

  const exisitingHook = hooks.find((hook) => hook.config.url === webhookUrl);
  if (exisitingHook) {
    return exisitingHook;
  }

  const { data } = await octokit.rest.repos.createWebhook({
    owner,
    repo,
    config: {
      url: webhookUrl,
      content_type: "json",
    },
    events: ["pull_request", "push", "issues"],
  });

  console.log("-----------------Webhook created successfully-----------------");

  return data;
};

// ===============================
// PULL REQ DIFFERENCE
// ================================

export async function getPullReqDiff(
  token: string,
  owner: string,
  repo: string,
  prNumber: number,
) {
  const octokit = new Octokit({ auth: token });
  const { data: pr } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  const { data: diff } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: {
      format: "diff",
    },
  });

  return {
    diff: diff as unknown as string,
    title: pr.title,
    description: pr.body || "",
  };
}

// ===============================
// Get Latest Repo Commit SHA
// ==============================
export async function getLatestCommitSHA(
  token: string,
  owner: string,
  repo: string,
  branch: string = "main",
): Promise<string> {
  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.rest.repos.getBranch({
    owner,
    repo,
    branch,
  });

  return data.commit.sha;
}

// =================================
// GET COMMIT DETAILS WITH FILES
// =================================
export async function getCommitDetails(
  token: string,
  owner: string,
  repo: string,
  commitSha: string,
) {
  const octokit = new Octokit({ auth: token });

  try {
    console.log("Fetching commits contents");
    const { data: commit } = await octokit.rest.repos.getCommit({
      owner,
      repo,
      ref: commitSha,
    });

    // Limit files processed to prevent rate limits & token overflow
    const filesToProcess = (commit.files || []).slice(0, 20); // Max 20 files

    const files = await Promise.all(
      filesToProcess.map(async (file) => {
        // Skip removed files
        if (file.status === "removed") return null;

        // Skip files we don't want to review (binary, configs, etc.)
        if (!shouldIncludeFile(file.filename)) return null;

        // Skip files that are too large (>100KB)
        if ((file.changes || 0) > 1000) {
          console.log(
            `⚠️ Skipping large file: ${file.filename} (${file.changes} changes)`,
          );
          return null;
        }

        try {
          // Fetch full file content at this commit
          const { data: fileData } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: file.filename,
            ref: commitSha,
          });

          // Ensure it's a file (not a directory) with content
          if (
            Array.isArray(fileData) ||
            fileData.type !== "file" ||
            !fileData.content
          ) {
            return null;
          }

          // Decode base64 content
          const content = Buffer.from(fileData.content, "base64").toString(
            "utf-8",
          );

          // Additional safety: skip if content is massive
          if (content.length > 50000) {
            // 50KB limit
            console.log(`⚠️ Skipping large content: ${file.filename}`);
            return {
              filename: file.filename,
              status: file.status,
              additions: file.additions || 0,
              deletions: file.deletions || 0,
              patch: file.patch || "",
              content: "// Content too large to include",
            };
          }

          return {
            filename: file.filename,
            status: file.status,
            additions: file.additions || 0,
            deletions: file.deletions || 0,
            patch: file.patch || "",
            content: content,
          };
        } catch (error) {
          // File might not exist at this ref or API error
          console.error(
            `❌ Failed to fetch content for ${file.filename}:`,
            error,
          );
          return {
            filename: file.filename,
            status: file.status,
            additions: file.additions || 0,
            deletions: file.deletions || 0,
            patch: file.patch || "",
            content: null, // Indicate failure but keep file in results
          };
        }
      }),
    );

    // Filter out null entries
    const validFiles = files.filter(
      (f): f is NonNullable<typeof f> => f !== null,
    );

    return {
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author?.name || "Unknown",
      date: commit.commit.author?.date,
      files: validFiles,
      // Real GitHub username (fallback to git name)
      authorName:
        commit.author?.login || commit.commit.author?.name || "Unknown",

      // Real GitHub avatar (fallback to null)
      authorAvatar:
        commit.author?.avatar_url || commit.committer?.avatar_url || null,
      stats: {
        totalFiles: validFiles.length,
        totalAdditions: validFiles.reduce((sum, f) => sum + f.additions, 0),
        totalDeletions: validFiles.reduce((sum, f) => sum + f.deletions, 0),
      },
    };
  } catch (error) {
    console.error(`❌ Failed to fetch commit ${commitSha}:`, error);
    throw new Error(`Failed to fetch commit details: ${error}`);
  }
}

// =================================
// HANDLE PUSH EVENT
// =================================
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { inngest } from "@/inngest/client";

export async function handlePushEvent(payload: any) {
  const { repository, commits, pusher, sender } = payload;
  console.log("Sender and pusher============================>", sender, pusher);
  const avatarUrl = sender.avatar_url;
  console.log("avatar_URL---------->", avatarUrl);
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  // 1. Get Repo & User
  console.log("Fetching repo data");
  const repoData = await convex.query(api.repos.getRepoByGithubId, {
    githubId: BigInt(repository.id) as any,
  });
  console.log("Repo data fetched:", repoData);

  if (!repoData) {
    console.log("Repository not found in database:", repository.full_name);
    return { message: "Repository not found", status: "skipped" };
  }

  const userData = await convex.query(api.users.getUser, {
    userId: repoData.userId,
  });

  if (!userData) {
    console.log("User not found for repo:", repoData.name);
    return { message: "User not found", status: "skipped" };
  }

  if (!userData.clerkUserId) {
    console.error("Clerk User ID not found for user:", userData.name);
    return { message: "Clerk User ID not found", status: "failed" };
  }

  const token = await getUserGithubToken(userData.clerkUserId);

  if (!token) {
    console.error("GitHub token not found for user:", userData.name);
    return { message: "GitHub token not found", status: "failed" };
  }
  console.log("Token found for user:", userData.name);

  // Process each commit
  const results = [];
  for (const commit of commits) {
    console.log(`Processing commit: ${commit.id}`);

    // 2. Fetch commit details (files & content)
    console.log("Fetching commits contents");
    const commitDetails = await getCommitDetails(
      token,
      repository.owner.name || repository.owner.login,
      repository.name,
      commit.id,
    );
    // console.log("Commit details fetched:", commitDetails);

    // 3. Create initial review record (pending)
    const reviewId = await convex.mutation(api.projects.createReview, {
      repoId: repoData._id,
      pushTitle: commit.message || "No title",
      pushUrl: commit.url,
      commitHash: commit.id,
      authorUserName: commit.author.name || pusher.name,
      authorAvatar: commit.author.avatar_url || avatarUrl,
      reviewType: "commit",
      reviewStatus: "pending",
    });
    console.log("Review created:", reviewId);

    // 4. Send Inngest Event to trigger AI review
    console.log("Sending Inngest event");
    await inngest.send({
      name: "commit/analyze",
      data: {
        reviewId,
        commitDetails,
        repoId: repoData._id,
      },
    });

    // Increment usage limit
    // await convex.mutation(api.users.incrementCommitCount, {
    //   userId: userData._id,
    // });

    results.push({ commit: commit.id, status: "queued" });
  }

  return { message: "Processed", results };
}

// =========================================================
//  GITHUB TREE VISUALIZER
// =========================================================

interface FolderRisk {
  path: string;
  name: string;
  filesChanged: number;
}

const SKIP_FOLDERS = new Set([
  // Node / JS
  "node_modules",
  ".next",
  ".nuxt",
  ".output",
  "dist",
  "build",
  "out",
  ".cache",
  ".turbo",
  ".vercel",
  ".parcel-cache",
  ".vite",
  ".expo",
  // Git
  ".git",
  ".github",
  // Logs & coverage
  "coverage",
  "logs",
  // Public static heavy assets
  "public/assets",
  "public/images",
  "public/fonts",
  "assets",
  "static",
  // IDE / Editor
  ".vscode",
  ".idea",
  // Python
  "__pycache__",
  ".pytest_cache",
  ".mypy_cache",
  ".venv",
  "venv",
  "env",
  // Java / Kotlin
  ".gradle",
  "target",
  "build",
  // PHP
  "vendor",
  // Ruby
  ".bundle",
  // Go
  "bin",
  "pkg",
  // Rust
  "target",
  // Swift / Xcode
  "DerivedData",
  ".build",
  // Docker
  ".docker",
  // Terraform
  ".terraform",
  // Misc
  "tmp",
  "temp",
]);

function shouldSkipFolder(folderPath: string): boolean {
  const parts = folderPath.split("/");
  return parts.some((part) => SKIP_FOLDERS.has(part));
}

export async function getFolderRiskHeatmap(
  token: string,
  owner: string,
  repo: string,
  branch: string = "main",
  commitLimit: number = 10,
): Promise<FolderRisk[]> {
  const octokit = new Octokit({ auth: token });
  const limit = pLimit(5);

  // 1️⃣ Get tree structure
  const { data: branchData } = await octokit.rest.repos.getBranch({
    owner,
    repo,
    branch,
  });

  const { data: treeData } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: branchData.commit.sha,
    recursive: "true",
  });

  // 2️⃣ Extract folders (with filtering)
  const folders = new Set<string>();

  treeData.tree.forEach((item) => {
    if (item.path?.includes("/")) {
      const pathParts = item.path.split("/");

      for (let i = 1; i <= pathParts.length - 1; i++) {
        const folderPath = pathParts.slice(0, i).join("/");

        if (!shouldSkipFolder(folderPath)) {
          folders.add(folderPath);
        }
      }
    }
  });

  console.log(
    `📊 Analyzing ${folders.size} folders (filtered from ${treeData.tree.length} items)`,
  );

  // 3️⃣ Get commits in parallel
  const { data: commits } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    sha: branch,
    per_page: commitLimit,
  });

  const folderChangeCount = new Map<string, Set<string>>();

  // 🚀 Batch commit fetching
  const commitBatches = [];
  for (let i = 0; i < commits.length; i += 10) {
    commitBatches.push(commits.slice(i, i + 10));
  }

  for (const batch of commitBatches) {
    await Promise.all(
      batch.map((commit) =>
        limit(async () => {
          try {
            const { data: commitDetail } = await octokit.rest.repos.getCommit({
              owner,
              repo,
              ref: commit.sha,
            });

            commitDetail.files?.forEach((file) => {
              const filePath = file.filename;

              if (shouldSkipFolder(filePath)) return;

              if (filePath.includes("/")) {
                const pathParts = filePath.split("/");

                for (let i = 1; i <= pathParts.length - 1; i++) {
                  const folderPath = pathParts.slice(0, i).join("/");

                  if (!shouldSkipFolder(folderPath)) {
                    if (!folderChangeCount.has(folderPath)) {
                      folderChangeCount.set(folderPath, new Set());
                    }
                    folderChangeCount.get(folderPath)!.add(filePath);
                  }
                }
              }
            });
          } catch (error) {
            console.error(
              `⚠️ Error fetching commit ${commit.sha.slice(0, 7)}:`,
              error,
            );
          }
        }),
      ),
    );
  }

  // 4️⃣ Build result array
  const folderRisks: FolderRisk[] = Array.from(folders)
    .map((folder) => {
      const filesChanged = folderChangeCount.get(folder)?.size || 0;

      return {
        path: folder,
        name: folder.split("/").pop() || folder,
        filesChanged,
      };
    })
    .filter((risk) => risk.filesChanged > 0)
    .sort((a, b) => b.filesChanged - a.filesChanged);

  console.log(`✅ Found ${folderRisks.length} folders with changes`);

  return folderRisks;
}

// ===================================================
// GET USER LANGUAGES FOR SKIILS
// ===================================================
export const getUserTopLanguages = async (
  username: string,
): Promise<string[]> => {
  console.log(`🔍 Fetching top languages for: ${username}`);

  const token = await getGithubAccessToken();
  const octokit = new Octokit({ auth: token });

  try {
    const { data: repos } = await octokit.rest.repos.listForUser({
      username,
      per_page: 30,
      sort: "pushed",
      direction: "desc",
      type: "owner",
    });

    console.log(`📦 Got ${repos.length} repos — counting languages...`);

    // count how many repos each language appears in
    const counts: Record<string, number> = {};
    for (const repo of repos) {
      if (!repo.language) continue;
      counts[repo.language] = (counts[repo.language] ?? 0) + 1;
    }

    console.log(`📊 Raw language counts:`, counts);

    const threshold = repos.length * 0.1; // 30 * 0.1 = 3 repos minimum
    const topLanguages = Object.entries(counts)
      .filter(([, count]) => count >= threshold)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([lang]) => lang);

    console.log(`✅ Top languages for ${username}:`, topLanguages);
    return topLanguages;
  } catch (error) {
    console.error(`❌ Error fetching languages for ${username}:`, error);
    return [];
  }
};

// ==================================================
// GET REPO FOLDER STRUCTURE
// =================================================
export const getRepoFolderStructure = async (
  owner: string,
  repo: string,
): Promise<string> => {
  console.log(`📁 Fetching folder structure for: ${owner}/${repo}`);

  const token = await getGithubAccessToken();
  const octokit = new Octokit({ auth: token });

  try {
    const { data } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: "HEAD",
      recursive: "true", // single call — gets everything flat
    });

    console.log(
      `🌳 Got ${data.tree.length} total items — filtering folders...`,
    );

    // only keep folders (blobs are files, trees are folders)
    const folders = data.tree
      .filter((item) => item.type === "tree")
      .map((item) => item.path!)
      .filter((path) => {
        const depth = path.split("/").length;
        return depth <= 3; // max 3 levels deep — enough signal, no noise
      });

    console.log(`📂 Found ${folders.length} folders (max depth 3)`);

    // build a readable tree string
    const tree = folders
      .map((path) => {
        const depth = path.split("/").length - 1;
        const name = path.split("/").pop()!;
        const indent = "  ".repeat(depth);
        return `${indent}📁 ${name}`;
      })
      .join("\n");

    console.log(`✅ Folder structure:\n${tree}`);
    return tree;
  } catch (error) {
    console.error(
      `❌ Error fetching folder structure for ${owner}/${repo}:`,
      error,
    );
    return "";
  }
};
