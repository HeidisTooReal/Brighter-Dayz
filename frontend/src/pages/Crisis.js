import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, MessageSquare, Heart, Users } from "lucide-react";
import { ASSETS } from "@/lib/assets";

const HOTLINES = [
  { name: "988 Suicide & Crisis Lifeline", desc: "Call or text 988 — free, 24/7", action: "tel:988", icon: Phone, color: "#FFD166" },
  { name: "Crisis Text Line", desc: "Text HOME to 741741", action: "sms:741741?&body=HOME", icon: MessageSquare, color: "#CDEAFE" },
  { name: "Childhelp National Hotline", desc: "Call or text 1-800-422-4453", action: "tel:18004224453", icon: Heart, color: "#D8F3DC" },
];

export default function Crisis() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#FFF6F4] p-5 md:p-10">
      <div className="mx-auto max-w-2xl">
        <button data-testid="crisis-back" onClick={() => navigate(-1)}
          className="flex items-center gap-2 font-semibold text-[#457B9D] mb-4">
          <ArrowLeft className="h-5 w-5" /> Back
        </button>

        <div className="flex items-center gap-3 mb-2">
          <img src={ASSETS.sunny} alt="Sunny" className="h-16 w-16 object-contain" />
          <h1 className="font-fredoka text-3xl font-bold text-[#1D3557]">You are not alone 💛</h1>
        </div>
        <p className="text-lg text-[#457B9D] mb-6">If you feel really sad, scared, or unsafe, please tell a grown-up you trust right away. It is brave to ask for help.</p>

        <div className="rounded-3xl bg-[#FFA69E] p-6 mb-5 text-center">
          <p className="font-bold text-[#7A2E26] text-lg">If you are in danger right now</p>
          <a data-testid="call-911" href="tel:911" className="mt-3 inline-block rounded-full bg-white px-8 py-3 text-xl font-bold text-[#c0392b]">Call 911</a>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm mb-5 flex items-center gap-4">
          <Users className="h-10 w-10 text-[#52b788]" strokeWidth={2.5} />
          <div>
            <p className="font-fredoka text-lg font-bold text-[#1D3557]">Tell a trusted grown-up</p>
            <p className="text-[#457B9D]">A parent, teacher, school counselor, or pastor can help you feel safe.</p>
          </div>
        </div>

        <h2 className="font-fredoka text-xl font-bold text-[#1D3557] mb-3">Helpers you can talk to</h2>
        <div className="space-y-3">
          {HOTLINES.map((h) => {
            const Icon = h.icon;
            return (
              <a key={h.name} data-testid={`hotline-${h.name}`} href={h.action}
                className="flex items-center gap-4 rounded-2xl p-4 shadow-sm transition hover:-translate-y-0.5" style={{ background: h.color + "66" }}>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white"><Icon className="h-6 w-6 text-[#1D3557]" /></div>
                <div>
                  <p className="font-bold text-[#1D3557]">{h.name}</p>
                  <p className="text-[#457B9D]">{h.desc}</p>
                </div>
              </a>
            );
          })}
        </div>

        <p className="mt-6 text-center text-[#457B9D]">"The Lord is close to the brokenhearted." — Psalm 34:18</p>
      </div>
    </div>
  );
}
