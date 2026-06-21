import { db } from "@/lib/db";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { getGeminiEmbeddings } from "./embeddings";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
  console.warn("[RAG] Missing Gemini API key.");
}

const embeddings = getGeminiEmbeddings("RETRIEVAL_QUERY");

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
});

export async function generateStandaloneQuestion(chatHistory: any[], currentQuestion: string) {
  // If it's the first question, no need to rewrite
  if (!chatHistory || chatHistory.length === 0) return currentQuestion;

  const historyText = chatHistory
    .map((m) => `${m.role === "USER" ? "User" : "AI"}: ${m.content}`)
    .join("\n");

  const response = await llm.invoke([
    new SystemMessage(
      "You are an assistant that rewrites questions to be standalone. Given the chat history and the latest user question, rewrite the latest question so that it can be understood completely without the history. Do not answer the question, just rewrite it."
    ),
    new HumanMessage(
      `Chat History:\n${historyText}\n\nLatest Question: ${currentQuestion}\n\nStandalone Question:`
    ),
  ]);

  return response.content.toString().trim() || currentQuestion;
}

export async function retrieveChunks(userId: string, query: string, limit: number = 5) {
  // Generate the embedding for the search query
  const queryEmbedding = await embeddings.embedQuery(query);
  const queryEmbeddingString = `[${queryEmbedding.join(",")}]`;

  // Hybrid Search using Reciprocal Rank Fusion (RRF)
  // Combines semantic vector search with full-text keyword search
  const results = await db.$queryRaw`
    WITH vector_search AS (
      SELECT 
        c."id", 
        c."content", 
        c."pageNumber",
        d."title" as "documentTitle",
        d."id" as "documentId",
        RANK() OVER (ORDER BY c."embedding" <=> ${queryEmbeddingString}::vector) as vector_rank
      FROM "DocumentChunk" c
      JOIN "Document" d ON c."documentId" = d."id"
      WHERE d."userId" = ${userId}
        AND c."embedding" IS NOT NULL
      ORDER BY c."embedding" <=> ${queryEmbeddingString}::vector
      LIMIT 20
    ),
    keyword_search AS (
      SELECT 
        c."id", 
        c."content", 
        c."pageNumber",
        d."title" as "documentTitle",
        d."id" as "documentId",
        RANK() OVER (ORDER BY ts_rank(to_tsvector('english', c."content"), plainto_tsquery('english', ${query})) DESC) as keyword_rank
      FROM "DocumentChunk" c
      JOIN "Document" d ON c."documentId" = d."id"
      WHERE d."userId" = ${userId}
        AND to_tsvector('english', c."content") @@ plainto_tsquery('english', ${query})
      LIMIT 20
    )
    SELECT 
      COALESCE(v."id", k."id") as "chunkId",
      COALESCE(v."content", k."content") as "content",
      COALESCE(v."pageNumber", k."pageNumber") as "pageNumber",
      COALESCE(v."documentTitle", k."documentTitle") as "documentTitle",
      COALESCE(v."documentId", k."documentId") as "documentId",
      (
        COALESCE(1.0 / (60 + v.vector_rank), 0.0) +
        COALESCE(1.0 / (60 + k.keyword_rank), 0.0)
      ) as rrf_score
    FROM vector_search v
    FULL OUTER JOIN keyword_search k ON v."id" = k."id"
    ORDER BY rrf_score DESC
    LIMIT ${limit};
  `;

  return results as Array<{
    chunkId: string;
    content: string;
    pageNumber: number;
    documentTitle: string;
    documentId: string;
    rrf_score: number;
  }>;
}
