export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  previousData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface Consent {
  id: string;
  userId: string;
  purpose: ConsentPurpose;
  status: 'granted' | 'revoked';
  grantedAt: Date;
  revokedAt?: Date;
  expiresAt?: Date;
  dataCategories: string[];
  thirdParties?: string[];
}

export enum ConsentPurpose {
  TREATMENT = 'treatment',
  RESEARCH = 'research',
  INSURANCE = 'insurance',
  SHARING = 'sharing',
  MARKETING = 'marketing',
  ABDM_LINKING = 'abdm_linking',
}

export interface HealthVaultRecord {
  id: string;
  patientId: string;
  type: 'case_sheet' | 'op_sheet' | 'lab_report' | 'imaging' | 'prescription' | 'discharge_summary';
  title: string;
  date: Date;
  hospitalName: string;
  doctorName: string;
  fileUrl?: string;
  data?: Record<string, unknown>;
  sharedWith: string[];
  abdmLinked: boolean;
}

export interface TriageResult {
  urgencyScore: number;
  urgencyLevel: 'low' | 'moderate' | 'high' | 'emergency';
  symptoms: string[];
  possibleConditions: string[];
  recommendedAction: string;
  preConsultationSummary: string;
}

export interface StudentProgress {
  userId: string;
  totalCasesPracticed: number;
  correctDiagnoses: number;
  accuracy: number;
  weakAreas: string[];
  strongAreas: string[];
  badges: Badge[];
  rank: number;
  streak: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  earnedAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  score: number;
  casesCompleted: number;
  accuracy: number;
  badges: number;
}
