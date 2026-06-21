import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import KidShell from "@/components/KidShell";
import { Wind, Flower2 } from "lucide-react";

const KIND_WORDS = ["You are brave!", "God loves you!", "You are kind!", "You can do it!", "You are safe!", "You shine!", "Good job!", "You matter!"];

function WorryBubbles({ childId }) {
  const [bubbles, setBubbles] = useState([]);
  const [popped, setPopped] = useState(0);
  const [word, setWord] = useState("");

  useEffect(() => {
    const id = setInterval(() => {
      setBubbles((b) => [...b, { id: Math.random(), x: 10 + Math.random() * 80, size: 50 + Math.random() * 50 }].slice(-8));
    }, 900);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pop = async (id) => {
    setBubbles((b) => b.filter((x) => x.id !== id));
    setWord(KIND_WORDS[Math.floor(Math.random() * KIND_WORDS.length)]);
    const n = popped + 1;
    setPopped(n);
    if (n === 5) {
      try { await api.post(`/children/${childId}/activities`, { type: "game", detail: "Worry Bubbles" }); }
      catch (e) { console.error("Failed to log activity:", e); }
    }
  };

  return (
    <div className="relative h-[60vh] overflow-hidden rounded-3xl bg-gradient-to-b from-[#CDEAFE] to-[#E8F7FF]">
      <p className="absolute top-3 left-0 right-0 text-center font-fredoka font-bold text-[#1D3557] z-10">Pop the worry bubbles! 🫧 Popped: {popped}</p>
      <AnimatePresence>
        {bubbles.map((b) => (
          <motion.button key={b.id} data-testid="worry-bubble" onClick={() => pop(b.id)}
            initial={{ y: "65vh", opacity: 0 }} animate={{ y: "-20vh", opacity: 1 }} exit={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 7, ease: "linear" }}
            className="absolute rounded-full bg-white/60 border-2 border-white shadow-md"
            style={{ left: `${b.x}%`, width: b.size, height: b.size }} />
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {word && (
          <motion.div key={word} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ opacity: 0 }}
            onAnimationComplete={() => setTimeout(() => setWord(""), 700)}
            className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="font-fredoka text-3xl font-bold text-[#457B9D] bg-white/80 rounded-full px-6 py-3">{word}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GratitudeGarden({ childId }) {
  const [items, setItems] = useState([]);
  const [val, setVal] = useState("");
  const FLOWERS = ["🌸", "🌻", "🌷", "🌼", "🌹", "💐"];

  const add = async () => {
    if (!val.trim()) return;
    const next = [...items, { id: Math.random().toString(36).slice(2), text: val.trim() }];
    setItems(next);
    setVal("");
    if (next.length === 3) {
      try { await api.post(`/children/${childId}/activities`, { type: "game", detail: "Gratitude Garden" }); }
      catch (e) { console.error("Failed to log activity:", e); }
    }
  };

  return (
    <div className="rounded-3xl bg-gradient-to-b from-[#D8F3DC] to-[#F0FFF4] p-6">
      <p className="font-fredoka text-xl font-bold text-[#1D3557] text-center mb-1">My Thankful Garden 🌱</p>
      <p className="text-center text-[#457B9D] mb-4">What are you thankful for today? Plant a flower for each one!</p>
      <div className="flex gap-2 mb-4">
        <input data-testid="gratitude-input" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="I am thankful for..." className="flex-1 rounded-full border-2 border-white bg-white px-4 py-3 text-lg outline-none" />
        <button data-testid="gratitude-add" onClick={add} className="rounded-full bg-[#52b788] px-6 font-bold text-white">Plant 🌷</button>
      </div>
      <div className="min-h-[30vh] flex flex-wrap content-end gap-3 justify-center">
        {items.map((it, i) => (
          <motion.div key={i} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            data-testid="gratitude-flower" className="flex flex-col items-center">
            <span className="text-5xl">{FLOWERS[i % FLOWERS.length]}</span>
            <span className="text-sm font-semibold text-[#1D3557] max-w-[120px] text-center">{it}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function Games() {
  const { childId } = useParams();
  const [child, setChild] = useState(null);
  const [game, setGame] = useState(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { api.get(`/children/${childId}`).then((r) => setChild(r.data)); }, [childId]);

  return (
    <KidShell child={child} title="Calm Games" bg="linear-gradient(180deg,#E6F4FF 0%,#FDFBF7 60%)">
      {!game ? (
        <div className="grid sm:grid-cols-2 gap-5">
          <button data-testid="game-bubbles" onClick={() => setGame("bubbles")}
            className="flex flex-col items-center gap-3 rounded-3xl bg-[#CDEAFE] p-8 shadow-sm transition hover:-translate-y-1">
            <Wind className="h-12 w-12 text-[#1D3557]" strokeWidth={2.5} />
            <span className="font-fredoka text-xl font-bold text-[#1D3557]">Worry Bubbles</span>
            <span className="text-sm text-[#457B9D] text-center">Pop your worries away</span>
          </button>
          <button data-testid="game-garden" onClick={() => setGame("garden")}
            className="flex flex-col items-center gap-3 rounded-3xl bg-[#D8F3DC] p-8 shadow-sm transition hover:-translate-y-1">
            <Flower2 className="h-12 w-12 text-[#1D3557]" strokeWidth={2.5} />
            <span className="font-fredoka text-xl font-bold text-[#1D3557]">Thankful Garden</span>
            <span className="text-sm text-[#457B9D] text-center">Grow a garden of gratitude</span>
          </button>
        </div>
      ) : (
        <div>
          <button data-testid="games-back" onClick={() => setGame(null)} className="mb-3 font-semibold text-[#457B9D]">← Pick another game</button>
          {game === "bubbles" ? <WorryBubbles childId={childId} /> : <GratitudeGarden childId={childId} />}
        </div>
      )}
    </KidShell>
  );
}
