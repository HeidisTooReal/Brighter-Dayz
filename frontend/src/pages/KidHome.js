import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import KidShell from "@/components/KidShell";
import ReadAloud from "@/components/ReadAloud";
import { ASSETS, MOODS, MOOD_REPLIES } from "@/lib/assets";
import { MessageCircleHeart, Wind, BookOpen, Sparkles, Gamepad2, Award, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const TILES = [
  { key: "chat", to: "chat", label: "Talk to Sunny", icon: MessageCircleHeart, bg: "#E8DFF5", span: "sm:col-span-2" },
  { key: "breathe", to: "breathe", label: "Breathe & Calm", icon: Wind, bg: "#D8F3DC", span: "" },
  { key: "story", to: "story", label: "Story Time", icon: BookOpen, bg: "#FFE3B3", span: "" },
  { key: "affirmations", to: "affirmations", label: "Happy Words", icon: Sparkles, bg: "#FFD9D4", span: "" },
  { key: "games", to: "games", label: "Calm Games", icon: Gamepad2, bg: "#CDEAFE", span: "" },
  { key: "badges", to: "badges", label: "My Badges", icon: Award, bg: "#FCE7A0", span: "" },
];

export default function KidHome() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [child, setChild] = useState(null);
  const [daily, setDaily] = useState(null);
  const [moodMsg, setMoodMsg] = useState("");

  const loadChild = async () => {
    const { data } = await api.get(`/children/${childId}`);
    setChild(data);
  };
  useEffect(() => {
    loadChild();
    api.get("/daily").then((r) => setDaily(r.data));
  }, [childId]);

  const pickMood = async (key) => {
    setMoodMsg(MOOD_REPLIES[key]);
    try {
      const { data } = await api.post(`/children/${childId}/moods`, { mood: key });
      setChild(data.child);
    } catch (e) {}
  };

  if (!child) return <KidShell><div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-[#457B9D]" /></div></KidShell>;

  return (
    <KidShell child={child} hideBack bg="linear-gradient(180deg,#FEF6E4 0%,#FDFBF7 40%)">
      {user?.role === "teen" ? (
        <button data-testid="home-signout" onClick={async () => { await logout(); navigate("/"); }} className="mb-3 text-sm font-semibold text-[#457B9D]">↩ Sign out</button>
      ) : (
        <button data-testid="home-switch-profile" onClick={() => navigate("/")} className="mb-3 text-sm font-semibold text-[#457B9D]">← Switch profile</button>
      )}

      <div className="flex items-center gap-4 mb-6">
        <motion.img src={ASSETS.sunny} alt="Sunny" className="h-24 w-24 object-contain"
          animate={{ rotate: [0, -4, 4, 0] }} transition={{ repeat: Infinity, duration: 3 }} />
        <div>
          <h1 className="font-fredoka text-3xl md:text-4xl font-bold text-[#1D3557]">Hi {child.name}! 🌞</h1>
          <p className="text-lg text-[#457B9D]">Sunny is so happy to see you!</p>
        </div>
      </div>

      {/* Mood check-in */}
      <section className="rounded-3xl bg-white p-6 shadow-sm mb-6">
        <h2 className="font-fredoka text-xl md:text-2xl font-bold text-[#1D3557] mb-4">How are you feeling today?</h2>
        <div className="grid grid-cols-5 gap-2 md:gap-4">
          {MOODS.map((m) => (
            <button key={m.key} data-testid={`mood-${m.key}`} onClick={() => pickMood(m.key)}
              className="flex flex-col items-center gap-1 rounded-2xl p-3 transition-all hover:-translate-y-1"
              style={{ background: m.color + "55" }}>
              <span className="text-4xl md:text-5xl">{m.emoji}</span>
              <span className="text-xs md:text-sm font-semibold text-[#1D3557]">{m.label}</span>
            </button>
          ))}
        </div>
        {moodMsg && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            data-testid="mood-reply" className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-[#FEF6E4] p-4">
            <p className="text-[#1D3557] font-medium">{moodMsg}</p>
            <ReadAloud text={moodMsg} testid="mood-reply-read" />
          </motion.div>
        )}
      </section>

      {/* Daily verse + affirmation */}
      {daily && (
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-3xl bg-[#CDEAFE] p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-fredoka font-bold text-[#1D3557]">📖 Today's Verse</span>
              <ReadAloud text={`Today's verse. ${daily.verse.text} ${daily.verse.ref}`} testid="verse-read" />
            </div>
            <p className="text-[#1D3557] text-lg leading-relaxed">"{daily.verse.text}"</p>
            <p className="mt-1 text-sm font-semibold text-[#457B9D]">— {daily.verse.ref}</p>
          </div>
          <div className="rounded-3xl bg-[#FFE3B3] p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-fredoka font-bold text-[#1D3557]">✨ Today's Happy Words</span>
              <ReadAloud text={daily.affirmation} testid="affirmation-read" />
            </div>
            <p className="text-[#1D3557] text-lg leading-relaxed">{daily.affirmation}</p>
          </div>
        </div>
      )}

      {/* Activity bento */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 auto-rows-[140px]">
        {TILES.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} data-testid={`tile-${t.key}`} onClick={() => navigate(`/kid/${childId}/${t.to}`)}
              className={`group flex flex-col items-start justify-between rounded-3xl p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${t.span}`}
              style={{ background: t.bg }}>
              <Icon className="h-9 w-9 text-[#1D3557] transition group-hover:scale-110" strokeWidth={2.5} />
              <span className="font-fredoka text-lg md:text-xl font-bold text-[#1D3557]">{t.label}</span>
            </button>
          );
        })}
      </div>
    </KidShell>
  );
}
