"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { TaskStatus } from "@prisma/client";

export async function getStudyPlannerData() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || !session.user?.id) return { plans: [], tasks: [] };

  // 1. Fetch study plans and tasks
  const plans = await db.studyPlan.findMany({
    where: { userId: session.user.id },
    include: {
      tasks: {
        orderBy: { date: "asc" }
      }
    },
    orderBy: { examDate: "asc" }
  });

  // 2. Fetch all tasks for today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // We fetch tasks that fall around current week/today to populate the queue
  const tasks = await db.studyTask.findMany({
    where: {
      plan: { userId: session.user.id }
    },
    include: {
      plan: {
        select: {
          subject: true
        }
      }
    },
    orderBy: { date: "asc" }
  });

  return { plans, tasks };
}

export async function toggleTaskStatusAction(taskId: string, completed: boolean) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || !session.user?.id) throw new Error("Unauthorized");

  const status = completed ? TaskStatus.COMPLETED : TaskStatus.PENDING;

  await db.studyTask.update({
    where: { id: taskId },
    data: { status }
  });

  revalidatePath("/study-plan");
}

export async function generateStudyPlanAction(subject: string, examDateStr: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || !session.user?.id) throw new Error("Unauthorized");

  const examDate = new Date(examDateStr);
  const now = new Date();

  // Create StudyPlan
  const plan = await db.studyPlan.create({
    data: {
      userId: session.user.id,
      subject,
      examDate,
    }
  });

  // Calculate study milestones between now and the exam date
  const diffTime = Math.abs(examDate.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 5;

  const topics = [
    `Foundational core concepts of ${subject}`,
    `Review generated active-recall Flashcards for ${subject}`,
    `Take Mock Quiz assessments on key concepts`,
    `Review RAG chat logs and summaries for weak areas`,
    `Final high-intensity recall review before exam`
  ];

  const tasksToCreate = [];
  for (let i = 0; i < 5; i++) {
    // Distribute tasks across the days leading to the exam
    const taskDate = new Date();
    const daysOffset = Math.round((diffDays / 5) * i) || i;
    taskDate.setDate(taskDate.getDate() + daysOffset);
    if (taskDate > examDate) taskDate.setTime(examDate.getTime());

    tasksToCreate.push(
      db.studyTask.create({
        data: {
          planId: plan.id,
          topic: topics[i],
          date: taskDate,
          status: TaskStatus.PENDING,
        }
      })
    );
  }

  await Promise.all(tasksToCreate);

  revalidatePath("/study-plan");
}
