"""CaseConnect Voice AI Service - voice-to-structured-data pipeline."""

from __future__ import annotations

import asyncio
import json
import logging
import os
import tempfile
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

import numpy as np
import soundfile as sf
from fastapi import FastAPI, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from src.config import Settings, settings
from src.models import (
    ModelStatus,
    ProcessTextRequest,
    ProcessTextResponse,
    TranscriptionResult,
    TranscriptionSegment,
    VoiceIntent,
    MedicalEntity,
)
from src.pipeline.intent_classifier import IntentClassifier
from src.pipeline.medical_ner import MedicalNERProcessor
from src.pipeline.noise_reduction import reduce_noise
from src.pipeline.template_filler import TemplateFiller
from src.pipeline.transcriber import WhisperTranscriber
from src.pipeline.vad import detect_voice_activity, extract_voice_segments

logger = logging.getLogger(__name__)

transcriber = WhisperTranscriber()
ner_processor = MedicalNERProcessor()
intent_classifier = IntentClassifier()
template_filler = TemplateFiller()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    Settings.configure_logging()
    logger.info("Starting CaseConnect Voice AI service on port %s", settings.PORT)

    os.makedirs(settings.TEMP_DIR, exist_ok=True)

    loop = asyncio.get_event_loop()
    try:
        await loop.run_in_executor(None, ner_processor.load)
        logger.info("NER processor loaded at startup")
    except Exception:
        logger.warning("NER processor failed to preload; will load on first request")

    yield

    logger.info("Shutting down Voice AI service")


app = FastAPI(
    title="CaseConnect Voice AI",
    description="Voice-to-structured-data pipeline for medical case management",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy", "service": "voice-ai"}


@app.get("/api/v1/voice/models/status")
async def models_status() -> ModelStatus:
    return ModelStatus(
        whisper_loaded=transcriber.is_loaded,
        whisper_model=transcriber.model_name,
        spacy_loaded=ner_processor.is_loaded,
        spacy_model=settings.SPACY_MODEL,
        device=settings.WHISPER_DEVICE,
        ready=ner_processor.is_loaded,
    )


@app.post("/api/v1/voice/transcribe", response_model=TranscriptionResult)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = "en",
) -> TranscriptionResult:
    """Accept audio upload and run the full voice-to-structured-data pipeline."""
    _validate_upload(file)

    tmp_path: str | None = None
    try:
        tmp_path = await _save_upload(file)
        audio_data, sample_rate = sf.read(tmp_path, dtype="float32")

        loop = asyncio.get_event_loop()

        processed_audio = await loop.run_in_executor(
            None, reduce_noise, audio_data, sample_rate
        )

        voice_segments = await loop.run_in_executor(
            None, detect_voice_activity, processed_audio, sample_rate
        )

        voiced_audio = extract_voice_segments(processed_audio, sample_rate, voice_segments)

        voiced_path = tmp_path + "_voiced.wav"
        sf.write(voiced_path, voiced_audio, sample_rate)

        transcription = await loop.run_in_executor(
            None, lambda: transcriber.transcribe(voiced_path, language=language)
        )

        text = transcription["text"]
        result = await _process_text_pipeline(text, loop)

        segments = [
            TranscriptionSegment(**seg) for seg in transcription.get("segments", [])
        ]

        return TranscriptionResult(
            text=text,
            language=transcription.get("language", language),
            duration=transcription.get("duration", 0.0),
            segments=segments,
            entities=[MedicalEntity(**e) for e in result["entities"]],
            intent=VoiceIntent(**result["intent"]),
            case_sheet=result["case_sheet"],
            confidence=transcription.get("confidence", 0.0),
        )

    except HTTPException:
        raise
    except FileNotFoundError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Transcription pipeline failed")
        raise HTTPException(status_code=500, detail=f"Pipeline error: {exc}") from exc
    finally:
        _cleanup_temp(tmp_path)


@app.post("/api/v1/voice/process-text", response_model=ProcessTextResponse)
async def process_text(request: ProcessTextRequest) -> ProcessTextResponse:
    """Process raw text through NER, intent classification, and template filling."""
    try:
        loop = asyncio.get_event_loop()
        result = await _process_text_pipeline(request.text, loop)

        return ProcessTextResponse(
            text=request.text,
            entities=[MedicalEntity(**e) for e in result["entities"]],
            intent=VoiceIntent(**result["intent"]),
            case_sheet=result["case_sheet"],
        )
    except Exception as exc:
        logger.exception("Text processing failed")
        raise HTTPException(status_code=500, detail=f"Processing error: {exc}") from exc


@app.websocket("/api/v1/voice/stream")
async def stream_transcription(ws: WebSocket) -> None:
    """Real-time streaming transcription over WebSocket.

    The client sends binary audio chunks; the server responds with
    incremental transcription JSON messages.
    """
    await ws.accept()
    logger.info("WebSocket client connected for streaming")

    audio_buffer = bytearray()
    sample_rate = 16000
    chunk_duration_sec = 5
    chunk_size = sample_rate * chunk_duration_sec * 2  # 16-bit PCM

    try:
        while True:
            data = await ws.receive()

            if "bytes" in data and data["bytes"]:
                audio_buffer.extend(data["bytes"])
            elif "text" in data and data["text"]:
                msg = json.loads(data["text"])
                if msg.get("action") == "config":
                    sample_rate = msg.get("sample_rate", 16000)
                    chunk_size = sample_rate * chunk_duration_sec * 2
                    await ws.send_json({"type": "config_ack", "sample_rate": sample_rate})
                    continue
                if msg.get("action") == "end":
                    break

            if len(audio_buffer) >= chunk_size:
                chunk = bytes(audio_buffer[:chunk_size])
                audio_buffer = audio_buffer[chunk_size:]

                audio_array = np.frombuffer(chunk, dtype=np.int16).astype(np.float32) / 32768.0

                loop = asyncio.get_event_loop()
                try:
                    result = await loop.run_in_executor(
                        None, transcriber.transcribe_array, audio_array, sample_rate
                    )
                    text = result["text"]

                    entities_raw = await loop.run_in_executor(
                        None, ner_processor.extract_entities, text
                    )
                    intent_raw = await loop.run_in_executor(
                        None, intent_classifier.classify, text, entities_raw
                    )

                    await ws.send_json({
                        "type": "partial",
                        "text": text,
                        "entities": entities_raw,
                        "intent": intent_raw,
                    })
                except Exception as exc:
                    logger.error("Streaming chunk processing error: %s", exc)
                    await ws.send_json({"type": "error", "message": str(exc)})

        if audio_buffer:
            remaining = np.frombuffer(bytes(audio_buffer), dtype=np.int16).astype(np.float32) / 32768.0
            if len(remaining) > sample_rate * 0.5:
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(
                    None, transcriber.transcribe_array, remaining, sample_rate
                )
                text_pipeline = await _process_text_pipeline(result["text"], loop)
                await ws.send_json({
                    "type": "final",
                    "text": result["text"],
                    "entities": text_pipeline["entities"],
                    "intent": text_pipeline["intent"],
                    "case_sheet": text_pipeline["case_sheet"],
                })

        await ws.send_json({"type": "done"})

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as exc:
        logger.exception("WebSocket error")
        try:
            await ws.send_json({"type": "error", "message": str(exc)})
        except Exception:
            pass


async def _process_text_pipeline(
    text: str, loop: asyncio.AbstractEventLoop
) -> dict:
    """Run NER -> intent classification -> template filling on text."""
    entities_raw = await loop.run_in_executor(
        None, ner_processor.extract_entities, text
    )
    intent_raw = await loop.run_in_executor(
        None, intent_classifier.classify, text, entities_raw
    )
    case_sheet = await loop.run_in_executor(
        None, template_filler.fill_template, text, entities_raw, intent_raw
    )
    return {
        "entities": entities_raw,
        "intent": intent_raw,
        "case_sheet": case_sheet,
    }


def _validate_upload(file: UploadFile) -> None:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in settings.SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{ext}'. Supported: {settings.SUPPORTED_FORMATS}",
        )


async def _save_upload(file: UploadFile) -> str:
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "wav"
    fd, tmp_path = tempfile.mkstemp(suffix=f".{ext}", dir=settings.TEMP_DIR)
    try:
        content = await file.read()
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            os.close(fd)
            os.unlink(tmp_path)
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE_MB} MB",
            )
        with os.fdopen(fd, "wb") as f:
            f.write(content)
    except HTTPException:
        raise
    except Exception as exc:
        os.close(fd)
        os.unlink(tmp_path)
        raise HTTPException(status_code=500, detail=f"Failed to save upload: {exc}") from exc
    return tmp_path


def _cleanup_temp(path: str | None) -> None:
    if not path:
        return
    for p in [path, path + "_voiced.wav"]:
        try:
            if os.path.exists(p):
                os.unlink(p)
        except OSError:
            pass


if __name__ == "__main__":
    import uvicorn
    Settings.configure_logging()
    uvicorn.run(
        "src.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level=settings.LOG_LEVEL.lower(),
    )
