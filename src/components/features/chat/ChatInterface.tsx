"use client";

import { Send, Sparkles, StopCircle, ArrowUp, BookOpen } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

type Message = {
  id: string;
  role: "user" | "assistant" | "model";
  content: string;
};

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          chatId: chatId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const newChatId = response.headers.get("x-chat-id");
      if (newChatId && !chatId) {
        setChatId(newChatId);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No readable stream");

      const decoder = new TextDecoder();
      let aiContent = "";
      const aiMessageId = (Date.now() + 1).toString();

      setMessages((prev) => [...prev, { id: aiMessageId, role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        aiContent += chunkText;

        setMessages((prev) => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: aiContent } 
              : msg
          )
        );
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Chat Error:", error);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const quickPrompts = [
    "Summarize my documents",
    "Key takeaways",
    "Explain a concept",
    "Create a study quiz",
  ];

  return (
    <div className="flex w-full h-full relative overflow-hidden bg-transparent">

      {/* AI Copilot Chat Panel — full width */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/40 bg-surface-container/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="text-on-primary w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline-md font-bold text-on-surface">NoteSage Doc Chat</h3>
              <p className="text-xs text-on-surface-variant">Ask anything about your documents and notes</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-8 max-w-lg mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-on-surface">Doc Chat Assistant</h2>
                <p className="text-on-surface-variant text-body-md leading-relaxed">
                  Ask questions about your uploaded documents, get summaries, explanations, and AI-powered insights to accelerate your learning.
                </p>
              </div>

              {/* How it works */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                {[
                  { icon: BookOpen, title: "Document Q&A", desc: "Ask questions about your PDFs and notes" },
                  { icon: Sparkles, title: "AI Insights", desc: "Get key takeaways and explanations" },
                  { icon: Send, title: "Library Search", desc: "Explore topics across your library" },
                ].map((feat) => (
                  <div key={feat.title} className="p-4 bg-surface-container rounded-xl border border-outline-variant/30 space-y-2">
                    <feat.icon className="w-5 h-5 text-primary" />
                    <p className="font-semibold text-on-surface text-sm">{feat.title}</p>
                    <p className="text-xs text-on-surface-variant">{feat.desc}</p>
                  </div>
                ))}
              </div>

              {/* Quick prompts */}
              <div className="w-full space-y-3">
                <p className="text-label-sm text-on-surface-variant text-left font-semibold uppercase tracking-widest">Try asking</p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => { setInput(prompt); }}
                      className="text-label-sm bg-surface-container hover:bg-primary/10 text-on-surface-variant hover:text-primary px-4 py-2 rounded-full border border-outline-variant/40 transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((m) => (
              m.role === "user" ? (
                <div key={m.id} className="flex flex-col gap-2 items-end">
                  <div className="bg-primary/10 border border-primary/20 px-4 py-3 rounded-2xl rounded-tr-none max-w-[80%]">
                    <p className="text-body-md text-on-surface whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex flex-col gap-4 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Sparkles className="text-[14px] text-on-primary w-3 h-3" />
                    </div>
                    <span className="text-label-sm font-bold text-primary">NoteSage AI</span>
                  </div>
                  <div className="space-y-4">
                    <p className="text-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                      {m.content}
                    </p>
                  </div>
                </div>
              )
            ))
          )}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse">
                  <Sparkles className="text-[14px] text-on-primary w-3 h-3" />
                </div>
                <span className="text-label-sm font-bold text-primary">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-6 border-t border-outline-variant/40 space-y-4 bg-surface-container/60">
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {quickPrompts.slice(0, 2).map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="text-label-sm bg-surface-container-high hover:bg-primary/10 text-on-surface-variant hover:text-primary px-3 py-2 rounded-full border border-outline-variant/30 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit} className="relative group">
            <textarea 
              className="w-full bg-surface-container-low border border-outline-variant/40 rounded-2xl p-4 pr-12 text-body-md text-on-surface focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all resize-none placeholder:text-on-surface-variant/40 outline-none" 
              placeholder="Ask anything about your documents..." 
              rows={2}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            {isLoading ? (
               <button type="button" onClick={stop} className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-error text-on-error flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                 <StopCircle className="w-4 h-4" />
               </button>
            ) : (
               <button type="submit" disabled={!input.trim()} className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100">
                 <ArrowUp className="w-5 h-5" />
               </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
