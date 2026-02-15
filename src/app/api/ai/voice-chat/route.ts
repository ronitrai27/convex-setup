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

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);


export type ChatMessage = UIMessage<never, UIDataTypes>;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: ChatMessage[] } =
      await req.json();
    console.log("Message recieved API/AGENT/CHAT: --------->", messages);

    const systemPrompt = `You are highly professional Agentic Assistant that helps user manage their project. Your messgae will be feeded to voice agents so u need to generate message accordingling naturally so make user feel he is talking to a real natutal voice agent in real time.`;

    const result = streamText({
      model: google("gemini-3-flash-preview"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
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
