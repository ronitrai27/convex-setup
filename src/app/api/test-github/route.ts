
import { getProjectHealthData, getProjectLanguages } from "@/modules/github/action";
import { NextResponse } from "next/server";

export async function GET() {
//   try {
//     console.log("🚀 Testing metrics for ronitrai27/Line-Queue-PR-Agent");

//     // Test health data
//     const healthData = await getProjectHealthData(
//       "ronitrai27",
//       "Line-Queue-PR-Agent"
//     );

//     // Test languages
//     const languages = await getProjectLanguages(
//       "ronitrai27",
//       "Line-Queue-PR-Agent"
//     );

//     return NextResponse.json({
//       success: true,
//       healthData,
//       languages,
//     });
//   } catch (error: any) {
//     console.error("❌ Test failed:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: error.message,
//       },
//       { status: 500 }
//     );
//   }
}