import { Worker } from "bullmq";
import { redisConnection } from "../lib/queue";
import { processDocument } from "./services/document-processor";
import { db } from "../lib/db";

console.log("[Worker] Starting BullMQ document processing worker...");

export const documentWorker = new Worker(
  "document-processing",
  async (job) => {
    const { documentId } = job.data;
    console.log(`[Worker] Picked up job for document: ${documentId}`);
    
    await db.document.update({ where: { id: documentId }, data: { status: "PROCESSING" } });
    
    try {
      await processDocument(documentId);
      await db.document.update({ where: { id: documentId }, data: { status: "READY" } });
      console.log(`[Worker] Successfully completed job for document: ${documentId}`);
    } catch (error: any) {
      console.error(`[Worker] Failed job for document: ${documentId}`, error);
      await db.document.update({ 
        where: { id: documentId }, 
        data: { 
          status: "FAILED",
          title: `ERR: ${error?.message || "Unknown error"}`.substring(0, 200) 
        } 
      });
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 3, // Process up to 3 PDFs concurrently
  }
);

documentWorker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error:`, err);
});

documentWorker.on("ready", () => {
  console.log("[Worker] Redis connection established. Listening for jobs...");
});
