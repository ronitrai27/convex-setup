import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    console.log("Messages received at server (GEMINI):", messages);

    const result = streamText({
      model: openai("gpt-4.1-nano"),
      system:
        "You are a Senior Software Engineer and your help users with their any issues about their repository." +
        "You need to highlight heavy tasks, bold important points and make sure that the content is easily digestible and easy to understand. proper format and most important diagrams and architecture pattern.",
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({
      sendReasoning: true,
    });
  } catch (error) {
    console.error("Error:", error);
    return Response.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
