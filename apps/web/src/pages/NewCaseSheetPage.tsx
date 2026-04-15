import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Mic,
  MicOff,
  ChevronRight,
  Heart,
  Brain,
  Bone,
  Eye,
  Ear,
  Wind,
  Stethoscope,
  Pill,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  User,
  Search,
  X,
  Activity,
  Languages,
  Gauge,
  Save,
  FileText,
  Loader2,
  GitBranch,
  ClipboardList,
  Syringe,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { INDIAN_BRAND_NAMES_SORTED, matchBrandHints } from '@/lib/indianDrugBrands';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import {
  analyzeSymptoms,
  analyzeSymptomsAI,
  generateClinicalNote,
  generateDischargeSummary,
  generateCasesheetFromNotes,
  type AIEntities,
  type ClinicalNote,
  type DischargeSummaryResult,
  type CasesheetAIResult,
} from '@/lib/medicalAI';
import { getModelName } from '@/lib/openrouter';
import {
  useCaseStore,
  type InvestigationOrder,
  type Prescription,
  type InvestigationEntry,
  type CaseSheetType,
  type Visit,
  defaultCaseSheet,
  autopopulateFromVisit,
} from '@/stores/case.store';
import { useAuthStore } from '@/stores/auth.store';
import { useHistoryAutocomplete } from '@/hooks/useHistoryAutocomplete';

type RecordingState = 'idle' | 'recording' | 'processing';

interface VitalInput {
  label: string;
  unit: string;
  value: string;
  placeholder: string;
}

const CASESHEET_TYPES: { id: CaseSheetType; label: string; description: string; icon: typeof FileText; visitType: 'OPD' | 'IPD' | 'both' }[] = [
  { id: 'opd-casesheet', label: 'OPD Casesheet', description: 'Outpatient consultation', icon: ClipboardList, visitType: 'OPD' },
  { id: 'admission-notes', label: 'Admission Notes', description: 'IPD admission documentation', icon: FileText, visitType: 'IPD' },
  { id: 'progress-records', label: 'Progress Records', description: 'Daily progress during stay', icon: Activity, visitType: 'IPD' },
  { id: 'doctors-orders', label: "Doctor's Orders", description: 'Prescriptions & investigations', icon: Syringe, visitType: 'IPD' },
  { id: 'cross-referral', label: 'Cross Referral', description: 'Specialist consultation request', icon: ArrowRight, visitType: 'both' },
  { id: 'operation-theater-notes', label: 'OT Notes', description: 'Operation theater documentation', icon: Syringe, visitType: 'IPD' },
  { id: 'doctors-handover-notes', label: 'Handover Notes', description: 'Transfer of care documentation', icon: GitBranch, visitType: 'IPD' },
  { id: 'discharge-summary', label: 'Discharge Summary', description: 'Comprehensive discharge documentation', icon: Layers, visitType: 'IPD' },
];

const EMPTY_PRESCRIPTION: Prescription = {
  id: 0,
  route: 'Oral',
  form: 'Tablet',
  drug: '',
  genericName: '',
  frequency: '',
  strength: '',
  duration: '',
  instructions: '',
};

const DEPARTMENTS = [
  { name: 'Cardiology', icon: Heart, color: 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' },
  { name: 'Neurology', icon: Brain, color: 'bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100' },
  { name: 'Orthopedics', icon: Bone, color: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' },
  { name: 'Pulmonology', icon: Wind, color: 'bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100' },
  { name: 'Ophthalmology', icon: Eye, color: 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100' },
  { name: 'ENT', icon: Ear, color: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100' },
  { name: 'General Medicine', icon: Stethoscope, color: 'bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100' },
  { name: 'Dermatology', icon: Activity, color: 'bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100' },
];

const MOCK_PATIENTS = [
  { name: 'Rajesh Sharma', mrn: 'MRN-00451', age: 58, gender: 'M' },
  { name: 'Priya Nair', mrn: 'MRN-00672', age: 34, gender: 'F' },
  { name: 'Amit Patel', mrn: 'MRN-00893', age: 45, gender: 'M' },
  { name: 'Deepa Krishnan', mrn: 'MRN-01024', age: 62, gender: 'F' },
  { name: 'Sunita Gupta', mrn: 'MRN-01287', age: 28, gender: 'F' },
];

const INITIAL_PRESCRIPTIONS: Prescription[] = [
  { ...EMPTY_PRESCRIPTION, id: 1 },
];

const MOCK_TRANSCRIPT = `Patient presents with complaints of chest pain, radiating to the left arm, onset approximately 2 hours ago. Pain is described as squeezing in nature, severity 7 out of 10. Associated symptoms include diaphoresis and mild shortness of breath. No history of nausea or vomiting. Patient has a known history of hypertension, currently on telma 40 and glycomet 500 once daily — also taking ecosprin 150. Family history significant for coronary artery disease — father had MI at age 55.`;

const URGENCY_LABELS: Record<AIEntities['triageUrgency'], { label: string; cls: string }> = {
  low: { label: 'Low', cls: 'bg-blue-100 text-blue-700' },
  moderate: { label: 'Moderate', cls: 'bg-amber-100 text-amber-700' },
  high: { label: 'High', cls: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critical', cls: 'bg-red-100 text-red-700 animate-pulse' },
};

const PREVIOUS_RECORDS = [
  { date: '15 Nov 2024', complaint: 'Follow-up for hypertension', doctor: 'Dr. Ananya Iyer' },
  { date: '22 Sep 2024', complaint: 'Routine health checkup', doctor: 'Dr. Vikram Joshi' },
  { date: '10 Jul 2024', complaint: 'Upper respiratory tract infection', doctor: 'Dr. Suresh Menon' },
];

function WaveformBar({ active, index }: { active: boolean; index: number }) {
  return (
    <motion.div
      className={`w-1 rounded-full ${active ? 'bg-emerald-400' : 'bg-white/10'}`}
      animate={
        active
          ? {
              height: [12, 28 + Math.random() * 20, 8, 24 + Math.random() * 16, 12],
            }
          : { height: 12 }
      }
      transition={
        active
          ? { duration: 0.8 + Math.random() * 0.4, repeat: Infinity, delay: index * 0.05 }
          : { duration: 0.3 }
      }
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">{children}</h3>;
}

export default function NewCaseSheetPage() {
  const navigate = useNavigate();
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [timer, setTimer] = useState(0);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<typeof MOCK_PATIENTS[0] | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [complaints, setComplaints] = useState<string[]>([]);
  const [complaintInput, setComplaintInput] = useState('');
  const [hpi, setHpi] = useState('');
  const [pmh, setPmh] = useState('');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(INITIAL_PRESCRIPTIONS);
  const [procedures, setProcedures] = useState<string[]>([]);
  const [procedureInput, setProcedureInput] = useState('');
  const [instructions, setInstructions] = useState('');
  const [diagnoses, setDiagnoses] = useState<string[]>([]);
  const [diagnosisInput, setDiagnosisInput] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [vitals, setVitals] = useState<VitalInput[]>([
    { label: 'Temp', unit: '°F', value: '', placeholder: '98.6' },
    { label: 'Pulse', unit: 'bpm', value: '', placeholder: '72' },
    { label: 'BP Sys', unit: 'mmHg', value: '', placeholder: '120' },
    { label: 'BP Dia', unit: 'mmHg', value: '', placeholder: '80' },
    { label: 'RR', unit: '/min', value: '', placeholder: '16' },
    { label: 'SpO2', unit: '%', value: '', placeholder: '98' },
  ]);
  const [generalCondition, setGeneralCondition] = useState('');
  const [checkboxes, setCheckboxes] = useState({
    pallor: false,
    icterus: false,
    cyanosis: false,
    clubbing: false,
    edema: false,
  });
  const [expandPrevRecords, setExpandPrevRecords] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'english' | 'hinglish' | 'hindi'>('hinglish');
  const [llmRefined, setLlmRefined] = useState(false);
  const [savingAs, setSavingAs] = useState<'draft' | 'complete' | null>(null);
  const [orderedInvestigations, setOrderedInvestigations] = useState<{ id: string; name: string; reasoning: string }[]>([]);
  const [investigationInput, setInvestigationInput] = useState('');
  const [caseSheetStatus, setCaseSheetStatus] = useState<'draft' | 'in-progress' | 'review' | 'complete'>('draft');
  const [savedCaseId, setSavedCaseId] = useState<string | null>(null);

  // Casesheet type & visit management
  const [casesheetType, setCasesheetType] = useState<CaseSheetType>('opd-casesheet');
  const [showTypeSelector, setShowTypeSelector] = useState(true);
  const [activeVisitId, setActiveVisitId] = useState<string | null>(null);
  const [showVisitPanel, setShowVisitPanel] = useState(false);

  // Extended clinical fields (Axone-level)
  const [surgicalHistory, setSurgicalHistory] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');
  const [personalHistory, setPersonalHistory] = useState('');
  const [socialHistory, setSocialHistory] = useState('');
  const [allergies, setAllergies] = useState('');
  const [systemicExamination, setSystemicExamination] = useState('');
  const [carePlan, setCarePlan] = useState('');
  const [painAssessment, setPainAssessment] = useState('');

  // Referral fields
  const [referralDepartment, setReferralDepartment] = useState('');
  const [reasonForReferral, setReasonForReferral] = useState('');

  // OT fields
  const [surgeonName, setSurgeonName] = useState('');
  const [anesthesiologist, setAnesthesiologist] = useState('');
  const [intraoperativeDetails, setIntraoperativeDetails] = useState('');

  // AI casesheet generation from notes
  const [roughNotes, setRoughNotes] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  const addCaseSheet = useCaseStore((s) => s.addCaseSheet);
  const updateCaseSheetFn = useCaseStore((s) => s.updateCaseSheet);
  const updateCaseSheetStatusFn = useCaseStore((s) => s.updateCaseSheetStatus);
  const addInvestigationOrder = useCaseStore((s) => s.addInvestigationOrder);
  const addToHistory = useCaseStore((s) => s.addToHistory);
  const addVisit = useCaseStore((s) => s.addVisit);
  const linkCasesheetToVisit = useCaseStore((s) => s.linkCasesheetToVisit);
  const allVisits = useCaseStore((s) => s.visits);
  const allCaseSheets = useCaseStore((s) => s.caseSheets);
  const user = useAuthStore((s) => s.user);
  const symptomAC = useHistoryAutocomplete({ category: 'symptoms' });
  const diagnosisAC = useHistoryAutocomplete({ category: 'diagnoses' });
  const medAC = useHistoryAutocomplete({ category: 'medications' });

  const [dischargeSummary, setDischargeSummary] = useState<DischargeSummaryResult | null>(null);
  const [dischargeLoading, setDischargeLoading] = useState(false);
  const [showDischargePanel, setShowDischargePanel] = useState(false);

  const patientVisits = useMemo(() => {
    if (!selectedPatient) return [];
    return allVisits.filter((v) => v.patientName === selectedPatient.name);
  }, [selectedPatient, allVisits]);

  const activeVisit = useMemo(() => {
    return activeVisitId ? allVisits.find((v) => v.id === activeVisitId) : undefined;
  }, [activeVisitId, allVisits]);

  const visitCasesheets = useMemo(() => {
    if (!activeVisitId) return [];
    return allCaseSheets.filter((cs) => cs.visitId === activeVisitId);
  }, [activeVisitId, allCaseSheets]);

  const isIPDType = casesheetType !== 'opd-casesheet';
  const showExtendedHistory = ['opd-casesheet', 'admission-notes', 'discharge-summary'].includes(casesheetType);
  const showReferralFields = casesheetType === 'cross-referral';
  const showOTFields = casesheetType === 'operation-theater-notes';
  const showCarePlan = ['admission-notes', 'progress-records'].includes(casesheetType);

  const handleCreateVisit = useCallback(() => {
    if (!selectedPatient) {
      toast.error('Select a patient first');
      return;
    }
    const visitId = `VIS-${Date.now()}`;
    const visit: Visit = {
      id: visitId,
      patientId: selectedPatient.mrn,
      patientName: selectedPatient.name,
      visitType: isIPDType ? 'IPD' : 'OPD',
      department: selectedDept || '',
      practitioner: user?.name || 'Doctor',
      patientStatus: isIPDType ? 'admitted' : 'in-progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      casesheetIds: [],
    };
    addVisit(visit);
    setActiveVisitId(visitId);
    toast.success(`${isIPDType ? 'IPD' : 'OPD'} visit created`);
  }, [selectedPatient, isIPDType, selectedDept, user, addVisit]);

  const handleGenerateFromNotes = useCallback(async () => {
    if (!roughNotes.trim()) {
      toast.error('Enter some clinical notes first');
      return;
    }
    setAiGenerating(true);
    try {
      let autopopulated: Record<string, any> | undefined;
      if (activeVisit) {
        autopopulated = autopopulateFromVisit(activeVisit, allCaseSheets, casesheetType);
      }
      const result = await generateCasesheetFromNotes(casesheetType, roughNotes, autopopulated);
      if (result.modelUsed === 'retry' || result.modelUsed === 'offline') {
        toast.error('AI generation failed. Please try again.');
        return;
      }

      const f = result.fields;
      if (f.chiefComplaints) {
        const cc = typeof f.chiefComplaints === 'string' ? f.chiefComplaints.split(',').map((s: string) => s.trim()) : f.chiefComplaints;
        setComplaints((prev) => [...new Set([...prev, ...cc])]);
      }
      if (f.historyOfPresentIllness) setHpi(f.historyOfPresentIllness);
      if (f.pastHistory) setPmh(f.pastHistory);
      if (f.surgicalHistory) setSurgicalHistory(f.surgicalHistory);
      if (f.familyHistory) setFamilyHistory(f.familyHistory);
      if (f.personalHistory) setPersonalHistory(f.personalHistory);
      if (f.socialHistory) setSocialHistory(f.socialHistory);
      if (f.allergies) setAllergies(f.allergies);
      if (f.generalExamination) setGeneralCondition(f.generalExamination);
      if (f.systemicExamination) setSystemicExamination(f.systemicExamination);
      if (f.carePlan) setCarePlan(f.carePlan);
      if (f.painAssessment) setPainAssessment(f.painAssessment);
      if (f.plan) setInstructions(f.plan);
      if (f.advice) setInstructions((prev) => prev ? `${prev}\n${f.advice}` : f.advice);
      if (f.provisionalDiagnosis) {
        setDiagnoses((prev) => [...new Set([...prev, ...(f.provisionalDiagnosis || [])])]);
      }
      if (f.finalDiagnosis) {
        setDiagnoses((prev) => [...new Set([...prev, f.finalDiagnosis])]);
      }
      if (f.referralDepartment) setReferralDepartment(f.referralDepartment);
      if (f.reasonForReferral) setReasonForReferral(f.reasonForReferral);
      if (f.surgeon) setSurgeonName(f.surgeon);
      if (f.anesthesiologist) setAnesthesiologist(f.anesthesiologist);
      if (f.intraoperativeDetails) setIntraoperativeDetails(f.intraoperativeDetails);

      if (result.prescriptions.length > 0) {
        setPrescriptions(result.prescriptions.map((p, i) => ({ ...p, id: Date.now() + i })));
      }
      if (result.investigations.length > 0) {
        setOrderedInvestigations(result.investigations.map((inv) => ({
          id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: inv.name,
          reasoning: inv.remarks || '',
        })));
      }

      toast.success(`AI generated ${CASESHEET_TYPES.find((t) => t.id === casesheetType)?.label || 'casesheet'} from your notes`);
    } catch (err) {
      toast.error('AI generation failed. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  }, [roughNotes, casesheetType, activeVisit, allCaseSheets]);

  const speechLangMap = { english: 'en-IN' as const, hinglish: 'en-IN' as const, hindi: 'hi-IN' as const };
  const speech = useSpeechRecognition({
    lang: speechLangMap[voiceLang],
    onResult: (text, isFinal) => {
      setTranscriptText(text);
      if (isFinal) setShowTranscript(true);
    },
    onError: (err) => toast.error(`Voice recognition error: ${err}`),
  });

  const asrConfidence = speech.confidence || (speech.isListening ? 78 : 0);

  const [aiEntities, setAiEntities] = useState<AIEntities | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [expandedDx, setExpandedDx] = useState<string | null>(null);
  const [clinicalNote, setClinicalNote] = useState<ClinicalNote | null>(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const aiDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);

    const combined = [...complaints, hpi, transcriptText].join(' ').trim();
    if (combined.length < 3) {
      setAiEntities(null);
      return;
    }

    setAiLoading(true);
    aiDebounceRef.current = setTimeout(async () => {
      try {
        const result = await analyzeSymptomsAI(complaints, hpi, transcriptText);
        if (result.suggestedDiagnoses.length > 0 || result.symptoms.length > 0) {
          setAiEntities(result);
        }
      } catch {
        setAiEntities(analyzeSymptoms(complaints, hpi, transcriptText));
      } finally {
        setAiLoading(false);
      }
    }, 800);

    return () => {
      if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
    };
  }, [complaints, hpi, transcriptText]);

  const handleGenerateNote = useCallback(async () => {
    if (complaints.length === 0 && !hpi) {
      toast.error('Add complaints or HPI before generating documentation');
      return;
    }
    setNoteLoading(true);
    try {
      const vitalsMap: Record<string, string> = {};
      vitals.forEach((v) => { if (v.value) vitalsMap[v.label] = v.value; });

      const note = await generateClinicalNote({
        complaints,
        hpi,
        diagnoses: diagnoses.map((d: any) => d.name || d),
        medications: prescriptions.filter((p) => p.drug).map((p) => ({ name: p.drug, dosage: p.strength })),
        investigations: orderedInvestigations.map((inv) => inv.name),
        vitals: vitalsMap,
        pmh,
      });
      setClinicalNote(note);
      toast.success('Clinical documentation generated');
    } catch {
      toast.error('Failed to generate documentation');
    } finally {
      setNoteLoading(false);
    }
  }, [complaints, hpi, diagnoses, prescriptions, vitals, orderedInvestigations, pmh]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (recordingState === 'recording') {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [recordingState]);

  const toggleRecording = useCallback(() => {
    if (recordingState === 'idle') {
      setRecordingState('recording');
      setTimer(0);
      setTranscriptText('');
      setShowTranscript(false);
      setLlmRefined(false);
      speech.reset();
      speech.start();
    } else if (recordingState === 'recording') {
      speech.stop();
      setRecordingState('processing');
      setTimeout(() => {
        setRecordingState('idle');
        setLlmRefined(true);
        setShowTranscript(true);
      }, 1500);
    }
  }, [recordingState, speech]);

  const handleAutoFill = useCallback(() => {
    if (!aiEntities) {
      toast.error('Type complaints or record voice to generate AI suggestions');
      return;
    }
    if (aiEntities.symptoms.length > 0) {
      setComplaints((prev) => {
        const all = new Set([...prev, ...aiEntities.symptoms]);
        return Array.from(all);
      });
    }
    if (aiEntities.suggestedDiagnoses.length > 0) {
      setDiagnoses((prev) => {
        const all = new Set([...prev, ...aiEntities.suggestedDiagnoses.map((d) => `${d.icdCode} — ${d.name}`)]);
        return Array.from(all);
      });
    }
    if (aiEntities.suggestedPrescriptions && aiEntities.suggestedPrescriptions.length > 0) {
      setPrescriptions(
        aiEntities.suggestedPrescriptions.map((p, i) => ({ ...p, id: Date.now() + i })),
      );
    } else if (aiEntities.suggestedMedications.length > 0) {
      setPrescriptions(
        aiEntities.suggestedMedications.map((m, i) => ({
          ...EMPTY_PRESCRIPTION,
          id: Date.now() + i,
          drug: m.name,
          strength: m.dosage,
        })),
      );
    }
    if (aiEntities.suggestedInvestigations.length > 0) {
      setOrderedInvestigations((prev) => {
        const existing = new Set(prev.map((p) => p.name));
        const newOnes = aiEntities.suggestedInvestigations
          .filter((inv) => !existing.has(inv.name))
          .map((inv) => ({ id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: inv.name, reasoning: inv.reasoning }));
        return [...prev, ...newOnes];
      });
    }
    toast.success('AI suggestions applied to form');
  }, [aiEntities]);

  const handleSave = useCallback(
    async (mode: 'draft' | 'complete') => {
      setSavingAs(mode);
      const status = mode === 'complete' ? 'complete' as const : caseSheetStatus;
      const id = savedCaseId || `CS-${Date.now()}`;
      const now = new Date().toISOString();

      const caseData = defaultCaseSheet({
        id,
        casesheetType,
        visitId: activeVisitId || '',
        status,
        createdAt: now,
        updatedAt: now,
        department: selectedDept || '',
        patientName: selectedPatient?.name || '',
        patientMrn: selectedPatient?.mrn || '',
        patientAge: selectedPatient ? String(selectedPatient.age) : '',
        patientGender: selectedPatient?.gender || '',
        chiefComplaints: complaints.join(', '),
        complaints,
        historyOfPresentIllness: hpi,
        hpi,
        pastHistory: pmh,
        pmh,
        surgicalHistory,
        familyHistory,
        personalHistory,
        socialHistory,
        allergies,
        systemicExamination,
        generalCondition,
        vitals: vitals.map((v) => ({ label: v.label, value: v.value })),
        structuredVitals: vitals.filter((v) => v.value).map((v) => ({
          vital: v.label === 'Temp' ? 'temperature' as const
            : v.label === 'Pulse' ? 'pulseRate' as const
            : v.label === 'SpO2' ? 'spo2' as const
            : v.label === 'RR' ? 'respiratoryRate' as const
            : 'bloodPressure' as const,
          unit: v.unit,
          value: v.value,
        })),
        provisionalDiagnosis: diagnoses,
        diagnoses,
        prescriptions,
        medications: prescriptions.map((p) => ({
          id: p.id,
          name: p.drug,
          dosage: p.strength,
          route: p.route,
          frequency: p.frequency,
          duration: p.duration,
        })),
        investigations: orderedInvestigations.map((inv) => ({
          name: inv.name,
          frequency: 'Once',
          remarks: inv.reasoning,
          time: '',
          orderDate: now,
        })),
        procedures,
        instructions,
        plan: instructions,
        carePlan,
        painAssessment,
        referralDepartment,
        reasonForReferral,
        primaryReasonForReferral: reasonForReferral,
        surgeon: surgeonName,
        anesthesiologist,
        intraoperativeDetails,
        dailyNotes: [],
      });

      if (savedCaseId) {
        updateCaseSheetFn(id, { ...caseData, status });
      } else {
        addCaseSheet(caseData);
        setSavedCaseId(id);
      }

      if (activeVisitId) {
        linkCasesheetToVisit(activeVisitId, id);
      }

      orderedInvestigations.forEach((inv) => {
        addInvestigationOrder({
          id: inv.id,
          name: inv.name,
          reasoning: inv.reasoning,
          status: 'ordered',
          linkedTo: { type: 'casesheet', id },
          patientName: selectedPatient?.name || 'Unknown',
          orderedAt: now,
        });
      });

      addToHistory('symptoms', complaints);
      addToHistory('diagnoses', diagnoses);
      addToHistory('medications', prescriptions.filter((p) => p.drug).map((p) => p.drug));
      addToHistory('investigations', orderedInvestigations.map((inv) => inv.name));

      if (mode === 'complete') setCaseSheetStatus('complete');

      await new Promise((r) => setTimeout(r, 600));
      setSavingAs(null);
      toast.success(mode === 'draft' ? `Case sheet saved as ${status}` : 'Case sheet saved & completed');
      if (mode === 'complete') navigate(`/doctor/case-sheets/${id}`);
    },
    [navigate, caseSheetStatus, savedCaseId, casesheetType, activeVisitId, selectedDept, selectedPatient, complaints, hpi, pmh, surgicalHistory, familyHistory, personalHistory, socialHistory, allergies, systemicExamination, generalCondition, vitals, diagnoses, prescriptions, orderedInvestigations, procedures, instructions, carePlan, painAssessment, referralDepartment, reasonForReferral, surgeonName, anesthesiologist, intraoperativeDetails, addCaseSheet, updateCaseSheetFn, addInvestigationOrder, addToHistory, linkCasesheetToVisit],
  );

  const handleGenerateDischarge = useCallback(async () => {
    setDischargeLoading(true);
    setShowDischargePanel(true);
    try {
      const result = await generateDischargeSummary({
        patientName: selectedPatient?.name || '',
        age: selectedPatient ? String(selectedPatient.age) : '',
        gender: selectedPatient?.gender || '',
        diagnoses,
        medications: prescriptions.filter((p) => p.drug).map((p) => ({ name: p.drug, dosage: p.strength })),
        prescriptions: prescriptions.filter((p) => p.drug),
        complaints,
        hpi,
        procedures,
        dailyNotes: [],
        investigations: orderedInvestigations.map((inv) => ({ name: inv.name })),
        pastHistory: pmh,
        familyHistory,
        allergies,
        generalExamination: generalCondition,
        systemicExamination,
      });
      setDischargeSummary(result);
      if (savedCaseId && result.modelUsed !== 'retry') {
        updateCaseSheetFn(savedCaseId, { dischargeSummary: JSON.stringify(result) });
      }
    } catch {
      toast.error('Failed to generate discharge summary');
    } finally {
      setDischargeLoading(false);
    }
  }, [selectedPatient, diagnoses, prescriptions, complaints, hpi, procedures, orderedInvestigations, pmh, familyHistory, allergies, generalCondition, systemicExamination, savedCaseId, updateCaseSheetFn]);

  const handleStatusTransition = useCallback((newStatus: 'draft' | 'in-progress' | 'review' | 'complete') => {
    setCaseSheetStatus(newStatus);
    if (savedCaseId) {
      updateCaseSheetStatusFn(savedCaseId, newStatus);
      toast.success(`Status updated to ${newStatus}`);
    } else {
      toast.info(`Status set to ${newStatus} — save to persist`);
    }
  }, [savedCaseId, updateCaseSheetStatusFn]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const addComplaint = () => {
    if (complaintInput.trim() && !complaints.includes(complaintInput.trim())) {
      setComplaints([...complaints, complaintInput.trim()]);
      setComplaintInput('');
    }
  };

  const addDiagnosis = () => {
    if (diagnosisInput.trim() && !diagnoses.includes(diagnosisInput.trim())) {
      setDiagnoses([...diagnoses, diagnosisInput.trim()]);
      setDiagnosisInput('');
    }
  };

  const addProcedure = () => {
    if (procedureInput.trim() && !procedures.includes(procedureInput.trim())) {
      setProcedures([...procedures, procedureInput.trim()]);
      setProcedureInput('');
    }
  };

  const addPrescriptionRow = () => {
    setPrescriptions([...prescriptions, { ...EMPTY_PRESCRIPTION, id: Date.now() }]);
  };

  const removePrescription = (id: number) => {
    setPrescriptions(prescriptions.filter((p) => p.id !== id));
  };

  const updatePrescription = (id: number, field: keyof Prescription, value: string) => {
    setPrescriptions(prescriptions.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const updateVital = (index: number, value: string) => {
    setVitals(vitals.map((v, i) => (i === index ? { ...v, value } : v)));
  };

  const filteredPatients = MOCK_PATIENTS.filter(
    (p) =>
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.mrn.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const filledSections = [
    selectedDept,
    selectedPatient,
    complaints.length > 0,
    hpi,
    vitals.some((v) => v.value),
    diagnoses.length > 0,
    prescriptions.some((p) => p.drug),
    orderedInvestigations.length > 0,
  ].filter(Boolean).length;
  const totalSections = 8;
  const progressPct = Math.round((filledSections / totalSections) * 100);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link to="/doctor/case-sheets" className="rounded-xl p-2 text-gray-400 transition-all hover:bg-white hover:text-gray-600 hover:shadow-sm">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Link to="/doctor/case-sheets" className="hover:text-primary-600 transition-colors">Case Sheets</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-600 font-medium">New</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            New {CASESHEET_TYPES.find((t) => t.id === casesheetType)?.label || 'Case Sheet'}
          </h1>
        </div>
      </div>

      {/* Casesheet Type Selector */}
      <AnimatePresence>
        {showTypeSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary-600" />
                  <h3 className="text-sm font-bold text-gray-900">Casesheet Type</h3>
                </div>
                <button
                  onClick={() => setShowTypeSelector(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Collapse
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CASESHEET_TYPES.map((ct) => {
                  const Icon = ct.icon;
                  const isActive = casesheetType === ct.id;
                  return (
                    <button
                      key={ct.id}
                      onClick={() => { setCasesheetType(ct.id); setShowTypeSelector(false); }}
                      className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all ${
                        isActive
                          ? 'border-primary-500 bg-primary-50/60 shadow-sm'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                        <span className={`text-xs font-semibold ${isActive ? 'text-primary-700' : 'text-gray-700'}`}>{ct.label}</span>
                      </div>
                      <span className={`text-[10px] ${isActive ? 'text-primary-500' : 'text-gray-400'}`}>{ct.description}</span>
                      <span className={`text-[9px] font-bold uppercase ${ct.visitType === 'IPD' ? 'text-blue-500' : ct.visitType === 'OPD' ? 'text-emerald-500' : 'text-gray-400'}`}>
                        {ct.visitType}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Type Badge + Visit Info */}
      {!showTypeSelector && (
        <div className="mb-4 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowTypeSelector(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-primary-200 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition-colors"
          >
            <Layers className="h-3.5 w-3.5" />
            {CASESHEET_TYPES.find((t) => t.id === casesheetType)?.label || 'OPD Casesheet'}
            <span className="text-primary-400">Change</span>
          </button>
          {isIPDType && (
            <>
              {activeVisit ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  <GitBranch className="h-3.5 w-3.5" />
                  Visit: {activeVisit.id.slice(-6)} · {visitCasesheets.length} docs
                </span>
              ) : (
                <button
                  onClick={handleCreateVisit}
                  className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create IPD Visit
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* AI Generate from Rough Notes */}
      <div className="card mb-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-violet-50/60 to-purple-50/40 px-5 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-600" />
            <h3 className="text-sm font-bold text-gray-900">AI: Generate from Notes</h3>
          </div>
          <span className="text-[10px] text-violet-500 font-medium">{getModelName()}</span>
        </div>
        <div className="p-5">
          <p className="text-xs text-gray-500 mb-3">
            Paste or dictate rough clinical notes. AI will structure them into a complete {CASESHEET_TYPES.find((t) => t.id === casesheetType)?.label || 'casesheet'} with prescriptions, investigations, and all required fields.
            {activeVisit && ' Previous visit data will be autopopulated.'}
          </p>
          <textarea
            value={roughNotes}
            onChange={(e) => setRoughNotes(e.target.value)}
            rows={4}
            placeholder={`Type rough notes here... e.g. "Patient 45yo male with chest pain 2 days, radiating to left arm. BP 140/90. Known diabetic on metformin. Plan: ECG, troponin, aspirin 75mg OD, atorvastatin 40mg HS"`}
            className="input resize-none mb-3"
          />
          <button
            onClick={handleGenerateFromNotes}
            disabled={aiGenerating || !roughNotes.trim()}
            className="btn-primary inline-flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {aiGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {aiGenerating ? 'Generating...' : `Generate ${CASESHEET_TYPES.find((t) => t.id === casesheetType)?.label || 'Casesheet'}`}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 xl:flex-row">
        {/* LEFT PANEL */}
        <div className="flex-1 space-y-6 xl:max-w-[60%]">
          {/* Voice Recording Section */}
          <div className="card overflow-hidden">
            <div
              className="relative px-6 py-8 text-center"
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 70%, #064e3b 100%)',
              }}
            >
              {/* Subtle radial glow behind mic button */}
              <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-4">
                <div className="h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl" />
              </div>

              <div className="relative flex flex-col items-center">
                {/* Record Button */}
                <motion.button
                  onClick={toggleRecording}
                  className="relative"
                  whileTap={{ scale: 0.95 }}
                >
                  {recordingState === 'recording' && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full bg-red-500"
                        animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full bg-red-500"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                      />
                    </>
                  )}
                  <div
                    className={`relative flex h-20 w-20 items-center justify-center rounded-full ring-2 transition-all duration-300 ${
                      recordingState === 'recording'
                        ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/30 ring-red-400/30'
                        : recordingState === 'processing'
                          ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 ring-amber-400/30'
                          : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 ring-emerald-400/30 hover:shadow-xl hover:shadow-emerald-500/40'
                    }`}
                  >
                    {recordingState === 'processing' ? (
                      <motion.div
                        className="h-6 w-6 rounded-full border-2 border-white border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                    ) : recordingState === 'recording' ? (
                      <MicOff className="h-8 w-8 text-white" />
                    ) : (
                      <Mic className="h-8 w-8 text-white" />
                    )}
                  </div>
                </motion.button>

                {/* Timer */}
                {recordingState === 'recording' && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 font-mono text-2xl font-bold text-white"
                  >
                    {formatTimer(timer)}
                  </motion.p>
                )}

                {/* Waveform */}
                <div className="mt-4 flex h-8 items-center gap-[3px]">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <WaveformBar key={i} active={recordingState === 'recording'} index={i} />
                  ))}
                </div>

                {/* Status */}
                <p className="mt-3 text-sm text-gray-300">
                  {recordingState === 'idle' && 'Tap to start recording'}
                  {recordingState === 'recording' && 'Recording... Tap to stop'}
                  {recordingState === 'processing' && 'Processing transcription...'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Voice command: Say &quot;New case [department]&quot; to begin
                </p>

                <div className="mt-5 w-full max-w-md space-y-3 text-left">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <Languages className="h-3.5 w-3.5" />
                    ASR language
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {(
                      [
                        { id: 'english' as const, label: 'English' },
                        { id: 'hinglish' as const, label: 'Hinglish' },
                        { id: 'hindi' as const, label: 'Hindi' },
                      ]
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setVoiceLang(opt.id)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                          voiceLang === opt.id
                            ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md shadow-emerald-500/20'
                            : 'bg-white/[0.06] text-gray-300 ring-1 ring-white/10 hover:bg-white/[0.1] hover:ring-white/20'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] leading-snug text-gray-500">
                    Hinglish / Hindi: lower raw ASR accuracy expected — enable <strong>LLM post-processing</strong>{' '}
                    (GPT-4o-class) after Whisper for code-switching & drug brands.
                  </p>
                  <p className="text-[11px] text-gray-500">
                    <strong>Speaker diarization</strong> (demo): Doctor channel highlighted · Patient channel muted in
                    UI.
                  </p>
                </div>
              </div>
            </div>

            {/* Live Transcription */}
            <AnimatePresence>
              {showTranscript && transcriptText && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white px-6 py-4 dark:border-gray-800 dark:from-gray-900/80 dark:to-gray-900/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
                      Live Transcription
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                      <Gauge className="h-3.5 w-3.5 text-primary-600" />
                      ASR confidence {asrConfidence}%
                    </div>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200/80 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-emerald-500 transition-all duration-300 shadow-sm shadow-emerald-500/20"
                      style={{ width: `${asrConfidence}%` }}
                    />
                  </div>
                  {recordingState === 'processing' && (
                    <p className="mt-2 flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                      <Sparkles className="h-3.5 w-3.5" />
                      LLM post-processing: normalizing Hinglish + Indian drug dictionary…
                    </p>
                  )}
                  {llmRefined && recordingState === 'idle' && (
                    <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      ✓ LLM refinement applied · mapped brands to generics where confident
                    </p>
                  )}
                  <p className="mt-2 font-mono text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                    {transcriptText}
                    {recordingState === 'recording' && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="inline-block w-0.5 h-4 bg-primary-500 ml-0.5 align-middle"
                      />
                    )}
                  </p>
                  {matchBrandHints(transcriptText, 6).length > 0 && (
                    <div className="mt-3 rounded-xl border border-dashed border-primary-200 bg-white/80 p-3 text-xs dark:border-primary-900 dark:bg-gray-950/60">
                      <p className="font-semibold text-primary-800 dark:text-primary-200">Indian brand hints</p>
                      <ul className="mt-1 space-y-1 text-gray-600 dark:text-gray-300">
                        {matchBrandHints(transcriptText, 6).map((h) => (
                          <li key={h.brand}>
                            <span className="font-mono font-semibold">{h.brand}</span> → {h.genericHint}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <details className="mt-3 text-[11px] text-gray-500">
                    <summary className="cursor-pointer font-semibold text-gray-600 dark:text-gray-300">
                      Expanded brand dictionary ({INDIAN_BRAND_NAMES_SORTED.length} entries)
                    </summary>
                    <p className="mt-1 max-h-24 overflow-y-auto font-mono text-[10px] leading-relaxed">
                      {INDIAN_BRAND_NAMES_SORTED.slice(0, 80).join(', ')}
                      …
                    </p>
                  </details>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Department Selector */}
          <div className="card p-6">
            <SectionLabel>Department</SectionLabel>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DEPARTMENTS.map((dept) => {
                const Icon = dept.icon;
                const isSelected = selectedDept === dept.name;
                return (
                  <motion.button
                    key={dept.name}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedDept(isSelected ? null : dept.name)}
                    className={`flex flex-col items-center gap-2.5 rounded-2xl border-2 p-4 transition-all duration-200 ${
                      isSelected
                        ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-emerald-50 shadow-md shadow-primary-500/10 ring-1 ring-primary-400/20'
                        : `border-transparent ${dept.color} hover:shadow-sm`
                    }`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                      isSelected
                        ? 'bg-gradient-to-br from-primary-500 to-emerald-500 text-white shadow-sm'
                        : ''
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`text-xs font-semibold ${isSelected ? 'text-primary-700' : ''}`}>{dept.name}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Patient Search */}
          <div className="card p-6">
            <SectionLabel>Patient</SectionLabel>
            {selectedPatient ? (
              <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-primary-50 to-emerald-50 border border-primary-200/60 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-emerald-500 text-white shadow-sm">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedPatient.name}</p>
                    <p className="text-xs text-gray-500">{selectedPatient.mrn} · {selectedPatient.age}y · {selectedPatient.gender}</p>
                  </div>
                </div>
                <button onClick={() => { setSelectedPatient(null); setPatientSearch(''); }} className="rounded-xl p-2 text-gray-400 transition-all hover:bg-white hover:text-gray-600 hover:shadow-sm">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient name or MRN..."
                  value={patientSearch}
                  onChange={(e) => { setPatientSearch(e.target.value); setShowPatientDropdown(true); }}
                  onFocus={() => setShowPatientDropdown(true)}
                  className="input pl-10"
                />
                <AnimatePresence>
                  {showPatientDropdown && patientSearch && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="card-glass absolute left-0 right-0 top-full z-10 mt-1.5 overflow-hidden rounded-2xl shadow-xl"
                    >
                      {filteredPatients.map((p) => (
                        <button
                          key={p.mrn}
                          onClick={() => { setSelectedPatient(p); setShowPatientDropdown(false); setPatientSearch(''); }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-all hover:bg-emerald-50/50"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.mrn} · {p.age}y · {p.gender}</p>
                          </div>
                        </button>
                      ))}
                      {filteredPatients.length === 0 && (
                        <p className="px-4 py-3 text-sm text-gray-400">No patients found</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Chief Complaints */}
          <div className="card p-6">
            <SectionLabel>Chief Complaints</SectionLabel>
            <div className="flex flex-wrap gap-2 mb-3">
              {complaints.map((c) => (
                <span key={c} className="badge-emerald inline-flex items-center gap-1.5">
                  {c}
                  <button onClick={() => setComplaints(complaints.filter((x) => x !== c))} className="rounded-full p-0.5 hover:bg-emerald-200/50 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Type complaint and press Enter..."
                  value={complaintInput}
                  onChange={(e) => { setComplaintInput(e.target.value); symptomAC.handleChange(e.target.value); }}
                  onKeyDown={(e) => {
                    symptomAC.handleKeyDown(e);
                    if (e.key === 'Enter' && symptomAC.selectedIndex < 0) { e.preventDefault(); addComplaint(); }
                  }}
                  onBlur={symptomAC.handleBlur}
                  onFocus={symptomAC.handleFocus}
                  className="input w-full"
                />
                {symptomAC.showSuggestions && symptomAC.suggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200/80 bg-white/95 shadow-lg backdrop-blur-xl max-h-40 overflow-auto">
                    {symptomAC.suggestions.map((s, i) => (
                      <button
                        key={s}
                        onMouseDown={() => { setComplaintInput(s); symptomAC.handleSelect(s); }}
                        className={`block w-full px-3 py-2 text-left text-sm transition-colors ${i === symptomAC.selectedIndex ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={addComplaint} className="btn-secondary px-3">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* History of Present Illness & Past Medical History */}
          <div className="card p-6 space-y-5">
            <div>
              <SectionLabel>History of Present Illness</SectionLabel>
              <textarea
                value={hpi}
                onChange={(e) => setHpi(e.target.value)}
                rows={4}
                placeholder="Describe the presenting illness in detail..."
                className="input resize-none"
              />
            </div>
            <div>
              <SectionLabel>Past Medical History</SectionLabel>
              <textarea
                value={pmh}
                onChange={(e) => setPmh(e.target.value)}
                rows={3}
                placeholder="Known conditions, surgeries, allergies..."
                className="input resize-none"
              />
            </div>
          </div>

          {/* Extended History (Axone-level documentation) */}
          {showExtendedHistory && (
            <div className="card p-6 space-y-5">
              <SectionLabel>Comprehensive History</SectionLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500">Surgical History</label>
                  <textarea value={surgicalHistory} onChange={(e) => setSurgicalHistory(e.target.value)} rows={2} placeholder="Previous surgeries, dates..." className="input resize-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500">Family History</label>
                  <textarea value={familyHistory} onChange={(e) => setFamilyHistory(e.target.value)} rows={2} placeholder="DM, HTN, CAD, cancer in family..." className="input resize-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500">Personal History</label>
                  <textarea value={personalHistory} onChange={(e) => setPersonalHistory(e.target.value)} rows={2} placeholder="Smoking, alcohol, diet, exercise..." className="input resize-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500">Allergies</label>
                  <textarea value={allergies} onChange={(e) => setAllergies(e.target.value)} rows={2} placeholder="Drug allergies, food allergies..." className="input resize-none" />
                </div>
              </div>
            </div>
          )}

          {/* Type-specific fields */}
          {showCarePlan && (
            <div className="card p-6 space-y-5">
              <SectionLabel>{casesheetType === 'admission-notes' ? 'Admission Details' : 'Progress Details'}</SectionLabel>
              {casesheetType === 'admission-notes' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500">Pain Assessment</label>
                  <input value={painAssessment} onChange={(e) => setPainAssessment(e.target.value)} placeholder="Pain score, location, type..." className="input" />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500">Care Plan</label>
                <textarea value={carePlan} onChange={(e) => setCarePlan(e.target.value)} rows={3} placeholder="Treatment plan, monitoring, nursing orders..." className="input resize-none" />
              </div>
            </div>
          )}

          {showReferralFields && (
            <div className="card p-6 space-y-4">
              <SectionLabel>Cross Referral Details</SectionLabel>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500">Referral Department</label>
                <input value={referralDepartment} onChange={(e) => setReferralDepartment(e.target.value)} placeholder="e.g. Nephrology, Cardiology..." className="input" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500">Reason for Referral</label>
                <textarea value={reasonForReferral} onChange={(e) => setReasonForReferral(e.target.value)} rows={3} placeholder="Clinical reasoning for referral..." className="input resize-none" />
              </div>
            </div>
          )}

          {showOTFields && (
            <div className="card p-6 space-y-4">
              <SectionLabel>Operation Theater Details</SectionLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500">Surgeon</label>
                  <input value={surgeonName} onChange={(e) => setSurgeonName(e.target.value)} placeholder="Primary surgeon" className="input" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500">Anesthesiologist</label>
                  <input value={anesthesiologist} onChange={(e) => setAnesthesiologist(e.target.value)} placeholder="Anesthesiologist name" className="input" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500">Intraoperative Details</label>
                <textarea value={intraoperativeDetails} onChange={(e) => setIntraoperativeDetails(e.target.value)} rows={4} placeholder="Detailed operative findings and procedure..." className="input resize-none" />
              </div>
            </div>
          )}

          {/* Systemic Examination */}
          {(showExtendedHistory || casesheetType === 'progress-records') && (
            <div className="card p-6">
              <SectionLabel>Systemic Examination</SectionLabel>
              <textarea
                value={systemicExamination}
                onChange={(e) => setSystemicExamination(e.target.value)}
                rows={4}
                placeholder="CVS: S1 S2 heard, no murmurs&#10;RS: Clear bilateral air entry&#10;PA: Soft, non-tender&#10;CNS: Conscious, oriented, no focal deficit"
                className="input resize-none"
              />
            </div>
          )}

          {/* General Examination */}
          <div className="card p-6 space-y-5">
            <SectionLabel>General Examination</SectionLabel>

            {/* Vitals Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {vitals.map((v, i) => (
                <div key={v.label}>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500">{v.label}</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={v.value}
                      onChange={(e) => updateVital(i, e.target.value)}
                      placeholder={v.placeholder}
                      className="input pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">{v.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* General Condition */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">General Condition</label>
              <select value={generalCondition} onChange={(e) => setGeneralCondition(e.target.value)} className="input">
                <option value="">Select condition</option>
                <option value="conscious">Conscious & Oriented</option>
                <option value="drowsy">Drowsy</option>
                <option value="unconscious">Unconscious</option>
                <option value="irritable">Irritable</option>
              </select>
            </div>

            {/* Quick Checkboxes */}
            <div className="flex flex-wrap gap-4">
              {(Object.keys(checkboxes) as (keyof typeof checkboxes)[]).map((key) => (
                <label key={key} className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={checkboxes[key]}
                    onChange={() => setCheckboxes({ ...checkboxes, [key]: !checkboxes[key] })}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="capitalize">{key}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Diagnosis */}
          <div className="card p-6">
            <SectionLabel>Diagnosis</SectionLabel>
            <div className="flex flex-wrap gap-2 mb-3">
              {diagnoses.map((d) => (
                <span key={d} className="badge-red inline-flex items-center gap-1.5">
                  {d}
                  <button onClick={() => setDiagnoses(diagnoses.filter((x) => x !== d))} className="rounded-full p-0.5 hover:bg-red-200/50 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search ICD-10 codes or type diagnosis..."
                  value={diagnosisInput}
                  onChange={(e) => { setDiagnosisInput(e.target.value); diagnosisAC.handleChange(e.target.value); }}
                  onKeyDown={(e) => {
                    diagnosisAC.handleKeyDown(e);
                    if (e.key === 'Enter' && diagnosisAC.selectedIndex < 0) { e.preventDefault(); addDiagnosis(); }
                  }}
                  onBlur={diagnosisAC.handleBlur}
                  onFocus={diagnosisAC.handleFocus}
                  className="input w-full"
                />
                {diagnosisAC.showSuggestions && diagnosisAC.suggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200/80 bg-white/95 shadow-lg backdrop-blur-xl max-h-40 overflow-auto">
                    {diagnosisAC.suggestions.map((s, i) => (
                      <button
                        key={s}
                        onMouseDown={() => { setDiagnosisInput(s); diagnosisAC.handleSelect(s); }}
                        className={`block w-full px-3 py-2 text-left text-sm transition-colors ${i === diagnosisAC.selectedIndex ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={addDiagnosis} className="btn-secondary px-3">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Prescriptions — Full Schema */}
          <div className="card p-6 space-y-5">
            <SectionLabel>Prescriptions</SectionLabel>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 pr-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Drug</th>
                    <th className="pb-3 px-1 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Generic</th>
                    <th className="pb-3 px-1 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Strength</th>
                    <th className="pb-3 px-1 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Form</th>
                    <th className="pb-3 px-1 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Route</th>
                    <th className="pb-3 px-1 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Freq</th>
                    <th className="pb-3 px-1 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Duration</th>
                    <th className="pb-3 px-1 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Instructions</th>
                    <th className="pb-3 pl-1 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {prescriptions.map((rx) => (
                    <tr key={rx.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-2 pr-1">
                        <input value={rx.drug} onChange={(e) => updatePrescription(rx.id, 'drug', e.target.value)} placeholder="Drug name" className="input text-xs w-28" />
                      </td>
                      <td className="py-2 px-1">
                        <input value={rx.genericName} onChange={(e) => updatePrescription(rx.id, 'genericName', e.target.value)} placeholder="Generic" className="input text-xs w-24" />
                      </td>
                      <td className="py-2 px-1">
                        <input value={rx.strength} onChange={(e) => updatePrescription(rx.id, 'strength', e.target.value)} placeholder="500mg" className="input text-xs w-16" />
                      </td>
                      <td className="py-2 px-1">
                        <select value={rx.form} onChange={(e) => updatePrescription(rx.id, 'form', e.target.value)} className="input text-xs w-20">
                          <option>Tablet</option>
                          <option>Capsule</option>
                          <option>Syrup</option>
                          <option>Injection</option>
                          <option>Cream</option>
                          <option>Ointment</option>
                          <option>Drops</option>
                          <option>Inhaler</option>
                          <option>Patch</option>
                        </select>
                      </td>
                      <td className="py-2 px-1">
                        <select value={rx.route} onChange={(e) => updatePrescription(rx.id, 'route', e.target.value)} className="input text-xs w-16">
                          <option>Oral</option>
                          <option>IV</option>
                          <option>IM</option>
                          <option>SC</option>
                          <option>Topical</option>
                          <option>Inhaled</option>
                          <option>Sublingual</option>
                          <option>Rectal</option>
                        </select>
                      </td>
                      <td className="py-2 px-1">
                        <select value={rx.frequency} onChange={(e) => updatePrescription(rx.id, 'frequency', e.target.value)} className="input text-xs w-16">
                          <option value="">--</option>
                          <option>OD</option>
                          <option>BD</option>
                          <option>TDS</option>
                          <option>QID</option>
                          <option>HS</option>
                          <option>SOS</option>
                          <option>STAT</option>
                          <option>Weekly</option>
                        </select>
                      </td>
                      <td className="py-2 px-1">
                        <input value={rx.duration} onChange={(e) => updatePrescription(rx.id, 'duration', e.target.value)} placeholder="7 days" className="input text-xs w-16" />
                      </td>
                      <td className="py-2 px-1">
                        <input value={rx.instructions} onChange={(e) => updatePrescription(rx.id, 'instructions', e.target.value)} placeholder="After meals" className="input text-xs w-24" />
                      </td>
                      <td className="py-2 pl-1">
                        <button onClick={() => removePrescription(rx.id)} className="rounded-xl p-1.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={addPrescriptionRow} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
              <Plus className="h-4 w-4" />
              Add prescription
            </button>

            {/* Procedures */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Procedures</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {procedures.map((p) => (
                  <span key={p} className="badge-violet inline-flex items-center gap-1.5">
                    {p}
                    <button onClick={() => setProcedures(procedures.filter((x) => x !== p))} className="rounded-full p-0.5 hover:bg-violet-200/50 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add procedure..."
                  value={procedureInput}
                  onChange={(e) => setProcedureInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addProcedure())}
                  className="input flex-1"
                />
                <button onClick={addProcedure} className="btn-secondary px-3">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Instructions</h4>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                placeholder="Diet, activity restrictions, follow-up advice..."
                className="input resize-none"
              />
            </div>
          </div>

          {/* Investigation Orders */}
          <div className="card p-6 space-y-4">
            <SectionLabel>Investigation Orders</SectionLabel>
            {orderedInvestigations.length > 0 && (
              <div className="space-y-2">
                {orderedInvestigations.map((inv) => (
                  <div key={inv.id} className="flex items-start justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/30 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{inv.name}</p>
                      {inv.reasoning && <p className="mt-0.5 text-[11px] text-gray-500">{inv.reasoning}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">Ordered</span>
                      <button
                        onClick={() => setOrderedInvestigations((prev) => prev.filter((i) => i.id !== inv.id))}
                        className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add investigation (e.g. CBC, ECG, X-ray)..."
                value={investigationInput}
                onChange={(e) => setInvestigationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && investigationInput.trim()) {
                    e.preventDefault();
                    setOrderedInvestigations((prev) => [...prev, { id: `inv-${Date.now()}`, name: investigationInput.trim(), reasoning: '' }]);
                    setInvestigationInput('');
                  }
                }}
                className="input flex-1"
              />
              <button
                onClick={() => {
                  if (investigationInput.trim()) {
                    setOrderedInvestigations((prev) => [...prev, { id: `inv-${Date.now()}`, name: investigationInput.trim(), reasoning: '' }]);
                    setInvestigationInput('');
                  }
                }}
                className="btn-secondary px-3"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {orderedInvestigations.length === 0 && (
              <p className="text-xs text-gray-400">No investigations ordered yet. Use AI suggestions or add manually.</p>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-6 xl:w-[40%]">
          {/* AI Suggestions Panel */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-glass overflow-hidden"
          >
            <div
              className="flex items-center justify-between border-b border-white/10 px-5 py-3.5"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(168,85,247,0.08))' }}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-violet-900 dark:text-violet-100">AI Suggestions</h3>
              </div>
              {aiEntities && (
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${URGENCY_LABELS[aiEntities.triageUrgency].cls}`}>
                  {URGENCY_LABELS[aiEntities.triageUrgency].label} Priority
                </span>
              )}
            </div>

            {!aiEntities || aiEntities.suggestedDiagnoses.length === 0 ? (
              <div className="p-6 text-center">
                {aiLoading ? (
                  <>
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-400" />
                    <p className="mt-2 text-sm font-medium text-gray-500">Analyzing with {getModelName()}…</p>
                    <p className="mt-1 text-xs text-gray-400">AI is generating diagnoses, medications & investigations</p>
                  </>
                ) : (
                  <>
                    <Sparkles className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-2 text-sm font-medium text-gray-500">Start typing complaints or speak</p>
                    <p className="mt-1 text-xs text-gray-400">{getModelName()} will analyze symptoms and suggest diagnoses, medications & investigations</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4 p-5">
                {/* Suggested Diagnoses with Reasoning */}
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Differential Diagnoses
                  </p>
                  <div className="space-y-2">
                    {aiEntities.suggestedDiagnoses.map((dx) => (
                      <div key={dx.icdCode} className="overflow-hidden rounded-xl border border-gray-200/60">
                        <button
                          onClick={() => setExpandedDx(expandedDx === dx.icdCode ? null : dx.icdCode)}
                          className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-gray-50/50"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="shrink-0 rounded-md bg-red-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-600">
                              {dx.icdCode}
                            </span>
                            <span className="truncate text-xs font-semibold text-gray-800">{dx.name}</span>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                                style={{ width: `${dx.confidence}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-gray-500">{dx.confidence}%</span>
                          </div>
                        </button>
                        {expandedDx === dx.icdCode && (
                          <div className="border-t border-gray-100 bg-violet-50/30 px-3 py-2.5">
                            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-gray-600">
                              <Brain className="mt-0.5 h-3 w-3 shrink-0 text-violet-500" />
                              {dx.reasoning}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested Medications */}
                {aiEntities.suggestedMedications.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Suggested Medications
                    </p>
                    <div className="space-y-1.5">
                      {aiEntities.suggestedMedications.map((m) => (
                        <div key={m.name} className="group rounded-lg border border-gray-100 bg-white/50 px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-800">{m.name}</span>
                            <span className="text-[10px] text-gray-400">{m.dosage}</span>
                          </div>
                          <p className="mt-1 text-[10px] leading-snug text-gray-400">{m.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Investigations */}
                {aiEntities.suggestedInvestigations.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Recommended Investigations
                    </p>
                    <div className="space-y-1.5">
                      {aiEntities.suggestedInvestigations.map((inv) => {
                        const alreadyOrdered = orderedInvestigations.some((o) => o.name === inv.name);
                        return (
                          <div key={inv.name} className="flex items-start justify-between gap-2 rounded-lg border border-gray-100 bg-white/50 px-3 py-2">
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-gray-800">{inv.name}</span>
                              <p className="mt-0.5 text-[10px] text-gray-400">{inv.reasoning}</p>
                            </div>
                            <button
                              onClick={() => {
                                if (!alreadyOrdered) {
                                  setOrderedInvestigations((prev) => [...prev, { id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, name: inv.name, reasoning: inv.reasoning }]);
                                  toast.success(`${inv.name} added to orders`);
                                }
                              }}
                              disabled={alreadyOrdered}
                              className={`shrink-0 rounded-lg p-1.5 transition-colors ${alreadyOrdered ? 'text-emerald-500' : 'text-gray-400 hover:bg-blue-50 hover:text-blue-600'}`}
                            >
                              {alreadyOrdered ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-violet-50/50 px-3 py-2 text-[10px] text-violet-700">
                  <strong>AI Model:</strong>{' '}
                  {aiLoading ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin text-violet-500" />
                      Analyzing with {getModelName()}…
                    </span>
                  ) : aiEntities?.modelUsed === 'offline' ? (
                    'Connecting to AI…'
                  ) : aiEntities?.modelUsed && aiEntities.modelUsed !== 'none' ? (
                    `${aiEntities.modelUsed} (via OpenRouter)`
                  ) : (
                    'Enter symptoms to activate AI'
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={handleAutoFill} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Apply to Form
                  </button>
                  <button
                    onClick={handleGenerateNote}
                    disabled={noteLoading}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                  >
                    {noteLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    Generate Note
                  </button>
                </div>

                {clinicalNote && clinicalNote.summary && (
                  <div className={`space-y-3 rounded-xl border p-4 ${clinicalNote.modelUsed === 'retry' ? 'border-amber-200/60 bg-amber-50/30' : 'border-violet-200/60 bg-violet-50/30'}`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${clinicalNote.modelUsed === 'retry' ? 'text-amber-600' : 'text-violet-600'}`}>
                        {clinicalNote.modelUsed === 'retry' ? 'AI Temporarily Busy' : 'AI Clinical Documentation'}
                      </p>
                      {clinicalNote.modelUsed !== 'retry' && clinicalNote.modelUsed !== 'offline' && (
                        <span className="text-[9px] text-violet-400">{clinicalNote.modelUsed}</span>
                      )}
                    </div>

                    {clinicalNote.summary && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500">Summary</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-700">{clinicalNote.summary}</p>
                      </div>
                    )}

                    {clinicalNote.hpiNarrative && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500">HPI Narrative</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-700">{clinicalNote.hpiNarrative}</p>
                        <button
                          onClick={() => { if (clinicalNote.hpiNarrative) setHpi(clinicalNote.hpiNarrative); toast.success('HPI applied'); }}
                          className="mt-1 text-[10px] font-semibold text-violet-600 hover:text-violet-700"
                        >
                          Apply to HPI field
                        </button>
                      </div>
                    )}

                    {clinicalNote.pastHistory && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500">Past History</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-700">{clinicalNote.pastHistory}</p>
                        <button
                          onClick={() => { if (clinicalNote.pastHistory) setPmh(clinicalNote.pastHistory); toast.success('PMH applied'); }}
                          className="mt-1 text-[10px] font-semibold text-violet-600 hover:text-violet-700"
                        >
                          Apply to PMH
                        </button>
                      </div>
                    )}

                    {clinicalNote.allergies && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500">Allergies</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-700">{clinicalNote.allergies}</p>
                      </div>
                    )}

                    {clinicalNote.generalExamination && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500">General Examination</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-700">{clinicalNote.generalExamination}</p>
                      </div>
                    )}

                    {clinicalNote.systemicExamination && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500">Systemic Examination</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-700">{clinicalNote.systemicExamination}</p>
                        <button
                          onClick={() => { if (clinicalNote.systemicExamination) setSystemicExamination(clinicalNote.systemicExamination); toast.success('Applied'); }}
                          className="mt-1 text-[10px] font-semibold text-violet-600 hover:text-violet-700"
                        >
                          Apply to form
                        </button>
                      </div>
                    )}

                    {clinicalNote.assessmentPlan && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500">Assessment & Plan</p>
                        <p className="mt-0.5 whitespace-pre-line text-xs leading-relaxed text-gray-700">{clinicalNote.assessmentPlan}</p>
                      </div>
                    )}

                    {clinicalNote.differentialDiagnosis && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500">Differential Diagnosis</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-700">{clinicalNote.differentialDiagnosis}</p>
                      </div>
                    )}

                    {clinicalNote.followUp && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500">Follow-up</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-700">{clinicalNote.followUp}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Template Preview */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-5"
          >
            <h3 className="mb-4 text-sm font-bold text-gray-900">Template Progress</h3>
            <div className="mb-4">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-gray-500">{progressPct}% complete</span>
                <span className="font-bold text-primary-700">{filledSections}/{totalSections} sections</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-200/50">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-sm shadow-emerald-500/20"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
            <div className="space-y-2">
              {[
                { name: 'Department', done: !!selectedDept },
                { name: 'Patient', done: !!selectedPatient },
                { name: 'Chief Complaints', done: complaints.length > 0 },
                { name: 'History of Present Illness', done: !!hpi },
                { name: 'General Examination', done: vitals.some((v) => v.value) },
                { name: 'Diagnosis', done: diagnoses.length > 0 },
                { name: 'Prescriptions', done: prescriptions.some((p) => p.drug) },
                { name: 'Investigations', done: orderedInvestigations.length > 0 },
              ].map((s) => (
                <div key={s.name} className="flex items-center gap-2.5 text-sm">
                  {s.done ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-emerald-500 shadow-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    </div>
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300" />
                  )}
                  <span className={s.done ? 'font-medium text-gray-900' : 'text-gray-400'}>{s.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Previous Records */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card overflow-hidden"
          >
            <button
              onClick={() => setExpandPrevRecords(!expandPrevRecords)}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50/50"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  <Clock className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Previous Records</h3>
              </div>
              <motion.div animate={{ rotate: expandPrevRecords ? 90 : 0 }}>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </motion.div>
            </button>
            <AnimatePresence>
              {expandPrevRecords && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-gray-100"
                >
                  <div className="divide-y divide-gray-50 px-5 py-2">
                    {PREVIOUS_RECORDS.map((rec) => (
                      <div key={rec.date} className="py-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">{rec.complaint}</p>
                          <span className="text-xs text-gray-400">{rec.date}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-400">{rec.doctor}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Discharge Summary Panel */}
      <AnimatePresence>
        {showDischargePanel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="card overflow-hidden border-emerald-200/60 mb-28"
          >
            <div className="flex items-center justify-between border-b border-emerald-100 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-gray-900">AI-Generated Discharge Summary</h3>
              </div>
              <div className="flex items-center gap-2">
                {dischargeSummary && dischargeSummary.modelUsed !== 'retry' && (
                  <span className="text-[10px] text-emerald-500">{dischargeSummary.modelUsed}</span>
                )}
                <button onClick={() => setShowDischargePanel(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {dischargeLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  <p className="ml-3 text-sm text-gray-500">Generating discharge summary from all admission data...</p>
                </div>
              ) : dischargeSummary ? (
                <>
                  {[
                    { title: 'Final Diagnosis', content: dischargeSummary.finalDiagnosis },
                    { title: 'Reason for Admission', content: dischargeSummary.reasonForAdmission },
                    { title: 'History of Present Illness', content: dischargeSummary.historyOfPresentIllness },
                    { title: 'In-Hospital Course', content: dischargeSummary.inHospitalCourse },
                    { title: 'Procedures', content: dischargeSummary.procedures },
                    { title: 'Administered Medications', content: dischargeSummary.administeredMedications },
                    { title: 'Patient Condition at Discharge', content: dischargeSummary.patientConditionAtDischarge },
                    { title: 'Advice', content: dischargeSummary.advice },
                    { title: 'Warning Signs', content: dischargeSummary.warningSignsToWatch },
                  ].filter((s) => s.content).map((section) => (
                    <div key={section.title}>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{section.title}</h4>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{section.content}</p>
                    </div>
                  ))}

                  {dischargeSummary.dischargePrescriptions && dischargeSummary.dischargePrescriptions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Discharge Prescriptions</h4>
                      <div className="space-y-1">
                        {dischargeSummary.dischargePrescriptions.map((rx, i) => (
                          <div key={i} className="rounded-lg bg-emerald-50/50 border border-emerald-100 px-3 py-2 text-xs">
                            <span className="font-semibold text-gray-800">{rx.drug}</span>
                            {rx.genericName && <span className="text-gray-500 ml-1">({rx.genericName})</span>}
                            <span className="text-gray-600 ml-2">{rx.strength} · {rx.form} · {rx.route} · {rx.frequency} · {rx.duration}</span>
                            {rx.instructions && <span className="text-gray-400 ml-1">— {rx.instructions}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {dischargeSummary.followUp && dischargeSummary.followUp.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Follow-up</h4>
                      <div className="space-y-1">
                        {dischargeSummary.followUp.map((fu, i) => (
                          <div key={i} className="text-xs text-gray-700">
                            {fu.practitionerName && <span className="font-semibold">{fu.practitionerName}: </span>}
                            {fu.remarks}
                            {fu.date && <span className="text-gray-400 ml-1">({new Date(fu.date).toLocaleDateString()})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {dischargeSummary.investigationsOrdered && dischargeSummary.investigationsOrdered.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Investigations</h4>
                      <div className="space-y-1">
                        {dischargeSummary.investigationsOrdered.map((inv, i) => (
                          <div key={i} className="text-xs text-gray-700">
                            <span className="font-semibold">{inv.name}:</span> {inv.result}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleGenerateDischarge}
                    className="btn-secondary inline-flex items-center gap-2 text-sm"
                  >
                    <Sparkles className="h-4 w-4" />
                    Regenerate
                  </button>
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Bottom Action Bar */}
      <div className="card-glass fixed inset-x-0 bottom-0 z-20 border-t border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link to="/doctor/case-sheets" className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-700">
              Cancel
            </Link>
            <div className="flex items-center gap-1.5 rounded-lg border border-gray-200/60 bg-white/50 px-1.5 py-1">
              {(['draft', 'in-progress', 'review', 'complete'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusTransition(s)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    caseSheetStatus === s
                      ? s === 'complete' ? 'bg-emerald-100 text-emerald-700' : s === 'review' ? 'bg-blue-100 text-blue-700' : s === 'in-progress' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-700'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateDischarge}
              disabled={dischargeLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-100 px-3 py-2 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-200 disabled:opacity-50"
            >
              {dischargeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Discharge Summary
            </button>
            <button
              onClick={() => handleSave('draft')}
              disabled={!!savingAs}
              className="btn-secondary inline-flex items-center gap-2 text-sm disabled:opacity-60"
            >
              {savingAs === 'draft' ? (
                <motion.div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </button>
            <button
              onClick={() => handleSave('complete')}
              disabled={!!savingAs}
              className="btn-primary inline-flex items-center gap-2 text-sm disabled:opacity-60"
            >
              {savingAs === 'complete' ? (
                <motion.div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Save & Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
