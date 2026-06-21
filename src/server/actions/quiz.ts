"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { generateQuizFromDocuments } from "@/server/services/ai-generator";
import { QuestionType } from "@prisma/client";

export async function getQuizHistoryData() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || !session.user?.id) return { history: [], stats: { averageAccuracy: 0, totalQuizzes: 0 } };

  // 1. Fetch completed quizzes
  const quizzes = await db.quiz.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      questions: true,
    },
  });

  // Calculate stats
  const completedQuizzes = quizzes.filter(q => q.score !== null);
  const totalQuizzes = completedQuizzes.length;
  
  let averageAccuracy = 0;
  if (totalQuizzes > 0) {
    // Take the last 5 quizzes
    const last5 = completedQuizzes.slice(0, 5);
    const sumAccuracy = last5.reduce((acc, q) => {
      const qCount = q.questions.length || 1;
      const scorePct = ((q.score || 0) / qCount) * 100;
      return acc + scorePct;
    }, 0);
    averageAccuracy = Math.round(sumAccuracy / last5.length);
  }

  return {
    history: quizzes,
    stats: {
      averageAccuracy,
      totalQuizzes,
    }
  };
}

export async function generateQuizAction(documentIds: string[], difficulty: string, questionCount: number) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || !session.user?.id) throw new Error("Unauthorized");

  if (!documentIds || documentIds.length === 0) {
    throw new Error("Please select at least one document to generate the quiz.");
  }

  // 1. Generate questions from Gemini
  const rawQuestions = await generateQuizFromDocuments(documentIds, difficulty, questionCount);

  // 2. Fetch first document title for quiz title
  const doc = await db.document.findFirst({
    where: { id: documentIds[0] }
  });
  const quizTitle = `${doc?.title?.split(".")[0] || "Custom"} Quiz (${difficulty})`;

  // 3. Create Quiz in Database
  const quiz = await db.quiz.create({
    data: {
      userId: session.user.id,
      title: quizTitle,
      documentId: documentIds[0],
      score: null, // null means incomplete
    }
  });

  // 4. Create QuizQuestions in Database
  const createPromises = rawQuestions.map((q) =>
    db.quizQuestion.create({
      data: {
        quizId: quiz.id,
        question: q.question,
        options: q.options, // stored as json
        correctAnswer: q.correctAnswer,
        type: QuestionType.MCQ,
      }
    })
  );

  await Promise.all(createPromises);

  revalidatePath("/quizzes");
  
  // Return the created quiz structure with questions
  return db.quiz.findUnique({
    where: { id: quiz.id },
    include: { questions: true }
  });
}

export async function submitQuizScoreAction(quizId: string, score: number) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || !session.user?.id) throw new Error("Unauthorized");

  await db.quiz.update({
    where: { id: quizId, userId: session.user.id },
    data: {
      score: score,
    }
  });

  revalidatePath("/quizzes");
}
