"""Medical Named Entity Recognition using spaCy EntityRuler with extensive patterns."""

from __future__ import annotations

import logging
from typing import Any

from src.config import settings
from src.models import EntityType

logger = logging.getLogger(__name__)

_SYMPTOM_PATTERNS: list[str] = [
    "fever", "cough", "cold", "headache", "migraine", "body ache", "body pain",
    "chest pain", "abdominal pain", "back pain", "joint pain", "knee pain",
    "neck pain", "shoulder pain", "muscle pain", "stomach ache", "sore throat",
    "nausea", "vomiting", "diarrhea", "constipation", "bloating", "acidity",
    "heartburn", "breathlessness", "shortness of breath", "wheezing", "sneezing",
    "runny nose", "nasal congestion", "dizziness", "fatigue", "weakness", "lethargy",
    "loss of appetite", "weight loss", "weight gain", "swelling", "edema",
    "rash", "itching", "burning sensation", "numbness", "tingling",
    "blurred vision", "double vision", "palpitations", "chest tightness",
    "difficulty swallowing", "blood in stool", "blood in urine", "frequent urination",
    "painful urination", "insomnia", "anxiety", "depression",
    "high fever", "low grade fever", "chills", "night sweats", "cramps",
    "loose motions", "gas", "indigestion", "dehydration", "seizures",
    "unconsciousness", "fainting", "syncope", "vertigo", "tinnitus",
]

_DIAGNOSIS_PATTERNS: list[str] = [
    "diabetes", "diabetes mellitus", "type 2 diabetes", "type 1 diabetes",
    "hypertension", "high blood pressure", "low blood pressure", "hypotension",
    "asthma", "bronchitis", "pneumonia", "tuberculosis", "tb", "copd",
    "coronary artery disease", "cad", "myocardial infarction", "heart attack",
    "heart failure", "congestive heart failure", "atrial fibrillation",
    "stroke", "cerebral infarction", "tia", "transient ischemic attack",
    "anemia", "iron deficiency anemia", "thyroid", "hypothyroidism", "hyperthyroidism",
    "dengue", "malaria", "typhoid", "chikungunya", "covid", "covid-19",
    "gastritis", "peptic ulcer", "gerd", "ibs", "irritable bowel syndrome",
    "kidney stone", "renal calculi", "uti", "urinary tract infection",
    "jaundice", "hepatitis", "cirrhosis", "fatty liver",
    "arthritis", "osteoarthritis", "rheumatoid arthritis", "gout",
    "osteoporosis", "spondylitis", "slip disc", "sciatica",
    "migraine", "epilepsy", "parkinson", "alzheimer",
    "cancer", "carcinoma", "tumor", "lymphoma", "leukemia",
    "fracture", "sprain", "dislocation", "tendinitis",
    "eczema", "psoriasis", "dermatitis", "fungal infection", "cellulitis",
    "conjunctivitis", "cataract", "glaucoma",
    "sinusitis", "tonsillitis", "pharyngitis", "otitis media",
    "appendicitis", "cholecystitis", "pancreatitis", "hernia",
    "dvt", "deep vein thrombosis", "pulmonary embolism",
    "sepsis", "septicemia", "shock", "ards",
]

_MEDICATION_PATTERNS: list[str] = [
    # Indian brand names
    "crocin", "dolo 650", "dolo", "combiflam", "saridon", "disprin",
    "augmentin", "azithral", "azithromycin", "amoxicillin", "amoxyclav",
    "ciprofloxacin", "cipro", "ofloxacin", "levofloxacin", "ceftriaxone",
    "metronidazole", "flagyl", "doxycycline", "norfloxacin",
    "pantop", "pantoprazole", "rablet", "rabeprazole", "omeprazole", "omez",
    "ranitidine", "famotidine", "sucralfate", "antacid", "gelusil", "digene",
    "metformin", "glycomet", "glimepiride", "amaryl", "gliclazide",
    "sitagliptin", "vildagliptin", "insulin", "human mixtard",
    "amlodipine", "telmisartan", "losartan", "ramipril", "enalapril",
    "atenolol", "metoprolol", "propranolol", "carvedilol",
    "atorvastatin", "rosuvastatin", "crestor", "fenofibrate",
    "montair lc", "montelukast", "levocetrizine", "cetrizine", "allegra",
    "deriphyllin", "salbutamol", "asthalin", "budesonide", "budecort",
    "shelcal", "calcium", "calcitriol", "becosules", "zincovit", "neurobion",
    "multivitamin", "iron", "folic acid", "b12",
    "aspirin", "ecosprin", "clopidogrel", "warfarin", "heparin", "enoxaparin",
    "diclofenac", "voveran", "ibuprofen", "brufen", "naproxen", "aceclofenac",
    "tramadol", "paracetamol", "acetaminophen",
    "prednisone", "prednisolone", "dexamethasone", "hydrocortisone",
    "ondansetron", "emeset", "domperidone", "domstal", "metoclopramide",
    "lactulose", "cremaffin", "isabgol", "dulcolax",
    "alprazolam", "diazepam", "clonazepam", "lorazepam",
    "amitriptyline", "fluoxetine", "sertraline", "escitalopram",
    "phenytoin", "carbamazepine", "valproate", "levetiracetam",
    "dermatology cream", "betadine", "mupirocin", "clotrimazole",
    "nitroglycerin", "sorbitrate", "furosemide", "lasix", "spironolactone",
    "thyroxine", "thyronorm", "eltroxin",
]

_DOSAGE_PATTERNS: list[str] = [
    "5 mg", "10 mg", "20 mg", "25 mg", "40 mg", "50 mg", "80 mg", "100 mg",
    "150 mg", "200 mg", "250 mg", "300 mg", "325 mg", "400 mg", "500 mg",
    "625 mg", "650 mg", "750 mg", "1000 mg", "1 g", "2 g",
    "5 ml", "10 ml", "15 ml", "20 ml", "30 ml",
    "1 tablet", "2 tablets", "half tablet",
    "1 capsule", "2 capsules",
    "1 unit", "2 units", "4 units", "6 units", "8 units", "10 units",
    "20 units", "30 units", "40 units",
    "1 drop", "2 drops",
    "1 puff", "2 puffs",
    "1 teaspoon", "2 teaspoons",
    "1 sachet", "1 injection", "1 vial", "1 ampoule",
]

_PROCEDURE_PATTERNS: list[str] = [
    "blood test", "blood work", "cbc", "complete blood count",
    "blood sugar", "fasting blood sugar", "fbs", "ppbs", "hba1c",
    "lipid profile", "liver function test", "lft", "kidney function test", "kft",
    "thyroid profile", "tsh", "t3", "t4",
    "urine test", "urine routine", "urine culture",
    "ecg", "electrocardiogram", "echo", "echocardiography", "2d echo",
    "x-ray", "xray", "chest x-ray", "ct scan", "mri", "mri scan",
    "ultrasound", "usg", "sonography", "endoscopy", "colonoscopy",
    "biopsy", "fnac", "surgery", "operation",
    "angiography", "angioplasty", "bypass", "cabg",
    "dialysis", "blood transfusion", "lumbar puncture",
    "nebulization", "physiotherapy", "dressing", "suturing",
    "catheterization", "intubation", "ventilator",
    "covid test", "rtpcr", "rapid antigen test",
]

_VITAL_PATTERNS: list[str] = [
    "blood pressure", "bp", "systolic", "diastolic",
    "heart rate", "pulse", "pulse rate", "pulse ox",
    "temperature", "temp", "oxygen saturation", "spo2", "sao2",
    "respiratory rate", "rr", "breathing rate",
    "weight", "height", "bmi", "body mass index",
    "blood sugar level", "sugar level", "glucose level",
]

_LAB_VALUE_PATTERNS: list[str] = [
    "hemoglobin", "hb", "wbc", "white blood cell", "rbc", "red blood cell",
    "platelet", "platelet count", "esr",
    "creatinine", "urea", "bun", "uric acid",
    "sgot", "sgpt", "alt", "ast", "bilirubin", "alkaline phosphatase",
    "albumin", "total protein", "globulin",
    "sodium", "potassium", "chloride", "calcium", "magnesium", "phosphorus",
    "triglycerides", "cholesterol", "hdl", "ldl", "vldl",
    "prothrombin time", "pt", "inr", "aptt",
    "troponin", "bnp", "d-dimer", "crp", "procalcitonin",
    "hba1c value", "fasting glucose", "random glucose",
]

_BODY_PART_PATTERNS: list[str] = [
    "head", "forehead", "temple", "scalp",
    "eye", "eyes", "ear", "ears", "nose", "mouth", "throat", "tongue", "jaw",
    "neck", "shoulder", "shoulders", "arm", "arms", "elbow", "wrist", "hand",
    "finger", "fingers", "thumb",
    "chest", "breast", "rib", "ribs", "lung", "lungs", "heart",
    "abdomen", "stomach", "liver", "kidney", "kidneys", "spleen", "pancreas",
    "intestine", "colon", "rectum", "bladder", "gallbladder",
    "back", "spine", "lower back", "upper back",
    "hip", "thigh", "knee", "knees", "leg", "legs", "ankle", "foot", "feet", "toe",
    "skin", "bone", "joint", "joints", "muscle", "muscles", "nerve",
    "brain", "pelvis", "groin",
]

_DURATION_PATTERNS: list[str] = [
    "1 day", "2 days", "3 days", "4 days", "5 days", "6 days", "7 days",
    "1 week", "2 weeks", "3 weeks", "4 weeks",
    "1 month", "2 months", "3 months", "6 months",
    "1 year", "2 years", "3 years", "5 years", "10 years",
    "since yesterday", "since morning", "since last week",
    "since last month", "for few days", "for a week",
    "past few days", "last few days", "couple of days",
    "one day", "two days", "three days", "four days", "five days",
    "one week", "two weeks", "one month", "two months",
]

_FREQUENCY_PATTERNS: list[str] = [
    "once daily", "twice daily", "thrice daily",
    "once a day", "twice a day", "three times a day",
    "four times a day", "every 4 hours", "every 6 hours",
    "every 8 hours", "every 12 hours",
    "before meals", "after meals", "before food", "after food",
    "before breakfast", "after breakfast", "before lunch", "after lunch",
    "before dinner", "after dinner", "at bedtime", "at night",
    "morning", "evening", "morning and evening",
    "empty stomach", "with food", "with water", "with milk",
    "od", "bd", "tds", "qid", "sos", "prn", "stat",
    "weekly", "fortnightly", "monthly",
    "alternate days", "every other day",
]

_ENTITY_MAP: dict[EntityType, list[str]] = {
    EntityType.SYMPTOM: _SYMPTOM_PATTERNS,
    EntityType.DIAGNOSIS: _DIAGNOSIS_PATTERNS,
    EntityType.MEDICATION: _MEDICATION_PATTERNS,
    EntityType.DOSAGE: _DOSAGE_PATTERNS,
    EntityType.PROCEDURE: _PROCEDURE_PATTERNS,
    EntityType.VITAL: _VITAL_PATTERNS,
    EntityType.LAB_VALUE: _LAB_VALUE_PATTERNS,
    EntityType.BODY_PART: _BODY_PART_PATTERNS,
    EntityType.DURATION: _DURATION_PATTERNS,
    EntityType.FREQUENCY: _FREQUENCY_PATTERNS,
}


class MedicalNERProcessor:
    """Extract medical entities from clinical text using spaCy EntityRuler."""

    def __init__(self) -> None:
        self._nlp: Any = None

    @property
    def is_loaded(self) -> bool:
        return self._nlp is not None

    def load(self) -> None:
        """Build the spaCy pipeline with EntityRuler patterns."""
        if self._nlp is not None:
            return

        import spacy
        from spacy.language import Language

        logger.info("Building medical NER pipeline with spaCy model '%s'...", settings.SPACY_MODEL)

        try:
            nlp = spacy.load(settings.SPACY_MODEL, disable=["ner"])
        except OSError:
            logger.warning("Model '%s' not found, falling back to blank 'en' pipeline", settings.SPACY_MODEL)
            nlp = spacy.blank("en")

        ruler = nlp.add_pipe("entity_ruler", config={"overwrite_ents": True})
        patterns = self._build_patterns()
        ruler.add_patterns(patterns)

        self._nlp = nlp
        logger.info("Medical NER pipeline ready with %d patterns", len(patterns))

    def _build_patterns(self) -> list[dict[str, Any]]:
        patterns: list[dict[str, Any]] = []
        for entity_type, terms in _ENTITY_MAP.items():
            for term in terms:
                tokens = term.lower().split()
                pattern_entry: dict[str, Any] = {
                    "label": entity_type.value,
                    "pattern": (
                        [{"LOWER": t} for t in tokens] if len(tokens) > 1 else term.lower()
                    ),
                }
                patterns.append(pattern_entry)
        return patterns

    def extract_entities(self, text: str) -> list[dict[str, Any]]:
        """Run NER on input text and return a list of entity dicts."""
        self.load()

        doc = self._nlp(text)
        entities: list[dict[str, Any]] = []

        for ent in doc.ents:
            entities.append({
                "text": ent.text,
                "entity_type": ent.label_,
                "start": ent.start_char,
                "end": ent.end_char,
                "confidence": 1.0,
            })

        logger.debug("Extracted %d entities from %d chars", len(entities), len(text))
        return entities
