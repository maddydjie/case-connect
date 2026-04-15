import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────

export type CaseSheetStatus = 'draft' | 'in-progress' | 'review' | 'complete';
export type OPSheetStatus = 'draft' | 'final' | 'signed';
export type EmergencyStatus = 'active' | 'admitted' | 'transferred' | 'discharged' | 'referred' | 'completed';
export type InvestigationStatus = 'ordered' | 'uploaded' | 'delivered';
export type VisitType = 'OPD' | 'IPD';
export type CaseSheetType =
  | 'opd-casesheet'
  | 'admission-notes'
  | 'progress-records'
  | 'doctors-orders'
  | 'cross-referral'
  | 'doctors-handover-notes'
  | 'operation-theater-notes'
  | 'discharge-summary';

export interface Prescription {
  id: number;
  route: string;
  form: string;
  drug: string;
  genericName: string;
  frequency: string;
  strength: string;
  duration: string;
  instructions: string;
}

export interface InvestigationEntry {
  name: string;
  frequency: string;
  remarks: string;
  time: string;
  orderDate: string | null;
  result?: string;
}

export interface StructuredVital {
  vital: 'bloodPressure' | 'pulseRate' | 'spo2' | 'hba1c' | 'randomBloodSugar' | 'temperature' | 'respiratoryRate';
  unit: string;
  value: string;
}

export interface FollowUp {
  practitionerName: string | null;
  date: string | null;
  remarks: string | null;
}

// Legacy compat
export interface MedicationEntry {
  id: number;
  name: string;
  dosage: string;
  route: string;
  frequency: string;
  duration: string;
}

export interface InvestigationOrder {
  id: string;
  name: string;
  reasoning: string;
  status: InvestigationStatus;
  linkedTo: { type: 'casesheet' | 'opsheet' | 'emergency'; id: string };
  patientName: string;
  orderedAt: string;
  deliveredAt?: string;
  resultNotes?: string;
}

export interface VitalEntry {
  label: string;
  value: string;
}

export interface DailyNote {
  date: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  vitals: VitalEntry[];
  investigationResults: string[];
}

// ─── Visit ───────────────────────────────────────────────────

export interface Visit {
  id: string;
  patientId: string;
  patientName: string;
  visitType: VisitType;
  department: string;
  practitioner: string;
  patientStatus: string;
  createdAt: string;
  updatedAt: string;
  casesheetIds: string[];
}

// ─── Structured CaseSheet (Axone-inspired) ───────────────────

export interface CaseSheet {
  id: string;
  visitId?: string;
  casesheetType: CaseSheetType;
  status: CaseSheetStatus;
  createdAt: string;
  updatedAt: string;
  department: string;

  // Patient info
  patientName: string;
  patientMrn: string;
  patientAge: string;
  patientGender: string;

  // Clinical data — common across types
  chiefComplaints: string;
  complaints: string[];
  historyOfPresentIllness: string;
  pastHistory: string;
  surgicalHistory: string;
  familyHistory: string;
  personalHistory: string;
  socialHistory: string;
  allergies: string;
  treatmentHistory: string;
  obstetricAndGynecologyHistory: string;

  // Examination
  generalExamination: string;
  systemicExamination: string;
  generalCondition: string;
  clinicalNotes: string;

  // Diagnosis
  provisionalDiagnosis: string[];
  finalDiagnosis: string;
  diagnoses: string[];

  // Vitals
  vitals: VitalEntry[];
  structuredVitals: StructuredVital[];

  // Treatment
  prescriptions: Prescription[];
  medications: MedicationEntry[];
  investigations: InvestigationEntry[];
  investigationOrders: InvestigationOrder[];

  // Plans & procedures
  procedures: string[];
  instructions: string;
  plan: string;
  advice: string;
  carePlan: string;

  // IPD-specific: admission notes
  dateOfAdmission: string;
  dateOfSurgery: string;
  dateOfPlannedDischarge: string;
  painAssessment: string;
  currentMedications: string;

  // Progress records
  currentPatientCondition: string;
  dietAndNutrition: string;

  // Cross referral
  referralDepartment: string;
  reasonForReferral: string;
  primaryReasonForReferral: string;
  recommendation: string;

  // OT notes
  surgeon: string;
  assistantSurgeon: string;
  anesthesiologist: string;
  indicationForSurgery: string;
  preoperativeAssessment: string;
  intraoperativeDetails: string;
  immediatePostoperativeCondition: string;
  postoperativeOrders: string;

  // Handover
  reasonForTransfer: string;
  handoverDetails: string;

  // Discharge summary
  inHospitalCourse: string;
  administeredMedications: string;
  patientConditionAtDischarge: string;
  generalExaminationAtDischarge: string;
  systemicExaminationAtDischarge: string;
  dischargeType: string;
  followUp: FollowUp[];
  dischargePrescriptions: Prescription[];

  // Daily notes (for IPD)
  dailyNotes: DailyNote[];
  dischargeSummary?: string;

  // Ward info
  bed?: string;
  ward?: string;

  // Legacy compat
  hpi: string;
  pmh: string;
}

export interface OPSheet {
  id: string;
  visitId?: string;
  status: OPSheetStatus;
  createdAt: string;
  updatedAt: string;
  patientName: string;
  mrn: string;
  department: string;
  chiefComplaint: string;
  doctorName: string;
  qualifications: string;
  nmcRegistration: string;
  hospitalName: string;
  hospitalAddress: string;
  age: string;
  gender: string;
  weightKg: string;
  address: string;
  diagnoses: string[];
  drugs: DrugRow[];
  prescriptions: Prescription[];
  investigations: InvestigationOrder[];
  investigationEntries: InvestigationEntry[];
  refillNote: string;
  followUp: FollowUp[];
  advice: string;
}

export interface DrugRow {
  genericNameCaps: string;
  dosageForm: string;
  strength: string;
  route: string;
  frequency: string;
  duration: string;
  totalQuantity: string;
}

export interface EmergencyRecord {
  id: string;
  status: EmergencyStatus;
  createdAt: string;
  updatedAt: string;
  patientName: string;
  age: string;
  gender: string;
  phone: string;
  briefId: string;
  triage: string;
  arrivalMode: string;
  chiefComplaint: string;
  vitals: VitalEntry[];
  abcNotes: string;
  interventions: string[];
  investigations: InvestigationOrder[];
  statusHistory: { status: EmergencyStatus; at: string; note: string }[];
}

export interface DoctorHistory {
  symptoms: string[];
  diagnoses: string[];
  medications: string[];
  investigations: string[];
}

// ─── Defaults ────────────────────────────────────────────────

export function defaultCaseSheet(overrides: Partial<CaseSheet> & { id: string }): CaseSheet {
  return {
    casesheetType: 'opd-casesheet',
    visitId: '',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    department: '',
    patientName: '',
    patientMrn: '',
    patientAge: '',
    patientGender: '',
    chiefComplaints: '',
    complaints: [],
    historyOfPresentIllness: '',
    hpi: '',
    pmh: '',
    pastHistory: '',
    surgicalHistory: '',
    familyHistory: '',
    personalHistory: '',
    socialHistory: '',
    allergies: '',
    treatmentHistory: '',
    obstetricAndGynecologyHistory: '',
    generalExamination: '',
    systemicExamination: '',
    generalCondition: '',
    clinicalNotes: '',
    provisionalDiagnosis: [],
    finalDiagnosis: '',
    diagnoses: [],
    vitals: [],
    structuredVitals: [],
    prescriptions: [],
    medications: [],
    investigations: [],
    investigationOrders: [],
    procedures: [],
    instructions: '',
    plan: '',
    advice: '',
    carePlan: '',
    dateOfAdmission: '',
    dateOfSurgery: '',
    dateOfPlannedDischarge: '',
    painAssessment: '',
    currentMedications: '',
    currentPatientCondition: '',
    dietAndNutrition: '',
    referralDepartment: '',
    reasonForReferral: '',
    primaryReasonForReferral: '',
    recommendation: '',
    surgeon: '',
    assistantSurgeon: '',
    anesthesiologist: '',
    indicationForSurgery: '',
    preoperativeAssessment: '',
    intraoperativeDetails: '',
    immediatePostoperativeCondition: '',
    postoperativeOrders: '',
    reasonForTransfer: '',
    handoverDetails: '',
    inHospitalCourse: '',
    administeredMedications: '',
    patientConditionAtDischarge: '',
    generalExaminationAtDischarge: '',
    systemicExaminationAtDischarge: '',
    dischargeType: '',
    followUp: [],
    dischargePrescriptions: [],
    dailyNotes: [],
    bed: '',
    ward: '',
    ...overrides,
  };
}

// ─── Autopopulation helpers ──────────────────────────────────

export function autopopulateFromVisit(
  visit: Visit,
  allCasesheets: CaseSheet[],
  targetType: CaseSheetType,
): Partial<CaseSheet> {
  const visitSheets = allCasesheets.filter((cs) => cs.visitId === visit.id);

  const opdSheet = visitSheets.find((cs) => cs.casesheetType === 'opd-casesheet');
  const admissionSheet = visitSheets.find((cs) => cs.casesheetType === 'admission-notes');
  const progressSheets = visitSheets.filter((cs) => cs.casesheetType === 'progress-records');
  const latestProgress = progressSheets[progressSheets.length - 1];
  const ordersSheets = visitSheets.filter((cs) => cs.casesheetType === 'doctors-orders');
  const crossReferrals = visitSheets.filter((cs) => cs.casesheetType === 'cross-referral');

  const base: Partial<CaseSheet> = {
    patientName: visit.patientName,
    department: visit.department,
  };

  switch (targetType) {
    case 'admission-notes':
      return {
        ...base,
        ...(opdSheet && {
          chiefComplaints: opdSheet.chiefComplaints || opdSheet.complaints.join(', '),
          complaints: opdSheet.complaints,
          historyOfPresentIllness: opdSheet.historyOfPresentIllness || opdSheet.hpi,
          generalExamination: opdSheet.generalExamination,
          systemicExamination: opdSheet.systemicExamination,
          allergies: opdSheet.allergies,
          pastHistory: opdSheet.pastHistory || opdSheet.pmh,
          familyHistory: opdSheet.familyHistory,
          personalHistory: opdSheet.personalHistory,
          diagnoses: opdSheet.diagnoses,
          provisionalDiagnosis: opdSheet.provisionalDiagnosis,
        }),
      };

    case 'progress-records':
      return {
        ...base,
        ...(admissionSheet && {
          diagnoses: admissionSheet.diagnoses,
          finalDiagnosis: admissionSheet.finalDiagnosis,
          currentMedications: admissionSheet.currentMedications || admissionSheet.prescriptions.map((p) => `${p.drug} ${p.strength} ${p.frequency}`).join(', '),
        }),
      };

    case 'doctors-orders':
      return {
        ...base,
        ...(admissionSheet && {
          diagnoses: admissionSheet.diagnoses,
          finalDiagnosis: admissionSheet.finalDiagnosis,
        }),
        ...(latestProgress && {
          currentPatientCondition: latestProgress.currentPatientCondition,
        }),
      };

    case 'cross-referral':
      return {
        ...base,
        ...(admissionSheet && {
          pastHistory: admissionSheet.pastHistory || admissionSheet.pmh,
          surgicalHistory: admissionSheet.surgicalHistory,
          allergies: admissionSheet.allergies,
        }),
        ...(ordersSheets.length > 0 && {
          currentMedications: ordersSheets
            .flatMap((o) => o.prescriptions)
            .map((p) => `${p.drug} ${p.strength} ${p.frequency}`)
            .join(', '),
        }),
      };

    case 'doctors-handover-notes':
      return {
        ...base,
        ...(admissionSheet && {
          historyOfPresentIllness: admissionSheet.historyOfPresentIllness || admissionSheet.hpi,
          allergies: admissionSheet.allergies,
        }),
        ...(latestProgress && {
          currentPatientCondition: latestProgress.currentPatientCondition,
        }),
        ...(crossReferrals.length > 0 && {
          clinicalNotes: crossReferrals.map((cr) => `Referral to ${cr.referralDepartment}: ${cr.reasonForReferral}`).join('\n'),
        }),
      };

    case 'operation-theater-notes':
      return {
        ...base,
        ...(admissionSheet && {
          diagnoses: admissionSheet.diagnoses,
          finalDiagnosis: admissionSheet.finalDiagnosis,
          preoperativeAssessment: admissionSheet.generalExamination,
        }),
        ...(latestProgress && {
          currentPatientCondition: latestProgress.currentPatientCondition,
        }),
        ...(ordersSheets.length > 0 && {
          currentMedications: ordersSheets
            .flatMap((o) => o.prescriptions)
            .map((p) => `${p.drug} ${p.strength}`)
            .join(', '),
        }),
      };

    case 'discharge-summary': {
      const allPrescriptions = visitSheets.flatMap((vs) => vs.prescriptions);
      const allInvestigations = visitSheets.flatMap((vs) => vs.investigations);
      const allProcedures = visitSheets.flatMap((vs) => vs.procedures);
      const allDailyNotes = visitSheets.flatMap((vs) => vs.dailyNotes);
      const dedupedMeds = [...new Map(allPrescriptions.map((p) => [`${p.drug}-${p.strength}`, p])).values()];
      return {
        ...base,
        ...(admissionSheet && {
          historyOfPresentIllness: admissionSheet.historyOfPresentIllness || admissionSheet.hpi,
          pastHistory: admissionSheet.pastHistory || admissionSheet.pmh,
          familyHistory: admissionSheet.familyHistory,
          personalHistory: admissionSheet.personalHistory,
          socialHistory: admissionSheet.socialHistory,
          treatmentHistory: admissionSheet.treatmentHistory,
          obstetricAndGynecologyHistory: admissionSheet.obstetricAndGynecologyHistory,
          generalExamination: admissionSheet.generalExamination,
          systemicExamination: admissionSheet.systemicExamination,
          allergies: admissionSheet.allergies,
          diagnoses: admissionSheet.diagnoses,
          finalDiagnosis: admissionSheet.finalDiagnosis,
        }),
        procedures: [...new Set(allProcedures)],
        prescriptions: dedupedMeds,
        investigations: allInvestigations,
        dailyNotes: allDailyNotes,
        administeredMedications: dedupedMeds.map((p) => `${p.drug} ${p.strength} ${p.frequency}`).join(', '),
      };
    }

    default:
      return base;
  }
}

// ─── Store ───────────────────────────────────────────────────

interface CaseStoreState {
  visits: Visit[];
  caseSheets: CaseSheet[];
  opSheets: OPSheet[];
  emergencies: EmergencyRecord[];
  investigationOrders: InvestigationOrder[];
  doctorHistory: DoctorHistory;

  // Visits
  addVisit: (v: Visit) => void;
  updateVisit: (id: string, patch: Partial<Visit>) => void;
  getVisit: (id: string) => Visit | undefined;
  getVisitsForPatient: (patientName: string) => Visit[];
  linkCasesheetToVisit: (visitId: string, casesheetId: string) => void;

  // Case Sheets
  addCaseSheet: (cs: CaseSheet) => void;
  updateCaseSheet: (id: string, patch: Partial<CaseSheet>) => void;
  updateCaseSheetStatus: (id: string, status: CaseSheetStatus) => void;
  getCaseSheet: (id: string) => CaseSheet | undefined;
  getCaseSheetsForVisit: (visitId: string) => CaseSheet[];
  addDailyNote: (caseId: string, note: DailyNote) => void;

  // OP Sheets
  addOPSheet: (op: OPSheet) => void;
  updateOPSheet: (id: string, patch: Partial<OPSheet>) => void;
  updateOPSheetStatus: (id: string, status: OPSheetStatus) => void;
  getOPSheet: (id: string) => OPSheet | undefined;

  // Emergencies
  addEmergency: (em: EmergencyRecord) => void;
  updateEmergency: (id: string, patch: Partial<EmergencyRecord>) => void;
  updateEmergencyStatus: (id: string, status: EmergencyStatus, note?: string) => void;
  getEmergency: (id: string) => EmergencyRecord | undefined;

  // Investigation Orders
  addInvestigationOrder: (order: InvestigationOrder) => void;
  updateInvestigationStatus: (id: string, status: InvestigationStatus, resultNotes?: string) => void;
  getInvestigationsFor: (linkedType: string, linkedId: string) => InvestigationOrder[];
  getInvestigationsForPatient: (patientName: string) => InvestigationOrder[];

  // Doctor History
  addToHistory: (category: keyof DoctorHistory, items: string[]) => void;
  searchHistory: (category: keyof DoctorHistory, prefix: string) => string[];
}

export const useCaseStore = create<CaseStoreState>()(
  persist(
    (set, get) => ({
      visits: [],
      caseSheets: [],
      opSheets: [],
      emergencies: [],
      investigationOrders: [],
      doctorHistory: { symptoms: [], diagnoses: [], medications: [], investigations: [] },

      // ─── Visits ─────────────────────────────────────────
      addVisit: (v) => set((s) => ({ visits: [v, ...s.visits] })),

      updateVisit: (id, patch) =>
        set((s) => ({
          visits: s.visits.map((v) =>
            v.id === id ? { ...v, ...patch, updatedAt: new Date().toISOString() } : v,
          ),
        })),

      getVisit: (id) => get().visits.find((v) => v.id === id),

      getVisitsForPatient: (patientName) =>
        get().visits.filter((v) => v.patientName === patientName),

      linkCasesheetToVisit: (visitId, casesheetId) =>
        set((s) => ({
          visits: s.visits.map((v) =>
            v.id === visitId
              ? { ...v, casesheetIds: [...new Set([...v.casesheetIds, casesheetId])], updatedAt: new Date().toISOString() }
              : v,
          ),
        })),

      // ─── Case Sheets ─────────────────────────────────────
      addCaseSheet: (cs) => set((s) => ({ caseSheets: [cs, ...s.caseSheets] })),

      updateCaseSheet: (id, patch) =>
        set((s) => ({
          caseSheets: s.caseSheets.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c,
          ),
        })),

      updateCaseSheetStatus: (id, status) =>
        set((s) => ({
          caseSheets: s.caseSheets.map((c) =>
            c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c,
          ),
        })),

      getCaseSheet: (id) => get().caseSheets.find((c) => c.id === id),

      getCaseSheetsForVisit: (visitId) =>
        get().caseSheets.filter((c) => c.visitId === visitId),

      addDailyNote: (caseId, note) =>
        set((s) => ({
          caseSheets: s.caseSheets.map((c) =>
            c.id === caseId
              ? { ...c, dailyNotes: [...c.dailyNotes, note], updatedAt: new Date().toISOString() }
              : c,
          ),
        })),

      // ─── OP Sheets ───────────────────────────────────────
      addOPSheet: (op) => set((s) => ({ opSheets: [op, ...s.opSheets] })),

      updateOPSheet: (id, patch) =>
        set((s) => ({
          opSheets: s.opSheets.map((o) =>
            o.id === id ? { ...o, ...patch, updatedAt: new Date().toISOString() } : o,
          ),
        })),

      updateOPSheetStatus: (id, status) =>
        set((s) => ({
          opSheets: s.opSheets.map((o) =>
            o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o,
          ),
        })),

      getOPSheet: (id) => get().opSheets.find((o) => o.id === id),

      // ─── Emergencies ─────────────────────────────────────
      addEmergency: (em) => set((s) => ({ emergencies: [em, ...s.emergencies] })),

      updateEmergency: (id, patch) =>
        set((s) => ({
          emergencies: s.emergencies.map((e) =>
            e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e,
          ),
        })),

      updateEmergencyStatus: (id, status, note = '') =>
        set((s) => ({
          emergencies: s.emergencies.map((e) =>
            e.id === id
              ? {
                  ...e,
                  status,
                  updatedAt: new Date().toISOString(),
                  statusHistory: [...e.statusHistory, { status, at: new Date().toISOString(), note }],
                }
              : e,
          ),
        })),

      getEmergency: (id) => get().emergencies.find((e) => e.id === id),

      // ─── Investigation Orders ─────────────────────────────
      addInvestigationOrder: (order) =>
        set((s) => ({ investigationOrders: [order, ...s.investigationOrders] })),

      updateInvestigationStatus: (id, status, resultNotes) =>
        set((s) => ({
          investigationOrders: s.investigationOrders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status,
                  ...(status === 'delivered' ? { deliveredAt: new Date().toISOString() } : {}),
                  ...(resultNotes ? { resultNotes } : {}),
                }
              : o,
          ),
        })),

      getInvestigationsFor: (linkedType, linkedId) =>
        get().investigationOrders.filter(
          (o) => o.linkedTo.type === linkedType && o.linkedTo.id === linkedId,
        ),

      getInvestigationsForPatient: (patientName) =>
        get().investigationOrders.filter((o) => o.patientName === patientName),

      // ─── Doctor History ───────────────────────────────────
      addToHistory: (category, items) =>
        set((s) => {
          const existing = new Set(s.doctorHistory[category]);
          items.forEach((item) => {
            if (item.trim()) existing.add(item.trim());
          });
          return {
            doctorHistory: {
              ...s.doctorHistory,
              [category]: Array.from(existing).slice(-500),
            },
          };
        }),

      searchHistory: (category, prefix) => {
        if (!prefix || prefix.length < 2) return [];
        const lower = prefix.toLowerCase();
        return get()
          .doctorHistory[category].filter((item) => item.toLowerCase().includes(lower))
          .slice(0, 10);
      },
    }),
    {
      name: 'caseconnect-cases',
    },
  ),
);
