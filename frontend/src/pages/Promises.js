import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import KidShell from "@/components/KidShell";
import ReadAloud from "@/components/ReadAloud";
import { ASSETS } from "@/lib/assets";

export default function Promises() {
  const { childId } = useParams();
  const [child, setChild] = useState(null);
  const [cats, setCats] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.get(`/children/${childId}`).then((r) => setChild(r.data));
    api.get("/scriptures").then((r) => { setCats(r.data.categories); setActive(r.data.categories[0]); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  return (
    <KidShell child={child} title="God's Promises" bg="linear-gradient(180deg,#FFF6E9 0%,#FDFBF7 55%)">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3 mb-5">
          <img src={ASSETS.jesus} alt="Jesus the Good Shepherd" className="h-20 w-20 object-contain" />
          <p className="text-lg text-[#457B9D]">God has a promise for every feeling. Tap how you feel to hear His Word. 💛</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {cats.map((c) => (
            <button key={c.id} data-testid={`promise-cat-${c.id}`} onClick={() => setActive(c)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition hover:-translate-y-0.5 ${active?.id === c.id ? "text-[#1D3557] shadow" : "text-[#457B9D] bg-white shadow-sm"}`}
              style={active?.id === c.id ? { background: c.color } : {}}>
              <span>{c.emoji}</span> {c.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {active && (
            <motion.div key={active.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-3">
              {active.verses.map((v, i) => (
                <div key={i} data-testid={`promise-verse-${active.id}-${i}`} className="rounded-3xl p-5 shadow-sm" style={{ background: active.color + "66" }}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xl leading-relaxed text-[#1D3557]">"{v.text}"</p>
                    <ReadAloud text={`${v.text} ${v.ref}`} voice="ash" label="Hear it" testid={`promise-read-${active.id}-${i}`} />
                  </div>
                  <p className="mt-2 text-sm font-bold text-[#457B9D]">— {v.ref}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </KidShell>
  );
}
