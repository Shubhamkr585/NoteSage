"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { after } from "next/server";
import { DocType } from "@prisma/client";
import { documentQueue } from "@/lib/queue";

export async function getUserDocuments() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || !session.user?.id) return [];

  const documents = await db.document.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { chunks: true },
      },
    },
  });

  return documents;
}

export async function deleteDocument(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || !session.user?.id) throw new Error("Unauthorized");

  await db.document.deleteMany({
    where: { id, userId: session.user.id },
  });

  revalidatePath("/documents");
}

export async function createDocument(title: string, s3Key: string, type: DocType) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || !session.user?.id) throw new Error("Unauthorized");

  const doc = await db.document.create({
    data: {
      title,
      s3Key,
      type,
      userId: session.user.id,
    },
  });

  // Dispatch job to BullMQ queue
  await documentQueue.add("process-pdf", { documentId: doc.id });
  console.log(`[Ingestion] Dispatched job for document ${doc.id}`);

  revalidatePath("/documents");
  return doc;
}
