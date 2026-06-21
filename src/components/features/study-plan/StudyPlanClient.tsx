"use client";

import { useState, useTransition } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  BarChart2, 
  Target, 
  CheckCircle2, 
  Circle,
  Loader2,
  CalendarDays
} from "lucide-react";
import { toggleTaskStatusAction, generateStudyPlanAction } from "@/server/actions/study-plan";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface StudyTask {
  id: string;
  planId: string;
  topic: string;
  date: Date;
  status: "PENDING" | "COMPLETED";
  plan: {
    subject: string;
  };
}

interface StudyPlan {
  id: string;
  subject: string;
  examDate: Date;
  tasks: {
    id: string;
    topic: string;
    date: Date;
    status: "PENDING" | "COMPLETED";
  }[];
}

interface StudyPlanClientProps {
  initialPlans: StudyPlan[];
  initialTasks: StudyTask[];
}

export function StudyPlanClient({ initialPlans, initialTasks }: StudyPlanClientProps) {
  const [subjectInput, setSubjectInput] = useState("");
  const [examDateInput, setExamDateInput] = useState("");
  const [isGenerating, startGenerateTransition] = useTransition();
  const [showGenerator, setShowGenerator] = useState(false);
  const router = useRouter();

  // Active week selection logic
  const [weekOffset, setWeekOffset] = useState(0);

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    // Save to DB
    await toggleTaskStatusAction(taskId, !currentCompleted);
    router.refresh();
  };

  const handleGeneratePlan = () => {
    if (!subjectInput || !examDateInput) {
      toast.warning("Please specify a subject name and an exam date.");
      return;
    }

    startGenerateTransition(async () => {
      try {
        await generateStudyPlanAction(subjectInput, examDateInput);
        setSubjectInput("");
        setExamDateInput("");
        setShowGenerator(false);
        router.refresh();
        toast.success("Study plan generated successfully!");
      } catch (err: any) {
        toast.error(`Failed to generate schedule: ${err.message}`);
      }
    });
  };

  // 1. Get dates for the selected week
  const getWeekDates = (offset: number) => {
    const today = new Date();
    // Get start of the current week (Monday)
    const dayOfWeek = today.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + distanceToMonday + offset * 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(startOfWeek);
      nextDay.setDate(startOfWeek.getDate() + i);
      dates.push(nextDay);
    }
    return dates;
  };

  const weekDates = getWeekDates(weekOffset);
  const startWeekStr = weekDates[0].toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endWeekStr = weekDates[6].toLocaleDateString(undefined, { month: "short", day: "numeric" });

  // 2. Filter tasks that fall on the week dates
  const getTasksForDate = (date: Date) => {
    return initialTasks.filter((task) => {
      const taskDate = new Date(task.date);
      return (
        taskDate.getFullYear() === date.getFullYear() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getDate() === date.getDate()
      );
    });
  };

  // 3. Compute stats
  const completedTasks = initialTasks.filter((t) => t.status === "COMPLETED").length;
  const totalTasksCount = initialTasks.length;
  const completionRate = totalTasksCount > 0 ? Math.round((completedTasks / totalTasksCount) * 100) : 0;

  // 4. Priorities calculations
  const priorities = initialPlans.map((plan) => {
    const timeDiff = new Date(plan.examDate).getTime() - new Date().getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    let priorityStr = "Exploring";
    let colorClass = "text-tertiary-container bg-tertiary-container/10";
    let pct = 25;

    if (daysLeft <= 5) {
      priorityStr = "Urgent";
      colorClass = "text-primary bg-primary/10";
      pct = 85;
    } else if (daysLeft <= 14) {
      priorityStr = "Maintenance";
      colorClass = "text-secondary-container bg-secondary-container/10";
      pct = 50;
    }

    return {
      id: plan.id,
      subject: plan.subject,
      priority: priorityStr,
      color: colorClass,
      percentage: pct,
    };
  });

  return (
    <div className="flex w-full h-full justify-center">
      <div className="p-8 max-w-[1400px] w-full mx-auto animate-in fade-in zoom-in duration-500 text-on-surface">
        
        {/* Hero Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="font-display text-headline-lg text-on-surface mb-2 font-bold text-3xl">Study Planner</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
              AI-optimized schedule tailored to your cognitive load and upcoming deadlines.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowGenerator(!showGenerator)}
              className="bg-gradient-to-r from-primary-container to-secondary-container px-6 py-3 rounded-xl font-label-md text-label-md font-bold flex items-center gap-2 hover:opacity-90 transition-all text-on-primary-container shadow-lg shadow-primary/20"
            >
              <Sparkles className="w-5 h-5 text-primary" />
              {showGenerator ? "Hide Setup" : "Generate Schedule"}
            </button>
          </div>
        </div>

        {/* Schedule Creator Setup */}
        {showGenerator && (
          <div className="mb-10 bg-surface-container rounded-3xl p-8 border border-white/5 glass-panel max-w-3xl animate-in slide-in-from-top-4 duration-300">
            <h3 className="font-headline-md text-xl font-bold mb-6">Create Custom Exam Schedule</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Subject Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Linear Algebra, ML Ethics"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary outline-none"
                  disabled={isGenerating}
                />
              </div>
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Exam Date</label>
                <input 
                  type="date" 
                  value={examDateInput}
                  onChange={(e) => setExamDateInput(e.target.value)}
                  className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary outline-none text-on-surface"
                  disabled={isGenerating}
                />
              </div>
            </div>
            <button 
              onClick={handleGeneratePlan}
              disabled={isGenerating || !subjectInput || !examDateInput}
              className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Generate Timelines
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content (Calendar + Task Board) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Calendar View */}
            <section className="bg-surface-container/40 backdrop-blur-md rounded-3xl p-6 overflow-hidden border border-white/5 glass-panel">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setWeekOffset(weekOffset - 1)}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
                  >
                    <ChevronLeft className="text-on-surface-variant w-6 h-6 text-on-surface" />
                  </button>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-semibold text-lg">
                    {startWeekStr} – {endWeekStr}
                  </h3>
                  <button 
                    onClick={() => setWeekOffset(weekOffset + 1)}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
                  >
                    <ChevronRight className="text-on-surface-variant w-6 h-6 text-on-surface" />
                  </button>
                </div>
                <span className="text-primary font-label-md text-label-md flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  Live Calendar Active
                </span>
              </div>
              
              <div className="grid grid-cols-7 gap-px bg-white/5 rounded-2xl overflow-hidden">
                {/* Header */}
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                  <div key={day} className="bg-surface-container p-4 text-center border-b border-white/5">
                    <span className="font-label-sm text-label-sm text-on-surface-variant opacity-60 uppercase">{day}</span>
                    <span className="block text-[11px] font-bold text-on-surface mt-1">{weekDates[i].getDate()}</span>
                  </div>
                ))}
                
                {/* Time Slots Visualizer mapping daily tasks */}
                {weekDates.map((date, i) => {
                  const dayTasks = getTasksForDate(date);
                  const isToday = new Date().toDateString() === date.toDateString();
                  return (
                    <div 
                      key={i} 
                      className={`min-h-[160px] p-2 flex flex-col gap-2 transition-all ${
                        isToday ? "bg-surface-container/50 ring-1 ring-primary/20" : "bg-surface-container/30"
                      }`}
                    >
                      {dayTasks.map((t) => {
                        const isCompleted = t.status === "COMPLETED";
                        return (
                          <div 
                            key={t.id} 
                            onClick={() => handleToggleTask(t.id, isCompleted)}
                            className={`p-2 rounded-lg border-l-2 cursor-pointer transition-all hover:bg-white/5 ${
                              isCompleted 
                                ? "bg-white/5 border-l-outline-variant opacity-40 line-through text-on-surface-variant" 
                                : "bg-primary-container/20 border-l-primary-container text-primary"
                            } font-label-sm text-label-sm`}
                          >
                            <span className="block font-bold truncate">{t.plan.subject}</span>
                            <span className="opacity-70 text-[10px] line-clamp-2">{t.topic}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Progress Visualization Cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-container/40 p-6 rounded-3xl relative overflow-hidden group border border-white/5 glass-panel">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary">
                      <BarChart2 className="w-6 h-6" />
                    </div>
                    <span className="font-label-md text-label-md text-primary">Live Stats</span>
                  </div>
                  <h4 className="font-headline-md text-headline-md text-on-surface mb-1 font-bold text-lg">Goal Completion</h4>
                  <div className="w-full h-2 bg-surface-container rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${completionRate}%` }}></div>
                  </div>
                  <p className="mt-2 font-label-sm text-label-sm text-on-surface-variant opacity-60">
                    {completionRate}% of study planner tasks completed ({completedTasks}/{totalTasksCount})
                  </p>
                </div>
              </div>
              
              <div className="bg-surface-container/40 p-6 rounded-3xl relative overflow-hidden group border border-white/5 glass-panel">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-secondary-container/20 flex items-center justify-center text-secondary">
                      <Target className="w-6 h-6" />
                    </div>
                    <span className="font-label-md text-label-md text-secondary">Schedule Velocity</span>
                  </div>
                  <h4 className="font-headline-md text-headline-md text-on-surface mb-1 font-bold text-lg">Active Milestones</h4>
                  <p className="mt-2 font-label-sm text-label-sm text-on-surface-variant opacity-60">
                    You have {initialPlans.length} active exam schedules currently tracked.
                  </p>
                </div>
              </div>
            </section>

            {/* Task Management Board */}
            <section className="bg-surface-container/40 rounded-3xl p-6 border border-white/5 glass-panel">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-headline-md text-headline-md text-on-surface font-semibold text-lg">Queue for Today</h3>
              </div>
              <div className="space-y-3">
                {initialTasks.length === 0 ? (
                  <div className="text-center p-6 text-on-surface-variant text-sm border border-dashed border-white/10 rounded-2xl">
                    No active tasks. Set up an exam study plan above to generate checklist tasks!
                  </div>
                ) : (
                  initialTasks.map((task) => {
                    const isCompleted = task.status === "COMPLETED";
                    return (
                      <div 
                        key={task.id} 
                        onClick={() => handleToggleTask(task.id, isCompleted)}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container/40 border border-white/5 hover:border-white/20 transition-all cursor-pointer group"
                      >
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 className="text-primary w-6 h-6" />
                          ) : (
                            <Circle className="text-outline-variant group-hover:text-primary transition-colors w-6 h-6" />
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className={`font-body-md text-body-md text-on-surface truncate ${isCompleted ? "line-through text-on-surface-variant/40" : ""}`}>
                            {task.topic}
                          </p>
                          <span className="font-label-sm text-label-sm text-on-surface-variant opacity-60">
                            {task.plan.subject} • {new Date(task.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          {/* Right Sidebar (Prioritization + AI Insight) */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Subject Prioritization List */}
            <div className="bg-surface-container/40 p-6 rounded-3xl border border-white/5 glass-panel">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-6 font-bold text-lg">Learning Priority</h3>
              <div className="space-y-4">
                {priorities.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No subjects scheduled.</p>
                ) : (
                  priorities.map((item) => (
                    <div key={item.id} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="font-label-md text-label-md text-on-surface truncate max-w-[150px]">{item.subject}</span>
                        <span className={`font-label-sm text-[10px] px-2 py-0.5 rounded-full ${item.color} font-bold`}>{item.priority}</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${item.percentage}%` }}></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Visual Accent Card */}
            <div className="relative h-48 rounded-3xl overflow-hidden glass-panel border border-white/5">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-secondary-container/10 to-transparent"></div>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent p-6 flex flex-col justify-end">
                <p className="font-display text-headline-md font-bold text-on-primary-fixed leading-tight mb-1 text-primary-fixed">Study Progress Tracker</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Check off your study tasks to build daily momentum.</p>
              </div>
            </div>
            
          </aside>
        </div>
      </div>
    </div>
  );
}
