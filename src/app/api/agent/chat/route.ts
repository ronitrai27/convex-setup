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
import { sendEmail } from "@/lib/mail";
import { google } from "@ai-sdk/google";
import { getArcadeTools } from "@/lib/ArcadeTools";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    const {
      messages,
      repoId,
      projectId,
    }: { messages: any[]; repoId: string; projectId: string } =
      await req.json();


    console.log("Repo ID recieved----------------->", repoId);
    console.log("Project ID recieved----------------->", projectId);

    const localTools = {
      getIssues: tool({
        description:
          "Get number of issues for the current repository connected.",
        parameters: z.object({
          repoId: z
            .string()
            .optional()
            .describe("The repository ID (optional, defaults to current)"),
          limit: z.number().optional(),
        }),
        // @ts-ignore
        execute: async ({
          repoId: id,
          limit,
        }: {
          repoId?: Id<"repositories">;
          limit?: number;
        }) => {
          const targetRepoId = id || (repoId as Id<"repositories">);
          console.log(
            "----------Called issues tool----------",
            targetRepoId,
            limit,
          );
          const allIssues = await convex.query(api.repos.getIssueTool, {
            repoId: targetRepoId,
            limit,
          });

          return { issues: allIssues };
        },
      }),
      sendEmail: tool({
        description: "Send an email to the user with the given subject and body.",
        // @ts-ignore
        inputSchema: z.object({
          to: z.string().describe("The recipient's email address"),
          subject: z.string().describe("The email subject"),
          body: z.string().describe("The email body"),
        }),
        // @ts-ignore
        execute: async ({
          to,
          subject,
          body,
        }: {
          to: string;
          subject: string;
          body: string;
        }) => {
          console.log(
            "----------Called sendEmail tool----------",
            to,
            subject,
            body,
          );
          const result = await sendEmail({ to, subject, body });
          return result;
        },
      }),
      projectDetails: tool({
        description: "Get the details about the project.",
        parameters: z.object({
          projectId: z
            .string()
            .optional()
            .describe("The project ID (optional, defaults to current)"),
        }),
        // @ts-ignore
        execute: async ({ projectId: id }: { projectId?: Id<"projects"> }) => {
          try {
            const targetProjectId = id || (projectId as Id<"projects">);
            console.log("projectId: ====> ", targetProjectId);
            const project = await convex.query(
              api.projects.getProject_detailTool,
              {
                projectId: targetProjectId,
              },
            );
            return { project };
          } catch (error) {
            console.log("Error in fetching project details: ====> ", error);
            return { project: null };
          }
        },
      }),
    } satisfies ToolSet;

    const project = await convex.query(api.projects.getProjectById, {
      projectId: projectId as Id<"projects">,
    });

    if (!project) {
      console.log("PROJECT DETAILS NOT FOUND");
    }

    const projectName = project?.projectName;
    const userId = process.env.ARCADE_USER_ID || "default-user";
    const mcpTools = await getArcadeTools(userId);
    const allTools = { ...localTools, ...mcpTools };

    const systemPrompt = `You are highly professional Agentic Assistant that helps users in their Quiries related to their repositories.
    
    Project Name: ${projectName}
    projectId: ${projectId}
    repoId: ${repoId}

You can:
- Get issues for the current repository connected (Number of issues or recent issues).
- Get project details using projectId.
- Send an email to the user with the given subject and body.
- Use Arcade MCP tools to read/write in Google Docs.

When the user asks about anyhting realted to tech or any problem related to their project or repo , help them.
Important: 
- behave super intelligent agentic Assistant
- call Tools you think is Important
- be professional and act like a Project Manager.`;

    const result = streamText({
      model: google("gemini-3-flash-preview"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools: allTools,
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
