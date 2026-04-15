interface SymptomMapping {
  conditions: string[];
  baseUrgency: number;
  keywords: string[];
}

interface TriageInput {
  symptoms: string[];
  duration: string;
  severity: number;
  age: number;
  gender: string;
  preExistingConditions: string[];
}

interface TriageResult {
  urgencyScore: number;
  urgencyLevel: "low" | "moderate" | "high" | "emergency";
  possibleConditions: string[];
  recommendedAction: string;
  preConsultationSummary: string;
}

const SYMPTOM_MAP: Record<string, SymptomMapping> = {
  chest_pain: {
    conditions: ["Angina", "Myocardial Infarction", "Costochondritis", "GERD"],
    baseUrgency: 80,
    keywords: ["chest", "heart", "tightness in chest", "chest pressure"],
  },
  breathing_difficulty: {
    conditions: ["Asthma", "COPD", "Pneumonia", "Pulmonary Embolism", "Anxiety"],
    baseUrgency: 75,
    keywords: ["breathless", "shortness of breath", "difficulty breathing", "wheezing"],
  },
  severe_bleeding: {
    conditions: ["Trauma", "Internal Hemorrhage", "Coagulopathy"],
    baseUrgency: 90,
    keywords: ["bleeding", "blood loss", "hemorrhage"],
  },
  loss_of_consciousness: {
    conditions: ["Syncope", "Seizure", "Stroke", "Hypoglycemia"],
    baseUrgency: 85,
    keywords: ["fainted", "unconscious", "blackout", "passed out"],
  },
  headache: {
    conditions: ["Tension Headache", "Migraine", "Sinusitis", "Meningitis"],
    baseUrgency: 30,
    keywords: ["headache", "head pain", "migraine"],
  },
  fever: {
    conditions: ["Viral Infection", "Bacterial Infection", "Malaria", "Dengue", "COVID-19"],
    baseUrgency: 35,
    keywords: ["fever", "temperature", "chills", "hot"],
  },
  abdominal_pain: {
    conditions: ["Gastritis", "Appendicitis", "Gallstones", "IBS", "Pancreatitis"],
    baseUrgency: 45,
    keywords: ["stomach pain", "abdominal", "belly pain", "cramps"],
  },
  vomiting: {
    conditions: ["Gastroenteritis", "Food Poisoning", "Pregnancy", "Migraine"],
    baseUrgency: 30,
    keywords: ["vomiting", "nausea", "throwing up"],
  },
  diarrhea: {
    conditions: ["Gastroenteritis", "Food Poisoning", "IBS", "Cholera"],
    baseUrgency: 25,
    keywords: ["diarrhea", "loose stools", "watery stools"],
  },
  cough: {
    conditions: ["Common Cold", "Bronchitis", "Pneumonia", "Tuberculosis", "COVID-19"],
    baseUrgency: 20,
    keywords: ["cough", "coughing", "dry cough", "wet cough"],
  },
  joint_pain: {
    conditions: ["Arthritis", "Gout", "Lupus", "Sprain"],
    baseUrgency: 20,
    keywords: ["joint pain", "joint swelling", "stiff joints"],
  },
  skin_rash: {
    conditions: ["Allergic Reaction", "Eczema", "Psoriasis", "Chickenpox", "Measles"],
    baseUrgency: 20,
    keywords: ["rash", "itching", "skin irritation", "hives"],
  },
  back_pain: {
    conditions: ["Muscle Strain", "Herniated Disc", "Sciatica", "Kidney Stones"],
    baseUrgency: 25,
    keywords: ["back pain", "lower back", "spine pain"],
  },
  dizziness: {
    conditions: ["Vertigo", "Hypotension", "Anemia", "Inner Ear Infection"],
    baseUrgency: 35,
    keywords: ["dizzy", "lightheaded", "vertigo", "spinning"],
  },
  eye_pain: {
    conditions: ["Conjunctivitis", "Glaucoma", "Corneal Abrasion", "Uveitis"],
    baseUrgency: 30,
    keywords: ["eye pain", "red eye", "blurry vision", "eye irritation"],
  },
  sore_throat: {
    conditions: ["Pharyngitis", "Tonsillitis", "Strep Throat", "Laryngitis"],
    baseUrgency: 15,
    keywords: ["sore throat", "throat pain", "difficulty swallowing"],
  },
  numbness: {
    conditions: ["Peripheral Neuropathy", "Stroke", "Carpal Tunnel", "Multiple Sclerosis"],
    baseUrgency: 50,
    keywords: ["numbness", "tingling", "pins and needles", "loss of sensation"],
  },
  palpitations: {
    conditions: ["Arrhythmia", "Anxiety", "Hyperthyroidism", "Anemia"],
    baseUrgency: 55,
    keywords: ["palpitations", "racing heart", "irregular heartbeat"],
  },
};

const HIGH_RISK_CONDITIONS = [
  "diabetes",
  "hypertension",
  "heart disease",
  "asthma",
  "copd",
  "cancer",
  "kidney disease",
  "liver disease",
  "hiv",
  "immunocompromised",
];

const DANGEROUS_COMBINATIONS: Array<{ symptoms: string[]; urgencyBoost: number; condition: string }> = [
  { symptoms: ["chest_pain", "breathing_difficulty"], urgencyBoost: 20, condition: "Possible Cardiac Event" },
  { symptoms: ["headache", "numbness", "dizziness"], urgencyBoost: 25, condition: "Possible Stroke" },
  { symptoms: ["fever", "breathing_difficulty", "cough"], urgencyBoost: 15, condition: "Possible Pneumonia / Respiratory Infection" },
  { symptoms: ["abdominal_pain", "vomiting", "fever"], urgencyBoost: 15, condition: "Possible Appendicitis / Acute Abdomen" },
  { symptoms: ["fever", "headache", "skin_rash"], urgencyBoost: 15, condition: "Possible Meningitis / Dengue" },
];

function normalizeSymptom(input: string): string | null {
  const lower = input.toLowerCase().trim();

  for (const [key, mapping] of Object.entries(SYMPTOM_MAP)) {
    if (key === lower) return key;
    if (mapping.keywords.some((kw) => lower.includes(kw) || kw.includes(lower))) {
      return key;
    }
  }
  return null;
}

function getUrgencyLevel(score: number): "low" | "moderate" | "high" | "emergency" {
  if (score >= 80) return "emergency";
  if (score >= 60) return "high";
  if (score >= 40) return "moderate";
  return "low";
}

function getRecommendedAction(level: "low" | "moderate" | "high" | "emergency"): string {
  switch (level) {
    case "emergency":
      return "Seek immediate emergency care. Call ambulance or visit nearest emergency department.";
    case "high":
      return "Visit a doctor as soon as possible, ideally within 2-4 hours. Consider urgent care.";
    case "moderate":
      return "Schedule a doctor appointment within 24-48 hours. Monitor symptoms closely.";
    case "low":
      return "Self-care and rest recommended. Schedule a routine appointment if symptoms persist beyond 3 days.";
  }
}

export function assessTriage(input: TriageInput): TriageResult {
  const normalizedSymptoms = input.symptoms.map(normalizeSymptom).filter(Boolean) as string[];

  if (normalizedSymptoms.length === 0) {
    return {
      urgencyScore: Math.min(input.severity * 5, 30),
      urgencyLevel: "low",
      possibleConditions: ["Unspecified symptoms - further evaluation needed"],
      recommendedAction: "Schedule a doctor appointment for proper evaluation.",
      preConsultationSummary: buildSummary(input, [], "low", input.severity * 5),
    };
  }

  const conditionSet = new Set<string>();
  let maxBaseUrgency = 0;

  for (const symptom of normalizedSymptoms) {
    const mapping = SYMPTOM_MAP[symptom];
    if (mapping) {
      mapping.conditions.forEach((c) => conditionSet.add(c));
      maxBaseUrgency = Math.max(maxBaseUrgency, mapping.baseUrgency);
    }
  }

  let urgencyScore = maxBaseUrgency;

  // Severity multiplier (1-10 scale)
  const severityFactor = (input.severity - 5) * 3;
  urgencyScore += severityFactor;

  // Multiple symptoms increase urgency
  if (normalizedSymptoms.length >= 3) urgencyScore += 10;
  else if (normalizedSymptoms.length >= 2) urgencyScore += 5;

  // Age-based adjustments
  if (input.age < 5 || input.age > 65) urgencyScore += 10;
  if (input.age < 1 || input.age > 80) urgencyScore += 5;

  // Pre-existing conditions
  const hasHighRisk = input.preExistingConditions.some((c) =>
    HIGH_RISK_CONDITIONS.some((hr) => c.toLowerCase().includes(hr))
  );
  if (hasHighRisk) urgencyScore += 10;

  // Dangerous symptom combinations
  for (const combo of DANGEROUS_COMBINATIONS) {
    const matched = combo.symptoms.every((s) => normalizedSymptoms.includes(s));
    if (matched) {
      urgencyScore += combo.urgencyBoost;
      conditionSet.add(combo.condition);
    }
  }

  urgencyScore = Math.max(0, Math.min(100, urgencyScore));

  const urgencyLevel = getUrgencyLevel(urgencyScore);
  const possibleConditions = Array.from(conditionSet);
  const recommendedAction = getRecommendedAction(urgencyLevel);

  return {
    urgencyScore,
    urgencyLevel,
    possibleConditions,
    recommendedAction,
    preConsultationSummary: buildSummary(input, possibleConditions, urgencyLevel, urgencyScore),
  };
}

function buildSummary(
  input: TriageInput,
  conditions: string[],
  level: string,
  score: number
): string {
  const parts = [
    `Patient: ${input.age}y ${input.gender}.`,
    `Presenting symptoms: ${input.symptoms.join(", ")}.`,
    `Duration: ${input.duration}. Severity: ${input.severity}/10.`,
  ];

  if (input.preExistingConditions.length > 0) {
    parts.push(`Pre-existing conditions: ${input.preExistingConditions.join(", ")}.`);
  }

  if (conditions.length > 0) {
    parts.push(`Possible conditions: ${conditions.slice(0, 5).join(", ")}.`);
  }

  parts.push(`Urgency: ${level.toUpperCase()} (score ${score}/100).`);

  return parts.join(" ");
}
