import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/lib/api";
import KidShell from "@/components/KidShell";
import { Volume2, VolumeX, Loader2 } from "lucide-react";

// Gentle, short holds for little ones (<= 8). Calmer, longer for older kids.
const YOUNG_EXERCISES = {
  balloon: { name: "Balloon Breath", steps: [["Breathe In", 4], ["Breathe Out", 4]] },
  flower: { name: "Smell the Flower", steps: [["Smell the Flower", 4], ["Hold", 2], ["Blow the Petals", 4]] },
};
const OLDER_EXERCISES = {
  "478": { name: "4-7-8 Calm Breath", steps: [["Breathe In", 4], ["Hold", 7], ["Breathe Out", 8]] },
  box: { name: "Box Breathing", steps: [["Breathe In", 4], ["Hold", 4], ["Breathe Out", 4], ["Hold", 4]] },
};

function getScale(label) {
  if (/in|smell/i.test(label)) return 1.4;
  if (/out|blow/i.test(label)) return 0.7;
  return 1;
}

export default function Breathe() {
  const { childId } = useParams();
  const [child, setChild] = useState(null);
  const [type, setType] = useState(null);
  const [running, setRunning] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [count, setCount] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [voiceOn, setVoiceOn] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const timer = useRef(null);
  const voiceRef = useRef({});

  useEffect(() => {
    api.get(`/children/${childId}`).then((r) => {
      setChild(r.data);
      const young = (r.data?.age || 8) <= 8;
      setType(young ? "balloon" : "478");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  const young = (child?.age || 8) <= 8;
  const EXERCISES = young ? YOUNG_EXERCISES : OLDER_EXERCISES;
  const ex = type && EXERCISES[type] ? EXERCISES[type] : Object.values(EXERCISES)[0];
  const [label, dur] = ex.steps[stepIdx] || ex.steps[0];

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

  // Speak the current step when it changes (voice guidance)
  useEffect(() => {
    if (!running || !voiceOn) return;
    const url = voiceRef.current[label];
    if (url) { const a = new Audio(url); a.play().catch(() => {}); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx, running]);

  const prepareVoice = async () => {
    const labels = [...new Set(ex.steps.map((s) => s[0]))];
    const map = {};
    await Promise.all(labels.map(async (lab) => {
      try {
        const { data } = await api.post("/tts", { text: lab + ".", voice: "ash", speed: 1.0 });
        map[lab] = data.audio;
      } catch (e) { console.error("Voice prep failed:", e); }
    }));
    voiceRef.current = map;
  };

  const start = async () => {
    if (voiceOn) { setPreparing(true); await prepareVoice(); setPreparing(false); }
    setStepIdx(0); setCount(0); setCycles(0); setRunning(true);
  };
  const stop = async () => {
    setRunning(false);
    clearTimeout(timer.current);
    if (cycles >= 1) {
      try { await api.post(`/children/${childId}/activities`, { type: "breathing", detail: ex.name }); }
      catch (e) { console.error("Failed to log activity:", e); }
    }
  };

  const scale = getScale(label);

  return (
    <KidShell child={child} title="Breathe & Calm" bg="linear-gradient(180deg,#DDF3E6 0%,#FDFBF7 60%)">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-lg text-[#457B9D] mb-2">"Be still and know that I am God." — Psalm 46:10</p>

        <div className="flex flex-wrap justify-center items-center gap-2 my-4">
          {Object.entries(EXERCISES).map(([k, v]) => (
            <button key={k} data-testid={`breathe-type-${k}`} disabled={running} onClick={() => setType(k)}
              className={`rounded-full px-4 py-2 font-semibold transition ${type === k ? "bg-[#52b788] text-white" : "bg-white text-[#457B9D] shadow-sm"}`}>{v.name}</button>
          ))}
          <button data-testid="breathe-voice-toggle" disabled={running} onClick={() => setVoiceOn((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-full px-4 py-2 font-semibold transition ${voiceOn ? "bg-[#457B9D] text-white" : "bg-white text-[#457B9D] shadow-sm"}`}>
            {voiceOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            {voiceOn ? "Voice on" : "Voice off"}
          </button>
        </div>

        <div className="relative flex h-80 items-center justify-center">
          <motion.div className="absolute rounded-full bg-[#95D5B2]/50" style={{ width: 220, height: 220 }}
            animate={{ scale: running ? scale : 1 }} transition={{ duration: running ? dur : 0.6, ease: "easeInOut" }} />
          <motion.div className="absolute rounded-full bg-[#74C69D]/70" style={{ width: 150, height: 150 }}
            animate={{ scale: running ? scale : 1 }} transition={{ duration: running ? dur : 0.6, ease: "easeInOut" }} />
          <div className="relative z-10 text-center px-4">
            <p data-testid="breathe-label" className="font-fredoka text-2xl md:text-3xl font-bold text-[#1D3557]">{running ? label : "Ready?"}</p>
            {running && <p className="text-5xl font-bold text-[#1D3557]">{dur - count}</p>}
          </div>
        </div>

        <p className="text-[#457B9D] mb-4">Breaths completed: <b data-testid="breathe-cycles">{cycles}</b></p>

        {!running ? (
          <button data-testid="breathe-start" onClick={start} disabled={preparing}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#52b788] px-10 py-4 text-xl font-bold text-white transition hover:-translate-y-1 disabled:opacity-60">
            {preparing ? <><Loader2 className="h-6 w-6 animate-spin" /> Getting ready...</> : "Begin 🌬️"}
          </button>
        ) : (
          <button data-testid="breathe-stop" onClick={stop}
            className="rounded-full bg-white px-10 py-4 text-xl font-bold text-[#457B9D] shadow transition hover:-translate-y-1">I feel calmer ✓</button>
        )}

        {young && <p className="mt-4 text-sm text-[#52b788] font-semibold">Gentle breaths made just for you! 🎈</p>}
      </div>
    </KidShell>
  );
}
