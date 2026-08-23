import { useState, useRef, useEffect } from "react";

const WELCOME = {
  id: "welcome",
  role: "ai",
 text: `As-salāmu ʿalaykum. I am the Bayt al-Ilm knowledge assistant, built by Akhi Abu Yahya. May Allah forgive him and his parents and reward them with Jannah.\n\nI can answer questions about Islamic fiqh and rulings — but only from the scholarly sources that have been uploaded to this system.\n\nIf your question is not covered by those sources, I will tell you clearly.\n\nPlease remember: this tool is for reference only. For personal matters, always consult a qualified scholar.`,
  sources: [],
};

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "#2a2010" }}>
        <span className="text-xs" style={{ color: "#c9973a" }}>ب</span>
      </div>
      <div className="chat-bubble-ai px-4 py-3 flex items-center gap-1">
        {[0,1,2].map(i => (
          <span key={i} className="typing-dot w-2 h-2 rounded-full inline-block"
            style={{ backgroundColor: "#c9973a", animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="chat-bubble-user px-4 py-3 max-w-[80%] text-sm leading-relaxed">
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 mb-4">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
        style={{ backgroundColor: "#2a2010" }}>
        <span className="text-xs font-bold" style={{ color: "#c9973a" }}>ب</span>
      </div>
      <div className="max-w-[85%]">
        <div className="chat-bubble-ai px-4 py-3 text-sm leading-relaxed"
          style={{ whiteSpace: "pre-line" }}>
          {msg.text}
        </div>

        {/* Error state */}
        {msg.error && (
          <p className="text-xs mt-1 px-1" style={{ color: "#c97a5a" }}>{msg.error}</p>
        )}

        {/* Sources */}
        {msg.sources && msg.sources.length > 0 && (
          <div className="mt-2 space-y-1">
            {msg.sources.map((src, i) => (
              <div key={i} className="text-xs px-3 py-2 rounded-lg"
                style={{ backgroundColor: "rgba(201,151,58,0.06)", border: "1px solid #2a2010", color: "#9a8a6a" }}>
                <span style={{ color: "#c9973a" }} className="font-semibold">
                  {src.book}
                </span>
                {src.page && <span> — Page {src.page}</span>}
                {src.excerpt && (
                  <p className="mt-0.5 italic" style={{ color: "#7a6a4a" }}>"{src.excerpt}"</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No sources disclaimer */}
        {msg.foundInSources === false && (
          <p className="text-xs mt-1 px-1" style={{ color: "#7a6a4a" }}>
            No matching passages found in the uploaded sources.
          </p>
        )}
      </div>
    </div>
  );
}

export default function Chatbot() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || loading) return;

    const userMsg = { id: Date.now(), role: "user", text: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), role: "ai", text: data.error || "Something went wrong.", sources: [], error: true },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            role: "ai",
            text: data.answer,
            sources: data.sources || [],
            foundInSources: data.foundInSources,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: "ai", text: "Network error. Please check your connection and try again.", sources: [], error: true },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([WELCOME]);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid #2a2010", backgroundColor: "#141008" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#c9973a" }}>
            <span className="font-bold text-sm" style={{ color: "#1a1208" }}>ب</span>
          </div>
          <div>
            <p className="font-amiri text-sm font-bold" style={{ color: "#e8dcc8" }}>
              Knowledge Assistant
            </p>
            <p className="text-xs" style={{ color: "#5a4a2e" }}>
              Answers from uploaded Islamic sources only
            </p>
          </div>
        </div>
        <button onClick={clearChat}
          className="text-xs px-3 py-1.5 rounded-lg transition hover:opacity-70 border"
          style={{ color: "#9a8a6a", borderColor: "#2a2010" }}
          title="Clear conversation">
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ minHeight: 0 }}>
        {messages.map((msg) => (
          <Message key={msg.id} msg={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Disclaimer */}
      <div className="px-4 py-2 text-center flex-shrink-0"
        style={{ borderTop: "1px solid #1a1208" }}>
        <p className="text-xs" style={{ color: "#3d2f14" }}>
          Informational tool only — not a substitute for a qualified scholar
        </p>
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0"
        style={{ borderTop: "1px solid #2a2010" }}>
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about Islamic rulings… (Enter to send)"
            rows={1}
            className="chat-input flex-1 rounded-xl px-4 py-3 text-sm resize-none"
            style={{ maxHeight: "120px" }}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-3 rounded-xl text-sm font-semibold transition flex-shrink-0"
            style={{
              backgroundColor: loading || !input.trim() ? "#2a2010" : "#c9973a",
              color: loading || !input.trim() ? "#5a4a2e" : "#1a1208",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            }}>
            {loading ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
