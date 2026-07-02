import { db } from "./src/lib/db";

async function main() {
  const result = await db.document.updateMany({
    data: {
      status: "READY"
    }
  });
  console.log(`Updated ${result.count} documents to READY`);
}

main().catch(console.error);
