import { getGeminiEmbeddings } from "./embeddings";
import { db } from "@/lib/db";
import { retryWithBackoff } from "@/lib/retry";

if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
  console.warn("[VectorStore] Missing Gemini API key for embeddings.");
}

const embeddings = getGeminiEmbeddings("RETRIEVAL_DOCUMENT");

export async function storeChunksInVectorDb(documentId: string, chunks: any[]) {
  const count = chunks.length;
  console.log(`[VectorStore] Starting embedding generation for ${count} chunks...`);

  const contents = chunks.map((chunk) => chunk.pageContent as string);
  const vectors = await retryWithBackoff(() => embeddings.embedDocuments(contents));

  console.log(`[VectorStore] Embedding generation completed for ${count} chunks.`);
  console.log(`[VectorStore] Starting transactional storage of ${count} chunks to pgvector...`);

  const insertPromises: any[] = [];
  
  chunks.forEach((chunk, index) => {
    const vector = vectors[index];
    if (!vector || vector.length === 0) {
      console.warn(`[VectorStore] Skipping chunk ${index} due to empty embedding.`);
      return;
    }

    const content = chunk.pageContent as string;
    const pageNumber: number = chunk.metadata?.loc?.pageNumber ?? 1;
    const vectorString = `[${vector.join(",")}]`;

    insertPromises.push(db.$executeRawUnsafe(
      `INSERT INTO "DocumentChunk" (id, "documentId", content, "pageNumber", embedding)
       VALUES (gen_random_uuid(), $1, $2, $3, $4::vector)`,
      documentId,
      content,
      pageNumber,
      vectorString
    ));
  });

  await retryWithBackoff(() => db.$transaction(insertPromises, { timeout: 30000 }));

  console.log(`[VectorStore] Successfully stored all ${count} chunks in pgvector database.`);
}
