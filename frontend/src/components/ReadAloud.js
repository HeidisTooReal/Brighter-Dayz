import React, { useState, useRef } from "react";
import { Volume2, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function ReadAloud({ text, voice = "ash", className = "", label = "Read to me", testid = "read-aloud-btn" }) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const play = async () => {
    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.post("/tts", { text, voice });
      const audio = new Audio(data.audio);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onpause = () => setPlaying(false);
      await audio.play();
      setPlaying(true);
    } catch (e) {
      console.warn("Read aloud unavailable:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      data-testid={testid}
      onClick={play}
      className={`inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[#1D3557] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white ${className}`}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Volume2 className="h-5 w-5" strokeWidth={2.5} />}
      {playing ? "Stop" : label}
    </button>
  );
}
