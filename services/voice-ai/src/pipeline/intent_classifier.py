"""Keyword and pattern-based intent classification for voice commands."""

from __future__ import annotations

import logging
import re
from typing import Any

from src.models import VoiceAction

logger = logging.getLogger(__name__)

_ACTION_KEYWORDS: dict[VoiceAction, list[str]] = {
    VoiceAction.NEW_CASE: [
        r"\bnew case\b", r"\bcreate case\b", r"\bopen case\b", r"\bregister patient\b",
        r"\bnew patient\b", r"\badmit patient\b", r"\bnew admission\b",
        r"\bstart case\b", r"\binitiate case\b",
    ],
    VoiceAction.NEW_OP: [
        r"\bnew op\b", r"\boutpatient\b", r"\bop visit\b", r"\bopd\b",
        r"\bnew outpatient\b", r"\bwalk-?in\b", r"\bconsultation\b",
    ],
    VoiceAction.EMERGENCY: [
        r"\bemergency\b", r"\burgent\b", r"\bcritical\b", r"\bcode blue\b",
        r"\bcode red\b", r"\btrauma\b", r"\bresuscitat\w*\b", r"\bcrash\b",
        r"\blife threatening\b", r"\bsevere\b",
    ],
    VoiceAction.FOLLOW_UP: [
        r"\bfollow[- ]?up\b", r"\breview\b", r"\bcheck[- ]?up\b",
        r"\bnext visit\b", r"\breturn visit\b", r"\bschedule follow\b",
    ],
    VoiceAction.ASSIGN_BED: [
        r"\bassign bed\b", r"\ballocate bed\b", r"\bbed number\b",
        r"\bshift to\b", r"\btransfer to\b", r"\bward\b",
        r"\bicu\b", r"\bnicu\b", r"\bpicu\b", r"\bccu\b",
    ],
    VoiceAction.ORDER_TEST: [
        r"\border test\b", r"\bget test\b", r"\brun test\b", r"\bsend for\b",
        r"\bbook test\b", r"\binvestigation\b", r"\blab order\b",
        r"\bdo (?:a |an )?(?:blood|urine|ecg|echo|x-?ray|ct|mri|ultrasound)\b",
    ],
    VoiceAction.PRESCRIBE: [
        r"\bprescribe\b", r"\bstart (?:on |with )?\w+\b.*(?:mg|ml|tablet|capsule)\b",
        r"\bgive (?:tab|cap|inj|syrup)\b", r"\bmedication\b", r"\bmedicine\b",
        r"\bdosage\b", r"\bdrug\b", r"\bprescription\b",
    ],
    VoiceAction.DISCHARGE: [
        r"\bdischarge\b", r"\brelease patient\b", r"\bsend home\b",
        r"\bdischarge summary\b", r"\bfit for discharge\b", r"\bready to go\b",
    ],
}

_DEPARTMENT_KEYWORDS: dict[str, list[str]] = {
    "cardiology": [
        r"\bcardiol\w*\b", r"\bheart\b", r"\bcardiac\b", r"\bchest pain\b",
        r"\becg\b", r"\becho\b", r"\bangio\w*\b", r"\bstent\b", r"\bpacemaker\b",
    ],
    "neurology": [
        r"\bneuro\w*\b", r"\bbrain\b", r"\bstroke\b", r"\bseizure\b",
        r"\bepilepsy\b", r"\bheadache\b", r"\bmigraine\b", r"\bnerve\b",
    ],
    "orthopedics": [
        r"\bortho\w*\b", r"\bfracture\b", r"\bbone\b", r"\bjoint\b",
        r"\bspine\b", r"\bspondyl\w*\b", r"\bknee\b", r"\bhip replacement\b",
    ],
    "pulmonology": [
        r"\bpulmon\w*\b", r"\blung\b", r"\basthma\b", r"\bcopd\b",
        r"\bbronch\w*\b", r"\bpneumonia\b", r"\btb\b", r"\btuberculosis\b",
    ],
    "gastroenterology": [
        r"\bgastro\w*\b", r"\bstomach\b", r"\bliver\b", r"\bgerd\b",
        r"\bjaundice\b", r"\bendoscopy\b", r"\bcolonoscopy\b", r"\bpancreat\w*\b",
    ],
    "nephrology": [
        r"\bnephro\w*\b", r"\bkidney\b", r"\brenal\b", r"\bdialysis\b",
        r"\bcreatinine\b", r"\buti\b",
    ],
    "endocrinology": [
        r"\bendocrin\w*\b", r"\bdiabetes\b", r"\bthyroid\b", r"\bhormone\b",
        r"\binsulin\b", r"\bhba1c\b",
    ],
    "oncology": [
        r"\boncol\w*\b", r"\bcancer\b", r"\btumor\b", r"\btumour\b",
        r"\bchemotherapy\b", r"\bradiation\b", r"\bbiopsy\b",
    ],
    "pediatrics": [
        r"\bpediatri\w*\b", r"\bpaediatri\w*\b", r"\bchild\b", r"\binfant\b",
        r"\bnewborn\b", r"\bneonatal\b",
    ],
    "obstetrics": [
        r"\bobstetric\w*\b", r"\bgynec\w*\b", r"\bpregnancy\b", r"\bpregnant\b",
        r"\bdelivery\b", r"\bc-?section\b", r"\bantenatal\b", r"\bpostnatal\b",
    ],
    "dermatology": [
        r"\bdermat\w*\b", r"\bskin\b", r"\brash\b", r"\beczema\b",
        r"\bpsoriasis\b", r"\bacne\b",
    ],
    "ophthalmology": [
        r"\bophthalmol\w*\b", r"\beye\b", r"\bvision\b", r"\bcataract\b",
        r"\bglaucoma\b", r"\bretina\b",
    ],
    "ent": [
        r"\bent\b", r"\bear\b", r"\bnose\b", r"\bthroat\b", r"\bsinus\w*\b",
        r"\btonsil\w*\b", r"\botitis\b",
    ],
    "general_medicine": [
        r"\bgeneral medicine\b", r"\bgeneral\b", r"\bfever\b", r"\binfection\b",
        r"\bdengue\b", r"\bmalaria\b", r"\btyphoid\b",
    ],
    "general_surgery": [
        r"\bsurgery\b", r"\bsurgical\b", r"\boperation\b", r"\bhernia\b",
        r"\bappendix\b", r"\bappendicitis\b", r"\bcholecystectomy\b",
    ],
}


class IntentClassifier:
    """Classify voice commands into structured intents."""

    def classify(
        self, text: str, entities: list[dict[str, Any]] | None = None
    ) -> dict[str, Any]:
        """Classify the intent of a transcribed voice command.

        Returns dict with keys: action, department, confidence, raw_keywords.
        """
        text_lower = text.lower()

        action, action_confidence, action_keywords = self._detect_action(text_lower)
        department, dept_confidence = self._detect_department(text_lower, entities)

        combined_confidence = (action_confidence + dept_confidence) / 2 if department else action_confidence

        result = {
            "action": action.value,
            "department": department,
            "confidence": round(combined_confidence, 3),
            "raw_keywords": action_keywords,
        }

        logger.debug("Intent classified: %s (dept=%s, conf=%.2f)", action.value, department, combined_confidence)
        return result

    def _detect_action(
        self, text: str
    ) -> tuple[VoiceAction, float, list[str]]:
        best_action = VoiceAction.UNKNOWN
        best_score = 0.0
        matched_keywords: list[str] = []

        for action, patterns in _ACTION_KEYWORDS.items():
            matches = [p for p in patterns if re.search(p, text, re.IGNORECASE)]
            if matches:
                score = min(1.0, len(matches) * 0.4 + 0.3)
                if score > best_score:
                    best_action = action
                    best_score = score
                    matched_keywords = [re.search(p, text, re.IGNORECASE).group() for p in matches if re.search(p, text, re.IGNORECASE)]

        return best_action, best_score, matched_keywords

    def _detect_department(
        self, text: str, entities: list[dict[str, Any]] | None = None
    ) -> tuple[str | None, float]:
        best_dept: str | None = None
        best_score = 0.0

        entity_text = ""
        if entities:
            entity_text = " ".join(e.get("text", "") for e in entities).lower()

        combined = f"{text} {entity_text}"

        for dept, patterns in _DEPARTMENT_KEYWORDS.items():
            matches = [p for p in patterns if re.search(p, combined, re.IGNORECASE)]
            if matches:
                score = min(1.0, len(matches) * 0.3 + 0.2)
                if score > best_score:
                    best_dept = dept
                    best_score = score

        return best_dept, best_score
