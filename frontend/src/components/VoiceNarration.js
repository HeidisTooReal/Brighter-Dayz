import React, { useEffect, useRef, useState } from "react";
import api, { API, getToken } from "@/lib/api";
import ReadAloud from "@/components/ReadAloud";
import { Mic, Square, Play, Pause, Trash2, Loader2, Check, X, RefreshCw } from "lucide-react";

function pickMimeType() {
  const candidates = ["audio/webm", "audio/mp4", "audio/ogg"];
  if (typeof MediaRecorder === "undefined") return "";
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) || "";
}

export default function VoiceNarration({ refType, refId, text, aiVoice = "coral", aiLabel = "Sunny reads it" }) {
  const [narration, setNarration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");

  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const previewUrlRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/narrations/${refType}/${refId}`);
      setNarration(data.narration || null);
    } catch {
      setNarration(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refType, refId]);

  const audioUrl = narration ? `${API}/narration-audio/${narration.id}?auth=${getToken()}` : null;

  const playParent = async () => {
    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    try {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onpause = () => setPlaying(false);
      await audio.play();
      setPlaying(true);
    } catch {
      setError("Could not play the recording.");
    }
  };

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setRecordedBlob(blob);
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = URL.createObjectURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      setRecording(true);
    } catch {
      setError("Please allow microphone access to record your voice.");
    }
  };

  const stopRecording = () => {
    if (mediaRef.current && mediaRef.current.state !== "inactive") mediaRef.current.stop();
    setRecording(false);
  };

  const previewRecorded = () => {
    if (!previewUrlRef.current) return;
    const audio = new Audio(previewUrlRef.current);
    audio.play();
  };

  const saveRecording = async () => {
    if (!recordedBlob) return;
    setSaving(true);
    setError("");
    try {
      const ext = (recordedBlob.type.includes("mp4") && "m4a") || (recordedBlob.type.includes("ogg") && "ogg") || "webm";
      const fd = new FormData();
      fd.append("file", recordedBlob, `narration.${ext}`);
      fd.append("ref_type", refType);
      fd.append("ref_id", refId);
      fd.append("label", "My voice");
      const { data } = await api.post("/narrations", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setNarration(data);
      setRecordedBlob(null);
    } catch {
      setError("Could not save your recording. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const discardRecorded = () => {
    setRecordedBlob(null);
    if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null; }
  };

  const deleteNarration = async () => {
    if (!narration) return;
    if (!window.confirm("Remove this recording? The story will use Sunny's voice again.")) return;
    try {
      await api.delete(`/narrations/${narration.id}`);
      setNarration(null);
    } catch {
      setError("Could not remove the recording.");
    }
  };

  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-[#457B9D]" />;
  }

  // ---- A recording exists: child hears ONLY the grown-up's voice ----
  if (narration) {
    return (
      <div className="flex flex-col items-end gap-1" data-testid="narration-exists">
        <div className="flex items-center gap-2">
          <button data-testid="narration-play" onClick={playParent}
            className="inline-flex items-center gap-2 rounded-full bg-[#457B9D] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5">
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            {playing ? "Stop" : "Hear my grown-up read it"}
          </button>
          <button data-testid="narration-delete" onClick={deleteNarration} title="Remove recording"
            className="inline-flex items-center justify-center rounded-full bg-white/80 p-2 text-[#E76F51] shadow-sm transition hover:bg-white">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <span className="text-[11px] text-[#94A3B8]">🎙️ Recorded by your grown-up</span>
      </div>
    );
  }

  // ---- Recorded but not yet saved: preview + save ----
  if (recordedBlob) {
    return (
      <div className="flex flex-col items-end gap-2" data-testid="narration-review">
        <div className="flex items-center gap-2">
          <button data-testid="narration-preview" onClick={previewRecorded}
            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-[#457B9D] shadow-sm">
            <Play className="h-4 w-4" /> Listen
          </button>
          <button data-testid="narration-save" onClick={saveRecording} disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[#2A9D8F] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save my voice
          </button>
          <button data-testid="narration-discard" onClick={discardRecorded}
            className="inline-flex items-center justify-center rounded-full bg-white/80 p-2 text-[#E76F51] shadow-sm">
            <X className="h-4 w-4" />
          </button>
        </div>
        {error && <span className="text-[11px] text-[#E76F51]">{error}</span>}
      </div>
    );
  }

  // ---- No recording yet: AI read-aloud + record button ----
  return (
    <div className="flex flex-col items-end gap-2" data-testid="narration-empty">
      <div className="flex items-center gap-2">
        <ReadAloud text={text} voice={aiVoice} label={aiLabel} testid="narration-ai-read" />
        {recording ? (
          <button data-testid="narration-stop" onClick={stopRecording}
            className="inline-flex items-center gap-2 rounded-full bg-[#E76F51] px-4 py-2 text-sm font-semibold text-white shadow-sm animate-pulse">
            <Square className="h-4 w-4" /> Stop & finish
          </button>
        ) : (
          <button data-testid="narration-record" onClick={startRecording}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#E76F51] shadow-sm transition-all hover:-translate-y-0.5">
            <Mic className="h-4 w-4" /> Record my voice
          </button>
        )}
      </div>
      {recording && <span className="text-[11px] font-semibold text-[#E76F51]">● Recording… read the story out loud, then tap Stop</span>}
      {!recording && <span className="text-[11px] text-[#94A3B8]"><RefreshCw className="inline h-3 w-3" /> Grown-ups: record once, your child hears you every time</span>}
      {error && <span className="text-[11px] text-[#E76F51]">{error}</span>}
    </div>
  );
}
