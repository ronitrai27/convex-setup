import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, description } = body;
    console.log(
      "POST /api/vision-prompt - Image size:",
      image?.length,
      "Description length:",
      description?.length,
    );

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    // Extract base64 data and convert to Uint8Array for the AI SDK
    const base64Data = image.includes("base64,")
      ? image.split("base64,")[1]
      : image;

    const binaryData = Buffer.from(base64Data, "base64");
    const uint8Array = new Uint8Array(binaryData);

    const systemPrompt = `
You are a senior prompt engineer.
Generate a clear, concise AI prompt that describes the UI from the sketch image so another AI can build production-ready code.

Rules:
- Cross-marked squares/rectangles = image placeholders.
- Ignore thick borders, guide lines, or sketch-only decorations.
- Focus on layout, hierarchy, components, and user sketch (what he wants to make actually)
- Be structured, specific, and concise.
- Output ONLY the final prompt text.

User context: ${description || "None"}
`;

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        prompt: z.string(),
      }),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: systemPrompt },
            { type: "image", image: uint8Array },
          ],
        },
      ],
    });

    console.log("Generated prompt:", object.prompt);
    return NextResponse.json(object);
  } catch (error: any) {
    console.error("Error generating vision prompt:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate prompt" },
      { status: 500 },
    );
  }
}
