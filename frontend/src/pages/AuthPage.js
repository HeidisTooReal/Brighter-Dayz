import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatApiErrorDetail } from "@/lib/api";
import { ASSETS } from "@/lib/assets";
import { Heart, Loader2 } from "lucide-react";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="relative hidden md:flex flex-col justify-end p-10"
           style={{ backgroundImage: `url(${ASSETS.sunnyHero})`, backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="rounded-3xl bg-white/70 backdrop-blur-md p-6 max-w-md">
          <h2 className="font-fredoka text-4xl font-bold text-[#1D3557]">Brighter Dayz</h2>
          <p className="mt-2 text-lg text-[#457B9D]">A gentle, faith-filled place for kids to share their feelings, find calm, and remember they are loved. 🐑💛</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 bg-[#FDFBF7]">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-2">
            <img src={ASSETS.sunny} alt="Sunny" className="h-16 w-16 object-contain" />
            <h1 className="font-fredoka text-3xl font-bold text-[#1D3557]">Welcome!</h1>
          </div>
          <p className="text-[#457B9D] mb-6">Grown-ups sign in here to set up your child's safe space.</p>

          <div className="flex rounded-full bg-[#E8DFF5] p-1 mb-6">
            <button data-testid="auth-tab-login" onClick={() => setMode("login")}
              className={`flex-1 rounded-full py-2 font-semibold transition ${mode === "login" ? "bg-white shadow text-[#1D3557]" : "text-[#457B9D]"}`}>Sign In</button>
            <button data-testid="auth-tab-register" onClick={() => setMode("register")}
              className={`flex-1 rounded-full py-2 font-semibold transition ${mode === "register" ? "bg-white shadow text-[#1D3557]" : "text-[#457B9D]"}`}>Create Account</button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <input data-testid="auth-name" value={name} onChange={(e) => setName(e.target.value)} required
                placeholder="Your name" className="w-full rounded-2xl border-2 border-[#E2E8F0] bg-white px-4 py-3 text-lg outline-none focus:border-[#457B9D]" />
            )}
            <input data-testid="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="Email" className="w-full rounded-2xl border-2 border-[#E2E8F0] bg-white px-4 py-3 text-lg outline-none focus:border-[#457B9D]" />
            <input data-testid="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              placeholder="Password" className="w-full rounded-2xl border-2 border-[#E2E8F0] bg-white px-4 py-3 text-lg outline-none focus:border-[#457B9D]" />

            {error && <p data-testid="auth-error" className="text-[#c0392b] text-sm font-medium">{error}</p>}

            <button data-testid="auth-submit" type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-[#457B9D] py-3 text-lg font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#3a6a89] disabled:opacity-60">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className="h-5 w-5" />}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-[#457B9D]">Demo: parent@brighterdayz.org / Sunshine123</p>
        </div>
      </div>
    </div>
  );
}
