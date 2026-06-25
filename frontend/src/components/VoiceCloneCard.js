import React, { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { Mic, Square, Play, Pause, Loader2, Check, Trash2, RefreshCw, Sparkles } from "lucide-react";

const SCRIPT = `Hello, my love. I am so happy you are here today. Take a slow, deep breath with me. In... and out. You are safe, you are loved, and you are never alone. God made you wonderfully, and so did I. No matter how big your feelings are, we can face them together. When you feel worried or sad, remember that Jesus is always close, holding your hand. You are brave. You are kind. You are my sunshine. Let's read a story, say a little prayer, and remember that tomorrow is a brand new day, full of hope and bright with love.`;

function pickMimeType() {
  const candidates = ["audio/webm", "audio/mp4", "audio/ogg"];
  if (typeof MediaRecorder === "undefined") return "";
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) || "";
}

export default function VoiceCloneCard() {
  const [enabled, setEnabled] = useState(true);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const previewUrlRef = useRef(null);
  const testAudioRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/voice-clone");
      setEnabled(data.enabled);
      setProfile(data.profile || null);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      if (testAudioRef.current) testAudioRef.current.pause();
    };
  }, []);

  const startRecording = async () => {
    setError(""); setOkMsg("");
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
      setRecordedBlob(null);
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("Please allow microphone access to record your voice.");
    }
  };

  const stopRecording = () => {
    if (mediaRef.current && mediaRef.current.state !== "inactive") mediaRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  };

  const previewRecorded = () => {
    if (!previewUrlRef.current) return;
    new Audio(previewUrlRef.current).play();
  };

  const saveClone = async () => {
    if (!recordedBlob) return;
    setSaving(true); setError(""); setOkMsg("");
    try {
      const ext = (recordedBlob.type.includes("mp4") && "m4a") || (recordedBlob.type.includes("ogg") && "ogg") || "webm";
      const fd = new FormData();
      fd.append("file", recordedBlob, `voice.${ext}`);
      fd.append("name", "My voice");
      const { data } = await api.post("/voice-clone", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setProfile(data.profile);
      setRecordedBlob(null);
      setOkMsg("Your voice is ready! Sunny and every story will now read in your voice. 💛");
    } catch (e) {
      const detail = e?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Could not create your voice. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const testVoice = async () => {
    setTesting(true); setError("");
    try {
      const { data } = await api.post("/tts", { text: "Hi sweetheart, it's me. I love you to the moon and back." });
      const audio = new Audio(data.audio);
      testAudioRef.current = audio;
      await audio.play();
    } catch {
      setError("Could not play a sample right now.");
    } finally {
      setTesting(false);
    }
  };

  const removeClone = async () => {
    if (!window.confirm("Remove your voice? Read-aloud will go back to the gentle app voice.")) return;
    try {
      await api.delete("/voice-clone");
      setProfile(null);
      setOkMsg("");
    } catch {
      setError("Could not remove your voice.");
    }
  };

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div data-testid="voice-clone-card" className="mb-8 rounded-2xl border-2 border-[#C9E4DE] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-6 w-6 text-[#2A9D8F]" />
        <h2 className="text-lg font-bold text-[#1D3557] font-['Nunito']">Your voice as Sunny</h2>
      </div>
      <p className="text-sm text-[#64748b] mb-4">
        Record yourself once, and your child will hear <b>your voice</b> everywhere — Sunny's chat, every storybook, prayers and happy words.
      </p>

      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-[#457B9D]" />
      ) : !enabled ? (
        <p className="rounded-xl bg-[#FFF6F4] p-4 text-sm text-[#7A2E26]">Voice cloning isn't configured yet. Please add your ElevenLabs API key.</p>
      ) : profile ? (
        <div data-testid="voice-clone-active" className="flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-[#E8F5F1] p-4">
            <Check className="h-5 w-5 text-[#2A9D8F]" />
            <span className="font-semibold text-[#1D3557]">Your voice is set up and in use across the app.</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button data-testid="voice-test" onClick={testVoice} disabled={testing}
              className="inline-flex items-center gap-2 rounded-full bg-[#457B9D] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Hear a sample
            </button>
            <button data-testid="voice-rerecord" onClick={() => setProfile(null)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#457B9D] shadow-sm border border-[#E2E8F0]">
              <RefreshCw className="h-4 w-4" /> Re-record
            </button>
            <button data-testid="voice-remove" onClick={removeClone}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#E76F51] shadow-sm border border-[#FCE0D8]">
              <Trash2 className="h-4 w-4" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-[#F8FAFC] p-4 border border-[#EEF2F7]">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#94a3b8]">Read this slowly &amp; warmly (about 30–60 seconds)</p>
            <p className="text-[15px] leading-relaxed text-[#1D3557]">{SCRIPT}</p>
          </div>

          {!recordedBlob ? (
            <div className="flex items-center gap-3">
              {recording ? (
                <>
                  <button data-testid="voice-stop" onClick={stopRecording}
                    className="inline-flex items-center gap-2 rounded-full bg-[#E76F51] px-5 py-3 font-bold text-white shadow-sm animate-pulse">
                    <Square className="h-5 w-5" /> Stop recording
                  </button>
                  <span className="font-mono text-lg font-semibold text-[#E76F51]">● {mmss}</span>
                </>
              ) : (
                <button data-testid="voice-record" onClick={startRecording}
                  className="inline-flex items-center gap-2 rounded-full bg-[#2A9D8F] px-5 py-3 font-bold text-white shadow-sm transition hover:-translate-y-0.5">
                  <Mic className="h-5 w-5" /> Record my voice
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button data-testid="voice-preview" onClick={previewRecorded}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#457B9D] shadow-sm border border-[#E2E8F0]">
                <Play className="h-4 w-4" /> Listen back
              </button>
              <button data-testid="voice-save" onClick={saveClone} disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-[#2A9D8F] px-5 py-2.5 font-bold text-white shadow-sm disabled:opacity-60">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating your voice…</> : <><Check className="h-4 w-4" /> Use this as my voice</>}
              </button>
              <button data-testid="voice-redo" onClick={startRecording}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#E76F51] shadow-sm border border-[#FCE0D8]">
                <RefreshCw className="h-4 w-4" /> Record again
              </button>
            </div>
          )}
        </div>
      )}

      {okMsg && <p data-testid="voice-ok" className="mt-3 text-sm font-semibold text-[#2A9D8F]">{okMsg}</p>}
      {error && <p data-testid="voice-error" className="mt-3 text-sm font-semibold text-[#E76F51]">{error}</p>}
    </div>
  );
}
