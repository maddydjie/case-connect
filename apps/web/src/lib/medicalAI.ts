/**
 * CaseConnect Medical AI Engine
 *
 * All clinical suggestions (diagnoses, medications, investigations, triage)
 * come from Gemma 4 via OpenRouter. Zero hardcoded medical logic.
 * A lightweight offline fallback returns a "connect to AI" message when the
 * API is unavailable.
 *
 * Structured output follows Axone-level clinical documentation standards:
 * full prescription schema, structured vitals, visit-based autopopulation.
 */

import { chatCompletion, isConfigured, getModelName } from './openrouter';
import type { Prescription, InvestigationEntry, FollowUp, CaseSheetType } from '@/stores/case.store';

// ─── Types ───────────────────────────────────────────────────

export interface AIEntities {
  symptoms: string[];
  suggestedDiagnoses: { name: string; confidence: number; icdCode: string; reasoning: string }[];
  suggestedMedications: { name: string; dosage: string; reasoning: string }[];
  suggestedPrescriptions: Prescription[];
  suggestedInvestigations: { name: string; reasoning: string }[];
  structuredInvestigations: InvestigationEntry[];
  vitals: Record<string, string>;
  triageUrgency: 'low' | 'moderate' | 'high' | 'critical';
  modelUsed: string;
}

export interface ClinicalNote {
  summary: string;
  hpiNarrative: string;
  pastHistory: string;
  familyHistory: string;
  personalHistory: string;
  allergies: string;
  generalExamination: string;
  systemicExamination: string;
  assessmentPlan: string;
  differentialDiagnosis: string;
  followUp: string;
  modelUsed: string;
}

export interface DischargeSummaryResult {
  finalDiagnosis: string;
  reasonForAdmission: string;
  historyOfPresentIllness: string;
  pastHistory: string;
  familyHistory: string;
  treatmentHistory: string;
  generalExamination: string;
  systemicExamination: string;
  inHospitalCourse: string;
  procedures: string;
  administeredMedications: string;
  investigationsOrdered: { name: string; result: string }[];
  patientConditionAtDischarge: string;
  advice: string;
  dischargePrescriptions: Prescription[];
  followUp: FollowUp[];
  warningSignsToWatch: string;
  modelUsed: string;
}

export interface CasesheetAIResult {
  type: CaseSheetType;
  fields: Record<string, any>;
  prescriptions: Prescription[];
  investigations: InvestigationEntry[];
  modelUsed: string;
}

// ─── Prompts ─────────────────────────────────────────────────

const CLINICAL_ANALYSIS_PROMPT = `You are a clinical decision-support AI for Indian healthcare (CaseConnect platform).
You are assisting licensed clinicians — not patients.

Given the patient presentation, analyze and respond ONLY with valid JSON (no markdown fences, no explanation outside JSON):

{
  "symptoms": ["extracted/normalized symptom 1", "symptom 2", ...],
  "suggestedDiagnoses": [
    {
      "name": "Diagnosis Name",
      "confidence": <number 0-100>,
      "icdCode": "ICD-10-CM code",
      "reasoning": "2-3 sentence clinical reasoning explaining why this diagnosis fits"
    }
  ],
  "suggestedPrescriptions": [
    {
      "route": "Oral/IV/IM/SC/Topical/Inhaled",
      "form": "Tablet/Capsule/Injection/Syrup/Cream/Inhaler",
      "drug": "Brand or generic name",
      "genericName": "INN generic name",
      "frequency": "OD/BD/TDS/QID/SOS/HS",
      "strength": "e.g. 500mg, 10ml",
      "duration": "e.g. 5 days, 2 weeks, 1 month",
      "instructions": "e.g. After meals, On empty stomach, At bedtime"
    }
  ],
  "suggestedMedications": [
    {
      "name": "Generic drug name with strength (e.g. Tab. Metformin 500mg)",
      "dosage": "dosing schedule (e.g. BD with meals x 30 days)",
      "reasoning": "why this drug, citing guideline if applicable"
    }
  ],
  "structuredInvestigations": [
    {
      "name": "Investigation name",
      "frequency": "Once/Daily/Weekly",
      "remarks": "Fasting/Post-prandial/Special instructions",
      "time": "Morning/Evening/Stat"
    }
  ],
  "suggestedInvestigations": [
    {
      "name": "Investigation name",
      "reasoning": "clinical justification for ordering"
    }
  ],
  "triageUrgency": "low" | "moderate" | "high" | "critical"
}

Requirements:
- Provide 2-5 differential diagnoses ranked by likelihood.
- Use ICD-10-CM codes (e.g. I21.9, E11.9, J18.9).
- Confidence = your estimated pre-test probability given the presentation.
- suggestedPrescriptions: full structured format with route, form, generic name, strength, duration, and instructions.
- suggestedMedications: use Indian generic names with strength, include dosage form (Tab/Cap/Inj/Syp).
- Follow Indian clinical guidelines (ICMR, API, NMC, RSSDI, CSI) where applicable.
- structuredInvestigations: include timing, frequency, and special remarks.
- Triage: critical = needs ER immediately, high = same-day evaluation, moderate = 24-48h, low = routine OPD.
- Reasoning must be clinically meaningful — not just restating the symptom.
- Do NOT include disclaimers or text outside the JSON.`;

const DOCUMENTATION_PROMPT = `You are a medical documentation AI for Indian healthcare. Given patient data from a clinical encounter, generate comprehensive structured clinical documentation.

Respond ONLY with valid JSON (no markdown, no text outside JSON):

{
  "summary": "1-2 sentence clinical summary suitable for discharge/referral",
  "hpiNarrative": "Structured History of Present Illness (4-6 sentences: onset, duration, character, severity, aggravating/relieving factors, associated symptoms, progression)",
  "pastHistory": "Past medical history including chronic conditions, previous hospitalizations, known allergies (drug & food), immunization status",
  "familyHistory": "Family history of relevant conditions (DM, HTN, CAD, cancer, genetic disorders)",
  "personalHistory": "Personal habits: smoking, alcohol, diet, exercise, sleep pattern, substance use",
  "allergies": "List all known allergies with type of reaction",
  "generalExamination": "Built, nourishment, orientation, pallor/icterus/cyanosis/clubbing/lymphadenopathy/edema, vitals summary",
  "systemicExamination": "CVS, RS, PA, CNS findings — structured per system",
  "assessmentPlan": "Assessment and Plan section with numbered diagnoses and corresponding treatment plan (include medications with doses, investigations, referrals)",
  "differentialDiagnosis": "Differential diagnosis discussion: why each was considered and how they rank",
  "followUp": "Follow-up plan: timeline, warning signs (red flags), next appointment, lifestyle modifications"
}

Requirements:
- Write as a clinician documenting for the medical record.
- Use standard medical terminology and Indian clinical context.
- Include specific medications with doses when prescribed.
- Assessment & Plan should be numbered.
- Follow-up should include red flag symptoms for the patient.
- All history sections must be comprehensive — not just "as stated".`;

const TRIAGE_PROMPT = `You are an AI triage assistant for the CaseConnect patient portal in India.
A patient is describing their symptoms. Assess urgency and suggest possible conditions.

Respond ONLY with valid JSON:

{
  "symptoms": ["normalized symptom list"],
  "suggestedDiagnoses": [
    {
      "name": "Condition name (patient-friendly)",
      "confidence": <0-100>,
      "icdCode": "ICD-10 code",
      "reasoning": "Brief explanation a patient can understand"
    }
  ],
  "suggestedInvestigations": [
    { "name": "Test name", "reasoning": "Why this might be needed" }
  ],
  "triageUrgency": "low" | "moderate" | "high" | "critical",
  "triageAdvice": "1-2 sentence actionable advice (e.g. Visit ER immediately / Book appointment within 48h / Home care is appropriate)",
  "redFlags": ["symptom that would require immediate ER visit if present"]
}

Guidelines:
- Use patient-friendly language in reasoning.
- triageUrgency: critical = call 112 / go to ER, high = see doctor today, moderate = within 48h, low = routine.
- Always include red flags the patient should watch for.
- Be conservative — when in doubt, triage higher.`;

const CASESHEET_GENERATION_PROMPT = `You are a clinical documentation AI for CaseConnect. Generate a complete, structured casesheet from the doctor's rough notes.
The doctor will dictate or type rough clinical notes. You must extract, infer, and structure all information into a standardized format.

You will be told the CASESHEET TYPE. Respond ONLY with valid JSON matching the schema for that type.

IMPORTANT: Your output must be comprehensive. Expand abbreviations, normalize medical terminology, add clinical detail where appropriate. Never leave fields empty when information can be reasonably inferred from the notes.

For prescriptions, ALWAYS use this schema:
{
  "route": "Oral/IV/IM/SC/Topical/Inhaled",
  "form": "Tablet/Capsule/Injection/Syrup/Cream",
  "drug": "Drug name",
  "genericName": "Generic/INN name",
  "frequency": "OD/BD/TDS/QID/SOS/HS",
  "strength": "e.g. 500mg",
  "duration": "e.g. 5 days",
  "instructions": "e.g. After meals"
}

For investigations:
{
  "name": "Investigation name",
  "frequency": "Once/Daily",
  "remarks": "Fasting/Special instructions",
  "time": "Morning/Evening/Stat"
}`;

const DISCHARGE_PROMPT = `You are a senior physician generating a comprehensive discharge summary for CaseConnect (Indian healthcare).

Given all admission data, generate a detailed discharge summary. Respond ONLY with valid JSON:

{
  "finalDiagnosis": "Final confirmed diagnosis(es)",
  "reasonForAdmission": "Reason for hospital admission",
  "historyOfPresentIllness": "Detailed HPI narrative",
  "pastHistory": "PMH, surgical history, allergies",
  "familyHistory": "Relevant family history",
  "treatmentHistory": "Treatment given before admission",
  "generalExamination": "Examination findings at admission",
  "systemicExamination": "System-wise examination findings",
  "inHospitalCourse": "Detailed narrative of hospital stay including procedures, complications, improvement timeline",
  "procedures": "All procedures performed with dates",
  "administeredMedications": "All medications given during hospital stay",
  "investigationsOrdered": [
    { "name": "Investigation name", "result": "Result/finding" }
  ],
  "patientConditionAtDischarge": "Patient's condition at the time of discharge",
  "advice": "Diet, activity, wound care, lifestyle modifications",
  "dischargePrescriptions": [
    {
      "route": "Oral",
      "form": "Tablet",
      "drug": "Drug name",
      "genericName": "Generic name",
      "frequency": "OD/BD/TDS",
      "strength": "e.g. 500mg",
      "duration": "e.g. Lifelong",
      "instructions": "e.g. After breakfast"
    }
  ],
  "followUp": [
    {
      "practitionerName": "Doctor name or null",
      "date": "ISO date or null",
      "remarks": "Follow-up instructions"
    }
  ],
  "warningSignsToWatch": "Red flags that warrant immediate return to hospital"
}

Requirements:
- In-hospital course must be a detailed narrative, not bullet points.
- Discharge prescriptions must include full drug details.
- Follow-up must include specific timeframes.
- Indian clinical context — use standard Indian drug names and guidelines.`;

// ─── Abort management ────────────────────────────────────────

let activeAbort: AbortController | null = null;

function freshAbort(): AbortController {
  activeAbort?.abort();
  const ac = new AbortController();
  activeAbort = ac;
  return ac;
}

// ─── Core API functions ──────────────────────────────────────

export async function analyzeSymptomsAI(
  complaints: string[],
  hpi: string,
  transcript: string,
): Promise<AIEntities> {
  const combined = [...complaints, hpi, transcript].filter(Boolean).join('. ').trim();
  if (combined.length < 3) return emptyResult();

  if (!isConfigured()) return offlineFallback(complaints);

  const ac = freshAbort();

  try {
    const userMsg = [
      `Patient presentation:`,
      `- Chief complaints: ${complaints.join(', ') || 'Not specified'}`,
      hpi ? `- History of present illness: ${hpi}` : '',
      transcript ? `- Dictated notes / voice transcript: ${transcript}` : '',
    ].filter(Boolean).join('\n');

    const response = await chatCompletion(
      [
        { role: 'system', content: CLINICAL_ANALYSIS_PROMPT },
        { role: 'user', content: userMsg },
      ],
      { temperature: 0.2, maxTokens: 3000, signal: ac.signal },
    );

    return parseAnalysisResponse(response.choices?.[0]?.message?.content ?? '', complaints);
  } catch (err: any) {
    if (err.name === 'AbortError') return emptyResult();
    console.warn('[CaseConnect AI] Analysis failed:', err.message);
    return offlineFallback(complaints);
  }
}

export async function triageSymptomsAI(
  symptoms: string[],
  severity: number,
  bodyRegion: string,
  comorbidities: string[],
): Promise<AIEntities & { triageAdvice?: string; redFlags?: string[] }> {
  if (symptoms.length === 0) return emptyResult();

  if (!isConfigured()) return offlineFallback(symptoms);

  const ac = freshAbort();

  try {
    const userMsg = [
      `Patient-reported symptoms: ${symptoms.join(', ')}`,
      `Severity (1-10): ${severity}`,
      bodyRegion ? `Body region: ${bodyRegion}` : '',
      comorbidities.length > 0 ? `Known conditions: ${comorbidities.join(', ')}` : '',
    ].filter(Boolean).join('\n');

    const response = await chatCompletion(
      [
        { role: 'system', content: TRIAGE_PROMPT },
        { role: 'user', content: userMsg },
      ],
      { temperature: 0.2, maxTokens: 1536, signal: ac.signal },
    );

    const raw = response.choices?.[0]?.message?.content ?? '';
    const parsed = safeJsonParse(raw);
    if (!parsed) return offlineFallback(symptoms);

    return {
      symptoms: parsed.symptoms ?? symptoms,
      suggestedDiagnoses: (parsed.suggestedDiagnoses ?? []).map(normalizeDx),
      suggestedMedications: [],
      suggestedPrescriptions: [],
      suggestedInvestigations: (parsed.suggestedInvestigations ?? []).map(normalizeInv),
      structuredInvestigations: [],
      vitals: {},
      triageUrgency: validUrgency(parsed.triageUrgency),
      modelUsed: getModelName(),
      triageAdvice: parsed.triageAdvice ?? '',
      redFlags: parsed.redFlags ?? [],
    };
  } catch (err: any) {
    if (err.name === 'AbortError') return emptyResult();
    console.warn('[CaseConnect AI] Triage failed:', err.message);
    return offlineFallback(symptoms);
  }
}

export async function generateClinicalNote(data: {
  complaints: string[];
  hpi: string;
  diagnoses: string[];
  medications: { name: string; dosage: string }[];
  investigations: string[];
  vitals: Record<string, string>;
  patientInfo?: string;
  pmh?: string;
}): Promise<ClinicalNote> {
  if (!isConfigured()) {
    return emptyClinicalNote('AI documentation unavailable — API key not configured.');
  }

  try {
    const userMsg = [
      `Clinical encounter data:`,
      `- Chief complaints: ${data.complaints.join(', ')}`,
      `- HPI: ${data.hpi || 'Not documented'}`,
      data.patientInfo ? `- Patient: ${data.patientInfo}` : '',
      data.pmh ? `- Past medical history: ${data.pmh}` : '',
      `- Diagnoses: ${data.diagnoses.join('; ') || 'Pending'}`,
      `- Medications: ${data.medications.map((m) => `${m.name} ${m.dosage}`).join('; ') || 'None prescribed'}`,
      `- Investigations ordered: ${data.investigations.join(', ') || 'None'}`,
      Object.keys(data.vitals).length > 0
        ? `- Vitals: ${Object.entries(data.vitals).map(([k, v]) => `${k}: ${v}`).join(', ')}`
        : '',
    ].filter(Boolean).join('\n');

    const response = await chatCompletion(
      [
        { role: 'system', content: DOCUMENTATION_PROMPT },
        { role: 'user', content: userMsg },
      ],
      { temperature: 0.3, maxTokens: 3000 },
    );

    const raw = response.choices?.[0]?.message?.content ?? '';
    const parsed = safeJsonParse(raw);
    if (!parsed) throw new Error('Could not parse documentation response');

    return {
      summary: String(parsed.summary ?? ''),
      hpiNarrative: String(parsed.hpiNarrative ?? ''),
      pastHistory: String(parsed.pastHistory ?? ''),
      familyHistory: String(parsed.familyHistory ?? ''),
      personalHistory: String(parsed.personalHistory ?? ''),
      allergies: String(parsed.allergies ?? ''),
      generalExamination: String(parsed.generalExamination ?? ''),
      systemicExamination: String(parsed.systemicExamination ?? ''),
      assessmentPlan: String(parsed.assessmentPlan ?? ''),
      differentialDiagnosis: String(parsed.differentialDiagnosis ?? ''),
      followUp: String(parsed.followUp ?? ''),
      modelUsed: getModelName(),
    };
  } catch (err: any) {
    console.warn('[CaseConnect AI] Documentation generation failed:', err.message);
    const isRateLimit = err.message?.includes('rate') || err.message?.includes('429');
    return emptyClinicalNote(
      isRateLimit
        ? 'AI models are busy right now. Please try again in 30 seconds — we automatically rotate through multiple free models.'
        : 'Documentation generation temporarily unavailable. Please try again.',
    );
  }
}

export async function suggestForOPSheet(
  chiefComplaint: string,
  diagnoses: string[],
): Promise<AIEntities> {
  if (!chiefComplaint.trim() && diagnoses.length === 0) return emptyResult();
  if (!isConfigured()) return offlineFallback([chiefComplaint]);

  const ac = freshAbort();

  try {
    const userMsg = [
      `OP consultation:`,
      `- Chief complaint: ${chiefComplaint}`,
      diagnoses.length > 0 ? `- Working diagnoses: ${diagnoses.join(', ')}` : '',
      `Suggest medications with full prescription details (route, form, genericName, strength, frequency, duration, instructions) and investigations. Focus on outpatient management.`,
    ].filter(Boolean).join('\n');

    const response = await chatCompletion(
      [
        { role: 'system', content: CLINICAL_ANALYSIS_PROMPT },
        { role: 'user', content: userMsg },
      ],
      { temperature: 0.2, maxTokens: 2048, signal: ac.signal },
    );

    return parseAnalysisResponse(response.choices?.[0]?.message?.content ?? '', [chiefComplaint]);
  } catch (err: any) {
    if (err.name === 'AbortError') return emptyResult();
    console.warn('[CaseConnect AI] OP suggestion failed:', err.message);
    return offlineFallback([chiefComplaint]);
  }
}

export async function generateCasesheetFromNotes(
  casesheetType: CaseSheetType,
  notes: string,
  autopopulatedData?: Record<string, any>,
): Promise<CasesheetAIResult> {
  if (!isConfigured()) {
    return {
      type: casesheetType,
      fields: {},
      prescriptions: [],
      investigations: [],
      modelUsed: 'offline',
    };
  }

  const typeSchemas: Record<CaseSheetType, string> = {
    'opd-casesheet': `{
      "chiefComplaints": "string",
      "historyOfPresentIllness": "detailed HPI narrative",
      "pastHistory": "string",
      "allergies": "string",
      "familyHistory": "string",
      "personalHistory": "string",
      "generalExamination": "string",
      "systemicExamination": "string",
      "provisionalDiagnosis": ["string"],
      "finalDiagnosis": "string",
      "plan": "string",
      "advice": "string",
      "prescriptions": [prescription_schema],
      "investigations": [investigation_schema]
    }`,
    'admission-notes': `{
      "finalDiagnosis": "string",
      "provisionalDiagnosis": ["string"],
      "chiefComplaints": "string",
      "historyOfPresentIllness": "string",
      "painAssessment": "string",
      "allergies": "string",
      "pastHistory": "string",
      "surgicalHistory": "string",
      "currentMedications": "string",
      "familyHistory": "string",
      "personalHistory": "string",
      "socialHistory": "string",
      "generalExamination": "string",
      "systemicExamination": "string",
      "carePlan": "string",
      "prescriptions": [prescription_schema],
      "investigations": [investigation_schema]
    }`,
    'progress-records': `{
      "finalDiagnosis": "string",
      "currentPatientCondition": "string",
      "generalExamination": "string",
      "systemicExamination": "string",
      "plan": "string",
      "dietAndNutrition": "string",
      "prescriptions": [prescription_schema],
      "investigations": [investigation_schema]
    }`,
    'doctors-orders': `{
      "finalDiagnosis": "string",
      "instructions": "orders text",
      "prescriptions": [prescription_schema],
      "investigations": [investigation_schema]
    }`,
    'cross-referral': `{
      "referralDepartment": "string",
      "primaryReasonForReferral": "string",
      "reasonForReferral": "detailed string",
      "clinicalNotes": "string",
      "recommendation": "string",
      "prescriptions": [],
      "investigations": [investigation_schema]
    }`,
    'doctors-handover-notes': `{
      "reasonForTransfer": "string",
      "currentPatientCondition": "string",
      "historyOfPresentIllness": "string",
      "allergies": "string",
      "currentMedications": "string",
      "handoverDetails": "string",
      "prescriptions": [prescription_schema],
      "investigations": []
    }`,
    'operation-theater-notes': `{
      "surgeon": "string",
      "assistantSurgeon": "string",
      "anesthesiologist": "string",
      "finalDiagnosis": "string",
      "indicationForSurgery": "string",
      "preoperativeAssessment": "string",
      "intraoperativeDetails": "detailed string",
      "immediatePostoperativeCondition": "string",
      "postoperativeOrders": "string",
      "prescriptions": [prescription_schema],
      "investigations": [investigation_schema]
    }`,
    'discharge-summary': `{
      "finalDiagnosis": "string",
      "reasonForAdmission": "string",
      "historyOfPresentIllness": "string",
      "inHospitalCourse": "detailed narrative string",
      "procedures": "string",
      "administeredMedications": "string",
      "patientConditionAtDischarge": "string",
      "advice": "string",
      "prescriptions": [prescription_schema],
      "investigations": [investigation_schema],
      "followUp": [{ "practitionerName": "string|null", "date": "ISO date|null", "remarks": "string" }]
    }`,
  };

  try {
    const autopopNote = autopopulatedData
      ? `\n\nPrevious visit data (autopopulated — use as context, include relevant data):\n${JSON.stringify(autopopulatedData, null, 1)}`
      : '';

    const userMsg = `Casesheet type: ${casesheetType}
Schema: ${typeSchemas[casesheetType]}

Doctor's notes:
${notes}${autopopNote}

Generate a complete, structured JSON response matching the schema. Expand abbreviations, use proper medical terminology. Be thorough.`;

    const response = await chatCompletion(
      [
        { role: 'system', content: CASESHEET_GENERATION_PROMPT },
        { role: 'user', content: userMsg },
      ],
      { temperature: 0.2, maxTokens: 4000 },
    );

    const raw = response.choices?.[0]?.message?.content ?? '';
    const parsed = safeJsonParse(raw);
    if (!parsed) throw new Error('Could not parse casesheet response');

    const prescriptions: Prescription[] = (parsed.prescriptions ?? []).map(normalizePrescription);
    const investigations: InvestigationEntry[] = (parsed.investigations ?? []).map(normalizeInvestigationEntry);

    const fields = { ...parsed };
    delete fields.prescriptions;
    delete fields.investigations;

    return {
      type: casesheetType,
      fields,
      prescriptions,
      investigations,
      modelUsed: getModelName(),
    };
  } catch (err: any) {
    console.warn('[CaseConnect AI] Casesheet generation failed:', err.message);
    return {
      type: casesheetType,
      fields: {},
      prescriptions: [],
      investigations: [],
      modelUsed: 'retry',
    };
  }
}

// ─── Synchronous fallback (for immediate render while API loads) ─

export function analyzeSymptoms(
  complaints: string[],
  _hpi: string,
  _transcript: string,
): AIEntities {
  return offlineFallback(complaints);
}

// ─── Discharge Summary ──────────────────────────────────────

export async function generateDischargeSummary(data: {
  patientName: string;
  age: string;
  gender: string;
  diagnoses: string[];
  medications: { name: string; dosage: string }[];
  prescriptions?: Prescription[];
  complaints: string[];
  hpi: string;
  procedures: string[];
  dailyNotes: { date: string; subjective: string; objective: string; assessment: string; plan: string }[];
  investigations: { name: string; resultNotes?: string }[];
  pastHistory?: string;
  familyHistory?: string;
  allergies?: string;
  generalExamination?: string;
  systemicExamination?: string;
}): Promise<DischargeSummaryResult> {
  try {
    const context = `Generate a comprehensive discharge summary for this patient.

Patient: ${data.patientName}, Age: ${data.age}, Gender: ${data.gender}
Admission complaints: ${data.complaints.join(', ')}
HPI: ${data.hpi}
Diagnoses: ${data.diagnoses.join(', ')}
Past history: ${data.pastHistory || 'Not documented'}
Family history: ${data.familyHistory || 'Not documented'}
Allergies: ${data.allergies || 'No known allergies'}
General examination: ${data.generalExamination || 'Not documented'}
Systemic examination: ${data.systemicExamination || 'Not documented'}
Current prescriptions: ${(data.prescriptions || []).map((p) => `${p.drug} ${p.strength} ${p.frequency} ${p.duration}`).join(', ') || data.medications.map((m) => `${m.name} ${m.dosage}`).join(', ')}
Procedures: ${data.procedures.join(', ') || 'None'}
Investigation results: ${data.investigations.map((i) => `${i.name}: ${i.resultNotes || 'Normal'}`).join(', ') || 'None documented'}
Daily progress notes:
${data.dailyNotes.map((n) => `[${n.date}] S: ${n.subjective} O: ${n.objective} A: ${n.assessment} P: ${n.plan}`).join('\n') || 'No daily notes'}`;

    const res = await chatCompletion(
      [
        { role: 'system', content: DISCHARGE_PROMPT },
        { role: 'user', content: context },
      ],
      { temperature: 0.3, maxTokens: 4000 },
    );

    const raw = res.choices?.[0]?.message?.content || '';
    const parsed = safeJsonParse(raw);
    if (parsed) {
      return {
        finalDiagnosis: String(parsed.finalDiagnosis ?? data.diagnoses.join(', ')),
        reasonForAdmission: String(parsed.reasonForAdmission ?? data.complaints.join(', ')),
        historyOfPresentIllness: String(parsed.historyOfPresentIllness ?? data.hpi),
        pastHistory: String(parsed.pastHistory ?? ''),
        familyHistory: String(parsed.familyHistory ?? ''),
        treatmentHistory: String(parsed.treatmentHistory ?? ''),
        generalExamination: String(parsed.generalExamination ?? ''),
        systemicExamination: String(parsed.systemicExamination ?? ''),
        inHospitalCourse: String(parsed.inHospitalCourse ?? ''),
        procedures: String(parsed.procedures ?? data.procedures.join(', ')),
        administeredMedications: String(parsed.administeredMedications ?? ''),
        investigationsOrdered: (parsed.investigationsOrdered ?? []).map((i: any) => ({
          name: String(i.name ?? ''),
          result: String(i.result ?? ''),
        })),
        patientConditionAtDischarge: String(parsed.patientConditionAtDischarge ?? ''),
        advice: String(parsed.advice ?? ''),
        dischargePrescriptions: (parsed.dischargePrescriptions ?? []).map(normalizePrescription),
        followUp: (parsed.followUp ?? []).map((f: any) => ({
          practitionerName: f.practitionerName ?? null,
          date: f.date ?? null,
          remarks: f.remarks ?? null,
        })),
        warningSignsToWatch: String(parsed.warningSignsToWatch ?? ''),
        modelUsed: getModelName(),
      };
    }
    return {
      finalDiagnosis: data.diagnoses.join(', '),
      reasonForAdmission: data.complaints.join(', '),
      historyOfPresentIllness: raw,
      pastHistory: '',
      familyHistory: '',
      treatmentHistory: '',
      generalExamination: '',
      systemicExamination: '',
      inHospitalCourse: '',
      procedures: '',
      administeredMedications: data.medications.map((m) => m.name).join(', '),
      investigationsOrdered: [],
      patientConditionAtDischarge: '',
      advice: '',
      dischargePrescriptions: [],
      followUp: [],
      warningSignsToWatch: '',
      modelUsed: getModelName(),
    };
  } catch (err: any) {
    console.warn('[CaseConnect AI] Discharge summary failed:', err.message);
    return {
      finalDiagnosis: '',
      reasonForAdmission: '',
      historyOfPresentIllness: 'AI temporarily unavailable. Please try again.',
      pastHistory: '',
      familyHistory: '',
      treatmentHistory: '',
      generalExamination: '',
      systemicExamination: '',
      inHospitalCourse: '',
      procedures: '',
      administeredMedications: '',
      investigationsOrdered: [],
      patientConditionAtDischarge: '',
      advice: '',
      dischargePrescriptions: [],
      followUp: [],
      warningSignsToWatch: '',
      modelUsed: 'retry',
    };
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function safeJsonParse(raw: string): any | null {
  try {
    const cleaned = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    return null;
  }
}

function normalizeDx(d: any) {
  return {
    name: String(d.name ?? ''),
    confidence: Math.min(100, Math.max(0, Number(d.confidence ?? 50))),
    icdCode: String(d.icdCode ?? 'R69'),
    reasoning: String(d.reasoning ?? ''),
  };
}

function normalizeInv(inv: any) {
  return {
    name: String(inv.name ?? ''),
    reasoning: String(inv.reasoning ?? ''),
  };
}

function normalizePrescription(p: any, index?: number): Prescription {
  return {
    id: p.id ?? Date.now() + (index ?? Math.random() * 1000),
    route: String(p.route ?? 'Oral'),
    form: String(p.form ?? 'Tablet'),
    drug: String(p.drug ?? p.name ?? ''),
    genericName: String(p.genericName ?? ''),
    frequency: String(p.frequency ?? ''),
    strength: String(p.strength ?? p.dosage ?? ''),
    duration: String(p.duration ?? ''),
    instructions: String(p.instructions ?? ''),
  };
}

function normalizeInvestigationEntry(inv: any): InvestigationEntry {
  return {
    name: String(inv.name ?? ''),
    frequency: String(inv.frequency ?? 'Once'),
    remarks: String(inv.remarks ?? ''),
    time: String(inv.time ?? ''),
    orderDate: inv.orderDate ?? null,
    result: inv.result ? String(inv.result) : undefined,
  };
}

function validUrgency(val: any): AIEntities['triageUrgency'] {
  return ['low', 'moderate', 'high', 'critical'].includes(val) ? val : 'moderate';
}

function parseAnalysisResponse(raw: string, complaints: string[]): AIEntities {
  const parsed = safeJsonParse(raw);
  if (!parsed) return offlineFallback(complaints);

  return {
    symptoms: parsed.symptoms ?? complaints,
    suggestedDiagnoses: (parsed.suggestedDiagnoses ?? []).map(normalizeDx),
    suggestedMedications: (parsed.suggestedMedications ?? []).map((m: any) => ({
      name: String(m.name ?? ''),
      dosage: String(m.dosage ?? ''),
      reasoning: String(m.reasoning ?? ''),
    })),
    suggestedPrescriptions: (parsed.suggestedPrescriptions ?? []).map(normalizePrescription),
    suggestedInvestigations: (parsed.suggestedInvestigations ?? []).map(normalizeInv),
    structuredInvestigations: (parsed.structuredInvestigations ?? []).map(normalizeInvestigationEntry),
    vitals: {},
    triageUrgency: validUrgency(parsed.triageUrgency),
    modelUsed: getModelName(),
  };
}

function emptyResult(): AIEntities {
  return {
    symptoms: [],
    suggestedDiagnoses: [],
    suggestedMedications: [],
    suggestedPrescriptions: [],
    suggestedInvestigations: [],
    structuredInvestigations: [],
    vitals: {},
    triageUrgency: 'low',
    modelUsed: 'none',
  };
}

function offlineFallback(complaints: string[]): AIEntities {
  return {
    symptoms: complaints,
    suggestedDiagnoses: complaints.length > 0
      ? [{
          name: 'Waiting for AI analysis',
          confidence: 0,
          icdCode: '',
          reasoning: 'AI models may be temporarily busy. The system will automatically retry with an available model. If this persists, check your internet connection.',
        }]
      : [],
    suggestedMedications: [],
    suggestedPrescriptions: [],
    suggestedInvestigations: [],
    structuredInvestigations: [],
    vitals: {},
    triageUrgency: 'low',
    modelUsed: 'offline',
  };
}

function emptyClinicalNote(summary: string): ClinicalNote {
  return {
    summary,
    hpiNarrative: '',
    pastHistory: '',
    familyHistory: '',
    personalHistory: '',
    allergies: '',
    generalExamination: '',
    systemicExamination: '',
    assessmentPlan: '',
    differentialDiagnosis: '',
    followUp: '',
    modelUsed: summary.includes('unavailable') ? 'offline' : 'retry',
  };
}
