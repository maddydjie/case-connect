export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export function assessVitalUrgency(vitals: {
  temperature?: number;
  pulse?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  respiratoryRate?: number;
  spo2?: number;
}): { level: 'normal' | 'warning' | 'critical'; alerts: string[] } {
  const alerts: string[] = [];

  if (vitals.temperature && (vitals.temperature > 103 || vitals.temperature < 95)) {
    alerts.push(`Temperature critical: ${vitals.temperature}°F`);
  } else if (vitals.temperature && (vitals.temperature > 100.4 || vitals.temperature < 96)) {
    alerts.push(`Temperature abnormal: ${vitals.temperature}°F`);
  }

  if (vitals.pulse && (vitals.pulse > 150 || vitals.pulse < 40)) {
    alerts.push(`Pulse critical: ${vitals.pulse} bpm`);
  } else if (vitals.pulse && (vitals.pulse > 100 || vitals.pulse < 50)) {
    alerts.push(`Pulse abnormal: ${vitals.pulse} bpm`);
  }

  if (vitals.bloodPressureSystolic && vitals.bloodPressureSystolic > 180) {
    alerts.push(`Hypertensive crisis: ${vitals.bloodPressureSystolic} mmHg`);
  } else if (vitals.bloodPressureSystolic && vitals.bloodPressureSystolic < 90) {
    alerts.push(`Hypotension: ${vitals.bloodPressureSystolic} mmHg`);
  }

  if (vitals.spo2 && vitals.spo2 < 90) {
    alerts.push(`SpO2 critical: ${vitals.spo2}%`);
  } else if (vitals.spo2 && vitals.spo2 < 94) {
    alerts.push(`SpO2 low: ${vitals.spo2}%`);
  }

  if (vitals.respiratoryRate && (vitals.respiratoryRate > 30 || vitals.respiratoryRate < 8)) {
    alerts.push(`Respiratory rate critical: ${vitals.respiratoryRate}/min`);
  }

  const hasCritical = alerts.some((a) => a.includes('critical') || a.includes('crisis'));
  const level = hasCritical ? 'critical' : alerts.length > 0 ? 'warning' : 'normal';

  return { level, alerts };
}

export const DEPARTMENT_TEMPLATES: Record<string, string[]> = {
  CARD: ['Chief Complaints', 'Cardiac History', 'ECG Findings', 'Echo Report', 'Angiography', 'Risk Factors', 'Medications'],
  NEUR: ['Chief Complaints', 'Neurological History', 'Cranial Nerve Exam', 'Motor Exam', 'Sensory Exam', 'Reflexes', 'Imaging'],
  ORTH: ['Chief Complaints', 'Mechanism of Injury', 'Joint Examination', 'Range of Motion', 'X-ray Findings', 'Treatment Plan'],
  PEDI: ['Chief Complaints', 'Birth History', 'Developmental Milestones', 'Immunization Status', 'Growth Chart', 'Feeding History'],
  GENM: ['Chief Complaints', 'History of Present Illness', 'Past History', 'Family History', 'General Examination', 'Systemic Examination'],
  GYNE: ['Chief Complaints', 'Menstrual History', 'Obstetric History', 'Per Abdominal Exam', 'Per Vaginal Exam', 'Investigations'],
  DERM: ['Chief Complaints', 'Duration', 'Site', 'Morphology', 'Distribution', 'Associated Symptoms', 'Previous Treatment'],
  PSYC: ['Chief Complaints', 'History of Present Illness', 'Personal History', 'Mental Status Exam', 'Psychometric Testing', 'Risk Assessment'],
};

export const COMMON_INDIAN_MEDICATIONS = [
  'Crocin (Paracetamol)', 'Dolo 650 (Paracetamol)', 'Combiflam (Ibuprofen + Paracetamol)',
  'Augmentin (Amoxicillin + Clavulanate)', 'Azithral (Azithromycin)', 'Cefixime',
  'Pantop (Pantoprazole)', 'Rablet (Rabeprazole)', 'Omez (Omeprazole)',
  'Metformin (Glycomet)', 'Glimepiride (Amaryl)', 'Amlodipine (Amlopress)',
  'Telmisartan (Telma)', 'Atorvastatin (Atorva)', 'Rosuvastatin (Rozavel)',
  'Montair LC (Montelukast + Levocetrizine)', 'Allegra (Fexofenadine)',
  'Shelcal (Calcium)', 'Becosules (B-Complex)', 'Zincovit (Multivitamin)',
];
