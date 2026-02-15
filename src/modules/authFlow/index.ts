"use server";
import { inngest } from "@/inngest/client";
import { auth } from "@clerk/nextjs/server";
import {
  getUserGithubToken,
} from "@/modules/github/action";
// import { ConvexHttpClient } from "convex/browser";
// import { api } from "../../../convex/_generated/api";

export const ConnectRepo = async (details: {
  owner: string;
  repo: string;
}) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Trigger Inngest indexing in background
  console.log("Triggering Inngest indexing...");
  await inngest.send({
    name: "repository-connected",
    data: {
      owner: details.owner,
      repo: details.repo,
      userId,
    },
  });

  return {
    success: true,
  };
};
