import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/lib/api";
import KidShell from "@/components/KidShell";
import { ASSETS } from "@/lib/assets";
import { Printer, Lock, Star, Flame, X } from "lucide-react";

const BADGE_META = {
  first_step: { emoji: "👣", color: "#D8F3DC", verse: "Be strong and brave. — Joshua 1:9" },
  rising_sun: { emoji: "🌅", color: "#FFE3B3", verse: "This is the day the Lord has made! — Psalm 118:24" },
  brave_heart: { emoji: "🦁", color: "#FFD9D4", verse: "I can do all things through Christ. — Philippians 4:13" },
  shining_star: { emoji: "🌟", color: "#CDEAFE", verse: "Let your light shine! — Matthew 5:16" },
  sunshine_hero: { emoji: "🦸", color: "#E8DFF5", verse: "You are wonderfully made! — Psalm 139:14" },
};

export default function Badges() {
  const { childId } = useParams();
  const [child, setChild] = useState(null);
  const [data, setData] = useState(null);
  const [certBadge, setCertBadge] = useState(null);

  useEffect(() => {
    api.get(`/children/${childId}`).then((r) => setChild(r.data));
    api.get(`/children/${childId}/rewards`).then((r) => setData(r.data));
  }, [childId]);

  const earned = new Set(data?.badges || []);
  const allBadges = data?.all_badges || [];
  const highest = [...allBadges].reverse().find((b) => earned.has(b.id));

  return (
    <KidShell child={child} title="My Badges" bg="linear-gradient(180deg,#FFF1D6 0%,#FDFBF7 55%)">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <div className="flex items-center gap-2 rounded-full bg-[#FFD166] px-5 py-2 font-bold text-[#7a5500]">
            <Star className="h-5 w-5 fill-current" /> {data?.stars || 0} stars
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[#FFE3B3] px-5 py-2 font-bold text-[#9a5b00]">
            <Flame className="h-5 w-5" /> {data?.streak || 0} day streak
          </div>
        </div>

        <p className="text-center text-lg text-[#457B9D] mb-6">Earn stars by checking in, breathing, reading stories, and playing. Collect all the badges! 🌈</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {allBadges.map((b) => {
            const meta = BADGE_META[b.id] || { emoji: "⭐", color: "#eee" };
            const got = earned.has(b.id);
            return (
              <motion.div key={b.id} data-testid={`badge-${b.id}`} whileHover={got ? { y: -4 } : {}}
                className={`flex flex-col items-center gap-2 rounded-3xl p-4 text-center shadow-sm transition ${got ? "" : "opacity-50 grayscale"}`}
                style={{ background: got ? meta.color : "#F1F5F9" }}>
                <span className="text-4xl">{got ? meta.emoji : ""}</span>
                {!got && <Lock className="h-7 w-7 text-[#94a3b8]" />}
                <span className="font-fredoka text-sm font-bold text-[#1D3557]">{b.label}</span>
                <span className="text-xs text-[#457B9D]">{b.stars}★</span>
                {got && (
                  <button data-testid={`print-cert-${b.id}`} onClick={() => setCertBadge(b)}
                    className="mt-1 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1D3557] shadow-sm">
                    <Printer className="h-4 w-4" /> Certificate
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          {highest ? (
            <button data-testid="open-certificate" onClick={() => setCertBadge(highest)}
              className="inline-flex items-center gap-2 rounded-full bg-[#F4A261] px-8 py-4 text-xl font-bold text-white transition hover:-translate-y-1">
              <Printer className="h-6 w-6" /> Print my certificate!
            </button>
          ) : (
            <p className="text-[#457B9D]">Earn your first star to unlock a certificate! ⭐</p>
          )}
        </div>
      </div>

      {certBadge && child && (
        <CertificateModal child={child} badge={certBadge} meta={BADGE_META[certBadge.id]} onClose={() => setCertBadge(null)} />
      )}
    </KidShell>
  );
}

function CertificateModal({ child, badge, meta, onClose }) {
  const today = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 print:bg-white print:p-0" onClick={onClose}>
      <div className="relative w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <button data-testid="close-certificate" onClick={onClose}
          className="absolute -top-3 -right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg print:hidden">
          <X className="h-5 w-5 text-[#1D3557]" />
        </button>

        <div id="certificate" className="rounded-3xl bg-[#FFFDF8] p-2 shadow-2xl">
          <div className="rounded-2xl border-[6px] border-double border-[#F4A261] p-8 text-center">
            <div className="flex items-center justify-center gap-3">
              <img src={ASSETS.sunny} alt="Sunny" className="h-16 w-16 object-contain" />
              <span className="font-fredoka text-2xl font-bold text-[#F4A261]">Brighter Dayz</span>
            </div>
            <p className="mt-4 font-fredoka text-3xl font-bold text-[#1D3557]">Certificate of Brightness</p>
            <p className="mt-2 text-[#457B9D]">This certificate is proudly awarded to</p>
            <p data-testid="cert-name" className="my-3 font-fredoka text-4xl font-bold text-[#F4A261]">{child.name}</p>
            <div className="my-4 inline-flex flex-col items-center">
              <span className="text-6xl">{meta?.emoji || "🌟"}</span>
              <span className="mt-1 rounded-full bg-[#FFE3B3] px-4 py-1 font-fredoka text-lg font-bold text-[#9a5b00]">{badge.label}</span>
            </div>
            <p className="mx-auto max-w-md text-[#1D3557]">For being brave, kind, and shining God's light every day. You are loved and you are amazing! 💛</p>
            <p className="mt-4 italic text-[#457B9D]">"{meta?.verse}"</p>
            <div className="mt-6 flex items-center justify-between text-sm text-[#457B9D]">
              <div className="text-left">
                <p className="font-fredoka text-lg text-[#1D3557]">Sunny the Lamb 🐑</p>
                <p>Your Brighter Dayz friend</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-[#1D3557]">{today}</p>
                <p>Date earned</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-center print:hidden">
          <button data-testid="do-print" onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full bg-[#52b788] px-8 py-3 text-lg font-bold text-white transition hover:-translate-y-0.5">
            <Printer className="h-5 w-5" /> Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
