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
  let s3KeyToClean = "";

  try {
    const document = await db.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error("Document not found");
    }

    s3KeyToClean = document.s3Key;

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
        
        let loaderDocs: any[] = [];
        try {
          const loader = new WebPDFLoader(blob);
          loaderDocs = await loader.load();
        } catch (e) {
          console.warn("[Processor] WebPDFLoader failed parsing completely. Will fallback to AI OCR.");
        }

        const totalText = loaderDocs.map(d => d.pageContent).join("").trim();
        if (totalText.length < 50) {
          console.log("[Processor] Standard extraction failed (0 or low text). Falling back to Gemini Multimodal OCR...");
          const { GoogleGenerativeAI } = await import("@google/genai");
          const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
          if (!apiKey) throw new Error("Missing Gemini API key for OCR fallback");
          
          const genAI = new GoogleGenerativeAI({ apiKey });
          
          const arrayBuffer = await blob.arrayBuffer();
          const base64Data = Buffer.from(arrayBuffer).toString("base64");
          
          const prompt = "You are an expert OCR engine. Extract every word of this document exactly as written, in its original language. To preserve citation metadata, you MUST wrap every single page in [PAGE_X_START] and [PAGE_X_END] tags (e.g., [PAGE_1_START] text... [PAGE_1_END]). Do not add any conversational text or formatting outside of the original text.";
          
          const result = await genAI.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [
              {
                role: "user",
                parts: [
                  { inlineData: { data: base64Data, mimeType: "application/pdf" } },
                  { text: prompt }
                ]
              }
            ]
          });
          
          const ocrText = result.text || "";
          
          // Reconstruct pseudo-LangChain documents
          const pages = ocrText.split(/\[PAGE_\d+_START\]/g).filter(p => p.trim());
          
          loaderDocs = pages.map((pageText, idx) => {
              const cleanText = pageText.replace(/\[PAGE_\d+_END\]/g, "").trim();
              return {
                  pageContent: cleanText,
                  metadata: { loc: { pageNumber: idx + 1 } }
              };
          }).filter(d => d.pageContent.length > 0);
        }

        return loaderDocs;
      });
      
      if (!textDocs || textDocs.length === 0) {
        throw new Error("No text extracted from document after AI fallback");
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

      if (s3KeyToClean && process.env.S3_BUCKET_NAME) {
        const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
        await s3Client.send(new DeleteObjectCommand({
           Bucket: process.env.S3_BUCKET_NAME,
           Key: s3KeyToClean
        }));
        console.log(`[Processor] Cleaned up orphaned file from S3: ${s3KeyToClean}`);
      }
    } catch (e) {} // ignore if db or s3 fails here
    throw error;
  }
}