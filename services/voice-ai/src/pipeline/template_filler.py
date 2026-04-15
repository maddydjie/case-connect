"""Map extracted entities and intents to department-specific case sheet fields."""

from __future__ import annotations

import logging
from typing import Any

from src.models import EntityType

logger = logging.getLogger(__name__)

_DEPARTMENT_FIELDS: dict[str, list[str]] = {
    "cardiology": [
        "chief_complaints", "vitals", "cardiac_history", "ecg_findings",
        "echo_findings", "diagnosis", "medications", "procedures",
        "risk_factors", "follow_up",
    ],
    "neurology": [
        "chief_complaints", "vitals", "neurological_exam", "consciousness_level",
        "diagnosis", "medications", "imaging", "procedures", "follow_up",
    ],
    "orthopedics": [
        "chief_complaints", "vitals", "injury_details", "examination",
        "imaging", "diagnosis", "medications", "procedures", "follow_up",
    ],
    "pulmonology": [
        "chief_complaints", "vitals", "respiratory_exam", "spo2",
        "diagnosis", "medications", "procedures", "follow_up",
    ],
    "gastroenterology": [
        "chief_complaints", "vitals", "abdominal_exam", "diet_history",
        "diagnosis", "medications", "procedures", "follow_up",
    ],
    "general_medicine": [
        "chief_complaints", "vitals", "history", "examination",
        "diagnosis", "medications", "investigations", "follow_up",
    ],
    "general_surgery": [
        "chief_complaints", "vitals", "examination", "pre_op_assessment",
        "diagnosis", "procedure_planned", "medications", "follow_up",
    ],
    "_default": [
        "chief_complaints", "vitals", "history", "examination",
        "diagnosis", "medications", "investigations", "follow_up",
    ],
}


class TemplateFiller:
    """Fill department-specific case sheet templates from NER + intent output."""

    def fill_template(
        self,
        text: str,
        entities: list[dict[str, Any]],
        intent: dict[str, Any],
    ) -> dict[str, Any]:
        """Build a structured case sheet from extracted data.

        Returns a dict with department-specific fields populated from entities.
        """
        department = intent.get("department") or "_default"
        action = intent.get("action", "unknown")

        grouped = self._group_entities(entities)

        template_fields = _DEPARTMENT_FIELDS.get(department, _DEPARTMENT_FIELDS["_default"])
        case_sheet: dict[str, Any] = {field: None for field in template_fields}

        case_sheet["chief_complaints"] = self._build_complaints(grouped, text)
        case_sheet["vitals"] = self._build_vitals(grouped)
        case_sheet["diagnosis"] = self._build_diagnosis(grouped)
        case_sheet["medications"] = self._build_medications(grouped)

        if "investigations" in case_sheet or "procedures" in case_sheet:
            procedures = self._extract_texts(grouped.get(EntityType.PROCEDURE, []))
            lab_values = self._extract_texts(grouped.get(EntityType.LAB_VALUE, []))
            if "investigations" in case_sheet:
                case_sheet["investigations"] = procedures + lab_values or None
            if "procedures" in case_sheet:
                case_sheet["procedures"] = procedures or None

        if "follow_up" in case_sheet:
            durations = self._extract_texts(grouped.get(EntityType.DURATION, []))
            case_sheet["follow_up"] = durations[-1] if durations else None

        case_sheet = {k: v for k, v in case_sheet.items() if v is not None}

        result = {
            "department": department if department != "_default" else None,
            "action": action,
            "original_text": text,
            "fields": case_sheet,
        }

        logger.debug(
            "Template filled: dept=%s, %d fields populated",
            department, len(case_sheet),
        )
        return result

    def _group_entities(
        self, entities: list[dict[str, Any]]
    ) -> dict[EntityType, list[dict[str, Any]]]:
        grouped: dict[EntityType, list[dict[str, Any]]] = {}
        for ent in entities:
            try:
                etype = EntityType(ent["entity_type"])
            except (ValueError, KeyError):
                continue
            grouped.setdefault(etype, []).append(ent)
        return grouped

    def _build_complaints(
        self, grouped: dict[EntityType, list[dict[str, Any]]], text: str
    ) -> list[dict[str, str | None]] | None:
        symptoms = grouped.get(EntityType.SYMPTOM, [])
        body_parts = grouped.get(EntityType.BODY_PART, [])
        durations = grouped.get(EntityType.DURATION, [])

        if not symptoms:
            return None

        complaints: list[dict[str, str | None]] = []
        duration_text = durations[0]["text"] if durations else None

        for symptom in symptoms:
            related_part = self._find_nearby_entity(symptom, body_parts, text, window=60)
            complaints.append({
                "symptom": symptom["text"],
                "body_part": related_part,
                "duration": duration_text,
            })
        return complaints

    def _build_vitals(
        self, grouped: dict[EntityType, list[dict[str, Any]]]
    ) -> dict[str, str] | None:
        vitals_entities = grouped.get(EntityType.VITAL, [])
        if not vitals_entities:
            return None
        return {v["text"]: "" for v in vitals_entities}

    def _build_diagnosis(
        self, grouped: dict[EntityType, list[dict[str, Any]]]
    ) -> list[str] | None:
        diagnoses = grouped.get(EntityType.DIAGNOSIS, [])
        if not diagnoses:
            return None
        return [d["text"] for d in diagnoses]

    def _build_medications(
        self, grouped: dict[EntityType, list[dict[str, Any]]]
    ) -> list[dict[str, str | None]] | None:
        meds = grouped.get(EntityType.MEDICATION, [])
        dosages = grouped.get(EntityType.DOSAGE, [])
        frequencies = grouped.get(EntityType.FREQUENCY, [])

        if not meds:
            return None

        medications: list[dict[str, str | None]] = []
        for i, med in enumerate(meds):
            dosage = dosages[i]["text"] if i < len(dosages) else None
            frequency = frequencies[i]["text"] if i < len(frequencies) else None
            medications.append({
                "name": med["text"],
                "dosage": dosage,
                "frequency": frequency,
            })
        return medications

    def _find_nearby_entity(
        self,
        target: dict[str, Any],
        candidates: list[dict[str, Any]],
        text: str,
        window: int = 60,
    ) -> str | None:
        """Find the closest candidate entity within a character window."""
        target_start = target.get("start", 0)
        target_end = target.get("end", 0)

        best: dict[str, Any] | None = None
        best_dist = window + 1

        for cand in candidates:
            cand_start = cand.get("start", 0)
            cand_end = cand.get("end", 0)
            dist = min(abs(cand_start - target_end), abs(target_start - cand_end))
            if dist < best_dist:
                best_dist = dist
                best = cand

        return best["text"] if best else None

    @staticmethod
    def _extract_texts(entities: list[dict[str, Any]]) -> list[str]:
        return [e["text"] for e in entities]
