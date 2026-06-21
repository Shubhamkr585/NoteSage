import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  try {
    console.log("Enabling pgvector...");
    await db.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log("pgvector enabled successfully!");
  } catch (err) {
    console.error("Failed to enable pgvector:", err);
  } finally {
    await db.$disconnect();
  }
}

main();
