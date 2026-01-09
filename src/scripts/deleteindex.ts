// src/scripts/deleteindex.ts

import dotenv from "dotenv";

//  explicitly load env
dotenv.config({ path: ".env.local" });


console.log("PINECONE_API_KEY exists:", !!process.env.PINECONE_API_KEY);

async function main() {
  const { deleteRepoVectors } = await import("@/modules/Pinecone/rag");
  try {
    await deleteRepoVectors("ronitrai27/portfolio-website-rox");
    console.log("✅ Done deleting vectors");
  } catch (error: any) {
    console.error("❌ Error deleting vectors:");
    console.error(error);
    if (error instanceof Error) {
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
    }
  }
}

main();

// npx tsx src/scripts/deleteindex.ts