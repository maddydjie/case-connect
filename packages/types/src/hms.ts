export interface Bed {
  id: string;
  hospitalId: string;
  departmentId: string;
  wardName: string;
  floor: number;
  bedNumber: string;
  type: BedType;
  status: BedStatus;
  patientId?: string;
  assignedAt?: Date;
  expectedDischarge?: Date;
  cleaningStartedAt?: Date;
  estimatedCleaningEta?: Date;
  readmissionRisk?: number;
  features: string[];
}

export enum BedType {
  GENERAL = 'general',
  SEMI_PRIVATE = 'semi_private',
  PRIVATE = 'private',
  ICU = 'icu',
  NICU = 'nicu',
  ISOLATION = 'isolation',
  EMERGENCY = 'emergency',
}

export enum BedStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  CLEANING = 'cleaning',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
  BLOCKED = 'blocked',
}

export interface BedAssignment {
  id: string;
  bedId: string;
  patientId: string;
  doctorId: string;
  admissionDate: Date;
  dischargeDate?: Date;
  reason: string;
  notes?: string;
}

export interface BedMapFloor {
  floor: number;
  wards: BedMapWard[];
}

export interface BedMapWard {
  name: string;
  beds: Bed[];
  occupancy: number;
  total: number;
}

export interface Document {
  id: string;
  patientId: string;
  hospitalId: string;
  type: DocumentType;
  title: string;
  status: DocumentStatus;
  fileUrl: string;
  ocrText?: string;
  validationResult?: ValidationResult;
  orderedBy?: string;
  uploadedBy?: string;
  validatedBy?: string;
  deliveredTo?: string[];
  orderedAt?: Date;
  uploadedAt?: Date;
  validatedAt?: Date;
  deliveredAt?: Date;
}

export enum DocumentType {
  LAB_REPORT = 'lab_report',
  IMAGING = 'imaging',
  PRESCRIPTION = 'prescription',
  DISCHARGE_SUMMARY = 'discharge_summary',
  CONSENT_FORM = 'consent_form',
  REFERRAL = 'referral',
  INSURANCE = 'insurance',
  OTHER = 'other',
}

export enum DocumentStatus {
  ORDERED = 'ordered',
  UPLOADED = 'uploaded',
  VALIDATING = 'validating',
  VALIDATED = 'validated',
  REJECTED = 'rejected',
  DELIVERED = 'delivered',
}

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  issues: string[];
  suggestions: string[];
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  departmentId: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: AppointmentType;
  priority: AppointmentPriority;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  waitlistPosition?: number;
  reminderSent: boolean;
  createdAt: Date;
}

export enum AppointmentType {
  NEW_CONSULTATION = 'new_consultation',
  FOLLOW_UP = 'follow_up',
  EMERGENCY = 'emergency',
  PROCEDURE = 'procedure',
  LAB_TEST = 'lab_test',
}

export enum AppointmentPriority {
  NORMAL = 'normal',
  MODERATE = 'moderate',
  EMERGENCY = 'emergency',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  WAITLISTED = 'waitlisted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export interface Schedule {
  doctorId: string;
  hospitalId: string;
  dayOfWeek: number;
  slots: ScheduleSlot[];
}

export interface ScheduleSlot {
  startTime: string;
  endTime: string;
  maxPatients: number;
  bookedCount: number;
  isAvailable: boolean;
}
