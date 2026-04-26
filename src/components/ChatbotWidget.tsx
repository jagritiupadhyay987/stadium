import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

const QUICK_PROMPTS = [
  "What is the highest priority incident right now?",
  "Summarize the current fan congestion hotspots.",
  "Which gates need extra staffing?",
  "Create a short safety announcement for concourse traffic.",
];

interface ChatbotWidgetProps {
  activeView: "ops" | "fan" | "roadmap";
}

export function ChatbotWidget({ activeView }: ChatbotWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendChat = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setError(null);
    const newMessages: ChatMessage[] = [...messages, { role: "user" as const, text: trimmed }];
    setMessages(newMessages);
    setQuery("");
    setLoading(true);

    try {
      const response = await fetch("/api/v1/chatbot/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          context_state: { view: activeView, timestamp: new Date().toISOString() },
        }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.response_text || "No response available." }]);
    } catch (err) {
      setError("Unable to reach the ops assistant. Try again later.");
      setMessages((prev) => [...prev, { role: "assistant", text: "I’m having trouble connecting to the backend assistant." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[320px] sm:w-[360px]">
      <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/30 bg-[#0B1A33]/95 border border-white/10 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3 bg-[#081326]">
          <div className="flex items-center gap-2 text-white">
            <MessageCircle className="w-5 h-5 text-[#7C83FF]" />
            <div>
              <p className="text-sm font-semibold">Ops Chat Assistant</p>
              <p className="text-[11px] text-white/50">Ask for summaries, dispatch advice, or safety scripts.</p>
            </div>
          </div>
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="rounded-full p-2 bg-white/5 text-white/80 hover:bg-white/10 transition"
            aria-label={open ? "Close chat" : "Open chat"}
          >
            {open ? <X className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {open ? (
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendChat(prompt)}
                  className="w-full rounded-lg border border-white/10 px-3 py-2 text-left text-xs text-white/80 hover:bg-white/5 transition"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 rounded-2xl bg-[#09192c]/80 p-3 border border-white/5">
              {messages.length === 0 && (
                <p className="text-xs text-white/50">Send a question to the ops assistant to get a fast response.</p>
              )}
              {messages.map((message, idx) => (
                <div key={`${message.role}-${idx}`} className={message.role === "user" ? "text-right" : "text-left"}>
                  <span className={message.role === "user" ? "inline-flex rounded-2xl bg-[#1F2F57]/90 px-3 py-2 text-xs text-white" : "inline-flex rounded-2xl bg-white/5 px-3 py-2 text-xs text-white/90"}>
                    {message.text}
                  </span>
                </div>
              ))}
            </div>

            {error && <div className="text-xs text-[#FF8A80]">{error}</div>}

            <div className="flex gap-2">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && sendChat(query)}
                className="flex-1 rounded-xl border border-white/10 bg-[#081326] px-3 py-2 text-sm text-white outline-none focus:border-[#7C83FF]"
                placeholder="Ask the ops assistant..."
              />
              <button
                onClick={() => sendChat(query)}
                disabled={loading}
                className="rounded-xl bg-[#7C83FF] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 text-xs text-white/60">Tap to expand the operational chatbot for live guidance.</div>
        )}
      </div>
    </div>
  );
}
