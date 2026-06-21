import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { ASSETS } from "@/lib/assets";
import { Plus, LayoutDashboard, LogOut, Loader2, Lock, ShieldCheck } from "lucide-react";
import LegalFooter from "@/components/LegalFooter";

const AVATARS = ["🐑", "🦁", "🐻", "🐰", "🦊", "🐨", "🐼", "🦄"];

export default function Profiles() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState(8);
  const [avatar, setAvatar] = useState("🐑");
  const [saving, setSaving] = useState(false);

  const [hasPin, setHasPin] = useState(!!user?.has_pin);
  const [pinMode, setPinMode] = useState(null); // "set" | "enter" | null
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState("");
  const [pinBusy, setPinBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/children");
      setChildren(data);
      if (data.length === 0) setShowAdd(true);
    } finally { setLoading(false); }
  };
  useEffect(() => {
    load();
    api.get("/auth/me").then((r) => setHasPin(!!r.data.has_pin)).catch((e) => console.error("Failed to load PIN status:", e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addChild = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/children", { name, age: Number(age), avatar });
      setName(""); setAge(8); setAvatar("🐑"); setShowAdd(false);
      await load();
    } finally { setSaving(false); }
  };

  const openDashboard = () => {
    if (hasPin) { setPin(""); setPinErr(""); setPinMode("enter"); }
    else navigate("/parent");
  };

  const submitPin = async (e) => {
    e.preventDefault();
    setPinErr(""); setPinBusy(true);
    try {
      if (pinMode === "set") {
        if (!/^\d{4,6}$/.test(pin)) { setPinErr("PIN must be 4 to 6 numbers."); setPinBusy(false); return; }
        await api.post("/auth/set-pin", { pin });
        setHasPin(true); setPinMode(null); setPin("");
      } else {
        await api.post("/auth/verify-pin", { pin });
        setPinMode(null); setPin("");
        navigate("/parent");
      }
    } catch (err) {
      setPinErr(err.response?.data?.detail || "Something went wrong.");
    } finally { setPinBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 md:p-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <img src={ASSETS.sunny} alt="Sunny" className="h-14 w-14 object-contain" />
            <div>
              <h1 className="font-fredoka text-2xl md:text-3xl font-bold text-[#1D3557]">Hi {user?.name || "Friend"}!</h1>
              <p className="text-[#457B9D]">Who's visiting Sunny today?</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button data-testid="set-pin-btn" onClick={() => { setPin(""); setPinErr(""); setPinMode("set"); }}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-[#1D3557] shadow-sm transition hover:-translate-y-0.5">
              {hasPin ? <ShieldCheck className="h-5 w-5 text-[#52b788]" /> : <Lock className="h-5 w-5" />}
              <span className="hidden sm:inline">{hasPin ? "Change PIN" : "Set PIN"}</span>
            </button>
            <button data-testid="goto-parent-dashboard" onClick={openDashboard}
              className="flex items-center gap-2 rounded-full bg-[#457B9D] px-4 py-2 font-semibold text-white transition hover:-translate-y-0.5">
              <LayoutDashboard className="h-5 w-5" /> <span className="hidden sm:inline">Parent Dashboard</span>
            </button>
            <button data-testid="logout-btn" onClick={() => { logout(); navigate("/"); }}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-[#1D3557] shadow-sm transition hover:-translate-y-0.5">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {!hasPin && (
          <div data-testid="pin-tip" className="mb-6 flex items-center gap-3 rounded-2xl bg-[#FFF3E9] p-4 text-[#9a5b00]">
            <Lock className="h-5 w-5 shrink-0" />
            <p className="text-sm">Tip: Set a Parent PIN so you can peek at the dashboard anytime without signing in — and keep it private from little ones.</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-[#457B9D]" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {children.map((c) => (
              <button key={c.id} data-testid={`child-card-${c.id}`} onClick={() => navigate(`/kid/${c.id}`)}
                className="flex flex-col items-center gap-2 rounded-3xl bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D8F3DC] text-5xl">{c.avatar || "🐑"}</div>
                <span className="font-fredoka text-lg font-bold text-[#1D3557]">{c.name}</span>
                <span className="text-sm text-[#457B9D]">⭐ {c.stars || 0}</span>
              </button>
            ))}
            <button data-testid="add-child-btn" onClick={() => setShowAdd(true)}
              className="flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-[#cbd5e1] p-6 text-[#457B9D] transition-all hover:-translate-y-1 hover:border-[#457B9D]">
              <Plus className="h-10 w-10" /> <span className="font-semibold">Add a child</span>
            </button>
          </div>
        )}

        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => children.length && setShowAdd(false)}>
            <form onClick={(e) => e.stopPropagation()} onSubmit={addChild}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl space-y-4">
              <h2 className="font-fredoka text-2xl font-bold text-[#1D3557]">Add a child</h2>
              <input data-testid="child-name-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Child's first name"
                className="w-full rounded-2xl border-2 border-[#E2E8F0] px-4 py-3 text-lg outline-none focus:border-[#457B9D]" />
              <div>
                <label className="text-sm font-semibold text-[#457B9D]">Age: {age}</label>
                <input data-testid="child-age-input" type="range" min="5" max="14" value={age} onChange={(e) => setAge(e.target.value)} className="w-full" />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#457B9D]">Pick a buddy</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {AVATARS.map((a) => (
                    <button type="button" key={a} data-testid={`avatar-${a}`} onClick={() => setAvatar(a)}
                      className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl transition ${avatar === a ? "bg-[#FFD166] scale-110" : "bg-[#F1F5F9]"}`}>{a}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                {children.length > 0 && <button type="button" onClick={() => setShowAdd(false)} className="flex-1 rounded-full bg-[#F1F5F9] py-3 font-semibold text-[#1D3557]">Cancel</button>}
                <button data-testid="save-child-btn" type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[#457B9D] py-3 font-bold text-white disabled:opacity-60">
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save"}
                </button>
              </div>
            </form>
          </div>
        )}

        {pinMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPinMode(null)}>
            <form onClick={(e) => e.stopPropagation()} onSubmit={submitPin}
              className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF2F8]"><Lock className="h-7 w-7 text-[#457B9D]" /></div>
              <h2 className="font-fredoka text-2xl font-bold text-[#1D3557]">{pinMode === "set" ? "Set Parent PIN" : "Enter Parent PIN"}</h2>
              <p className="text-sm text-[#457B9D]">{pinMode === "set" ? "Choose a 4–6 digit PIN for the Parent Dashboard." : "Enter your PIN to open the dashboard."}</p>
              <input data-testid="pin-input" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                type="password" inputMode="numeric" autoFocus placeholder="••••"
                className="w-full rounded-2xl border-2 border-[#E2E8F0] px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-[#457B9D]" />
              {pinErr && <p data-testid="pin-error" className="text-sm font-medium text-[#c0392b]">{pinErr}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setPinMode(null)} className="flex-1 rounded-full bg-[#F1F5F9] py-3 font-semibold text-[#1D3557]">Cancel</button>
                <button data-testid="pin-submit" type="submit" disabled={pinBusy} className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[#457B9D] py-3 font-bold text-white disabled:opacity-60">
                  {pinBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : pinMode === "set" ? "Save PIN" : "Unlock"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      <LegalFooter />
    </div>
  );
}
