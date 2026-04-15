"""Whisper-based speech-to-text transcription with lazy model loading."""

from __future__ import annotations

import logging
import time
from pathlib import Path
from typing import Any

import numpy as np

from src.config import settings

logger = logging.getLogger(__name__)


class WhisperTranscriber:
    """Wraps OpenAI Whisper with lazy loading and caching."""

    def __init__(self, model_name: str | None = None):
        self._model_name = model_name or settings.WHISPER_MODEL
        self._model: Any = None
        self._load_time: float = 0.0

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    @property
    def model_name(self) -> str:
        return self._model_name

    def load_model(self) -> None:
        """Load the Whisper model into memory (idempotent)."""
        if self._model is not None:
            return

        logger.info("Loading Whisper model '%s' on device '%s'...", self._model_name, settings.WHISPER_DEVICE)
        start = time.monotonic()

        try:
            import whisper
            self._model = whisper.load_model(
                self._model_name,
                device=settings.WHISPER_DEVICE,
            )
            self._load_time = time.monotonic() - start
            logger.info("Whisper model loaded in %.2fs", self._load_time)
        except Exception:
            logger.exception("Failed to load Whisper model '%s'", self._model_name)
            raise

    def transcribe(
        self,
        audio_path: str | Path,
        *,
        language: str = "en",
    ) -> dict[str, Any]:
        """Transcribe an audio file and return structured results.

        Returns dict with keys: text, segments, confidence, duration, language.
        """
        self.load_model()

        audio_path = Path(audio_path)
        if not audio_path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        logger.info("Transcribing %s (language=%s)", audio_path.name, language)
        start = time.monotonic()

        result = self._model.transcribe(
            str(audio_path),
            language=language,
            fp16=False,
            verbose=False,
        )

        elapsed = time.monotonic() - start
        segments = [
            {
                "id": seg["id"],
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"].strip(),
                "confidence": seg.get("avg_logprob", 0.0),
            }
            for seg in result.get("segments", [])
        ]

        duration = segments[-1]["end"] if segments else 0.0
        avg_confidence = (
            sum(s["confidence"] for s in segments) / len(segments)
            if segments
            else 0.0
        )

        logger.info(
            "Transcription complete: %.1fs audio in %.2fs (%.1fx realtime)",
            duration,
            elapsed,
            duration / elapsed if elapsed > 0 else 0,
        )

        return {
            "text": result["text"].strip(),
            "segments": segments,
            "confidence": avg_confidence,
            "duration": duration,
            "language": result.get("language", language),
        }

    def transcribe_array(
        self,
        audio_data: np.ndarray,
        sample_rate: int,
        *,
        language: str = "en",
    ) -> dict[str, Any]:
        """Transcribe from a numpy array by saving to a temp file."""
        import soundfile as sf
        import tempfile

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            sf.write(tmp.name, audio_data, sample_rate)
            return self.transcribe(tmp.name, language=language)
