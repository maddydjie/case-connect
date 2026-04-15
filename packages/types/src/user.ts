export enum UserRole {
  DOCTOR = 'doctor',
  STUDENT = 'student',
  PATIENT = 'patient',
  HOSPITAL_ADMIN = 'hospital_admin',
  LAB_TECH = 'lab_tech',
  PHARMACIST = 'pharmacist',
  SUPER_ADMIN = 'super_admin',
}

export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  hospitalId?: string;
  departmentId?: string;
  isActive: boolean;
  mfaEnabled: boolean;
  abhaId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoctorProfile {
  userId: string;
  registrationNumber: string;
  specialization: string;
  qualification: string;
  experience: number;
  departments: string[];
  consultationFee?: number;
  availableSlots?: TimeSlot[];
}

export interface StudentProfile {
  userId: string;
  institutionId: string;
  enrollmentNumber: string;
  year: number;
  course: string;
  mentorId?: string;
}

export interface PatientProfile {
  userId: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: EmergencyContact;
  familyMembers: string[];
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface TimeSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export type Permission =
  | 'case_sheet:create'
  | 'case_sheet:read'
  | 'case_sheet:update'
  | 'case_sheet:delete'
  | 'op_sheet:create'
  | 'op_sheet:read'
  | 'op_sheet:update'
  | 'emergency:create'
  | 'emergency:read'
  | 'bed:view'
  | 'bed:assign'
  | 'bed:manage'
  | 'schedule:view'
  | 'schedule:create'
  | 'schedule:manage'
  | 'patient:view'
  | 'patient:manage'
  | 'report:view'
  | 'report:upload'
  | 'report:validate'
  | 'analytics:view'
  | 'admin:users'
  | 'admin:hospital'
  | 'admin:audit'
  | 'student:practice'
  | 'student:view_analytics'
  | 'faculty:feedback';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.DOCTOR]: [
    'case_sheet:create', 'case_sheet:read', 'case_sheet:update',
    'op_sheet:create', 'op_sheet:read', 'op_sheet:update',
    'emergency:create', 'emergency:read',
    'bed:view', 'bed:assign',
    'schedule:view', 'schedule:create',
    'patient:view',
    'report:view',
    'analytics:view',
  ],
  [UserRole.STUDENT]: [
    'case_sheet:read',
    'student:practice', 'student:view_analytics',
  ],
  [UserRole.PATIENT]: [
    'patient:view', 'patient:manage',
    'schedule:view', 'schedule:create',
    'report:view',
  ],
  [UserRole.HOSPITAL_ADMIN]: [
    'case_sheet:read',
    'bed:view', 'bed:manage',
    'schedule:view', 'schedule:manage',
    'patient:view',
    'report:view',
    'analytics:view',
    'admin:users', 'admin:hospital', 'admin:audit',
  ],
  [UserRole.LAB_TECH]: [
    'report:view', 'report:upload', 'report:validate',
    'patient:view',
  ],
  [UserRole.PHARMACIST]: [
    'op_sheet:read',
    'patient:view',
  ],
  [UserRole.SUPER_ADMIN]: [
    'case_sheet:create', 'case_sheet:read', 'case_sheet:update', 'case_sheet:delete',
    'op_sheet:create', 'op_sheet:read', 'op_sheet:update',
    'emergency:create', 'emergency:read',
    'bed:view', 'bed:assign', 'bed:manage',
    'schedule:view', 'schedule:create', 'schedule:manage',
    'patient:view', 'patient:manage',
    'report:view', 'report:upload', 'report:validate',
    'analytics:view',
    'admin:users', 'admin:hospital', 'admin:audit',
    'student:practice', 'student:view_analytics',
    'faculty:feedback',
  ],
};
