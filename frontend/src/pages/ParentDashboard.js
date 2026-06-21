import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ASSETS, MOODS, MOOD_SCORE } from "@/lib/assets";
import { ArrowLeft, Trash2, Star, Flame, Activity, Smile, Loader2, ShieldAlert, Check } from "lucide-react";
import LegalFooter from "@/components/LegalFooter";

const moodMeta = (key) => MOODS.find((m) => m.key === key) || { emoji: "🙂", label: key, color: "#ccc" };

export default function ParentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [moodSeries, setMoodSeries] = useState({});
  const [alerts, setAlerts] = useState([]);

  const load = async () => {
    const { data } = await api.get("/parent/overview");
    setData(data);
    api.get("/parent/alerts").then((r) => setAlerts(r.data)).catch(() => {});
    const series = {};
    for (const item of data.children) {
      const moods = await api.get(`/children/${item.child.id}/moods`).then((r) => r.data);
      series[item.child.id] = moods.slice(0, 14).reverse().map((m) => ({
        date: new Date(m.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        score: MOOD_SCORE[m.mood] || 3, mood: m.mood,
      }));
    }
    setMoodSeries(series);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const removeChild = async (id, name) => {
    if (!window.confirm(`Remove ${name}'s profile and all their data?`)) return;
    await api.delete(`/children/${id}`);
    load();
  };

  const dismissAlert = async (id) => {
    try { await api.post(`/parent/alerts/${id}/read`); setAlerts((a) => a.filter((x) => x.id !== id)); }
    catch (e) { console.error("Failed to dismiss alert:", e); }
  };

  if (!data) return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]"><Loader2 className="h-10 w-10 animate-spin text-[#457B9D]" /></div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-5 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <button data-testid="parent-back" onClick={() => navigate("/")} className="flex items-center gap-2 font-semibold text-[#457B9D]">
            <ArrowLeft className="h-5 w-5" /> Profiles
          </button>
          <span className="text-sm text-[#64748b]">{user?.email}</span>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <img src={ASSETS.sunny} alt="" className="h-12 w-12 object-contain" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1D3557] font-['Nunito']">Parent Dashboard</h1>
            <p className="text-[#64748b]">A gentle window into your child's well-being.</p>
          </div>
        </div>

        {alerts.length > 0 && (
          <div data-testid="safety-alerts" className="mb-8 rounded-2xl border-2 border-[#FFA69E] bg-[#FFF6F4] p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="h-6 w-6 text-[#c0392b]" />
              <h2 className="text-lg font-bold text-[#7A2E26] font-['Nunito']">Safety alerts — please check in</h2>
            </div>
            <div className="space-y-3">
              {alerts.map((a) => (
                <div key={a.id} data-testid={`alert-${a.id}`} className="rounded-xl bg-white p-4 shadow-sm border border-[#FFD9D4]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#1D3557]">{a.child_name} <span className="ml-1 rounded-full bg-[#FFE3E0] px-2 py-0.5 text-xs font-semibold text-[#c0392b]">{(a.category || "concern").replace("_", " ")}</span></p>
                      <p className="mt-1 text-[#457B9D] italic">"{a.message}"</p>
                      <p className="mt-1 text-xs text-[#94a3b8]">{new Date(a.created_at).toLocaleString()} {a.emailed ? "· emailed to you" : "· (email not configured)"}</p>
                    </div>
                    <button data-testid={`alert-dismiss-${a.id}`} onClick={() => dismissAlert(a.id)}
                      className="flex items-center gap-1 rounded-full bg-[#F1F5F9] px-3 py-1.5 text-sm font-semibold text-[#1D3557] hover:bg-[#e2e8f0]">
                      <Check className="h-4 w-4" /> Reviewed
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-[#457B9D]">If they may be in danger: call/text <b>988</b>, text HOME to <b>741741</b>, or call <b>911</b>.</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.children.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <p className="text-[#64748b]">No child profiles yet. Add one from the profiles screen.</p>
          </div>
        )}

        <div className="space-y-8">
          {data.children.map(({ child, recent_moods, mood_count, activity_count, last_mood }) => (
            <div key={child.id} data-testid={`parent-child-${child.id}`} className="rounded-2xl bg-white p-6 shadow-sm border border-[#E2E8F0]">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D8F3DC] text-3xl">{child.avatar || "🐑"}</div>
                  <div>
                    <h2 className="text-xl font-bold text-[#1D3557] font-['Nunito']">{child.name}</h2>
                    <p className="text-sm text-[#64748b]">Age {child.age}</p>
                  </div>
                </div>
                <button data-testid={`delete-child-${child.id}`} onClick={() => removeChild(child.id, child.name)}
                  className="text-[#94a3b8] hover:text-[#ef4444] transition"><Trash2 className="h-5 w-5" /></button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <Stat icon={Smile} label="Last mood" value={last_mood ? moodMeta(last_mood.mood).label : "—"} color="#52b788" />
                <Stat icon={Activity} label="Activities" value={activity_count} color="#457B9D" />
                <Stat icon={Star} label="Stars" value={child.stars || 0} color="#FFB703" />
                <Stat icon={Flame} label="Day streak" value={child.streak || 0} color="#F4A261" />
              </div>

              {(moodSeries[child.id]?.length > 1) ? (
                <div className="h-56">
                  <p className="text-sm font-semibold text-[#64748b] mb-2">Mood trend (1 = struggling, 5 = great)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={moodSeries[child.id]} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} />
                      <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 12, fill: "#64748b" }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#457B9D" strokeWidth={3} dot={{ r: 5, fill: "#457B9D" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-[#94a3b8]">Not enough mood check-ins yet to show a trend.</p>
              )}

              {recent_moods.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-[#64748b] mb-2">Recent check-ins</p>
                  <div className="flex flex-wrap gap-2">
                    {recent_moods.map((m) => (
                      <span key={m.id} className="inline-flex items-center gap-1 rounded-full bg-[#F1F5F9] px-3 py-1 text-sm">
                        {moodMeta(m.mood).emoji} {moodMeta(m.mood).label}
                        <span className="text-[#94a3b8]">· {new Date(m.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <LegalFooter />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl bg-[#F8FAFC] p-4 border border-[#EEF2F7]">
      <Icon className="h-5 w-5 mb-1" style={{ color }} />
      <p className="text-xs text-[#64748b]">{label}</p>
      <p className="text-lg font-bold text-[#1D3557] font-['Nunito']">{value}</p>
    </div>
  );
}
