import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import KidShell from "@/components/KidShell";
import ReadAloud from "@/components/ReadAloud";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";

const FEELINGS = ["worried", "sad", "scared", "happy", "angry", "lonely"];

export default function Affirmations() {
  const { childId } = useParams();
  const [child, setChild] = useState(null);
  const [text, setText] = useState("");
  const [feeling, setFeeling] = useState(null);
  const [loading, setLoading] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { api.get(`/children/${childId}`).then((r) => setChild(r.data)); }, [childId]);

  const generate = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/affirmation/generate", { age: child?.age || 8, feeling });
      setText(data.affirmation);
      await api.post(`/children/${childId}/activities`, { type: "affirmation", detail: data.affirmation });
    } catch (e) {
      setText("I am loved, I am brave, and God is always with me.");
    } finally { setLoading(false); }
  };

  return (
    <KidShell child={child} title="Happy Words" bg="linear-gradient(180deg,#FFE0DB 0%,#FDFBF7 55%)">
      <div className="mx-auto max-w-xl text-center">
        <Sparkles className="mx-auto h-12 w-12 text-[#F4A261]" strokeWidth={2.5} />
        <p className="text-lg text-[#457B9D] mt-2 mb-5">Tap to hear a special happy thought made just for you! 💛</p>

        <p className="text-sm font-semibold text-[#457B9D] mb-2">How are you feeling? (optional)</p>
        <div className="flex flex-wrap justify-center gap-2 mb-5">
          {FEELINGS.map((f) => (
            <button key={f} data-testid={`feeling-${f}`} onClick={() => setFeeling(f === feeling ? null : f)}
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${feeling === f ? "bg-[#FFA69E] text-white" : "bg-white text-[#457B9D] shadow-sm"}`}>{f}</button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {text && (
            <motion.div key={text} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              data-testid="affirmation-text" className="rounded-3xl bg-white p-8 shadow-sm mb-5">
              <p className="font-fredoka text-2xl md:text-3xl font-bold text-[#1D3557] leading-snug">"{text}"</p>
              <div className="mt-4 flex justify-center"><ReadAloud text={text} voice="ash" label="Hear it" testid="affirmation-read-btn" /></div>
            </motion.div>
          )}
        </AnimatePresence>

        <button data-testid="affirmation-generate" onClick={generate} disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F4A261] px-10 py-4 text-xl font-bold text-white transition hover:-translate-y-1 disabled:opacity-60">
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : text ? <RefreshCw className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
          {text ? "Another one!" : "Give me happy words!"}
        </button>
      </div>
    </KidShell>
  );
}
