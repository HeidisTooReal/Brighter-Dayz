import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PIECES = ["⭐", "🌟", "✨", "💛", "🎉", "🌈", "🕊️"];

export default function Confetti({ show, onDone }) {
  const [bits, setBits] = useState([]);

  useEffect(() => {
    if (!show) return;
    const arr = Array.from({ length: 32 }).map((_, i) => ({
      id: `${Date.now()}-${i}`,
      x: Math.random() * 100,
      delay: Math.random() * 0.3,
      rot: (Math.random() - 0.5) * 360,
      emoji: PIECES[Math.floor(Math.random() * PIECES.length)],
      size: 18 + Math.random() * 22,
    }));
    setBits(arr);
    const t = setTimeout(() => { setBits([]); onDone && onDone(); }, 2600);
    return () => clearTimeout(t);
  }, [show, onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden">
      <AnimatePresence>
        {bits.map((b) => (
          <motion.span key={b.id} initial={{ y: -40, x: `${b.x}vw`, opacity: 0, rotate: 0 }}
            animate={{ y: "110vh", opacity: [0, 1, 1, 0.8], rotate: b.rot }}
            transition={{ duration: 2.4, delay: b.delay, ease: "easeIn" }}
            className="absolute top-0" style={{ fontSize: b.size }}>{b.emoji}</motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
