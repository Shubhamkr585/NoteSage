"use client";

import { useState, useTransition } from "react";
import { 
  ChevronRight, 
  Sparkles, 
  BrainCircuit, 
  Wand2, 
  X, 
  Volume2, 
  RotateCcw, 
  CheckCircle2, 
  ChevronLeft, 
  Bot,
  Loader2,
  PlayCircle
} from "lucide-react";
import { createFlashcardDeckAction, updateFlashcardReviewAction } from "@/server/actions/flashcard";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  difficulty: number;
}

interface Deck {
  documentId: string | null;
  title: string;
  cards: Flashcard[];
  lastStudied: Date;
  mastery: number;
}

interface Document {
  id: string;
  title: string;
}

interface FlashcardClientProps {
  initialDecks: Deck[];
  documents: Document[];
}

export function FlashcardClient({ initialDecks, documents }: FlashcardClientProps) {
  const [isStudyModalOpen, setIsStudyModalOpen] = useState(false);
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, startGenerateTransition] = useTransition();
  const [selectedDocId, setSelectedDocId] = useState("");
  const router = useRouter();

  const handleStartStudy = (deck: Deck) => {
    if (deck.cards.length === 0) {
      toast.warning("No cards in this deck yet!");
      return;
    }
    setActiveDeck(deck);
    setCurrentCardIdx(0);
    setIsFlipped(false);
    setIsStudyModalOpen(true);
  };

  const handleGenerate = async (docId: string) => {
    if (!docId) return;
    startGenerateTransition(async () => {
      try {
        await createFlashcardDeckAction(docId);
        router.refresh();
        setSelectedDocId("");
        toast.success("Flashcards generated successfully!");
      } catch (err: any) {
        toast.error(`Failed to generate flashcards: ${err.message}`);
      }
    });
  };

  const handleReviewFeedback = async (gotIt: boolean) => {
    if (!activeDeck) return;
    const card = activeDeck.cards[currentCardIdx];
    
    // Optimistic UI updates / Spaced repetition save
    await updateFlashcardReviewAction(card.id, gotIt);

    if (currentCardIdx < activeDeck.cards.length - 1) {
      setCurrentCardIdx(currentCardIdx + 1);
      setIsFlipped(false);
    } else {
      setIsStudyModalOpen(false);
      setActiveDeck(null);
      router.refresh();
      toast.success("Study session complete!");
    }
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex h-full w-full">
      <main className="flex-1 max-w-[1200px] mx-auto py-8">
        {/* Header & AI Generation Action */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <nav className="flex items-center gap-2 text-on-surface-variant text-label-sm font-label-sm mb-4 opacity-60">
              <span className="hover:text-primary cursor-pointer">Library</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-primary font-medium">Flashcards</span>
            </nav>
            <h2 className="text-headline-lg font-headline-lg text-on-surface">Knowledge Vault</h2>
            <p className="text-on-surface-variant mt-2 max-w-lg">Master your subjects with AI-driven spaced repetition. Generate decks directly from your uploaded documents and study materials.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 bg-surface-container-high/40 p-3 rounded-2xl border border-outline-variant/30">
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="bg-surface-container-high border border-outline-variant/30 rounded-lg text-label-sm px-4 py-2.5 focus:ring-primary/30 outline-none max-w-xs text-on-surface"
              disabled={isGenerating}
            >
              <option value="">Select Document to Study...</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>{doc.title}</option>
              ))}
            </select>
            <button 
              onClick={() => handleGenerate(selectedDocId)}
              disabled={!selectedDocId || isGenerating}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary-container font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-primary-container group-hover:rotate-45 transition-transform" />
                  AI Generate Deck
                </>
              )}
            </button>
          </div>
        </section>

        {/* Bento Grid of Decks */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[240px]">
          {initialDecks.length === 0 ? (
            <div className="col-span-full border border-dashed border-outline-variant/40 rounded-3xl p-12 text-center text-on-surface-variant flex flex-col items-center justify-center gap-4">
              <BrainCircuit className="w-12 h-12 text-primary opacity-50" />
              <div>
                <p className="font-semibold text-lg">No Flashcard Decks Yet</p>
                <p className="text-sm max-w-sm mt-1">Select an uploaded document in the top-right, and hit "AI Generate Deck" to parse active-recall cards.</p>
              </div>
            </div>
          ) : (
            initialDecks.map((deck, idx) => {
              const isLarge = idx === 0;
              return (
                <div 
                  key={deck.documentId || "manual"} 
                  className={`${isLarge ? "md:col-span-8" : "md:col-span-4"} bg-surface-container rounded-3xl p-8 border border-outline-variant/20 glass-panel relative overflow-hidden group flex flex-col justify-between`}
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors duration-700"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary">
                          <BrainCircuit className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-headline-md font-headline-md font-bold text-lg leading-tight truncate max-w-[280px]" title={deck.title}>
                            {deck.title}
                          </h3>
                          <p className="text-on-surface-variant text-label-sm">{deck.cards.length} Cards</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 flex items-center justify-between gap-8 mt-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-label-sm mb-2">
                        <span className="text-on-surface-variant">Mastery Level</span>
                        <span className="text-primary font-bold">{deck.mastery}%</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${deck.mastery}%` }}></div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleStartStudy(deck)}
                      className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-xl shadow-primary/20"
                    >
                      <PlayCircle className="w-5 h-5" />
                      Study
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* AI Suggestion Card */}
          {documents.length > 0 && initialDecks.length < documents.length && (
            <div className="md:col-span-8 bg-surface-container rounded-3xl border border-dashed border-outline-variant/40 p-8 flex items-center justify-between group hover:border-primary/50 transition-all">
              <div className="max-w-md">
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] uppercase font-bold rounded-full mb-3 inline-block">AI Suggestion</span>
                <h4 className="text-headline-md mb-2">Unstudied materials found</h4>
                <p className="text-on-surface-variant text-body-sm">We detected documents that lack flashcard decks. Pick a document and select "AI Generate Deck" to extract questions.</p>
              </div>
              <button 
                onClick={() => {
                  const unstudied = documents.find(d => !initialDecks.some(deck => deck.documentId === d.id));
                  if (unstudied) handleGenerate(unstudied.id);
                }}
                disabled={isGenerating}
                className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all duration-500 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wand2 className="w-8 h-8" />}
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Study Modal Overlay */}
      {isStudyModalOpen && activeDeck && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md px-4 transition-opacity duration-300">
          <div className="max-w-4xl w-full">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setIsStudyModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
                >
                  <X className="w-5 h-5 text-on-surface" />
                </button>
                <div>
                  <h4 className="font-headline-md text-on-surface font-semibold text-lg">{activeDeck.title}</h4>
                  <div className="flex gap-1.5 mt-2">
                    {activeDeck.cards.map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-1 w-8 rounded-full ${i <= currentCardIdx ? "bg-primary" : "bg-outline-variant"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-primary font-bold text-headline-md">{currentCardIdx + 1}/{activeDeck.cards.length}</span>
                <p className="text-label-sm text-on-surface-variant opacity-60">Cards reviewed</p>
              </div>
            </div>

            {/* Interactive Flip Card */}
            <div className="relative w-full aspect-[16/9] perspective-1000">
              <div 
                className={`flip-card-inner relative w-full h-full cursor-pointer ${isFlipped ? 'flip-card-flipped' : ''}`}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  setIsFlipped(!isFlipped);
                }}
              >
                {/* Front Side (Term) */}
                <div className="flip-card-front absolute inset-0 bg-surface-container rounded-[40px] border border-outline-variant/30 shadow-2xl flex flex-col items-center justify-center p-12 text-center select-none">
                  <span className="text-primary/60 mb-6 uppercase tracking-[0.2em] font-bold text-label-sm">The Question</span>
                  <h1 className="text-2xl md:text-3xl font-headline-lg text-on-surface max-w-2xl leading-tight font-medium">
                    {activeDeck.cards[currentCardIdx].question}
                  </h1>
                  <p className="mt-12 text-on-surface-variant/60 italic text-sm">Tap card to reveal answer</p>
                </div>

                {/* Back Side (Definition) */}
                <div className="flip-card-back absolute inset-0 bg-surface-container rounded-[40px] border border-primary/20 shadow-2xl shadow-primary/5 flex flex-col p-12 overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-secondary/60 uppercase tracking-[0.2em] font-bold text-label-sm">The Answer</span>
                    <button 
                      onClick={() => speakText(activeDeck.cards[currentCardIdx].answer)}
                      className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <Volume2 className="w-5 h-5 text-on-surface" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 text-on-surface">
                    <p className="text-lg text-on-surface-variant leading-relaxed font-normal">
                      {activeDeck.cards[currentCardIdx].answer}
                    </p>
                  </div>

                  {/* Feedback Buttons */}
                  <div className="mt-8 flex gap-4">
                    <button 
                      onClick={() => handleReviewFeedback(false)}
                      className="flex-1 py-4 rounded-xl bg-surface-container-high text-on-surface font-bold hover:bg-error-container/20 hover:text-error transition-all flex items-center justify-center gap-2 group"
                    >
                      <RotateCcw className="w-5 h-5 group-hover:rotate-[-45deg] transition-transform" />
                      Need Practice
                    </button>
                    <button 
                      onClick={() => handleReviewFeedback(true)}
                      className="flex-1 py-4 rounded-xl bg-primary text-on-primary-container font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
                    >
                      <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Got it
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Study Stats / Navigation */}
            <div className="flex justify-between items-center mt-8 px-4 text-on-surface-variant">
              <button 
                onClick={() => currentCardIdx > 0 && setCurrentCardIdx(currentCardIdx - 1)}
                disabled={currentCardIdx === 0}
                className="flex items-center gap-2 hover:text-primary transition-colors disabled:opacity-30 disabled:hover:text-inherit"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous card
              </button>
              <button 
                onClick={() => {
                  if (currentCardIdx < activeDeck.cards.length - 1) {
                    setCurrentCardIdx(currentCardIdx + 1);
                    setIsFlipped(false);
                  } else {
                    setIsStudyModalOpen(false);
                  }
                }}
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                Skip card
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Context Panel */}
      <div className="fixed bottom-8 right-8 z-30">
        <button className="w-14 h-14 rounded-full bg-primary text-on-primary shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-90 transition-all group">
          <Bot className="w-6 h-6" />
          <div className="absolute right-full mr-4 px-4 py-2 bg-surface-container border border-outline-variant/30 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all pointer-events-none text-on-surface text-label-md">
            Ask Sage about this card
          </div>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 {
            perspective: 1000px;
        }
        .flip-card-inner {
            transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            transform-style: preserve-3d;
        }
        .flip-card-flipped {
            transform: rotateY(180deg);
        }
        .flip-card-front, .flip-card-back {
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
        }
        .flip-card-back {
            transform: rotateY(180deg);
        }
      `}} />
    </div>
  );
}
