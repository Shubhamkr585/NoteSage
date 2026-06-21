import { getUserDocuments } from "@/server/actions/document";
import { getQuizHistoryData } from "@/server/actions/quiz";
import { QuizClient } from "@/components/features/quizzes/QuizClient";

export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
  const [documents, historyData] = await Promise.all([
    getUserDocuments(),
    getQuizHistoryData(),
  ]);

  // Map user documents to simple client format
  const mappedDocs = documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
  }));

  // Map history questions options to JSON structure
  const mappedHistory = historyData.history.map((q) => ({
    id: q.id,
    title: q.title,
    score: q.score,
    createdAt: q.createdAt,
    questions: q.questions.map((question) => ({
      id: question.id,
      question: question.question,
      options: typeof question.options === "string" ? JSON.parse(question.options) : question.options,
      correctAnswer: question.correctAnswer,
    })),
  }));

  return (
    <QuizClient 
      documents={mappedDocs} 
      history={mappedHistory} 
      stats={historyData.stats} 
    />
  );
}
