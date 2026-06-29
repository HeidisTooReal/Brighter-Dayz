import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/api";
import KidShell from "@/components/KidShell";
import ReadAloud from "@/components/ReadAloud";
import { ASSETS } from "@/lib/assets";
import { Loader2, ArrowLeft, BookOpen, Clock } from "lucide-react";

const FILTERS = [
  { key: "all", label: "All Books" },
  { key: "bible", label: "Bible & Jesus" },
  { key: "hero", label: "Bible Heroes" },
  { key: "life", label: "Real Life" },
];

export default function StoryLibrary() {
  const { childId } = useParams();
  const [child, setChild] = useState(null);
  const [books, setBooks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(null);
  const [loadingBook, setLoadingBook] = useState(false);

  useEffect(() => {
    api.get(`/children/${childId}`).then((r) => setChild(r.data));
    api.get(`/books`).then((r) => setBooks(r.data.books || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  const openBook = async (id) => {
    setLoadingBook(true);
    try {
      const { data } = await api.get(`/books/${id}`);
      setOpen(data);
      api.post(`/children/${childId}/activities`, { type: "story", detail: data.title }).catch(() => {});
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      /* ignore */
    } finally {
      setLoadingBook(false);
    }
  };

  const shown = books.filter((b) => filter === "all" || b.category === filter);

  if (open) {
    const cover = open.category === "life" ? ASSETS.sunnyHero : open.category === "hero" ? ASSETS.shepherd : ASSETS.jesus;
    return (
      <KidShell child={child} title="Story Library" bg="linear-gradient(180deg,#FFF1D6 0%,#FDFBF7 55%)">
        <div className="mx-auto max-w-2xl">
          <button data-testid="book-back" onClick={() => setOpen(null)}
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#457B9D] shadow-sm transition hover:-translate-y-0.5">
            <ArrowLeft className="h-4 w-4" /> Back to shelf
          </button>

          <div data-testid="book-reader" className="rounded-3xl bg-white p-6 shadow-sm">
            <img src={cover} alt={open.title} className="w-full rounded-2xl object-cover shadow-sm mb-5"
              style={{ maxHeight: 220, objectPosition: "center 25%" }} />
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h2 className="font-fredoka text-2xl font-bold text-[#1D3557]">{open.emoji} {open.title}</h2>
                <p className="text-sm font-semibold text-[#F4A261]">{open.theme}</p>
              </div>
              <ReadAloud text={`${open.title}. ${open.body}`} voice="coral" label="Read aloud" testid="book-read" />
            </div>
            <div className="prose mt-3 text-lg leading-relaxed text-[#1D3557] whitespace-pre-line">{open.body}</div>
          </div>
        </div>
      </KidShell>
    );
  }

  return (
    <KidShell child={child} title="Story Library" bg="linear-gradient(180deg,#FFF1D6 0%,#FDFBF7 55%)">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3 mb-5">
          <BookOpen className="h-9 w-9 text-[#F4A261]" strokeWidth={2.5} />
          <div>
            <h1 className="font-fredoka text-2xl md:text-3xl font-bold text-[#1D3557]">My Story Shelf</h1>
            <p className="text-sm text-[#457B9D]">Pick a book and tap "Read aloud" to hear it.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {FILTERS.map((f) => (
            <button key={f.key} data-testid={`book-filter-${f.key}`} onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filter === f.key ? "bg-[#F4A261] text-white" : "bg-white text-[#457B9D] shadow-sm"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {books.length === 0 ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#457B9D]" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {shown.map((b) => (
              <button key={b.id} data-testid={`book-card-${b.id}`} onClick={() => openBook(b.id)}
                className="flex flex-col items-start justify-between rounded-3xl p-4 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{ background: b.color, minHeight: 150 }}>
                <span className="text-4xl">{b.emoji}</span>
                <div>
                  <span className="block font-fredoka text-base font-bold leading-snug text-[#1D3557]">{b.title}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#457B9D]">
                    <Clock className="h-3 w-3" /> {b.minutes} min read
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {loadingBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
        )}
      </div>
    </KidShell>
  );
}
