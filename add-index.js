const { Client } = require('pg');
require('dotenv').config();

async function addIndex() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log("Connected to database...");
    
    const query = `
      ALTER TABLE "DocumentChunk" ADD COLUMN IF NOT EXISTS "fts_vector" tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce("content", ''))) STORED;
      CREATE INDEX IF NOT EXISTS "DocumentChunk_fts_idx" ON "DocumentChunk" USING GIN ("fts_vector");
    `;
    await client.query(query);
    
    console.log("Successfully created GIN index on DocumentChunk.fts_vector!");
  } catch (err) {
    console.error("Error creating index:", err);
  } finally {
    await client.end();
  }
}

addIndex();
