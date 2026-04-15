export interface Hospital {
  id: string;
  name: string;
  code: string;
  type: HospitalType;
  address: Address;
  phone: string;
  email: string;
  website?: string;
  registrationNumber: string;
  abdmFacilityId?: string;
  totalBeds: number;
  departments: Department[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum HospitalType {
  GOVERNMENT = 'government',
  PRIVATE = 'private',
  TRUST = 'trust',
  CLINIC = 'clinic',
  NURSING_HOME = 'nursing_home',
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface Department {
  id: string;
  name: string;
  code: DepartmentCode;
  hospitalId: string;
  headDoctorId?: string;
  bedCount: number;
  isActive: boolean;
}

export enum DepartmentCode {
  CARDIOLOGY = 'CARD',
  NEUROLOGY = 'NEUR',
  ORTHOPEDICS = 'ORTH',
  PEDIATRICS = 'PEDI',
  GENERAL_MEDICINE = 'GENM',
  GYNECOLOGY = 'GYNE',
  DERMATOLOGY = 'DERM',
  PSYCHIATRY = 'PSYC',
  EMERGENCY = 'EMER',
  SURGERY = 'SURG',
  ENT = 'ENT',
  OPHTHALMOLOGY = 'OPHT',
  RADIOLOGY = 'RADI',
  PATHOLOGY = 'PATH',
  ICU = 'ICU',
}
