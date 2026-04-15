export interface TranscriptionRequest {
  audioData: Buffer | string;
  format: 'wav' | 'mp3' | 'webm' | 'ogg';
  sampleRate?: number;
  language?: string;
  departmentCode?: string;
  doctorId: string;
}

export interface TranscriptionResult {
  id: string;
  text: string;
  confidence: number;
  duration: number;
  language: string;
  segments: TranscriptionSegment[];
  medicalEntities: MedicalEntity[];
  intent: VoiceIntent;
  templateData?: Record<string, unknown>;
  processingTimeMs: number;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
}

export interface MedicalEntity {
  text: string;
  label: MedicalEntityType;
  start: number;
  end: number;
  confidence: number;
  normalizedValue?: string;
  icdCode?: string;
}

export enum MedicalEntityType {
  SYMPTOM = 'symptom',
  DIAGNOSIS = 'diagnosis',
  MEDICATION = 'medication',
  DOSAGE = 'dosage',
  PROCEDURE = 'procedure',
  VITAL = 'vital',
  LAB_VALUE = 'lab_value',
  BODY_PART = 'body_part',
  DURATION = 'duration',
  FREQUENCY = 'frequency',
}

export interface VoiceIntent {
  action: VoiceAction;
  department?: string;
  confidence: number;
}

export enum VoiceAction {
  NEW_CASE = 'new_case',
  NEW_OP = 'new_op',
  EMERGENCY = 'emergency',
  FOLLOW_UP = 'follow_up',
  ASSIGN_BED = 'assign_bed',
  ORDER_TEST = 'order_test',
  PRESCRIBE = 'prescribe',
  DISCHARGE = 'discharge',
  UNKNOWN = 'unknown',
}
