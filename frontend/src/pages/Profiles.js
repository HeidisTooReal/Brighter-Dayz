import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { ASSETS } from "@/lib/assets";
import { Plus, LayoutDashboard, LogOut, Loader2 } from "lucide-react";

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

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/children");
      setChildren(data);
      if (data.length === 0) setShowAdd(true);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const addChild = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/children", { name, age: Number(age), avatar });
      setName(""); setAge(8); setAvatar("🐑"); setShowAdd(false);
      await load();
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 md:p-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src={ASSETS.sunny} alt="Sunny" className="h-14 w-14 object-contain" />
            <div>
              <h1 className="font-fredoka text-2xl md:text-3xl font-bold text-[#1D3557]">Hi {user?.name || "Friend"}!</h1>
              <p className="text-[#457B9D]">Who's visiting Sunny today?</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button data-testid="goto-parent-dashboard" onClick={() => navigate("/parent")}
              className="flex items-center gap-2 rounded-full bg-[#457B9D] px-4 py-2 font-semibold text-white transition hover:-translate-y-0.5">
              <LayoutDashboard className="h-5 w-5" /> <span className="hidden sm:inline">Parent Dashboard</span>
            </button>
            <button data-testid="logout-btn" onClick={() => { logout(); navigate("/"); }}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-[#1D3557] shadow-sm transition hover:-translate-y-0.5">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

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
      </div>
    </div>
  );
}
