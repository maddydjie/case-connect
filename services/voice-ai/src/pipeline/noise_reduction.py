"""Audio preprocessing with spectral-gating noise reduction (numpy-based)."""

import logging

import numpy as np

logger = logging.getLogger(__name__)


def reduce_noise(
    audio_data: np.ndarray,
    sample_rate: int,
    *,
    noise_thresh_db: float = -40.0,
    n_fft: int = 2048,
    hop_length: int = 512,
) -> np.ndarray:
    """Apply spectral-gating noise reduction to audio.

    Estimates a noise profile from the quietest frames and subtracts it
    from the full spectrogram, then reconstructs via inverse STFT.
    """
    if audio_data.size == 0:
        return audio_data

    if audio_data.ndim > 1:
        audio_data = audio_data.mean(axis=1)

    audio_float = audio_data.astype(np.float32)

    windowed = _stft(audio_float, n_fft, hop_length)
    magnitude = np.abs(windowed)
    phase = np.angle(windowed)

    frame_energy = np.mean(magnitude, axis=0)
    noise_frame_count = max(1, int(len(frame_energy) * 0.1))
    quietest_indices = np.argsort(frame_energy)[:noise_frame_count]
    noise_profile = np.mean(magnitude[:, quietest_indices], axis=1, keepdims=True)

    threshold_linear = 10 ** (noise_thresh_db / 20.0)
    gain = np.maximum(magnitude - noise_profile * (1.0 + threshold_linear), 0.0)
    gain = np.where(magnitude > 0, gain / (magnitude + 1e-10), 0.0)
    gain = np.clip(gain, 0.0, 1.0)

    cleaned_magnitude = magnitude * gain
    cleaned_complex = cleaned_magnitude * np.exp(1j * phase)

    result = _istft(cleaned_complex, n_fft, hop_length, len(audio_float))
    result = normalize_audio(result)

    logger.debug(
        "Noise reduction applied: %d samples at %d Hz", len(result), sample_rate
    )
    return result


def normalize_audio(audio: np.ndarray, target_db: float = -3.0) -> np.ndarray:
    """Normalize audio to a target peak level in dB."""
    peak = np.max(np.abs(audio))
    if peak < 1e-10:
        return audio
    target_linear = 10 ** (target_db / 20.0)
    return audio * (target_linear / peak)


def _stft(signal: np.ndarray, n_fft: int, hop_length: int) -> np.ndarray:
    """Short-time Fourier transform."""
    window = np.hanning(n_fft)
    pad_length = n_fft // 2
    padded = np.pad(signal, (pad_length, pad_length), mode="reflect")

    n_frames = 1 + (len(padded) - n_fft) // hop_length
    frames = np.stack(
        [padded[i * hop_length : i * hop_length + n_fft] for i in range(n_frames)],
        axis=-1,
    )
    windowed = frames * window[:, np.newaxis]
    return np.fft.rfft(windowed, n=n_fft, axis=0)


def _istft(
    stft_matrix: np.ndarray, n_fft: int, hop_length: int, length: int
) -> np.ndarray:
    """Inverse short-time Fourier transform with overlap-add."""
    window = np.hanning(n_fft)
    n_frames = stft_matrix.shape[1]
    expected_length = n_fft + hop_length * (n_frames - 1)
    output = np.zeros(expected_length)
    window_sum = np.zeros(expected_length)

    for i in range(n_frames):
        frame = np.fft.irfft(stft_matrix[:, i], n=n_fft)
        start = i * hop_length
        output[start : start + n_fft] += frame * window
        window_sum[start : start + n_fft] += window ** 2

    nonzero = window_sum > 1e-10
    output[nonzero] /= window_sum[nonzero]

    pad_length = n_fft // 2
    return output[pad_length : pad_length + length]
