import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { generateStandaloneQuestion, retrieveChunks } from "@/server/services/rag";
import { NextResponse } from "next/server";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
});

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, chatId } = await req.json();
    const latestMessage = messages[messages.length - 1];
    const userQuery = latestMessage.content;
    const userId = session.user.id;

    // 1. Generate Standalone Question from Conversation History
    const history = messages.slice(0, -1);
    const standaloneQuestion = await generateStandaloneQuestion(history, userQuery);

    console.log(`[RAG] Original: "${userQuery}" | Standalone: "${standaloneQuestion}"`);

    // 2. Retrieve Relevant Chunks (Hybrid Search)
    const chunks = await retrieveChunks(userId, standaloneQuestion, 7);

    // 3. Assemble Multi-Document Context
    const contextStrings = chunks.map(chunk => {
      return `[Source: ${chunk.documentTitle}, Page ${chunk.pageNumber}]\n${chunk.content}`;
    });
    const context = contextStrings.join("\n\n---\n\n");

    // Create citations array to save to DB and send to client
    const citations = chunks.map(c => ({
      documentId: c.documentId,
      documentTitle: c.documentTitle,
      pageNumber: c.pageNumber,
    }));

    // 4. Save User Message
    let activeChatId = chatId;
    if (!activeChatId) {
      const newChat = await db.chat.create({
        data: { userId, title: userQuery.substring(0, 40) + "..." }
      });
      activeChatId = newChat.id;
    }

    await db.message.create({
      data: {
        chatId: activeChatId,
        role: "USER",
        content: userQuery,
      }
    });

    // 5. Generate Grounded AI Response
    const systemPrompt = `You are NoteSage, an intelligent study assistant.
You should prioritize answering the user's question using the provided Context, citing your sources inline using [Page X] or [Document Title].
If the answer is not contained in the Context, explicitly state that the information was not found in the uploaded documents, but then provide a helpful, custom answer based on your own general knowledge to assist the user. Do not state facts as coming from the documents if they are not.

Context:
${context}
`;

    // Map messages for LangChain
    const langchainMessages = [
      new SystemMessage(systemPrompt),
      ...messages.map((m: any) => 
        m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
      )
    ];

    const responseStream = await llm.stream(langchainMessages);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullText = "";
        try {
          for await (const chunk of responseStream) {
            const textChunk = chunk.content.toString();
            if (textChunk) {
              fullText += textChunk;
              controller.enqueue(encoder.encode(textChunk));
            }
          }
          
          // Save AI Message with citations metadata when complete
          await db.message.create({
            data: {
              chatId: activeChatId,
              role: "AI",
              content: fullText,
              sources: JSON.stringify(citations),
            }
          });
          controller.close();
        } catch (e) {
          console.error("[Stream Error]:", e);
          controller.error(e);
        }
      }
    });

    const citationsBase64 = Buffer.from(JSON.stringify(citations)).toString('base64');

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'x-chat-id': activeChatId,
        'x-citations': citationsBase64
      }
    });

  } catch (error) {
    console.error("[Chat API Error]:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
