import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { Flame, FileText, UploadCloud, MessageSquare, BookOpen, CheckCircle2, Brain, CalendarDays } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  // Fetch all real data in parallel
  const [
    docCount,
    recentDocs,
    flashcardCount,
    quizCount,
    studyPlanCount,
    pendingTasks,
    chatCount,
  ] = await Promise.all([
    db.document.count({ where: { userId } }),
    db.document.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    db.flashcard.count({ where: { userId } }),
    db.quiz.count({ where: { userId } }),
    db.studyPlan.count({ where: { userId } }),
    db.studyTask.findMany({
      where: { plan: { userId }, status: "PENDING" },
      include: { plan: { select: { subject: true } } },
      orderBy: { date: "asc" },
      take: 5,
    }),
    db.chat.count({ where: { userId } }),
  ]);

  const firstName = session.user.name?.split(" ")[0] || "Student";

  // Compute greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const stats = [
    { label: "Documents", value: docCount, icon: FileText, color: "text-primary", href: "/documents" },
    { label: "Flashcards", value: flashcardCount, icon: Brain, color: "text-secondary", href: "/flashcards" },
    { label: "Quizzes", value: quizCount, icon: CheckCircle2, color: "text-tertiary", href: "/quizzes" },
    { label: "Study Plans", value: studyPlanCount, icon: CalendarDays, color: "text-primary", href: "/study-plan" },
  ];

  return (
    <>
      {/* Welcome Section */}
      <section className="mb-12">
        <h2 className="font-headline-lg text-headline-lg mb-2">{greeting}, {firstName}.</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          {docCount === 0
            ? "Upload your first document to get started with AI-powered learning."
            : `You have ${docCount} document${docCount === 1 ? "" : "s"} and ${flashcardCount} flashcard${flashcardCount === 1 ? "" : "s"} ready to study.`}
        </p>
      </section>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="glass-panel rounded-2xl p-6 flex flex-col gap-3 hover:border-primary/30 border border-outline-variant/30 transition-all group"
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-6 h-6 ${stat.color}`} />
                <span className="text-display font-display text-2xl font-bold text-on-surface">
                  {stat.value}
                </span>
              </div>
              <p className="text-on-surface-variant text-label-md font-label-md group-hover:text-primary transition-colors">
                {stat.label}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">

        {/* Recent Documents */}
        <div className="col-span-12 xl:col-span-8 glass-panel rounded-3xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-headline-md font-headline-md">Recent Documents</h3>
            <Link href="/documents" className="text-primary text-label-md font-label-md hover:underline">
              View Library →
            </Link>
          </div>
          <div className="space-y-3">
            {recentDocs.length === 0 ? (
              <div className="py-12 border border-dashed border-outline-variant/40 rounded-2xl text-center text-on-surface-variant">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-body-md">No documents yet.</p>
                <p className="text-label-sm mt-1">Upload your first PDF to get started.</p>
              </div>
            ) : (
              recentDocs.map((doc) => (
                <Link
                  href="/documents"
                  key={doc.id}
                  className="flex items-center gap-4 p-4 bg-surface-container rounded-xl border border-outline-variant/20 hover:border-primary/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                      {doc.title}
                    </p>
                    <p className="text-label-sm text-on-surface-variant mt-0.5">
                      {new Date(doc.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })} · {doc.type}
                    </p>
                  </div>
                  <span className="text-xs text-on-surface-variant border border-outline-variant/30 px-2 py-1 rounded-full">
                    View
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Today's Study Tasks */}
        <div className="col-span-12 xl:col-span-4 glass-panel rounded-3xl p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-headline-md font-headline-md">Upcoming Tasks</h3>
            <Link href="/study-plan" className="text-primary text-label-sm hover:underline">
              View Plan →
            </Link>
          </div>
          <div className="space-y-3 flex-1">
            {pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-on-surface-variant">
                <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-body-md">No upcoming tasks.</p>
                <Link href="/study-plan" className="text-primary text-label-sm mt-2 hover:underline">
                  Create a study plan →
                </Link>
              </div>
            ) : (
              pendingTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 bg-surface-container rounded-xl border border-outline-variant/20">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-body-md text-on-surface font-medium truncate">{task.topic}</p>
                    <p className="text-label-sm text-on-surface-variant mt-0.5">
                      {task.plan.subject} · {new Date(task.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-12 glass-panel rounded-3xl p-8">
          <h3 className="text-headline-md font-headline-md mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link href="/documents" className="flex flex-col items-center justify-center gap-4 p-6 bg-surface-container rounded-2xl border border-outline-variant/20 hover:border-primary/40 hover:bg-primary/5 transition-all group">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-body-md">Upload PDF</p>
                <p className="text-body-sm text-on-surface-variant">Import study documents</p>
              </div>
            </Link>

            <Link href="/chat" className="flex flex-col items-center justify-center gap-4 p-6 bg-surface-container rounded-2xl border border-outline-variant/20 hover:border-primary/40 hover:bg-primary/5 transition-all group">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-body-md">Doc Chat</p>
                <p className="text-body-sm text-on-surface-variant">Ask questions about docs</p>
              </div>
            </Link>

            <Link href="/flashcards" className="flex flex-col items-center justify-center gap-4 p-6 bg-surface-container rounded-2xl border border-outline-variant/20 hover:border-primary/40 hover:bg-primary/5 transition-all group">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-body-md">Flashcards</p>
                <p className="text-body-sm text-on-surface-variant">Active recall study session</p>
              </div>
            </Link>

            <Link href="/quizzes" className="flex flex-col items-center justify-center gap-4 p-6 bg-surface-container rounded-2xl border border-outline-variant/20 hover:border-primary/40 hover:bg-primary/5 transition-all group">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-body-md">Take a Quiz</p>
                <p className="text-body-sm text-on-surface-variant">Test your knowledge</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="col-span-12 glass-panel rounded-3xl p-8">
          <h3 className="text-headline-md font-headline-md mb-6">Your Learning Hub</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-primary">{docCount}</p>
              <p className="text-on-surface-variant text-label-md">Documents</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-primary">{flashcardCount}</p>
              <p className="text-on-surface-variant text-label-md">Flashcards</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-primary">{quizCount}</p>
              <p className="text-on-surface-variant text-label-md">Quizzes Taken</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-primary">{chatCount}</p>
              <p className="text-on-surface-variant text-label-md">AI Conversations</p>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
