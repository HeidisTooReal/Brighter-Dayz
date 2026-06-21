import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { ASSETS } from "@/lib/assets";
import CrisisButton from "@/components/CrisisButton";

export default function KidShell({ child, title, bg = "#FDFBF7", children, hideBack = false }) {
  const navigate = useNavigate();
  const { childId } = useParams();
  return (
    <div className="min-h-screen pb-28" style={{ background: bg }}>
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 md:px-8 backdrop-blur-md bg-white/60 border-b border-white/40">
        <div className="flex items-center gap-3">
          {!hideBack && (
            <button
              data-testid="kid-back-btn"
              onClick={() => navigate(`/kid/${childId}`)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm transition hover:-translate-y-0.5"
            >
              <ArrowLeft className="h-6 w-6 text-[#1D3557]" strokeWidth={2.5} />
            </button>
          )}
          {title && <h1 className="font-fredoka text-2xl md:text-3xl font-bold text-[#1D3557]">{title}</h1>}
        </div>
        {child && (
          <div className="flex items-center gap-2">
            <div data-testid="kid-streak" className="flex items-center gap-1 rounded-full bg-[#FFE3B3] px-3 py-1.5 font-bold text-[#9a5b00]">
              <Flame className="h-5 w-5" strokeWidth={2.5} /> {child.streak || 0}
            </div>
            <div data-testid="kid-stars" className="flex items-center gap-1 rounded-full bg-[#FFD166] px-3 py-1.5 font-bold text-[#7a5500]">
              <Star className="h-5 w-5 fill-current" strokeWidth={2.5} /> {child.stars || 0}
            </div>
            <motion.img
              src={ASSETS.sunny}
              alt="Sunny"
              className="h-12 w-12 object-contain"
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            />
          </div>
        )}
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 md:px-8">{children}</main>
      <CrisisButton />
    </div>
  );
}
