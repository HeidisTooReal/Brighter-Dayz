import React from "react";

export default function LegalFooter({ light = false }) {
  const cls = light ? "text-white/70 hover:text-white" : "text-[#94a3b8] hover:text-[#457B9D]";
  return (
    <footer data-testid="legal-footer" className="mt-12 pb-6 text-center text-xs">
      <div className={`flex items-center justify-center gap-4 ${light ? "text-white/60" : "text-[#94a3b8]"}`}>
        <a href="/privacy" data-testid="footer-privacy" className={`underline transition ${cls}`}>Privacy Policy</a>
        <span>·</span>
        <a href="/terms" data-testid="footer-terms" className={`underline transition ${cls}`}>Terms of Service</a>
        <span>·</span>
        <a href="/help" data-testid="footer-help" className={`underline transition ${cls}`}>Get Help</a>
      </div>
      <p className={`mt-2 ${light ? "text-white/50" : "text-[#b6c0cc]"}`}>
        © {new Date().getFullYear()} HLM LLC · Brighter Dayz · Made with love &amp; prayer 💛
      </p>
    </footer>
  );
}
