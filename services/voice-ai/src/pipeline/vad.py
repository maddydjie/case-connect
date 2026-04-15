"""Energy-based Voice Activity Detection."""

from __future__ import annotations

import logging
from dataclasses import dataclass

import numpy as np

logger = logging.getLogger(__name__)

_DEFAULT_FRAME_MS = 30
_DEFAULT_ENERGY_THRESHOLD = 0.01
_MIN_SPEECH_MS = 250
_MIN_SILENCE_MS = 300
_PADDING_MS = 100


@dataclass
class VoiceSegment:
    start: float
    end: float

    @property
    def duration(self) -> float:
        return self.end - self.start


def detect_voice_activity(
    audio_data: np.ndarray,
    sample_rate: int,
    *,
    frame_ms: int = _DEFAULT_FRAME_MS,
    energy_threshold: float = _DEFAULT_ENERGY_THRESHOLD,
    min_speech_ms: int = _MIN_SPEECH_MS,
    min_silence_ms: int = _MIN_SILENCE_MS,
    padding_ms: int = _PADDING_MS,
) -> list[VoiceSegment]:
    """Detect voice segments using frame-level RMS energy thresholding.

    Returns a list of VoiceSegment with start/end times in seconds.
    """
    if audio_data.size == 0:
        return []

    if audio_data.ndim > 1:
        audio_data = audio_data.mean(axis=1)

    audio_float = audio_data.astype(np.float32)
    peak = np.max(np.abs(audio_float))
    if peak > 0:
        audio_float = audio_float / peak

    frame_size = int(sample_rate * frame_ms / 1000)
    n_frames = len(audio_float) // frame_size

    if n_frames == 0:
        return [VoiceSegment(start=0.0, end=len(audio_float) / sample_rate)]

    rms_values = np.array([
        np.sqrt(np.mean(audio_float[i * frame_size : (i + 1) * frame_size] ** 2))
        for i in range(n_frames)
    ])

    adaptive_threshold = max(energy_threshold, np.median(rms_values) * 1.5)
    is_speech = rms_values > adaptive_threshold

    min_speech_frames = max(1, int(min_speech_ms / frame_ms))
    min_silence_frames = max(1, int(min_silence_ms / frame_ms))
    padding_frames = max(0, int(padding_ms / frame_ms))

    segments: list[VoiceSegment] = []
    in_speech = False
    speech_start = 0
    silence_count = 0

    for i, frame_is_speech in enumerate(is_speech):
        if frame_is_speech:
            if not in_speech:
                speech_start = i
                in_speech = True
            silence_count = 0
        elif in_speech:
            silence_count += 1
            if silence_count >= min_silence_frames:
                speech_end = i - silence_count
                if speech_end - speech_start >= min_speech_frames:
                    start_sec = max(0.0, (speech_start - padding_frames) * frame_ms / 1000)
                    end_sec = min(
                        len(audio_float) / sample_rate,
                        (speech_end + padding_frames) * frame_ms / 1000,
                    )
                    segments.append(VoiceSegment(start=start_sec, end=end_sec))
                in_speech = False
                silence_count = 0

    if in_speech:
        speech_end = n_frames
        if speech_end - speech_start >= min_speech_frames:
            start_sec = max(0.0, (speech_start - padding_frames) * frame_ms / 1000)
            end_sec = len(audio_float) / sample_rate
            segments.append(VoiceSegment(start=start_sec, end=end_sec))

    segments = _merge_close_segments(segments, min_gap=min_silence_ms / 1000)

    if not segments and np.max(rms_values) > energy_threshold * 0.5:
        segments = [VoiceSegment(start=0.0, end=len(audio_float) / sample_rate)]

    logger.debug("VAD found %d voice segments in %.1fs audio", len(segments), len(audio_float) / sample_rate)
    return segments


def extract_voice_segments(
    audio_data: np.ndarray,
    sample_rate: int,
    segments: list[VoiceSegment],
) -> np.ndarray:
    """Concatenate only voiced portions of audio."""
    if not segments:
        return audio_data

    parts: list[np.ndarray] = []
    for seg in segments:
        start_idx = int(seg.start * sample_rate)
        end_idx = int(seg.end * sample_rate)
        parts.append(audio_data[start_idx:end_idx])

    return np.concatenate(parts) if parts else audio_data


def _merge_close_segments(
    segments: list[VoiceSegment], min_gap: float
) -> list[VoiceSegment]:
    """Merge segments that are separated by less than min_gap seconds."""
    if len(segments) <= 1:
        return segments

    merged: list[VoiceSegment] = [segments[0]]
    for seg in segments[1:]:
        if seg.start - merged[-1].end < min_gap:
            merged[-1] = VoiceSegment(start=merged[-1].start, end=seg.end)
        else:
            merged.append(seg)
    return merged
