"""ElevenLabs voice cloning + TTS helpers for Brighter Dayz.

A parent records ~1-2 min of their own voice; we create an Instant Voice
Clone and reuse the returned voice_id to read ALL text aloud in their voice.
"""
import os
import logging
from elevenlabs import ElevenLabs, VoiceSettings

logger = logging.getLogger("brighterdayz.voiceclone")

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")
TTS_MODEL = "eleven_multilingual_v2"
OUTPUT_FORMAT = "mp3_44100_128"

_client = None


def _get_client():
    global _client
    if _client is None:
        if not ELEVENLABS_API_KEY:
            raise RuntimeError("ELEVENLABS_API_KEY not configured")
        _client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
    return _client


def is_enabled() -> bool:
    return bool(ELEVENLABS_API_KEY)


def create_clone(name: str, audio_bytes: bytes, content_type: str = "audio/webm") -> str:
    """Create an Instant Voice Clone from audio. Returns voice_id."""
    client = _get_client()
    ext = {"audio/webm": "webm", "audio/mpeg": "mp3", "audio/mp4": "m4a",
           "audio/ogg": "ogg", "audio/wav": "wav"}.get(content_type, "webm")
    voice = client.voices.ivc.create(
        name=name,
        files=[(f"sample.{ext}", audio_bytes, content_type)],
        description="Parent's voice for Brighter Dayz read-aloud",
    )
    return voice.voice_id


def synthesize(voice_id: str, text: str) -> bytes:
    """Generate speech bytes (mp3) for text using a cloned voice_id."""
    client = _get_client()
    stream = client.text_to_speech.convert(
        voice_id,
        text=text,
        model_id=TTS_MODEL,
        output_format=OUTPUT_FORMAT,
        voice_settings=VoiceSettings(
            stability=0.55, similarity_boost=0.85, style=0.0, use_speaker_boost=True
        ),
    )
    audio = b""
    for chunk in stream:
        if chunk:
            audio += chunk
    return audio


def delete_clone(voice_id: str) -> None:
    try:
        _get_client().voices.delete(voice_id)
    except Exception:
        logger.exception("failed to delete ElevenLabs voice %s", voice_id)
