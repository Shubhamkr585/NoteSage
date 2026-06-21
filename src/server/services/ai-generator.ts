import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { db } from "@/lib/db";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  json: true,
});

interface FlashcardOutput {
  question: string;
  answer: string;
}

interface QuizQuestionOutput {
  question: string;
  options: string[];
  correctAnswer: string;
}

export async function generateFlashcardsFromDocument(documentId: string): Promise<FlashcardOutput[]> {
  console.log(`[AI Generator] Generating flashcards for document: ${documentId}`);

  // 1. Retrieve chunks
  const chunks = await db.documentChunk.findMany({
    where: { documentId },
    orderBy: { pageNumber: "asc" },
    take: 15, // Take first 15 chunks (enough content for flashcards)
  });

  if (!chunks || chunks.length === 0) {
    throw new Error("No text content found for this document.");
  }

  const context = chunks.map((c) => c.content).join("\n\n---\n\n");

  // 2. Query Gemini for structured JSON
  const systemPrompt = `You are an AI assistant that creates active-recall study flashcards from the provided document content.
Generate a list of exactly 8 high-quality study flashcards based on the document text. Each flashcard must consist of a clear, focused study question and a comprehensive, detailed answer.

You MUST return a JSON object exactly matching this schema:
{
  "flashcards": [
    {
      "question": "Question text here",
      "answer": "Answer explanation here"
    }
  ]
}`;

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(`Document Content:\n\n${context}`),
  ]);

  try {
    const rawText = response.content.toString();
    const parsed = JSON.parse(rawText);
    if (!parsed.flashcards || !Array.isArray(parsed.flashcards)) {
      throw new Error("Invalid output format from Gemini");
    }
    return parsed.flashcards as FlashcardOutput[];
  } catch (err) {
    console.error("[AI Generator] Failed to parse flashcard JSON:", err, response.content);
    throw new Error("AI failed to generate flashcards in correct format.");
  }
}

export async function generateQuizFromDocuments(
  documentIds: string[],
  difficulty: string,
  numQuestions: number
): Promise<QuizQuestionOutput[]> {
  console.log(`[AI Generator] Generating quiz for documents: ${documentIds.join(", ")}, difficulty: ${difficulty}`);

  // 1. Retrieve chunks from all selected documents
  const chunks = await db.documentChunk.findMany({
    where: { documentId: { in: documentIds } },
    orderBy: { pageNumber: "asc" },
    take: 20, // Combine chunks
  });

  if (!chunks || chunks.length === 0) {
    throw new Error("No text content found for the selected documents.");
  }

  const context = chunks.map((c) => c.content).join("\n\n---\n\n");

  // 2. Query Gemini
  const systemPrompt = `You are an AI assistant that creates multiple-choice quiz questions from the provided document content.
Create exactly ${numQuestions} multiple-choice questions at a difficulty level of "${difficulty}".
For each question:
- Provide exactly 4 options.
- The options should be plausible but only one correct.
- Specify the correctAnswer which MUST match one of the elements in the options array EXACTLY.

You MUST return a JSON object exactly matching this schema:
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option C"
    }
  ]
}`;

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(`Document Content:\n\n${context}`),
  ]);

  try {
    const rawText = response.content.toString();
    const parsed = JSON.parse(rawText);
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid output format from Gemini");
    }
    return parsed.questions as QuizQuestionOutput[];
  } catch (err) {
    console.error("[AI Generator] Failed to parse quiz JSON:", err, response.content);
    throw new Error("AI failed to generate quiz in correct format.");
  }
}
