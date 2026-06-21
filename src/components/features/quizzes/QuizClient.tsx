"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  FileText, 
  CheckCircle2, 
  Circle, 
  Rocket, 
  History, 
  Timer, 
  Sparkles, 
  ArrowLeft, 
  Flag, 
  ArrowRight,
  Loader2
} from "lucide-react";
import { generateQuizAction, submitQuizScoreAction } from "@/server/actions/quiz";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Document {
  id: string;
  title: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: any; // json array
  correctAnswer: string;
}

interface QuizHistory {
  id: string;
  title: string;
  score: number | null;
  createdAt: Date;
  questions: QuizQuestion[];
}

interface QuizStats {
  averageAccuracy: number;
  totalQuizzes: number;
}

interface QuizClientProps {
  documents: Document[];
  history: QuizHistory[];
  stats: QuizStats;
}

export function QuizClient({ documents, history, stats }: QuizClientProps) {
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<"Novice" | "Adept" | "Expert">("Adept");
  const [numQuestions, setNumQuestions] = useState(10);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default
  const [isGenerating, startGenerateTransition] = useTransition();
  const router = useRouter();

  // Load first document as selected by default if available
  useEffect(() => {
    if (documents.length > 0 && selectedDocIds.length === 0) {
      setSelectedDocIds([documents[0].id]);
    }
  }, [documents]);

  // Countdown timer effect
  useEffect(() => {
    if (!isQuizActive || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishQuiz(true); // Auto-submit when time is up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isQuizActive, timeLeft]);

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleStartQuiz = () => {
    if (selectedDocIds.length === 0) {
      toast.warning("Please select at least one source document.");
      return;
    }

    startGenerateTransition(async () => {
      try {
        const quiz = await generateQuizAction(selectedDocIds, difficulty, numQuestions);
        setActiveQuiz(quiz);
        setAnswers({});
        setCurrentIdx(0);
        setSelectedOption(null);
        setTimeLeft(numQuestions * 60); // 1 minute per question
        setIsQuizActive(true);
        toast.success("Quiz generated successfully! Good luck!");
      } catch (err: any) {
        toast.error(`Failed to generate quiz: ${err.message}`);
      }
    });
  };

  const handleOptionSelect = (optionText: string) => {
    setSelectedOption(optionText);
    setAnswers((prev) => ({ ...prev, [currentIdx]: optionText }));
  };

  const handleNextQuestion = () => {
    if (!selectedOption) {
      toast.warning("Please select an answer option.");
      return;
    }

    if (currentIdx < activeQuiz.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      // Retrieve previously selected option if exists
      setSelectedOption(answers[currentIdx + 1] || null);
    } else {
      // Last question completed, finish quiz
      handleFinishQuiz();
    }
  };

  const handleFinishQuiz = async (autoSubmit = false) => {
    if (!activeQuiz) return;
    
    // Compute final score
    let correctCount = 0;
    activeQuiz.questions.forEach((q: QuizQuestion, idx: number) => {
      const userAnswer = answers[idx];
      if (userAnswer === q.correctAnswer) {
        correctCount++;
      }
    });

    try {
      await submitQuizScoreAction(activeQuiz.id, correctCount);
      const scoreMsg = autoSubmit 
        ? `Time is up! Your score: ${correctCount}/${activeQuiz.questions.length}`
        : `Quiz finished! Your score: ${correctCount}/${activeQuiz.questions.length}`;
      toast.success(scoreMsg, { duration: 5000 });
      setIsQuizActive(false);
      setActiveQuiz(null);
      router.refresh();
    } catch (err: any) {
      toast.error(`Failed to save quiz score: ${err.message}`);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex w-full h-full justify-center">
      {!isQuizActive ? (
        <div className="w-full max-w-3xl space-y-8 py-8 animate-in fade-in zoom-in duration-500 text-on-surface">
          <div className="space-y-2">
            <h2 className="text-headline-lg font-headline-lg text-on-surface">Quiz Generator</h2>
            <p className="text-body-md text-on-surface-variant">Transform your study materials into interactive assessment modules.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Setup Card */}
            <div className="col-span-full bg-surface-container rounded-2xl p-8 border border-white/5 glass-panel">
              <div className="space-y-6">
                <div>
                  <label className="block text-label-md font-bold mb-3 text-on-surface-variant uppercase tracking-wider">Select Source Documents</label>
                  {documents.length === 0 ? (
                    <div className="text-center p-6 border border-dashed border-white/10 rounded-xl text-on-surface-variant text-sm">
                      No documents in library. Upload PDFs in the Library tab first.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                      {documents.map((doc) => {
                        const isSelected = selectedDocIds.includes(doc.id);
                        return (
                          <div 
                            key={doc.id}
                            onClick={() => toggleDocumentSelection(doc.id)}
                            className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                              isSelected ? "border-primary bg-primary/5 text-primary" : "border-white/5 bg-surface-container-highest hover:border-white/20 text-on-surface"
                            }`}
                          >
                            <FileText className="w-6 h-6 mr-3 flex-shrink-0" />
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="text-label-md font-medium truncate" title={doc.title}>{doc.title}</p>
                            </div>
                            {isSelected ? <CheckCircle2 className="text-primary w-5 h-5 flex-shrink-0" /> : <Circle className="text-on-surface-variant/20 w-5 h-5 flex-shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-label-md font-bold mb-3 text-on-surface-variant uppercase tracking-wider">Difficulty Level</label>
                    <div className="flex gap-2">
                      {["Novice", "Adept", "Expert"].map((level) => {
                        const isSel = difficulty === level;
                        return (
                          <button 
                            key={level}
                            onClick={() => setDifficulty(level as any)}
                            className={`flex-1 py-2 px-3 rounded-lg border text-label-md transition-all font-semibold ${
                              isSel ? "border-primary bg-primary/10 text-primary" : "border-white/10 hover:bg-white/5 text-on-surface"
                            }`}
                          >
                            {level}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-label-md font-bold mb-3 text-on-surface-variant uppercase tracking-wider">Number of Questions</label>
                    <input 
                      className="w-full accent-primary h-2 bg-surface-container-low rounded-full appearance-none cursor-pointer" 
                      max="20" 
                      min="5" 
                      step="5" 
                      type="range" 
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(Number(e.target.value))}
                    />
                    <div className="flex justify-between text-label-sm text-on-surface-variant mt-2">
                      <span>5</span>
                      <span className="text-primary font-bold">{numQuestions} questions</span>
                      <span>20</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={handleStartQuiz}
                  disabled={selectedDocIds.length === 0 || isGenerating}
                  className="w-full py-4 bg-primary text-on-primary-container font-headline-md font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Generating Quiz from sources...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-6 h-6" />
                      Generate Quiz Session
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Stats/History Bento */}
            <div className="bg-surface-container-high rounded-2xl p-6 border border-white/5 flex flex-col justify-between overflow-hidden relative">
              <div className="relative z-10">
                <p className="text-label-sm font-bold text-on-surface-variant uppercase tracking-widest mb-1">Your Mastery</p>
                <h3 className="text-headline-md font-bold text-xl">{stats.averageAccuracy}% Accuracy</h3>
                <p className="text-body-sm text-on-surface-variant mt-2">Based on your last 5 completed quizzes.</p>
              </div>
              <div className="mt-6 h-12 flex items-end gap-1 relative z-10">
                {history.slice(0, 7).reverse().map((q, idx) => {
                  const qCount = q.questions.length || 1;
                  const score = q.score || 0;
                  const percent = (score / qCount) * 100;
                  return (
                    <div 
                      key={q.id} 
                      className="flex-1 bg-primary rounded-t-sm transition-all hover:scale-y-110" 
                      style={{ height: `${Math.max(percent, 10)}%` }}
                      title={`${q.title}: ${score}/${qCount}`}
                    />
                  );
                })}
              </div>
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-primary/10 blur-3xl rounded-full"></div>
            </div>

            <div className="bg-surface-container-high rounded-2xl p-6 border border-white/5 flex flex-col justify-center items-center text-center">
              <History className="text-primary-container w-10 h-10 mb-3 text-primary" />
              <p className="text-label-md font-bold">Quiz History</p>
              <p className="text-body-sm text-on-surface-variant px-4">You have generated {stats.totalQuizzes} quizzes total.</p>
              <button 
                onClick={() => router.refresh()} 
                className="mt-4 text-primary text-label-sm font-bold hover:underline"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl space-y-6 py-8 animate-in slide-in-from-bottom-4 fade-in duration-500 text-on-surface">
          {/* Progress & Timer Bar */}
          <div className="w-full flex items-center gap-6 bg-surface-container-low p-4 rounded-2xl border border-white/5 glass-panel sticky top-20 z-30">
            <div className="flex-1">
              <div className="flex justify-between items-end mb-2">
                <p className="text-label-sm font-bold text-primary uppercase tracking-wider">
                  Question {(currentIdx + 1).toString().padStart(2, "0")}{" "}
                  <span className="text-on-surface-variant font-normal">of {activeQuiz.questions.length}</span>
                </p>
                <p className="text-label-sm font-bold text-on-surface-variant">
                  {Math.round(((currentIdx) / activeQuiz.questions.length) * 100)}% Complete
                </p>
              </div>
              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary shadow-[0_0_8px_rgba(208,188,255,0.5)] transition-all duration-300"
                  style={{ width: `${((currentIdx) / activeQuiz.questions.length) * 100}%` }}
                />
              </div>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="flex items-center gap-3">
              <Timer className="text-primary w-6 h-6" />
              <div className="text-right">
                <p className="text-headline-md font-bold font-display leading-none text-lg">{formatTime(timeLeft)}</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Remaining</p>
              </div>
            </div>
          </div>

          {/* Question Area */}
          <div className="bg-surface-container rounded-3xl p-8 md:p-12 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 select-none">
              <span className="material-symbols-outlined text-[120px]">quiz</span>
            </div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-label-sm font-bold mb-6">
                <Sparkles className="w-4 h-4" />
                AI Generated Question
              </div>
              
              <h3 className="text-xl md:text-2xl font-headline-lg text-on-surface leading-tight mb-10">
                {activeQuiz.questions[currentIdx].question}
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                {(activeQuiz.questions[currentIdx].options as string[]).map((optionText, idx) => {
                  const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D
                  const isSelected = selectedOption === optionText;

                  return (
                    <div 
                      key={idx}
                      onClick={() => handleOptionSelect(optionText)}
                      className={`group flex items-center p-6 rounded-2xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-white/10 bg-white/5 hover:border-white/30 text-on-surface'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 mr-5 flex items-center justify-center transition-all flex-shrink-0 ${
                        isSelected ? 'border-primary bg-primary' : 'border-white/10'
                      }`}>
                        <div className="w-2.5 h-2.5 rounded-full bg-background" />
                      </div>
                      <div className="flex-1">
                        <span className={`text-label-sm transition-colors block mb-1 ${
                          isSelected ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'
                        }`}>
                          {optionLabel}.
                        </span>
                        <p className="text-body-md font-medium">{optionText}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button 
              onClick={() => {
                if (currentIdx > 0) {
                  setCurrentIdx(currentIdx - 1);
                  setSelectedOption(answers[currentIdx - 1] || null);
                }
              }}
              disabled={currentIdx === 0}
              className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors px-6 py-3 rounded-xl border border-transparent hover:bg-white/5 disabled:opacity-30"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-label-md">Previous Question</span>
            </button>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                onClick={() => setIsQuizActive(false)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-error px-6 py-3 rounded-xl border border-error/20 bg-error/5 hover:bg-error/10 transition-colors"
              >
                <Flag className="w-5 h-5" />
                <span className="font-label-md">Cancel Session</span>
              </button>
              <button 
                onClick={handleNextQuestion}
                disabled={!selectedOption}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-on-primary-container font-bold px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
              >
                <span className="font-label-md">
                  {currentIdx === activeQuiz.questions.length - 1 ? "Finish Quiz" : "Submit Answer"}
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
