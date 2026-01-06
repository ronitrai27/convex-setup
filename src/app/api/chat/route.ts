import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";
import { validateERModel, generateSessionId } from "@/modules/my-project/ErHelper";
import { NextResponse } from "next/server";
import { parseSchemaWithGemini } from "@/lib/Gemini";

export const maxDuration = 30;

// =============================================
// Helper to detect if message contains a schema
// =============================================
function detectSchema(content: string): boolean {
  const schemaKeywords = [
    "model ",
    "table ",
    "CREATE TABLE",
    "@relation",
    "@id",
    "@default",
    "interface ",
    "type ",
    "schema ",
    "entity ",
    "field:",
    "fields:",
    "PRIMARY KEY",
    "FOREIGN KEY",
    "REFERENCES",
  ];

  const lowerContent = content.toLowerCase();
  return (
    schemaKeywords.some((keyword) =>
      lowerContent.includes(keyword.toLowerCase())
    ) && content.length > 100
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, schemaContext } = body;
    let sessionId = body.sessionId || req.headers.get("x-session-id");

    console.log("Chat API received:", {
      messagesCount: messages?.length,
      sessionId,
      hasSchema: !!schemaContext,
    });

    // =====================================================
    // Get schema context from body (more reliable than headers for large data)
    // =====================================================
    let schemaInfo = "";
    if (schemaContext) {
      try {
        const schemaData = schemaContext;

        // Format COMPLETE schema details for AI with all fields and relations
        const schemaDetails = schemaData.tables
          .map((table: any) => {
            // Format Fields
            const fields = table.fields
              .map((f: any) => {
                let fieldDesc = `    - ${f.name}: ${f.type}`;
                if (f.isPrimary) fieldDesc += " (PK)";
                if (f.isForeign && f.foreignTable)
                  fieldDesc += ` (FK -> ${f.foreignTable})`;
                if (f.isRequired) fieldDesc += " (NOT NULL)";
                if (f.isUnique) fieldDesc += " (UNIQUE)";
                if (f.defaultValue)
                  fieldDesc += ` (DEFAULT: ${f.defaultValue})`;
                return fieldDesc;
              })
              .join("\n");

            // Format Relations
            const relations =
              table.relations && table.relations.length > 0
                ? "\n    Relationships:\n" +
                  table.relations
                    .map(
                      (r: any) =>
                        `    - ${r.type} to ${r.to} (via ${
                          r.fromField || "id"
                        } -> ${r.toField || "id"})`
                    )
                    .join("\n")
                : "";
            return `\n  **${table.name}**\n${fields}${relations}`;
          })
          .join("\n\n");

        schemaInfo = `\n\n=== UPLOADED SCHEMA CONTEXT ===\n${schemaDetails}\n\n`;
      } catch (e) {
        console.error("Failed to parse schema context:", e);
      }
    }

    // =====================================================
    const lastMessage = messages[messages.length - 1];
    const lastMessageText =
      lastMessage?.parts?.[0]?.text || lastMessage?.content || "";
    const isSchemaMessage = detectSchema(lastMessageText);

    // SCHEMA PARSING + CHAT RESPONSE

    if (isSchemaMessage) {
      try {
        console.log("Schema detected, parsing...");

        // Generate sessionId if not provided
        if (!sessionId) {
          sessionId = generateSessionId();
          console.log("Generated new sessionId:", sessionId);
        }

        // Parse schema
        console.log("LAST MESSAGE TEXT", lastMessageText);
        const ermodel = await parseSchemaWithGemini(lastMessageText);

        // Validate
        const validation = validateERModel(ermodel);
        if (!validation.valid) {
          return NextResponse.json(
            {
              error: `Schema validation failed: ${validation.errors.join(
                ", "
              )}`,
              type: "error",
            },
            { status: 400 }
          );
        }

        if (validation.warnings.length > 0) {
          console.warn("Schema warnings:", validation.warnings);
        }

        // Generate AI response about the schema
        const aiResponse = `I've successfully parsed your schema! I found ${
          ermodel.entities.length
        } tables:\n\n${ermodel.entities
          .map(
            (e:any) =>
              `• **${e.name}** (${e.fields.length} fields, ${e.relations.length} relations)`
          )
          .join(
            "\n"
          )}\n\nThe ER diagram has been generated. What would you like to know about your schema?`;

        // Return both schema and response
        return NextResponse.json({
          type: "schema_parsed",
          sessionId,
          schema: ermodel,
          message: aiResponse,
          role: "assistant",
        });
      } catch (error) {
        console.error("Schema parsing error:", error);
        return NextResponse.json(
          {
            error: `Failed to parse schema: ${
              error instanceof Error ? error.message : String(error)
            }`,
            type: "error",
          },
          { status: 500 }
        );
      }
    }

    console.log("Regular chat request, sessionId:", sessionId);

    // Generate sessionId if not provided
    if (!sessionId) {
      sessionId = generateSessionId();
      console.log("Generated new sessionId for chat:", sessionId);
    }


    // Provide clarity if no schema is present
    const schemaInstructions = schemaInfo
      ? schemaInfo
      : "\n\n**STATUS: NO SCHEMA UPLOADED YET.**\nThe user has NOT provided a database schema yet, You can tell him to upload the schema first.";

    const systemPrompt = `You are a specialized Database Schema Assistant for session ${sessionId}.
${schemaInstructions}
${schemaInfo}
1. **GREETINGS**: If the user says "Hi", "Hello", "Hii", or similar greetings, you can reply: "Please upload your schema , I'll help to Convert your Schema into Visual Representation"
2. **SCOPE CONTROL**: 
   - **Priority 1**: Answer questions based on the uploaded schema (if available) in concise way possible.
   - **Priority 2**: You MAY answer general questions about databases, SQL, modeling, or optimization usage even if no schema is present.
   - **Refusal**: Only refuse requests completely unrelated.
3. **COMPLETE DETAILS**: If a schema IS present, you can provide details about it , in concise way possible
4. **RELATIONSHIPS**: you can also actively explain how tables are connected.
5. **NO SUMMARIES**: If the user asks for "Summary" or "Overview", provide short summaries only.
`;

    const result = streamText({
      model: openai("gpt-4.1-mini"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
