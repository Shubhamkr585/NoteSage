import { getUserDocuments } from "@/server/actions/document";
import { getFlashcardDecks } from "@/server/actions/flashcard";
import { FlashcardClient } from "@/components/features/flashcards/FlashcardClient";

export const dynamic = "force-dynamic";

export default async function FlashcardsPage() {
  const [documents, decks] = await Promise.all([
    getUserDocuments(),
    getFlashcardDecks(),
  ]);

  // Simplify document mapping for client component
  const mappedDocs = documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
  }));

  // Map database decks to client decks format
  const mappedDecks = decks.map((deck) => ({
    documentId: deck.documentId,
    title: deck.title,
    cards: deck.cards.map((c) => ({
      id: c.id,
      question: c.question,
      answer: c.answer,
      difficulty: c.difficulty,
    })),
    lastStudied: deck.lastStudied,
    mastery: deck.mastery,
  }));

  return (
    <FlashcardClient initialDecks={mappedDecks} documents={mappedDocs} />
  );
}
