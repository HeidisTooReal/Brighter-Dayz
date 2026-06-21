import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import KidShell from "@/components/KidShell";
import ReadAloud from "@/components/ReadAloud";
import { ASSETS } from "@/lib/assets";
import { Heart, Sparkles, Loader2, Trash2, Send } from "lucide-react";

const PROMPTS = [
  "Thank You God for...",
  "God, please help me with...",
  "Please watch over...",
  "I'm sorry for...",
  "God, I feel... and I need You.",
];

export default function PrayerCorner() {
  const { childId } = useParams();
  const [child, setChild] = useState(null);
  const [text, setText] = useState("");
  const [prayers, setPrayers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [helping, setHelping] = useState(false);

  const loadPrayers = () => api.get(`/children/${childId}/prayers`).then((r) => setPrayers(r.data));

  useEffect(() => {
    api.get(`/children/${childId}`).then((r) => setChild(r.data));
    loadPrayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post(`/children/${childId}/prayers`, { text, kind: "prayer" });
      setChild(data.child);
      setText("");
      await loadPrayers();
    } catch (e) { console.error("Failed to save prayer:", e); }
    finally { setSaving(false); }
  };

  const helpMePray = async () => {
    setHelping(true);
    try {
      const { data } = await api.post("/prayer/generate", { age: child?.age || 8 });
      setText(data.prayer);
    } catch (e) { console.error("Prayer helper failed:", e); }
    finally { setHelping(false); }
  };

  const remove = async (id) => {
    try { await api.delete(`/children/${childId}/prayers/${id}`); await loadPrayers(); }
    catch (e) { console.error("Failed to delete prayer:", e); }
  };

  return (
    <KidShell child={child} title="Prayer Corner" bg="linear-gradient(180deg,#EAF0FB 0%,#FDFBF7 55%)">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <motion.img src={ASSETS.sunny} alt="Sunny" className="h-16 w-16 object-contain"
            animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2.5 }} />
          <p className="text-lg text-[#457B9D]">Talk to God anytime. He always listens and He loves you so much. 🕊️</p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#457B9D] mb-2">Need help starting?</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {PROMPTS.map((p) => (
              <button key={p} data-testid={`prayer-prompt-${p}`} onClick={() => setText((t) => (t ? t + " " : "") + p + " ")}
                className="rounded-full bg-[#EAF0FB] px-3 py-1.5 text-sm font-semibold text-[#457B9D] transition hover:-translate-y-0.5">{p}</button>
            ))}
          </div>
          <textarea data-testid="prayer-input" value={text} onChange={(e) => setText(e.target.value)} rows={5}
            placeholder="Dear God..." className="w-full rounded-2xl border-2 border-[#E2E8F0] p-4 text-lg outline-none focus:border-[#457B9D]" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button data-testid="prayer-help" onClick={helpMePray} disabled={helping}
              className="inline-flex items-center gap-2 rounded-full bg-[#E8DFF5] px-4 py-2 font-semibold text-[#5b3f8a] transition hover:-translate-y-0.5 disabled:opacity-60">
              {helping ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />} Help me pray
            </button>
            {text.trim() && <ReadAloud text={text} voice="onyx" label="Read it" testid="prayer-read" />}
            <button data-testid="prayer-save" onClick={save} disabled={saving || !text.trim()}
              className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#457B9D] px-6 py-2 font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-50">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />} Amen
            </button>
          </div>
        </div>

        {prayers.length > 0 && (
          <div className="mt-8">
            <h3 className="font-fredoka text-xl font-bold text-[#1D3557] mb-3 flex items-center gap-2"><Heart className="h-5 w-5 text-[#FFA69E]" /> My Prayers</h3>
            <div className="space-y-3">
              <AnimatePresence>
                {prayers.map((p) => (
                  <motion.div key={p.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    data-testid={`prayer-${p.id}`} className="flex items-start justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
                    <div>
                      <p className="text-[#1D3557] whitespace-pre-line">{p.text}</p>
                      <p className="mt-1 text-xs text-[#94a3b8]">{new Date(p.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
                    </div>
                    <button data-testid={`prayer-delete-${p.id}`} onClick={() => remove(p.id)} className="text-[#cbd5e1] hover:text-[#ef4444] transition"><Trash2 className="h-5 w-5" /></button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </KidShell>
  );
}
