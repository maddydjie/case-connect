import { DepartmentCode } from './hospital.js';

export interface CaseSheet {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  departmentCode: DepartmentCode;
  admissionDate: Date;
  chiefComplaints: string[];
  historyOfPresentIllness: string;
  pastMedicalHistory: string;
  familyHistory?: string;
  personalHistory?: string;
  generalExamination: GeneralExamination;
  systemicExamination: Record<string, string>;
  investigations: Investigation[];
  diagnosis: Diagnosis[];
  treatmentPlan: TreatmentPlan;
  followUpInstructions?: string;
  icdCodes: string[];
  voiceTranscriptionId?: string;
  status: CaseSheetStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum CaseSheetStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REVIEWED = 'reviewed',
  ARCHIVED = 'archived',
}

export interface GeneralExamination {
  vitals: Vitals;
  generalCondition: string;
  consciousness: string;
  buildAndNourishment?: string;
  pallor?: boolean;
  icterus?: boolean;
  cyanosis?: boolean;
  clubbing?: boolean;
  edema?: boolean;
  lymphadenopathy?: boolean;
}

export interface Vitals {
  temperature?: number;
  pulse?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  respiratoryRate?: number;
  spo2?: number;
  weight?: number;
  height?: number;
  bmi?: number;
}

export interface Investigation {
  name: string;
  type: 'lab' | 'imaging' | 'procedure';
  status: 'ordered' | 'pending' | 'completed';
  result?: string;
  normalRange?: string;
  isAbnormal?: boolean;
  orderedAt: Date;
  completedAt?: Date;
}

export interface Diagnosis {
  code: string;
  description: string;
  type: 'primary' | 'secondary' | 'differential';
  icdCode?: string;
}

export interface TreatmentPlan {
  medications: Medication[];
  procedures: string[];
  diet?: string;
  activity?: string;
  specialInstructions?: string;
}

export interface Medication {
  name: string;
  genericName?: string;
  dosage: string;
  route: MedicationRoute;
  frequency: string;
  duration: string;
  instructions?: string;
}

export enum MedicationRoute {
  ORAL = 'oral',
  IV = 'iv',
  IM = 'im',
  SC = 'sc',
  TOPICAL = 'topical',
  INHALED = 'inhaled',
  SUBLINGUAL = 'sublingual',
  RECTAL = 'rectal',
}

export interface OPSheet {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  visitDate: Date;
  chiefComplaints: string[];
  examination: string;
  diagnosis: Diagnosis[];
  prescription: Medication[];
  icdCodes: string[];
  followUpDate?: Date;
  referral?: string;
  voiceTranscriptionId?: string;
  clinicBranding?: ClinicBranding;
  status: 'draft' | 'completed' | 'exported';
  createdAt: Date;
}

export interface ClinicBranding {
  logoUrl?: string;
  clinicName: string;
  address: string;
  phone: string;
  registrationInfo: string;
}

export interface EmergencyDoc {
  id: string;
  patientId?: string;
  doctorId: string;
  hospitalId: string;
  triageCategory: TriageCategory;
  arrivalMode: 'walk_in' | 'ambulance' | 'referral';
  airway: string;
  breathing: string;
  circulation: string;
  disability: string;
  exposure: string;
  vitals: Vitals;
  chiefComplaint: string;
  interventions: string[];
  disposition: string;
  escalatedTo?: string;
  startedAt: Date;
  completedAt?: Date;
  durationSeconds: number;
}

export enum TriageCategory {
  RESUSCITATION = 'resuscitation',
  EMERGENT = 'emergent',
  URGENT = 'urgent',
  LESS_URGENT = 'less_urgent',
  NON_URGENT = 'non_urgent',
}

export interface FollowUp {
  id: string;
  caseSheetId: string;
  patientId: string;
  doctorId: string;
  date: Date;
  soapNote: SOAPNote;
  vitalChanges: VitalChange[];
  labChanges: LabChange[];
  anomalyAlerts: string[];
  updatedMedications?: Medication[];
  status: 'pending' | 'completed';
}

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface VitalChange {
  vitalName: string;
  previousValue: number;
  currentValue: number;
  unit: string;
  trend: 'improving' | 'stable' | 'worsening';
}

export interface LabChange {
  testName: string;
  previousValue: string;
  currentValue: string;
  isAbnormal: boolean;
}
