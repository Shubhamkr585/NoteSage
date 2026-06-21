import { getStudyPlannerData } from "@/server/actions/study-plan";
import { StudyPlanClient } from "@/components/features/study-plan/StudyPlanClient";

export const dynamic = "force-dynamic";

export default async function StudyPlanPage() {
  const { plans, tasks } = await getStudyPlannerData();

  // Map server plans to client plans structure
  const mappedPlans = plans.map((p) => ({
    id: p.id,
    subject: p.subject,
    examDate: p.examDate,
    tasks: p.tasks.map((t) => ({
      id: t.id,
      topic: t.topic,
      date: t.date,
      status: t.status as "PENDING" | "COMPLETED",
    })),
  }));

  // Map server tasks to client tasks structure
  const mappedTasks = tasks.map((t) => ({
    id: t.id,
    planId: t.planId,
    topic: t.topic,
    date: t.date,
    status: t.status as "PENDING" | "COMPLETED",
    plan: {
      subject: t.plan.subject,
    },
  }));

  return (
    <StudyPlanClient initialPlans={mappedPlans} initialTasks={mappedTasks} />
  );
}
