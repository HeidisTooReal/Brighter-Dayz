import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/lib/api";
import KidShell from "@/components/KidShell";

const EXERCISES = {
  "478": { name: "4-7-8 Calm Breath", steps: [["Breathe In", 4], ["Hold", 7], ["Breathe Out", 8]] },
  "box": { name: "Box Breathing", steps: [["Breathe In", 4], ["Hold", 4], ["Breathe Out", 4], ["Hold", 4]] },
};

export default function Breathe() {
  const { childId } = useParams();
  const [child, setChild] = useState(null);
  const [type, setType] = useState("478");
  const [running, setRunning] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [count, setCount] = useState(0);
  const [cycles, setCycles] = useState(0);
  const timer = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { api.get(`/children/${childId}`).then((r) => setChild(r.data)); }, [childId]);

  const ex = EXERCISES[type];
  const [label, dur] = ex.steps[stepIdx];

  useEffect(() => {
    if (!running) return;
    if (count >= dur) {
      const next = (stepIdx + 1) % ex.steps.length;
      setStepIdx(next);
      setCount(0);
      if (next === 0) setCycles((c) => c + 1);
      return;
    }
    timer.current = setTimeout(() => setCount((c) => c + 1), 1000);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, count, stepIdx]);

  const start = () => { setRunning(true); setStepIdx(0); setCount(0); setCycles(0); };
  const stop = async () => {
    setRunning(false);
    clearTimeout(timer.current);
    if (cycles >= 1) {
      try { await api.post(`/children/${childId}/activities`, { type: "breathing", detail: ex.name }); }
      catch (e) { console.error("Failed to log activity:", e); }
    }
  };

  const scale = label === "Breathe In" ? 1.4 : label === "Breathe Out" ? 0.7 : 1;

  return (
    <KidShell child={child} title="Breathe & Calm" bg="linear-gradient(180deg,#DDF3E6 0%,#FDFBF7 60%)">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-lg text-[#457B9D] mb-2">"Be still and know that I am God." — Psalm 46:10</p>

        <div className="flex justify-center gap-2 my-4">
          {Object.entries(EXERCISES).map(([k, v]) => (
            <button key={k} data-testid={`breathe-type-${k}`} disabled={running} onClick={() => setType(k)}
              className={`rounded-full px-4 py-2 font-semibold transition ${type === k ? "bg-[#52b788] text-white" : "bg-white text-[#457B9D] shadow-sm"}`}>{v.name}</button>
          ))}
        </div>

        <div className="relative flex h-80 items-center justify-center">
          <motion.div className="absolute rounded-full bg-[#95D5B2]/50" style={{ width: 220, height: 220 }}
            animate={{ scale: running ? scale : 1 }} transition={{ duration: running ? dur : 0.6, ease: "easeInOut" }} />
          <motion.div className="absolute rounded-full bg-[#74C69D]/70" style={{ width: 150, height: 150 }}
            animate={{ scale: running ? scale : 1 }} transition={{ duration: running ? dur : 0.6, ease: "easeInOut" }} />
          <div className="relative z-10 text-center">
            <p data-testid="breathe-label" className="font-fredoka text-3xl font-bold text-[#1D3557]">{running ? label : "Ready?"}</p>
            {running && <p className="text-5xl font-bold text-[#1D3557]">{dur - count}</p>}
          </div>
        </div>

        <p className="text-[#457B9D] mb-4">Breaths completed: <b data-testid="breathe-cycles">{cycles}</b></p>

        {!running ? (
          <button data-testid="breathe-start" onClick={start}
            className="rounded-full bg-[#52b788] px-10 py-4 text-xl font-bold text-white transition hover:-translate-y-1">Begin 🌬️</button>
        ) : (
          <button data-testid="breathe-stop" onClick={stop}
            className="rounded-full bg-white px-10 py-4 text-xl font-bold text-[#457B9D] shadow transition hover:-translate-y-1">I feel calmer ✓</button>
        )}
      </div>
    </KidShell>
  );
}
