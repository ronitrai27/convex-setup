import { ConvexHttpClient } from "convex/browser";
import { convertToModelMessages, stepCountIs, streamText, tool } from "ai";
import {
  type InferUITools,
  type ToolSet,
  type UIDataTypes,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { google } from "@ai-sdk/google";
import { getReadme, getRepoFolderStructure } from "@/modules/github/action";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export type ChatMessage = UIMessage<never, UIDataTypes>;

export async function POST(req: Request) {
  try {
    console.log("Project Agent Route Hit");
    const {
      messages,
      projectId,
    }: { messages: ChatMessage[]; projectId: string } = await req.json();
    console.log("PROJECT ID AT ROUTE:", projectId);
    console.log("MESSAGES AT ROUTE:", messages);

    // Resolve repoId and projectName server-side from the project
    const project = await convex.query(api.projects.getProjectById, {
      projectId: projectId as Id<"projects">,
    });

    if (!project) {
      console.log("PROJECT DETAILS NOT FOUND");
    }

    const repoId = project?.repositoryId;
    const projectName = project?.projectName;

    const LocalTools = {
      updateProjectDetails: tool({
        description:
          "Update project timeline, features list, and status in the database.",
        parameters: z.object({
          projectTimeline: z
            .string()
            .describe("The estimated timeline for the project"),
          projectFeaturesList: z.any().describe("Array of features proposed"),
          projectOverview: z
            .string()
            .describe("Brief overview of the project plan"),
        }),
        // @ts-ignore
        execute: async ({
          projectTimeline,
          projectOverview,
          projectFeaturesList,
        }: {
          projectTimeline: string;
          projectOverview: string;
          projectFeaturesList: any;
        }) => {
          if (!project) return { success: false, error: "Project not found" };
          if (projectTimeline || projectOverview || projectFeaturesList) {
            await convex.mutation(api.projects.updateProjectDetails, {
              projectId: projectId as Id<"projects">,
              repoId: repoId,
              projectTimeline,
              projectOverview,
              projectFeaturesList,
            });
            return { success: true };
          }
          return {
            success: false,
            error: "No data provided, please provide data",
          };
        },
      }),

      getTeamSkills: tool({
        description:
          "Get the skills of all team members associated with this project.",
        parameters: z.object({}),
        // @ts-ignore
        execute: async (_args) => {
          console.log("Fetching team skills for project:", projectId);
          try {
            const skills = await convex.query(
              api.projects.getProjectTeamSkills,
              {
                projectId: projectId as Id<"projects">,
              },
            );
            console.log("✅ Team skills fetched:", skills);
            return { success: true, teamSkills: skills };
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            console.error("❌ Failed to fetch team skills:", message);
            return { success: false, error: message };
          }
        },
      }),

      getRepoStructure: tool({
        description:
          "Get the repository folder structure and README content to understand the project.",
        parameters: z.object({}),
        // @ts-ignore
        execute: async (_args) => {
          try {
            if (!repoId) return { success: false, error: "No repository connected" };
            console.log("📁 Fetching repo structure for:", repoId);

            const repo = await convex.query(api.repos.getRepoById, {
              repoId: repoId,
            });

            if (!repo)
              return {
                success: false,
                error: `Repository not found for id: ${repoId}`,
              };

            const [structure, readme] = await Promise.all([
              getRepoFolderStructure(repo.owner, repo.name),
              getReadme(repo.owner, repo.name),
            ]);

            return {
              success: true,
              folderStructure: structure,
              readme: readme ? readme.slice(0, 1500) : "No README found",
            };
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            console.error("❌ getRepoStructure failed:", message);
            return { success: false, error: message };
          }
        },
      }),

      projectDetails: tool({
        description: "Get the existing project details (overview, timeline, features).",
        parameters: z.object({}),
        // @ts-ignore
        execute: async () => {
          try {
            console.log("Fetching current project details for:", projectId);
            const details = await convex.query(
              api.projects.getProject_detailTool,
              {
                projectId: projectId as Id<"projects">,
              },
            );
            return { success: true, details };
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            console.error("❌ Failed to fetch project details:", message);
            return { success: false, error: message };
          }
        },
      }),
    } satisfies ToolSet;

    const systemPrompt = `You are a professional onboarding AI agent helping users plan their project. Talk like a concise project manager.

## CONTEXT:
- Project ID: ${projectId}
- Repo ID: ${repoId}
- project Name: ${projectName}

## TASKS:
Task 1: Welcome user and ask for their project details and timeline.
Task 2: Use tools to fetch repo structure. Ask user what additional features they want.
Task 3: Fetch team member skills. Ask if they want features matched to team skills.
Task 4: Generate structured project features in proper markdown format.
Task 5: On confirmation, update database. with  projectTimeline, projectOverview, projectFeaturesList,

## RULES:
- Never call updateProject tool before user confirms features
- If user says regenerate, redo Task 4 with a fresh features list.
- Keep messages short — you are a PM, not an essay writer, Act like a senior dev and talk naturally like humans.
- if any tool failed or error try again.
- projectOverview should be well written description of the project.
- projectFeaturesList should be well written list of features.
- never ask all details at once to users. Always ask one detail at a time.
- Talk with energy and confidence.`;

    const result = streamText({
      model: google("gemini-3-flash-preview"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools: LocalTools,
      toolChoice: "auto",
      stopWhen: stepCountIs(3),
    });

    return result.toUIMessageStreamResponse({
      sendReasoning: true,
      sendSources: true,
    });
  } catch (error) {
    console.error("Error in chat route:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
