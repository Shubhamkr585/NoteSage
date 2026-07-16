import { getGeminiEmbeddings } from "./embeddings";
import { db } from "@/lib/db";
import { retryWithBackoff } from "@/lib/retry";

if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
  console.warn("[VectorStore] Missing Gemini API key for embeddings.");
}

const embeddings = getGeminiEmbeddings("RETRIEVAL_DOCUMENT");

export async function storeChunksInVectorDb(documentId: string, chunks: any[]) {
  const count = chunks.length;
  console.log(`[VectorStore] Starting sequential embedding generation for ${count} chunks...`);

  const insertPromises: any[] = [];
  let successfulEmbeddings = 0;
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const content = chunk.pageContent as string;
    const pageNumber: number = chunk.metadata?.loc?.pageNumber ?? 1;

    try {
      // Embed sequentially to avoid Gemini batch token limits causing silent empty arrays
      const vectors = await retryWithBackoff(() => embeddings.embedDocuments([content]));
      const vector = vectors[0];
      
      if (!vector || vector.length === 0) {
        console.warn(`[VectorStore] Skipping chunk ${i} due to empty embedding response from API.`);
        continue;
      }

      const vectorString = `[${vector.join(",")}]`;

      insertPromises.push(db.$executeRawUnsafe(
        `INSERT INTO "DocumentChunk" (id, "documentId", content, "pageNumber", embedding)
         VALUES (gen_random_uuid(), $1, $2, $3, $4::vector)`,
        documentId,
        content,
        pageNumber,
        vectorString
      ));
      successfulEmbeddings++;
    } catch (e) {
      console.warn(`[VectorStore] Failed to embed chunk ${i}:`, e);
    }
  }

  if (insertPromises.length === 0) {
    throw new Error("Zero chunks were successfully embedded. The Gemini API likely blocked the content or failed.");
  }

  console.log(`[VectorStore] Starting transactional storage of ${successfulEmbeddings} chunks to pgvector...`);
  await retryWithBackoff(() => db.$transaction(insertPromises, { timeout: 30000 }));
  console.log(`[VectorStore] Successfully stored ${successfulEmbeddings} chunks in pgvector database.`);
}
