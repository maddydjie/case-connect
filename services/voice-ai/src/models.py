from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class VoiceAction(str, Enum):
    NEW_CASE = "new_case"
    NEW_OP = "new_op"
    EMERGENCY = "emergency"
    FOLLOW_UP = "follow_up"
    ASSIGN_BED = "assign_bed"
    ORDER_TEST = "order_test"
    PRESCRIBE = "prescribe"
    DISCHARGE = "discharge"
    UNKNOWN = "unknown"


class EntityType(str, Enum):
    SYMPTOM = "SYMPTOM"
    DIAGNOSIS = "DIAGNOSIS"
    MEDICATION = "MEDICATION"
    DOSAGE = "DOSAGE"
    PROCEDURE = "PROCEDURE"
    VITAL = "VITAL"
    LAB_VALUE = "LAB_VALUE"
    BODY_PART = "BODY_PART"
    DURATION = "DURATION"
    FREQUENCY = "FREQUENCY"


class MedicalEntity(BaseModel):
    text: str
    entity_type: EntityType
    start: int
    end: int
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class TranscriptionSegment(BaseModel):
    id: int
    start: float
    end: float
    text: str
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class VoiceIntent(BaseModel):
    action: VoiceAction = VoiceAction.UNKNOWN
    department: str | None = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    raw_keywords: list[str] = Field(default_factory=list)


class TranscriptionResult(BaseModel):
    text: str
    language: str = "en"
    duration: float = 0.0
    segments: list[TranscriptionSegment] = Field(default_factory=list)
    entities: list[MedicalEntity] = Field(default_factory=list)
    intent: VoiceIntent = Field(default_factory=VoiceIntent)
    case_sheet: dict[str, Any] = Field(default_factory=dict)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class TranscriptionRequest(BaseModel):
    language: str = "en"
    model: str | None = None


class ProcessTextRequest(BaseModel):
    text: str
    language: str = "en"
    department: str | None = None


class ProcessTextResponse(BaseModel):
    text: str
    entities: list[MedicalEntity] = Field(default_factory=list)
    intent: VoiceIntent = Field(default_factory=VoiceIntent)
    case_sheet: dict[str, Any] = Field(default_factory=dict)


class ModelStatus(BaseModel):
    whisper_loaded: bool = False
    whisper_model: str = ""
    spacy_loaded: bool = False
    spacy_model: str = ""
    device: str = "cpu"
    ready: bool = False
