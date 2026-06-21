import React from "react";
import { useNavigate } from "react-router-dom";
import { LifeBuoy } from "lucide-react";

export default function CrisisButton() {
  const navigate = useNavigate();
  return (
    <button
      data-testid="crisis-help-btn"
      onClick={() => navigate("/help")}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#FFA69E] px-5 py-3 font-bold text-[#7A2E26] shadow-lg shadow-[#FFA69E]/40 transition-all hover:-translate-y-1 hover:bg-[#ff9488]"
    >
      <LifeBuoy className="h-6 w-6" strokeWidth={2.5} />
      Get Help
    </button>
  );
}
