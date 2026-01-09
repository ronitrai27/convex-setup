
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

// Define the structured output schema
const ProjectAnalysisSchema = z.object({
  suggestedTags: z.array(z.string()).min(4).max(5).describe("4-5 most relevant tags for the project"),
  enhancedDescription: z.string().describe("An improved, engaging description of the project"),
  projectHealth: z.object({
    score: z.number().min(0).max(100).describe("Overall project health score (0-100)"),
    summary: z.string().describe("Summary of project health and completeness"),
  }),
  discoverability: z.object({
    score: z.number().min(0).max(100).describe("How easily discoverable this project is (0-100)"),
    insights: z.array(z.string()).describe("Specific insights about discoverability"),
    improvements: z.array(z.string()).describe("Suggestions to improve discoverability"),
  }),
});

type ProjectAnalysis = z.infer<typeof ProjectAnalysisSchema>;