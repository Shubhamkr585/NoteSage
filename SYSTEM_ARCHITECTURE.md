dfari

# NoteSage System Architecture & Interview Master Guide

This document is your ultimate cheat sheet for system design and technical interviews. It breaks down every feature we built, the database design, and the complex mathematical algorithms used in NoteSage.

---

## 1. Core Features & How They Are Implemented

### A. Secure File Uploads (AWS S3 Pre-Signed URLs)

**The Problem:** Normally, when a user uploads a PDF, it goes to the Next.js server first, which then forwards it to an AWS bucket. If the file is 50MB, it consumes 50MB of server RAM and blocks other users from using the site.
**How We Implemented It:** We used **Pre-Signed URLs**.

1. The React frontend asks Next.js for permission to upload.
2. Next.js securely asks AWS S3 to generate a temporary, cryptographically signed URL (valid for 5 minutes).
3. The React frontend takes that URL and uploads the massive PDF *directly* from the user's browser to the AWS S3 Bucket. The Next.js server never even touches the file, saving massive amounts of RAM and bandwidth.

### B. Fault-Tolerant Background Processing (Redis + BullMQ)

**The Problem:** Extracting text from a 100-page PDF and sending it to Gemini to generate 3072-dimensional embeddings takes 30+ seconds. If we did this on the main Next.js API route, the HTTP request would timeout (504 Gateway Timeout) and the user would see a crashed page.
**How We Implemented It:**

1. When a document is saved to the database, we instantly return a `200 OK` to the user.
2. Behind the scenes, Next.js adds a "Job" to a **Redis Queue** (using BullMQ).
3. We run a separate background process (`notesage-worker`) using PM2. This worker constantly listens to Redis.
4. The worker picks up the job, downloads the PDF from S3, extracts the text using `pdf-parse`, chunks it using LangChain, generates the embeddings, and saves them to the database. If the worker crashes mid-job, Redis remembers the job and assigns it again when the worker reboots (Fault Tolerance).

### C. Bulletproof Citations (Metadata Preservation)

**The Problem:** LLMs naturally hallucinate. We need to prove where the AI got its answers.
**How We Implemented It:**

1. During the background worker phase, we pass the raw PDF pages into LangChain's `splitDocuments()` function. This preserves the mathematical `pageNumber` for every single 1,000-character chunk.
2. When the user asks a question, we retrieve the top 5 chunks.
3. We send the chunks to the AI, but we *also* extract the `pageNumber` from those chunks and send it to the frontend React app via a hidden HTTP header (`x-citations`).
4. The React UI parses that header and renders physical badges (e.g., 🔖 Page 14) so the user knows exactly where the AI sourced the information.

---

## 2. Database Design (Neon Serverless PostgreSQL)

We designed a highly normalized relational database using Prisma.

* **`User`**: Stores authentication data (managed by Better Auth).
* **`Document`**: Represents the uploaded PDF. It contains a `status` enum (`UPLOADING`, `PROCESSING`, `READY`) which the UI constantly polls to show loading spinners.
* **`DocumentChunk`**: A One-to-Many relationship with `Document`. One 50-page PDF might be broken down into 200 chunks.
  * *The Magic Column:* `embedding Unsupported("vector(3072)")`. This uses the `pgvector` extension to store arrays of 3,072 floating-point numbers.
* **`Chat` & `Message`**: Tracks the user's conversation history. The `Message` table has a `sources Json` column where we permanently store the citations used for that specific AI response.

---

## 3. The Mathematics of Retrieval-Augmented Generation (RAG)

NoteSage does not just use standard Vector Search. It uses **Hybrid Search with Reciprocal Rank Fusion (RRF)**. This is a highly advanced, senior-level system design feature.

### A. Semantic Vector Search (Cosine Distance)

When a user asks a question (e.g., *"How do plants eat?"*), we convert that sentence into a 3072-dimensional vector using the Gemini Embedding API.
We then use PostgreSQL to compare the question's vector against all the document chunk vectors.

* **The Formula:** `c."embedding" <=> ${queryEmbeddingString}::vector`
* **How it works:** The `<=>` operator mathematically calculates the **Cosine Distance** between the vectors. It measures the "angle" between the two points in a 3072-dimensional space. If the angle is very small, the two sentences mean the exact same thing *conceptually*, even if they use completely different words (like "eat" vs "photosynthesis").

### B. Full-Text Keyword Search

Vector search is bad at finding exact names, acronyms, or serial numbers. If the user searches for "NASA", vector search might return "SpaceX" because they are conceptually similar.

* **The Formula:** `to_tsvector('english', content) @@ plainto_tsquery('english', query)`
* **How it works:** We use Postgres's built-in text search (`tsvector`) to do traditional, exact keyword matching (similar to how Google originally worked).

### C. Reciprocal Rank Fusion (RRF) - The Ultimate Formula

We now have two lists of results:

1. Top 20 results based on Conceptual Meaning (Vector Rank).
2. Top 20 results based on Exact Keywords (Keyword Rank).
   Because "Cosine Distance scores" and "Keyword Frequency scores" are completely different mathematical units, you cannot simply add them together.

* **The RRF Formula:**
  ```sql
  RRF_Score = (1.0 / (60 + vector_rank)) + (1.0 / (60 + keyword_rank))
  ```
* **How it works:** Instead of looking at their raw scores, we look at their **Rank** (1st place, 2nd place, 3rd place).
  * If a chunk of text is 1st place in Vector Search and 1st place in Keyword search, its score is: `(1/61) + (1/61) = 0.032`.
  * The constant `60` is a smoothing factor discovered by researchers at the University of Waterloo that prevents highly-ranked outliers from completely dominating the search results.
* **The Result:** By sorting our chunks by this final `RRF_Score`, we pull the absolute best, most relevant paragraphs out of a 1,000-page textbook and feed them to the Gemini AI to generate a flawless answer.
