import { s3Client } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { storeChunksInVectorDb } from "./vectorStore";
import { retryWithBackoff } from "@/lib/retry";

// Polyfill DOM objects required by pdfjs-dist in Node.js / Next.js Server Components
if (typeof global !== "undefined") {
  if (typeof (global as any).DOMException === "undefined") {
    (global as any).DOMException = class DOMException extends Error {
      constructor(message: string, name: string) {
        super(message);
        this.name = name;
      }
    };
  }
  if (typeof (global as any).document === "undefined") {
    (global as any).document = {
      createElement: () => ({}),
      documentElement: {},
    };
  }
  if (typeof (global as any).window === "undefined") {
    (global as any).window = global;
  }
}

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

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    let splitDocs: any[] = [];

    if (document.type === "PDF") {
      const { WebPDFLoader } = await import("@langchain/community/document_loaders/web/pdf");
      const textDocs = await retryWithBackoff(async () => {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("Failed to fetch file from S3");
        const blob = await response.blob();
        const loader = new WebPDFLoader(blob);
        return loader.load();
      });
      
      if (!textDocs || textDocs.length === 0) {
        throw new Error("No text extracted from document");
      }

      // Pass the raw documents directly to the splitter so they retain their native pageNumber metadata!
      splitDocs = await splitter.splitDocuments(textDocs);
    } else {
      // Plain text
      const extractedText = await retryWithBackoff(async () => {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("Failed to fetch file from S3");
        return response.text();
      });

      if (!extractedText?.trim()) {
        throw new Error("No text extracted from document");
      }

      splitDocs = await splitter.createDocuments(
        [extractedText],
        [{ loc: { pageNumber: 1 } }]
      );
    }

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