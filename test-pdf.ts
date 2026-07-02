import { processDocument } from "./src/server/services/document-processor";
import { db } from "./src/lib/db";

async function main() {
  const doc = await db.document.findFirst({
    orderBy: { createdAt: "desc" }
  });
  if (!doc) {
    console.log("No document found in local db");
    return;
  }
  console.log("Testing processDocument on: " + doc.id);
  try {
    const res = await processDocument(doc.id);
    console.log("Success:", res);
  } catch (e) {
    console.error("Failed:", e);
  }
}
main();
