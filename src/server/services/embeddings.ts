import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

/**
 * Creates an instance of GoogleGenerativeAIEmbeddings configured for gemini-embedding-001
 * with its native 3072-dimensional embedding size.
 */
export function getGeminiEmbeddings(taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"): GoogleGenerativeAIEmbeddings {
  return new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001",
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    taskType: taskType as any,
  });
}
