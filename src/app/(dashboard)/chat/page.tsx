import { ChatInterface } from "@/components/features/chat/ChatInterface";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  return (
    <div 
      className="w-full flex flex-col rounded-3xl bg-surface-container border border-outline-variant/40 relative overflow-hidden glass-panel"
      style={{ height: "calc(100vh - 160px)" }}
    >
      <ChatInterface />
    </div>
  );
}
