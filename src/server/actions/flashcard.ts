"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { generateFlashcardsFromDocument } from "@/server/services/ai-generator";

export async function getFlashcardDecks() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || !session.user?.id) return [];

  // 1. Fetch all flashcards for this user
  const flashcards = await db.flashcard.findMany({
    where: { userId: session.user.id },
    include: {
      document: {
        select: {
          title: true,
        },
      },
    },
  });

  // 2. Group by document
  const decksMap: Record<string, {
    documentId: string | null;
    title: string;
    cards: typeof flashcards;
    lastStudied: Date;
    mastery: number;
  }> = {};

  for (const card of flashcards) {
    const docId = card.documentId;
    const key = docId || "manual";
    const docTitle = card.document?.title || "Manual Entries";

    if (!decksMap[key]) {
      decksMap[key] = {
        documentId: docId,
        title: docTitle,
        cards: [],
        lastStudied: card.nextReview,
        mastery: 0,
      };
    }

    decksMap[key].cards.push(card);
    
    // Mastery: calculate percentage of cards with difficulty >= 2 (got it right multiple times)
    const masteredCount = decksMap[key].cards.filter(c => c.difficulty >= 2).length;
    decksMap[key].mastery = Math.round((masteredCount / decksMap[key].cards.length) * 100);
  }

  return Object.values(decksMap);
}

export async function createFlashcardDeckAction(documentId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session || !session.user?.id) return { success: false, error: "Unauthorized" };

    // Check if document exists and belongs to user
    const doc = await db.document.findUnique({
      where: { id: documentId, userId: session.user.id },
    });
    if (!doc) return { success: false, error: "Document not found" };

    // Call Gemini to generate
    const generated = await generateFlashcardsFromDocument(documentId);

    // Bulk create in DB
    const createPromises = generated.map((card) =>
      db.flashcard.create({
        data: {
          userId: session.user.id,
          documentId: documentId,
          question: card.question,
          answer: card.answer,
          difficulty: 0,
          nextReview: new Date(),
        },
      })
    );

    await Promise.all(createPromises);

    revalidatePath("/flashcards");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to generate flashcards" };
  }
}

export async function updateFlashcardReviewAction(cardId: string, gotIt: boolean) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || !session.user?.id) throw new Error("Unauthorized");

  const card = await db.flashcard.findUnique({
    where: { id: cardId, userId: session.user.id },
  });
  if (!card) throw new Error("Card not found");

  let newDifficulty = card.difficulty;
  let daysToAdd = 1;

  if (gotIt) {
    newDifficulty += 1;
    // Spaced repetition interval: 1 day, 3 days, 7 days, 14 days, 30 days...
    daysToAdd = Math.pow(2, newDifficulty);
  } else {
    newDifficulty = 0;
    daysToAdd = 1; // review tomorrow
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);

  await db.flashcard.update({
    where: { id: cardId },
    data: {
      difficulty: newDifficulty,
      nextReview: nextReviewDate,
    },
  });

  revalidatePath("/flashcards");
}
