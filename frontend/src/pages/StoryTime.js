import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/api";
import KidShell from "@/components/KidShell";
import ReadAloud from "@/components/ReadAloud";
import { ASSETS } from "@/lib/assets";
import { Loader2, BookOpen, Sparkles } from "lucide-react";

const TOPICS = ["being brave", "making friends", "feeling worried", "being thankful", "bedtime fears", "kindness"];

export default function StoryTime() {
  const { childId } = useParams();
  const [child, setChild] = useState(null);
  const [kind, setKind] = useState("biblical");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState(null);
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    api.get(`/children/${childId}`).then((r) => setChild(r.data));
    api.get(`/children/${childId}/stories`).then((r) => setSaved(r.data));
  }, [childId]);

  const generate = async () => {
    setLoading(true); setStory(null);
    try {
      const { data } = await api.post("/story/generate", { kind, topic, age: child?.age || 8 });
      setStory(data);
      await api.post(`/children/${childId}/stories/save`, data);
      await api.post(`/children/${childId}/activities`, { type: "story", detail: data.title });
      api.get(`/children/${childId}/stories`).then((r) => setSaved(r.data));
    } catch (e) {
      setStory({ title: "Oops!", body: "Story time is resting. Please try again in a moment." });
    } finally { setLoading(false); }
  };

  return (
    <KidShell child={child} title="Story Time" bg="linear-gradient(180deg,#FFF1D6 0%,#FDFBF7 55%)">
      <div className="mx-auto max-w-2xl">
        <img src={ASSETS.shepherd} alt="The Good Shepherd" className="w-full rounded-3xl object-cover shadow-sm mb-5" style={{ maxHeight: 220, objectPosition: "center 30%" }} />

        <div className="flex rounded-full bg-white p-1 shadow-sm mb-4">
          <button data-testid="story-kind-biblical" onClick={() => setKind("biblical")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-full py-2 font-semibold transition ${kind === "biblical" ? "bg-[#FFD166] text-[#7a5500]" : "text-[#457B9D]"}`}>
            <BookOpen className="h-5 w-5" /> Bible Story</button>
          <button data-testid="story-kind-reallife" onClick={() => setKind("reallife")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-full py-2 font-semibold transition ${kind === "reallife" ? "bg-[#FFD166] text-[#7a5500]" : "text-[#457B9D]"}`}>
            <Sparkles className="h-5 w-5" /> Real Life</button>
        </div>

        <p className="text-sm font-semibold text-[#457B9D] mb-2">What is the story about? (optional)</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {TOPICS.map((t) => (
            <button key={t} data-testid={`story-topic-${t}`} onClick={() => setTopic(t === topic ? "" : t)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${topic === t ? "bg-[#F4A261] text-white" : "bg-white text-[#457B9D] shadow-sm"}`}>{t}</button>
          ))}
        </div>

        <button data-testid="story-generate" onClick={generate} disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-full bg-[#F4A261] py-4 text-xl font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-60">
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "📖"} Tell me a story!
        </button>

        {story && (
          <div data-testid="story-output" className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="font-fredoka text-2xl font-bold text-[#1D3557]">{story.title}</h2>
              <ReadAloud text={`${story.title}. ${story.body}`} voice="fable" label="Read aloud" testid="story-read" />
            </div>
            <div className="prose text-lg leading-relaxed text-[#1D3557] whitespace-pre-line">{story.body}</div>
          </div>
        )}

        {saved.length > 0 && (
          <div className="mt-8">
            <h3 className="font-fredoka text-xl font-bold text-[#1D3557] mb-3">📚 My Saved Stories</h3>
            <div className="space-y-2">
              {saved.map((s) => (
                <button key={s.id} data-testid={`saved-story-${s.id}`} onClick={() => setStory(s)}
                  className="block w-full rounded-2xl bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5">
                  <span className="font-semibold text-[#1D3557]">{s.title}</span>
                  <span className="ml-2 text-xs text-[#457B9D]">{s.kind === "biblical" ? "Bible" : "Real Life"}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </KidShell>
  );
}
