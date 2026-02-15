import { pineconeIndex } from "@/lib/pinecone";
import { embed } from "ai";
import { google } from "@ai-sdk/google";

interface FileItem {
  path: string;
  content: string;
}

type batch = {
  id: string;
  values: number[];
  metadata: {
    repoId: string;
    path: string;
    content: string;
  };
};

// ========== CONFIG ==========
const MAX_CHUNK_SIZE = 4000;
const EMBEDDING_CONCURRENCY = 10;
const UPSERT_BATCH_SIZE = 100;

// ========== SMART CHUNKING ==========
function smartChunk(file: FileItem): string[] {
  const { path, content } = file;

  // Small files - return as-is
  if (content.length <= MAX_CHUNK_SIZE) {
    return [`File: ${path}\n\n${content}`];
  }

  // Large files - chunk intelligently
  const chunks: string[] = [];
  const lines = content.split("\n");
  let currentChunk = `File: ${path}\n\n`;
  let isFirstChunk = true;

  for (const line of lines) {
    if (!isFirstChunk) {
      const trimmed = line.trim();
      if (
        trimmed.startsWith("import ") ||
        trimmed.startsWith("//") ||
        trimmed.startsWith("/*") ||
        trimmed.startsWith("*")
      ) {
        continue;
      }
    }

    if ((currentChunk + line).length > MAX_CHUNK_SIZE) {
      chunks.push(currentChunk.trim());
      currentChunk = `File: ${path} (part ${chunks.length + 1})\n\n${line}\n`;
      isFirstChunk = false;
    } else {
      currentChunk += line + "\n";
    }
  }

  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks.slice(0, 3);
}

// ========== PARALLEL EMBEDDING ==========
async function generateEmbeddingsBatch(
  texts: string[],
): Promise<(number[] | null)[]> {
  const results: (number[] | null)[] = [];

  // Process in batches of EMBEDDING_CONCURRENCY
  for (let i = 0; i < texts.length; i += EMBEDDING_CONCURRENCY) {
    const batch = texts.slice(i, i + EMBEDDING_CONCURRENCY);

    const batchResults = await Promise.all(
      batch.map(async (text) => {
        try {
          const { embedding } = await embed({
            model: google.embeddingModel("gemini-embedding-001"),
            value: text,
          });
          return embedding;
        } catch (error) {
          console.error("Embedding failed:", error);
          return null;
        }
      }),
    );

    results.push(...batchResults);

    // Progress log
    console.log(
      `Embedded ${Math.min(i + EMBEDDING_CONCURRENCY, texts.length)}/${texts.length}`,
    );
  }

  return results;
}

// ========== MAIN INDEXING ==========
export async function indexCodebase(
  repoId: string,
  files: FileItem[],
): Promise<void> {
  console.time("⏱️ Total indexing time");

  // 1. Smart chunk all files
  const allChunks: { chunk: string; path: string; index: number }[] = [];

  for (const file of files) {
    const chunks = smartChunk(file);
    chunks.forEach((chunk, i) => {
      allChunks.push({ chunk, path: file.path, index: i });
    });
  }

  console.log(
    `📦 Created ${allChunks.length} chunks from ${files.length} files`,
  );

  // Generate embeddings in parallel (KEY SPEEDUP )
  console.log("🚀 Generating embeddings in parallel...");
  const embeddings = await generateEmbeddingsBatch(
    allChunks.map((c) => c.chunk),
  );

  //  Prepare vectors (filter out failed embeddings)
  const vectors = allChunks
    .map((chunk, i) => {
      if (!embeddings[i]) return null;

      return {
        id: `${repoId}-${chunk.path.replace(/\//g, "_")}-${chunk.index}`,
        values: embeddings[i]!,
        metadata: {
          repoId,
          path: chunk.path,
          content: chunk.chunk,
        },
      };
    })
    .filter((v) => v !== null) as batch[];

  console.log(`✅ Generated ${vectors.length} vectors`);

  //  Batch upsert to Pinecone
  if (vectors.length > 0) {
    for (let i = 0; i < vectors.length; i += UPSERT_BATCH_SIZE) {
      const batch = vectors.slice(i, i + UPSERT_BATCH_SIZE);
      // @ts-ignore
      await pineconeIndex.upsert({ records: batch });
      console.log(
        `📤 Upserted batch ${Math.floor(i / UPSERT_BATCH_SIZE) + 1}/${Math.ceil(vectors.length / UPSERT_BATCH_SIZE)}`,
      );
    }
  }

  console.timeEnd("⏱️ Total indexing time");
}

//=========== Generating simple text embedding.===========
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: google.embeddingModel("gemini-embedding-001"),
    value: text,
  });

  return embedding;
}

//=========== Retrieving context from Pinecone.===========
export async function retrieveContext(query: string, topK: number = 5) {
  const embeddings = await generateEmbedding(query);

  const result = await pineconeIndex.query({
    vector: embeddings,
    topK,
    includeMetadata: true,
  });

  console.log("Results found while retrieving context:", result);

  return result.matches
    .map((match) => match.metadata?.content as string)
    .filter(Boolean);
}
// ==========================================
// DELETEING THE REPOS VECTORS BY REPO NAME
// ==========================================
export async function deleteRepoVectors(repoId: string) {
  console.log(`Deleting all vectors for repo: ${repoId}`);
  // repoID here is fullname like ronitrai27/repo name
  
  try {
    let allVectorIds: string[] = [];
    let paginationToken: string | undefined = undefined;
    
    // Paginate through all results
    do {
      const listResponse = await pineconeIndex.listPaginated({ 
        prefix: `${repoId}-`,
        paginationToken
      });
      
      const vectorIds = listResponse.vectors?.map(v => v.id) || [];
      allVectorIds.push(...vectorIds as any);
      
      paginationToken = listResponse.pagination?.next;
      
      console.log(`Found ${vectorIds.length} vectors (total so far: ${allVectorIds.length})`);
    } while (paginationToken);
    
    if (allVectorIds.length > 0) {
      // Delete in batches
      const batchSize = 1000;
      for (let i = 0; i < allVectorIds.length; i += batchSize) {
        const batch = allVectorIds.slice(i, i + batchSize);
        await pineconeIndex.deleteMany(batch);
        console.log(`Deleted batch of ${batch.length} vectors`);
      }
    }
    
    console.log(`✅ Deleted ${allVectorIds.length} vectors for repo: ${repoId}`);
  } catch (error) {
    console.error(`Failed to delete vectors for repo ${repoId}:`, error);
    throw error;
  }
}