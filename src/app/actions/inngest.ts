"use server";

import { inngest } from "@/inngest/client";
import { auth } from "@clerk/nextjs/server";

export async function triggerRepoIndexing(owner: string, repo: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  await inngest.send({
    name: "repository-connected",
    data: {
      owner,
      repo,
      userId,
    },
  });

  return { success: true };
}
