import { NextRequest, NextResponse } from "next/server";
import {
  generateSessionId,
  ermodelToReactFlow,
  applyDagreLayout,
  validateERModel,
} from "@/modules/my-project/ErHelper";
import { parseSchemaWithGemini } from "@/lib/Gemini";

export const maxDuration = 180;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { schemaContent } = body;

    if (!schemaContent || typeof schemaContent !== "string") {
      return NextResponse.json(
        { success: false, error: "Schema content is required" },
        { status: 400 }
      );
    }

    if (schemaContent.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Schema content cannot be empty" },
        { status: 400 }
      );
    }

    // 2. PARSE SCHEMA WITH GEMINI
    console.log("Parsing schema with Gemini...");
    let ermodel;
    try {
      ermodel = await parseSchemaWithGemini(schemaContent);
    } catch (error: unknown) {
      console.error("Gemini parsing failed:", error);
      return NextResponse.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to parse schema. Please check the format and try again.",
        },
        { status: 500 }
      );
    }

    // 3. VALIDATE ERMODEL
    const validation = validateERModel(ermodel);
    if (!validation.valid) {
      console.error("ERModel validation failed:", validation.errors);
      return NextResponse.json(
        {
          success: false,
          error: `Schema validation failed: ${validation.errors.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Log warnings (non-blocking)
    if (validation.warnings.length > 0) {
      console.warn("ERModel validation warnings:", validation.warnings);
    }

    // 4. GENERATE SESSION ID
    const sessionId = generateSessionId();
    console.log(`Session created: ${sessionId}`);

    // 5. CONVERT TO REACT FLOW FORMAT
    const { nodes, edges } = ermodelToReactFlow(ermodel);

    // 6. APPLY LAYOUT ALGORITHM
    const { nodes: layoutedNodes, edges: layoutedEdges } = applyDagreLayout(
      nodes,
      edges,
      "LR" // Left-to-Right layout
    );

    // 7. RETURN SUCCESS RESPONSE
    return NextResponse.json({
      success: true,
      sessionId,
      ermodel,
      nodes: layoutedNodes,
      edges: layoutedEdges,
    });
  } catch (error: unknown) {
    // 8. GLOBAL ERROR HANDLER
    console.error("Upload route error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}