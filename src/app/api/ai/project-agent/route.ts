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
    console.log("Project Agent Route Hit")
    const { messages, projectId}: { messages: ChatMessage[]; projectId: string } = await req.json();

    // Resolve repoId and projectName server-side from the project
    const project = await convex.query(api.projects.getProjectById, {
      projectId: projectId as Id<"projects">,
    });

    // if (!project) {
    //   return new Response("Project not found", { status: 404 });
    // }

    // const repoId = project.repositoryId;
    // const projectName = project.projectName;

    // console.log("✅ REPO ID AT ROUTE:", repoId);
    // console.log("✅ PROJECT ID AT ROUTE:", projectId);
    // console.log("✅ PROJECT NAME AT ROUTE:", projectName);

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
        execute: async (args) => {
          console.log("Updating project details:", args);
          await convex.mutation(api.projects.updateProjectDetails, {
            projectId: projectId as Id<"projects">,
            repoId: "j97bs9tx86hcq60e5yr5h0paz981bnpa" as Id<"repositories">,
            ...args,
          });
          return { success: true };
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
            console.log("📁 Fetching repo structure for:", "j97bs9tx86hcq60e5yr5h0paz981bnpa");

            const repo = await convex.query(api.repos.getRepoById, {
              repoId: "j97bs9tx86hcq60e5yr5h0paz981bnpa" as Id<"repositories">,
            });

            if (!repo)
              return {
                success: false,
                error: `Repository not found for id: ${"j97bs9tx86hcq60e5yr5h0paz981bnpa"}`,
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
    } satisfies ToolSet;

    const systemPrompt = `You are a professional onboarding AI agent helping users plan their project. Talk like a concise project manager.

## CONTEXT:
- Project ID: ${projectId}
- Repo ID: j97bs9tx86hcq60e5yr5h0paz981bnpa

## YOUR RESPONSE FORMAT RULES:
- Important to include exact Tag  <action type="confirm" /> for confirmation from user.
- When you need user input, add <action> tags specifying what you need
- otherwise rest all in markdown formats.

## TASKS:
Task 1: Welcome user and ask for project timeline.
Task 2: Use tools to fetch repo structure. Ask user what additional features they want.
Task 3: Fetch team member skills. Ask if they want features matched to team skills.
Task 4: Generate structured project features. MUST use <features> format and wait for confirmation <action>.
Task 5: On confirmation, update database using tools. Respond with <complete>.

## RESPONSE FORMATS:

### Proposing features (Task 4):

  Based on your repo and team skills, here's your project plan:
    [
      { "id": "1", "title": "Feature title", "description": "What it does and why"},
      { "id": "2", "title": "Feature title", "description": "What it does and why"}
    ]
  <action type="confirm" />

## RULES:
- Never call updateProject tool before user confirms features
- If user says regenerate, redo Task 4 with a fresh <features> block
- Keep messages short — you are a PM, not an essay writer
- if any tool failed or error try again.`;

    const result = streamText({
      model: google("gemini-3-flash-preview"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools: LocalTools,
      toolChoice: "auto",
      stopWhen: stepCountIs(5),
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
