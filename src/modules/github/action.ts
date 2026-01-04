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
  console.log("accessToken", accessToken);
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
  console.log("token", token);
  console.log("username", username);
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

    // console.log("response from graphQL query--", response);
    // console.log("response.user.contributionsCollection.contributionCalendar", response.user.contributionsCollection.contributionCalendar);
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
      const subFiles = await getRepoFileContents(owner, repo, accessToken, item.path);

      files = files.concat(subFiles);
    }
  }

  return files;
}
