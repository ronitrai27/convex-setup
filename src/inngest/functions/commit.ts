import { inngest } from "@/inngest/client";
import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { z } from "zod";
import { sendEmail } from "@/lib/mail";

const ReviewSchema = z.object({
  summary: z.string().describe("2-3 sentence overview of changes"),
  walkthrough: z.array(
    z.object({
      filename: z.string(),
      changes: z
        .string()
        .describe("Brief explanation of what changed in concise manner."),
    }),
  ),
  sequenceDiagram: z
    .string()
    .describe(
      "Mermaid sequence diagram visualizing the flow of changes (if applicable).",
    )
    .optional(),
  criticalIssues: z
    .array(
      z.object({
        title: z.string(),
        file: z.string(),
        line: z.number().optional(),
        description: z.string(),
        fix: z.string(),
      }),
    )
    .optional()
    .describe(
      "List of critical issues found. Empty or undefined if no serious problems.",
    ),
});

export const handleCommitReview = inngest.createFunction(
  { id: "handle-commit-review" },
  { event: "commit/analyze" },
  async ({ event, step }) => {
    const { reviewId, commitDetails, repoId } = event.data;
    console.log("commit details: ", commitDetails);
    console.log("commit details author: ", commitDetails.author.name);
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Step 1: Generate AI Review
    const reviewContent = await step.run("generate-ai-review", async () => {
      const fileContext = commitDetails.files
        .map(
          (file: any) => `
## File: ${file.filename}
**Status**: ${file.status}
**Changes**: +${file.additions || 0} -${file.deletions || 0}

### Diff:
\`\`\`diff
${file.patch || "No patch available"}
\`\`\`

### Full Content (truncated):
\`\`\`
${file.content ? file.content.slice(0, 4000) : "Content unavailable or too large"}
\`\`\`
`,
        )
        .join("\n---\n");

      const { output } = await generateText({
        model: google("gemini-2.5-flash"),
        output: Output.object({
          schema: z.object({
            review: ReviewSchema,
          }),
        }),
        prompt: `You are an expert code reviewer. Analyze this commit and provide a concise review in MARKDOWN format.
**Commit Message**: ${commitDetails.message || "No message"}
${fileContext}

Provide:
1. **summary**: Brief 2-3 sentence overview of what changed and why
2. **walkthrough**: Array of file-by-file explanations with context (keep it short)
3. **sequenceDiagram**: A Mermaid sequence diagram showing the flow of changes (if applicable). Use simple syntax, avoid special characters in labels.
4. **criticalIssues** (optional)
   - Include ONLY if there are MAJOR or CRITICAL issues.
   - Maximum 1-2 issues.
   - Ignore minor suggestions, refactors, style, or optimizations.
   - Must have: title, file eg (src/app/folder/file), line (optional), description, and fix
   - Must be respond in markdown format
   -Be precise. Do not invent problems. Only flag issues with strong confidence`,
      });

      return output.review;
    });

    // Step 2: Update review in database and handle critical issues
    const issues = reviewContent.criticalIssues ?? [];
    const hasActualIssue = issues.length > 0;
    await step.run("update-review", async () => {

      // Format review as markdown
      let markdownReview = `## Summary\n${reviewContent.summary}\n\n`;

      // Add sequence diagram if present
      if (reviewContent.sequenceDiagram) {
        markdownReview += `## Sequence Diagram\n\`\`\`mermaid\n${reviewContent.sequenceDiagram}\n\`\`\`\n\n`;
      }

      markdownReview += `## Walkthrough\n`;
      reviewContent.walkthrough.forEach((w) => {
        markdownReview += `### ${w.filename}\n${w.changes}\n\n`;
      });

      // ---------------------------
      // Critical Issues Section
      // ---------------------------
      markdownReview += `## Critical Issues\n`;

      if (!hasActualIssue) {
        markdownReview += `None found.\n`;
      } else {
        issues.forEach((issue, index) => {
          markdownReview += `### ${index + 1}. ${issue.title}\n\n`;
          markdownReview += `- **File**: ${issue.file}\n`;
          if (issue.line) {
            markdownReview += `- **Line**: ${issue.line}\n`;
          }
          markdownReview += `- **Description**: ${issue.description}\n`;
          markdownReview += `- **Fix**: ${issue.fix}\n\n`;
        });
      }

      await convex.mutation(api.projects.updateReview, {
        reviewId,
        review: markdownReview,
        reviewStatus: "completed",
        ctiticalIssueFound: hasActualIssue,
      });

      // ---------------------------
      // Create DB Issues (1–2 max)
      // ---------------------------
      if (hasActualIssue) {
        const shortSha = commitDetails.sha.substring(0, 7);

        for (const issue of issues) {
          const issueMarkdown = `# ${issue.title}
        **File**: ${issue.file}
        ${issue.line ? `**Line**: ${issue.line}\n` : ""}
        ## Description
        ${issue.description}
        ## Fix
        ${issue.fix}`;

          await convex.mutation(api.projects.createIssue, {
            repoId: repoId,
            issueTitle: `Critical issue in ${shortSha}: ${issue.title}`,
            issueDescription: issueMarkdown,
            issueStatus: "pending",
            issueType: "by_agent",
            issueFiles: issue.file,
          });
        }
      }
    });

    // ---------------------------
    // Send Email Notification (if critical issues found)
    // ---------------------------
    await step.run("send-critical-issue-email", async () => {
      if (!hasActualIssue) return;

      const shortSha = commitDetails.sha.substring(0, 7);

      const issueList = issues
        .map(
          (issue, index) =>
            `${index + 1}. ${issue.title}\nFile: ${issue.file}${
              issue.line ? ` (Line ${issue.line})` : ""
            }\n`,
        )
        .join("\n");

      const emailBody = `
A critical issue was detected in commit ${shortSha}.

Repository: ${repoId}

Issues Found:
${issueList}

Please review immediately inside WeKraft dashboard.
 WeKraft AI
`;

      await sendEmail({
        to: "ronitrai1237@gmail.com",
        subject: `🚨 Critical Issue Detected in Commit ${shortSha}`,
        body: emailBody,
      });
    });

    return {
      success: true,
      reviewId,
    };
  },
);
