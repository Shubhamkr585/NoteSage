"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { after } from "next/server";
import { DocType } from "@prisma/client";
import { processDocument } from "@/server/services/document-processor";

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

  // Start document processing asynchronously in the background.
  // Because we are deploying on a persistent AWS EC2 Node server (not Vercel Serverless),
  // detached promises will naturally continue executing in the background without being killed.
  processDocument(doc.id)
    .then((res) => {
      console.log(`[Ingestion] Async document processing succeeded for document ${doc.id}:`, res);
    })
    .catch((err) => {
      console.error(`[Ingestion] Async document processing failed for document ${doc.id}:`, err);
    });

  revalidatePath("/documents");
  return doc;
}
