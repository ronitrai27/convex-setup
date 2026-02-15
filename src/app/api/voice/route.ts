import {
  experimental_generateSpeech as generateSpeech,
  NoSpeechGeneratedError,
} from "ai"
import { openai } from "@ai-sdk/openai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    if (!text) {
      return NextResponse.json(
        { error: "Text is required for speech generation" },
        { status: 400 }
      )
    }

    const result = await generateSpeech({
      model: openai.speech("tts-1"),
      voice: "alloy",
      text: text,
    })

    return NextResponse.json({ audio: result.audio.base64 })
  } catch (error) {
    if (NoSpeechGeneratedError.isInstance(error)) {
      console.error("AI_NoSpeechGeneratedError")
      console.error("Cause:", error.cause)
      console.error("Responses:", error.responses)
      return NextResponse.json(
        { error: `TTS Error: ${error.message}` },
        { status: 500 }
      )
    }

    console.error("Error generating audio API:", error)
    return NextResponse.json(
      { error: "Failed to generate audio" },
      { status: 500 }
    )
  }
}