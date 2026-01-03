import { pineconeIndex } from "@/lib/pinecone";
import { embed } from "ai";
import { google } from "@ai-sdk/google";

/**
 * Represents a single file from the repository
 * that will be indexed into Pinecone
 */
interface FileItem {
  path: string;     // File path (e.g. src/app/page.tsx)
  content: string;  // Full file content as string
}

/**
 * Generates a vector embedding for a given text
 * - Uses Google text-embedding-004 model
 * - Output is a numerical vector used for semantic search
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: google.textEmbeddingModel("text-embedding-004"),
    value: text, // Text to convert into vector representation
  });

  return embedding;
}

/**
 * Indexes a repository codebase into Pinecone
 * - Each file is converted into an embedding
 * - Embeddings are stored with metadata for later retrieval
 */
export async function indexCodebase(
  repoId: string,
  files: FileItem[]
): Promise<void> {
  const vectors = [];

  // Loop through every file in the repository
  for (const file of files) {
    // Include file path with content for better context
    const content = `File ${file.path}:\n\n${file.content}`;

    // Limit text size to avoid embedding token limits
    const truncatedContent = content.substring(0, 8000);

    try {
      // Generate embedding for the file content
      const embedding = await generateEmbedding(truncatedContent);

      // Prepare vector object for Pinecone
      vectors.push({
        // Unique vector ID (per repo + file)
        id: `${repoId}-${file.path.replace(/\//g, "_")}`,

        // Numerical embedding values
        values: embedding,

        // Metadata stored alongside the vector
        metadata: {
          repoId,                 // Repository identifier
          path: file.path,        // Original file path
          content: truncatedContent, // Used later as AI context
        },
      });
    } catch (error) {
      // Skip file if embedding generation fails
      console.error(`Failed to generate embedding for ${file.path}:`, error);
    }
  }

  // Upload vectors to Pinecone in batches for efficiency
  if (vectors.length > 0) {
    const batchSize = 100;

    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);

      console.log(`Indexing ${batch.length} vectors...`);

      // Store vectors in Pinecone index
      await pineconeIndex.upsert(batch);
    }
  }
}

/**
 * Retrieves relevant code context for a user query
 * - Converts query into an embedding
 * - Finds closest matching files from Pinecone
 */
export async function retrieveContext(
  query: string,
  repoId: string,
  topK: number = 5
) {
  // Generate embedding for the search query
  const embedding = await generateEmbedding(query);

  // Perform semantic similarity search in Pinecone
  const result = await pineconeIndex.query({
    vector: embedding,
    topK,
    includeMetadata: true,
  });

  // Return only the stored file content as context
  return result.matches
    .map((match) => match.metadata?.content as string)
    .filter(Boolean);
}

// ==========================================
// DELETEING THE REPOS VECTORS BY REPO ID
// ==========================================
export async function deleteRepoVectors(repoId: string) {
  console.log(`Deleting all vectors for repo: ${repoId}`);
  
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