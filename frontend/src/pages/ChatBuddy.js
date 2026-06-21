import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api, { API } from "@/lib/api";
import KidShell from "@/components/KidShell";
import ReadAloud from "@/components/ReadAloud";
import { ASSETS } from "@/lib/assets";
import { Send, Loader2 } from "lucide-react";

const STARTERS = ["I feel sad today", "I'm scared", "Tell me something happy", "I had a hard day"];

export default function ChatBuddy() {
  const { childId } = useParams();
  const [child, setChild] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    api.get(`/children/${childId}`).then((r) => setChild(r.data));
    api.get(`/children/${childId}/chat/history`).then((r) => setMessages(r.data.map((m) => ({ role: m.role, text: m.text }))));
  }, [childId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setInput("");
    setSending(true);
    setMessages((m) => [...m, { role: "user", text: msg }, { role: "assistant", text: "" }]);
    try {
      const res = await fetch(`${API}/children/${childId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: msg }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", text: copy[copy.length - 1].text + chunk };
          return copy;
        });
      }
    } catch (e) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", text: "I'm here for you, friend. 💛" };
        return copy;
      });
    } finally { setSending(false); }
  };

  return (
    <KidShell child={child} title="Talk to Sunny" bg="linear-gradient(180deg,#F3EEFA 0%,#FDFBF7 50%)">
      <div className="mx-auto max-w-2xl">
        <div className="space-y-4 mb-4 min-h-[40vh]">
          {messages.length === 0 && (
            <div className="text-center py-6">
              <img src={ASSETS.sunny} alt="Sunny" className="mx-auto h-28 w-28 object-contain" />
              <p className="text-lg text-[#457B9D] mt-2">Hi! I'm Sunny. You can tell me anything. 🐑💛</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}>
              {m.role === "assistant" && <img src={ASSETS.sunny} alt="" className="h-9 w-9 object-contain" />}
              <div data-testid={`chat-msg-${m.role}`}
                className={`max-w-[80%] rounded-3xl px-4 py-3 text-lg ${m.role === "user" ? "bg-[#457B9D] text-white rounded-br-md" : "bg-white text-[#1D3557] shadow-sm rounded-bl-md"}`}>
                {m.text || (sending ? <Loader2 className="h-5 w-5 animate-spin" /> : "")}
                {m.role === "assistant" && m.text && !sending && (
                  <div className="mt-2"><ReadAloud text={m.text} voice="coral" testid={`chat-read-${i}`} label="Hear it" /></div>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {STARTERS.map((s) => (
              <button key={s} data-testid={`starter-${s}`} onClick={() => send(s)}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#457B9D] shadow-sm transition hover:-translate-y-0.5">{s}</button>
            ))}
          </div>
        )}

        <div className="sticky bottom-4 flex items-center gap-2 rounded-full bg-white p-2 shadow-lg">
          <input data-testid="chat-input" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message..."
            className="flex-1 bg-transparent px-4 py-2 text-lg outline-none" />
          <button data-testid="chat-send" onClick={() => send()} disabled={sending}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#457B9D] text-white transition hover:scale-105 disabled:opacity-60">
            {sending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
          </button>
        </div>
      </div>
    </KidShell>
  );
}
