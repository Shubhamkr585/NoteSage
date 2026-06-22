<div align="center">
  <img src="./public/hero.png" alt="NoteSage Hero" width="800px" />
  <h1>NoteSage</h1>
  <p><strong>An advanced AI-powered study platform featuring Retrieval-Augmented Generation (RAG) and Hybrid Search.</strong></p>
</div>

---

## 🚀 Overview

NoteSage is a modern full-stack web application designed to help students interact deeply with their study materials. By uploading textbooks and PDF documents, users can "chat" with their notes, automatically generate spaced-repetition flashcards, take AI-graded quizzes, and create intelligent study plans based on their exam dates.

## ✨ Core Features

* **Document Chat (RAG):** Securely upload PDFs directly to AWS S3. NoteSage chunks, embeds, and vectorizes your documents so you can ask natural language questions and receive highly accurate AI answers sourced directly from your textbook.
* **Intelligent Flashcards:** Automatically generate spaced-repetition flashcards from your documents, ensuring long-term memory retention.
* **AI Quiz Generation:** Prompt-engineered generation of strict JSON-based multiple-choice quizzes to test your knowledge on specific chapters.
* **Automated Study Planner:** Calculates reading velocity and automatically schedules document chapters based on your target exam date.

---

## 🧠 Deep Dive: Hybrid Search Architecture

NoteSage does not rely on standard Vector Search. To guarantee absolute precision—especially when searching for specific acronyms, ID numbers, or names—NoteSage implements **Hybrid Search with Reciprocal Rank Fusion (RRF)** directly inside PostgreSQL.

<div align="center">
  <img src="./public/hybrid_search.png" alt="Hybrid Search Architecture" width="600px" />
</div>

### How it works:
1. **Vector Search (`pgvector`):** The user's query is converted into a 3072-dimensional vector using the Gemini API. We calculate the mathematical *cosine distance* against all document chunks to find paragraphs with the exact same **meaning** or semantic intent.
2. **Keyword Search (`to_tsvector`):** Simultaneously, we run a traditional PostgreSQL Full-Text Search to find exact **keyword** matches in the text.
3. **Reciprocal Rank Fusion (RRF):** We merge both lists together using the RRF mathematical formula `(1.0 / (60 + rank))`. This ensures that a text chunk containing both high semantic meaning AND the exact keywords floats to the absolute top of the results.

The resulting top 5 chunks are injected into a secure system prompt, and the Gemini 1.5 model streams the final answer back to the React UI using Server Actions.

---

## 🛠️ Tech Stack

* **Frontend:** Next.js (App Router), React, TailwindCSS, `useTransition` for UI optimization
* **Backend:** Next.js Server Actions, Node.js
* **Database:** PostgreSQL, Prisma ORM, `pgvector`
* **AI / LLM:** Google Gemini 1.5 Flash, Langchain
* **Storage:** AWS S3 (Direct Uploads via Pre-signed URLs)
* **Authentication:** Better Auth (Email/Password & Google OAuth)
* **Deployment:** Docker, Docker Compose, AWS EC2

---

## ⚙️ Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Shubhamkr585/NoteSage.git
   cd NoteSage/notesage/notesage
   ```

2. **Configure Environment Variables:**
   Create a `.env` file based on `.env.example`. You will need AWS S3 Credentials, a Google Gemini API Key, and Google OAuth credentials.

3. **Deploy via Docker:**
   ```bash
   docker compose build --no-cache
   docker compose up -d
   ```

4. **Initialize Database:**
   ```bash
   docker compose exec app npx prisma db push
   ```

5. **Access the Application:**
   Open `http://localhost` in your browser.
