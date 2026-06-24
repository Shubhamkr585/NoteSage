import { s3Client } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { storeChunksInVectorDb } from "./vectorStore";
import { retryWithBackoff } from "@/lib/retry";

export async function processDocument(documentId: string) {
  console.log(`[Processor] Starting document processing for ${documentId}`);

  try {
    const document = await db.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error("Document not found");
    }

    if (!process.env.S3_BUCKET_NAME) {
      throw new Error("S3_BUCKET_NAME not configured");
    }

    // Get S3 presigned URL for the document
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: document.s3Key,
    });
    const fileUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    let extractedText = "";

    if (document.type === "PDF") {
      const pdfParseModule = await import("pdf-parse");
      const pdf = (pdfParseModule.default || pdfParseModule) as any;
      const uint8Array = await retryWithBackoff(async () => {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("Failed to fetch file from S3");
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
      });
      const textResult = await retryWithBackoff(async () => {
        return pdf(Buffer.from(uint8Array));
      });
      extractedText = textResult.text;
    } else {
      // Plain text
      extractedText = await retryWithBackoff(async () => {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("Failed to fetch file from S3");
        return response.text();
      });
    }

    if (!extractedText?.trim()) {
      throw new Error("No text extracted from document");
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const splitDocs = await splitter.createDocuments(
      [extractedText],
      [{ loc: { pageNumber: 1 } }]
    );

    console.log(`[Processor] Split document into ${splitDocs.length} chunks`);

    await storeChunksInVectorDb(documentId, splitDocs);

    console.log(`[Processor] Successfully processed document ${documentId}`);

    return {
      success: true,
      chunks: splitDocs.length,
    };
  } catch (error: any) {
    console.error(`[Processor] Failed to process document ${documentId}`, error);
    try {
      await db.document.update({
        where: { id: documentId },
        data: { title: `ERR: ${error?.message || "Unknown processing error"}`.substring(0, 200) }
      });
    } catch (e) {} // ignore if db fails here
    throw error;
  }
}