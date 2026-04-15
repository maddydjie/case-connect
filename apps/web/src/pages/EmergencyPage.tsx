import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Clock,
  Mic,
  MicOff,
  Siren,
  Ambulance,
  Footprints,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Wind,
  HeartPulse,
  Zap,
  Pill,
  Activity,
  Thermometer,
  Droplets,
  Phone,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useCaseStore } from '@/stores/case.store';

type TriageCategory = 'resuscitation' | 'emergent' | 'urgent' | 'less-urgent' | 'non-urgent';
type ArrivalMode = 'walk-in' | 'ambulance' | 'referral';
type ABCSection = 'airway' | 'breathing' | 'circulation';

interface ActiveEmergency {
  id: string;
  startTime: number;
  triage: TriageCategory;
  patientName?: string;
  abcProgress: { airway: boolean; breathing: boolean; circulation: boolean };
  chiefComplaint?: string;
}

interface RecentEmergency {
  id: string;
  time: string;
  triage: TriageCategory;
  complaint: string;
  duration: string;
  patient: string;
  status: 'in-progress' | 'completed' | 'admitted' | 'transferred' | 'referred';
}

const TRIAGE_CONFIG: Record<TriageCategory, { label: string; color: string; bg: string; border: string; ring: string }> = {
  resuscitation: { label: 'Resuscitation', color: 'text-white', bg: 'bg-red-600', border: 'border-red-600', ring: 'ring-red-500' },
  emergent: { label: 'Emergent', color: 'text-white', bg: 'bg-orange-500', border: 'border-orange-500', ring: 'ring-orange-400' },
  urgent: { label: 'Urgent', color: 'text-gray-900', bg: 'bg-yellow-400', border: 'border-yellow-400', ring: 'ring-yellow-400' },
  'less-urgent': { label: 'Less Urgent', color: 'text-white', bg: 'bg-emerald-500', border: 'border-emerald-500', ring: 'ring-emerald-400' },
  'non-urgent': { label: 'Non-Urgent', color: 'text-white', bg: 'bg-blue-500', border: 'border-blue-500', ring: 'ring-blue-400' },
};

const INITIAL_ACTIVE: ActiveEmergency[] = [
  {
    id: 'em-001',
    startTime: Date.now() - 47000,
    triage: 'resuscitation',
    patientName: 'Suresh Iyer',
    abcProgress: { airway: true, breathing: true, circulation: false },
    chiefComplaint: 'Chest pain, diaphoresis',
  },
  {
    id: 'em-002',
    startTime: Date.now() - 123000,
    triage: 'emergent',
    patientName: 'Priya Nair',
    abcProgress: { airway: true, breathing: false, circulation: false },
    chiefComplaint: 'Severe dyspnea',
  },
];

const RECENT_EMERGENCIES: RecentEmergency[] = [
  { id: 'r1', time: '14:32', triage: 'urgent', complaint: 'Fall with head injury', duration: '1m 12s', patient: 'Gopal Krishna', status: 'admitted' },
  { id: 'r2', time: '13:15', triage: 'resuscitation', complaint: 'Cardiac arrest - ROSC achieved', duration: '0m 48s', patient: 'Deepa Sharma', status: 'admitted' },
  { id: 'r3', time: '12:02', triage: 'less-urgent', complaint: 'Laceration right forearm', duration: '1m 35s', patient: 'Arun Prasad', status: 'completed' },
  { id: 'r4', time: '10:45', triage: 'emergent', complaint: 'Acute asthma exacerbation', duration: '1m 05s', patient: 'Kavitha Sundaram', status: 'transferred' },
  { id: 'r5', time: '09:20', triage: 'non-urgent', complaint: 'Minor allergic reaction', duration: '1m 28s', patient: 'Rahul Mehra', status: 'completed' },
];

const AIRWAY_TAGS = ['Patent', 'Obstructed', 'Intubated'];
const BREATHING_TAGS = ['Normal', 'Labored', 'Absent', 'Ventilated'];
const CIRCULATION_TAGS = ['Stable', 'Unstable', 'CPR'];
const INTERVENTION_OPTIONS = ['IV Access', 'O₂', 'Intubation', 'CPR', 'Defibrillation', 'Medications'];

function useTimer(running: boolean, startTime: number) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running, startTime]);
  return elapsed;
}

function formatSeconds(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function TimerDisplay({ startTime, className = '' }: { startTime: number; className?: string }) {
  const elapsed = useTimer(true, startTime);
  const timerColor =
    elapsed < 60
      ? 'from-emerald-400 to-emerald-600'
      : elapsed < 90
        ? 'from-amber-400 to-amber-600'
        : 'from-red-400 to-red-600';
  return (
    <span
      className={`font-mono font-black tabular-nums bg-gradient-to-b ${timerColor} bg-clip-text text-transparent drop-shadow-sm ${className}`}
    >
      {formatSeconds(elapsed)}
    </span>
  );
}

function ABCIndicator({ progress }: { progress: ActiveEmergency['abcProgress'] }) {
  const steps: { key: ABCSection; label: string }[] = [
    { key: 'airway', label: 'A' },
    { key: 'breathing', label: 'B' },
    { key: 'circulation', label: 'C' },
  ];
  const currentIdx = steps.findIndex((s) => !progress[s.key]);
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((step, i) => {
        const done = progress[step.key];
        const active = i === currentIdx;
        return (
          <div key={step.key} className="flex items-center gap-1">
            {done ? (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm shadow-emerald-500/30">
                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
              </div>
            ) : active ? (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 shadow-sm shadow-amber-400/30">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
              </div>
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
                <Circle className="h-3 w-3 text-gray-300" />
              </div>
            )}
            <span
              className={`text-[10px] font-extrabold tracking-wide ${
                done ? 'text-emerald-600' : active ? 'text-amber-600' : 'text-gray-300'
              }`}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <div className={`mx-0.5 h-px w-3 ${done ? 'bg-emerald-300' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function EmergencyPage() {
  const [activeEmergencies, setActiveEmergencies] = useState<ActiveEmergency[]>(INITIAL_ACTIVE);
  const [recentList, setRecentList] = useState<RecentEmergency[]>(RECENT_EMERGENCIES);
  const [showForm, setShowForm] = useState(false);
  const [formStartTime, setFormStartTime] = useState(0);
  const [expandedActive, setExpandedActive] = useState<string | null>(null);

  const [selectedTriage, setSelectedTriage] = useState<TriageCategory | null>(null);
  const [arrivalMode, setArrivalMode] = useState<ArrivalMode | null>(null);
  const [expandedABC, setExpandedABC] = useState<ABCSection | null>('airway');
  const [airwayNotes, setAirwayNotes] = useState('');
  const [airwayTags, setAirwayTags] = useState<string[]>([]);
  const [breathingNotes, setBreathingNotes] = useState('');
  const [breathingTags, setBreathingTags] = useState<string[]>([]);
  const [circulationNotes, setCirculationNotes] = useState('');
  const [circulationTags, setCirculationTags] = useState<string[]>([]);
  const [vitals, setVitals] = useState({ hr: '', bp: '', spo2: '', temp: '', rr: '' });
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [interventions, setInterventions] = useState<string[]>([]);
  const [emPatientName, setEmPatientName] = useState('');
  const [emPatientAge, setEmPatientAge] = useState('');
  const [emPatientGender, setEmPatientGender] = useState('M');
  const [emPatientPhone, setEmPatientPhone] = useState('');
  const [emBriefId, setEmBriefId] = useState('');
  const [expandedRecent, setExpandedRecent] = useState<string | null>(null);

  const addEmergencyToStore = useCaseStore((s) => s.addEmergency);
  const updateEmergencyInStore = useCaseStore((s) => s.updateEmergency);
  const updateEmergencyStatusInStore = useCaseStore((s) => s.updateEmergencyStatus);

  const formRef = useRef<HTMLDivElement>(null);

  const voiceInput = useSpeechRecognition({
    lang: 'en-IN',
    onResult: (text, isFinal) => {
      if (isFinal) setChiefComplaint((prev) => (prev ? `${prev} ${text}` : text));
    },
    onError: (err) => toast.error(`Voice error: ${err}`),
  });

  const handleEscalate = useCallback(() => {
    toast.success('Escalation sent to senior doctor on-call', {
      description: 'Dr. Sunil Desai has been notified via pager and SMS.',
    });
  }, []);

  const handleCallOnDuty = useCallback(() => {
    toast.info('Calling on-duty senior...', {
      description: 'Connecting to Ward B on-call: +91-XXXX-XXXX90',
    });
  }, []);

  const handleUpdateStatus = useCallback((emId: string, newStatus: RecentEmergency['status']) => {
    const em = activeEmergencies.find((e) => e.id === emId);
    if (!em) return;
    setActiveEmergencies((prev) => prev.filter((e) => e.id !== emId));
    const elapsed = Math.floor((Date.now() - em.startTime) / 1000);
    const newRecent: RecentEmergency = {
      id: emId,
      time: format(new Date(), 'HH:mm'),
      triage: em.triage,
      complaint: em.chiefComplaint || 'Documented',
      duration: `${Math.floor(elapsed / 60)}m ${String(elapsed % 60).padStart(2, '0')}s`,
      patient: em.patientName || 'Unknown',
      status: newStatus,
    };
    setRecentList((prev) => [newRecent, ...prev]);
    const statusLabels: Record<string, string> = {
      admitted: 'Patient admitted to ward',
      transferred: 'Patient transferred to higher center',
      completed: 'Emergency documentation completed',
      referred: 'Referral sent to specialist',
    };
    toast.success(statusLabels[newStatus] || 'Status updated', {
      description: `${em.patientName || 'Patient'} — ${em.chiefComplaint || 'ER Case'}`,
    });
    setExpandedActive(null);
  }, [activeEmergencies]);

  const handleReferral = useCallback((emId: string) => {
    const em = activeEmergencies.find((e) => e.id === emId);
    toast.success('Referral sent', {
      description: `${em?.patientName || 'Patient'} referred to Cardiology. Senior notified.`,
    });
  }, [activeEmergencies]);

  const handleCallSenior = useCallback((emId: string) => {
    const em = activeEmergencies.find((e) => e.id === emId);
    toast.info('Calling senior on-call...', {
      description: `For ${em?.patientName || 'patient'}: Dr. Sunil Desai notified via pager.`,
    });
  }, [activeEmergencies]);

  const handleStartEmergency = useCallback(() => {
    setShowForm(true);
    setFormStartTime(Date.now());
    setSelectedTriage(null);
    setArrivalMode(null);
    setExpandedABC('airway');
    setAirwayNotes('');
    setAirwayTags([]);
    setBreathingNotes('');
    setBreathingTags([]);
    setCirculationNotes('');
    setCirculationTags([]);
    setVitals({ hr: '', bp: '', spo2: '', temp: '', rr: '' });
    setChiefComplaint('');
    setInterventions([]);
    setEmPatientName('');
    setEmPatientAge('');
    setEmPatientGender('M');
    setEmPatientPhone('');
    setEmBriefId('');
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }, []);

  const handleComplete = useCallback(() => {
    if (!emPatientName.trim()) {
      toast.error('Patient name is required');
      return;
    }
    setShowForm(false);
    const id = `em-${Date.now()}`;
    const now = new Date().toISOString();
    const patientName = emPatientName.trim() || 'Unknown Patient';
    const newEm: ActiveEmergency = {
      id,
      startTime: formStartTime,
      triage: selectedTriage || 'urgent',
      patientName,
      abcProgress: { airway: true, breathing: true, circulation: true },
      chiefComplaint: chiefComplaint || 'Documented',
    };
    setActiveEmergencies((prev) => [...prev, newEm]);

    addEmergencyToStore({
      id,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      patientName,
      age: emPatientAge,
      gender: emPatientGender,
      phone: emPatientPhone,
      briefId: emBriefId,
      triage: selectedTriage || 'urgent',
      arrivalMode: arrivalMode || 'walk-in',
      chiefComplaint: chiefComplaint || 'Documented',
      vitals: Object.entries(vitals).filter(([, v]) => v).map(([k, v]) => ({ label: k.toUpperCase(), value: v })),
      abcNotes: [airwayNotes, breathingNotes, circulationNotes].filter(Boolean).join(' | '),
      interventions,
      investigations: [],
      statusHistory: [{ status: 'active', at: now, note: 'Emergency started' }],
    });

    toast.success(`Emergency documented for ${patientName}`);
  }, [formStartTime, selectedTriage, chiefComplaint, emPatientName, emPatientAge, emPatientGender, emPatientPhone, emBriefId, arrivalMode, vitals, airwayNotes, breathingNotes, circulationNotes, interventions, addEmergencyToStore]);

  const toggleTag = (tag: string, current: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]);
  };

  const toggleIntervention = (item: string) => {
    setInterventions((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glass relative overflow-hidden border-red-500/20 p-0"
        style={{
          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 40%, #991b1b 70%, #dc2626 100%)',
          boxShadow: '0 0 40px rgba(239, 68, 68, 0.15), 0 20px 60px rgba(185, 28, 28, 0.2)',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/[0.07] blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/[0.05] blur-xl" />
        <div className="absolute right-20 top-4 h-20 w-20 rounded-full bg-red-400/10 blur-lg" />

        <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-2xl bg-white/20" />
              <div className="relative rounded-2xl border border-white/20 bg-white/15 p-3.5 shadow-lg shadow-black/10 backdrop-blur-md">
                <Siren className="h-8 w-8 text-white drop-shadow-md" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-sm sm:text-3xl">
                EMERGENCY DOCUMENTATION
              </h1>
              <p className="mt-1 text-sm font-medium text-red-100/80">
                Rapid clinical documentation in under 90 seconds
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="flex items-center gap-2.5 rounded-full border border-white/20 bg-white/15 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-black/10 backdrop-blur-md"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white shadow-sm shadow-white/50" />
              </span>
              {activeEmergencies.length} Active
            </motion.div>
            <button
              onClick={handleCallOnDuty}
              className="rounded-xl border border-white/20 bg-white/10 p-2.5 backdrop-blur-md transition-all hover:bg-white/20 hover:shadow-lg"
              title="Call on-duty senior"
            >
              <Phone className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* START EMERGENCY Button */}
      <motion.button
        onClick={handleStartEmergency}
        whileHover={{ scale: 1.01, y: -2 }}
        whileTap={{ scale: 0.985 }}
        className="group relative w-full overflow-hidden rounded-2xl glow-red"
        style={{
          background: 'linear-gradient(135deg, #dc2626, #ef4444, #dc2626)',
          boxShadow: '0 0 30px rgba(239, 68, 68, 0.2), 0 20px 50px rgba(220, 38, 38, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12),transparent_70%)]" />
        <div className="absolute inset-[1px] rounded-2xl border border-red-400/30" />
        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: 'linear-gradient(135deg, #ef4444, #f87171, #ef4444)' }}
        />
        <div className="shimmer absolute inset-0" />

        <div className="relative flex h-36 flex-col items-center justify-center gap-2.5">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <AlertTriangle className="h-11 w-11 text-white drop-shadow-lg transition-transform duration-300 group-hover:scale-110" />
          </motion.div>
          <span className="text-2xl font-black tracking-widest text-white drop-shadow-md">
            START EMERGENCY
          </span>
          <span className="text-xs font-medium tracking-wide text-red-100/70">
            Press to begin ABC assessment
          </span>
        </div>
      </motion.button>

      {/* Active Emergencies */}
      {activeEmergencies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="h-px flex-1 bg-gradient-to-r from-red-200/60 to-transparent" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Active Emergencies
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-red-200/60 to-transparent" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {activeEmergencies.map((em) => {
              const cfg = TRIAGE_CONFIG[em.triage];
              const isExpanded = expandedActive === em.id;
              return (
                <motion.div
                  key={em.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card group relative overflow-hidden border-l-4"
                  style={{
                    borderLeftColor: em.triage === 'resuscitation' ? '#dc2626' : em.triage === 'emergent' ? '#f97316' : '#eab308',
                  }}
                >
                  <button
                    onClick={() => setExpandedActive(isExpanded ? null : em.id)}
                    className="flex w-full items-start justify-between p-5 text-left"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {em.patientName && <span className="text-sm font-bold text-gray-800">{em.patientName}</span>}
                      </div>
                      {em.chiefComplaint && <p className="text-xs font-medium text-gray-500">{em.chiefComplaint}</p>}
                      <ABCIndicator progress={em.abcProgress} />
                    </div>
                    <TimerDisplay startTime={em.startTime} className="text-3xl" />
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-gray-100"
                      >
                        <div className="space-y-3 p-5 pt-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Quick Actions</p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleUpdateStatus(em.id, 'admitted')}
                              className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700 transition-all hover:bg-blue-100"
                            >
                              Admit to Ward
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(em.id, 'transferred')}
                              className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-xs font-semibold text-violet-700 transition-all hover:bg-violet-100"
                            >
                              Transfer
                            </button>
                            <button
                              onClick={() => handleReferral(em.id)}
                              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100"
                            >
                              Refer to Specialist
                            </button>
                            <button
                              onClick={() => handleCallSenior(em.id)}
                              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-100"
                            >
                              Call Senior Doctor
                            </button>
                          </div>
                          <button
                            onClick={() => handleUpdateStatus(em.id, 'completed')}
                            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg"
                          >
                            Complete & Discharge
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Emergency Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            ref={formRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card overflow-hidden border-red-200/60 glow-red"
          >
            {/* Form Header */}
            <div className="relative overflow-hidden border-b border-red-100/80 px-6 py-5"
              style={{ background: 'linear-gradient(135deg, #fef2f2, #fff1f2, #fef2f2)' }}
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-200/20 blur-xl" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-2 shadow-md shadow-red-500/20">
                    <Stethoscope className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">New Emergency Documentation</h2>
                    <p className="text-xs text-gray-400">Complete ABC assessment rapidly</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-gray-200/60 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-sm">
                    <TimerDisplay startTime={formStartTime} className="text-xl" />
                  </div>
                  <button
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border border-gray-200/60 bg-white/80 p-2 text-gray-400 shadow-sm backdrop-blur-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-8 p-6">
              {/* Triage Category */}
              <div>
                <label className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  <div className="h-1 w-1 rounded-full bg-red-400" />
                  Triage Category
                </label>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                  {(Object.entries(TRIAGE_CONFIG) as [TriageCategory, (typeof TRIAGE_CONFIG)[TriageCategory]][]).map(([key, cfg]) => {
                    const selected = selectedTriage === key;
                    return (
                      <motion.button
                        key={key}
                        onClick={() => setSelectedTriage(key)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className={`relative overflow-hidden rounded-xl px-3 py-3.5 text-xs font-bold transition-all duration-200 ${
                          selected
                            ? `${cfg.bg} ${cfg.color} ring-2 ${cfg.ring} ring-offset-2 shadow-lg`
                            : 'border border-gray-200/80 bg-white/80 text-gray-600 shadow-sm backdrop-blur-sm hover:border-gray-300 hover:shadow-md'
                        }`}
                      >
                        {selected && (
                          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                        )}
                        <span className="relative">{cfg.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Arrival Mode */}
              <div>
                <label className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  <div className="h-1 w-1 rounded-full bg-indigo-400" />
                  Arrival Mode
                </label>
                <div className="flex gap-2.5">
                  {([
                    { key: 'walk-in' as ArrivalMode, label: 'Walk-in', icon: Footprints },
                    { key: 'ambulance' as ArrivalMode, label: 'Ambulance', icon: Ambulance },
                    { key: 'referral' as ArrivalMode, label: 'Referral', icon: ArrowUpRight },
                  ]).map((mode) => {
                    const Icon = mode.icon;
                    const active = arrivalMode === mode.key;
                    return (
                      <motion.button
                        key={mode.key}
                        onClick={() => setArrivalMode(mode.key)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className={`relative flex flex-1 flex-col items-center gap-2 overflow-hidden rounded-xl px-4 py-4 text-xs font-semibold transition-all duration-200 ${
                          active
                            ? 'border border-indigo-400/60 bg-gradient-to-b from-indigo-50 to-indigo-100/50 text-indigo-700 shadow-md shadow-indigo-500/10'
                            : 'border border-gray-200/80 bg-white/80 text-gray-500 shadow-sm backdrop-blur-sm hover:border-gray-300 hover:shadow-md'
                        }`}
                      >
                        {active && (
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_70%)]" />
                        )}
                        <Icon className={`relative h-5 w-5 ${active ? 'text-indigo-600' : ''}`} />
                        <span className="relative">{mode.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Patient Details */}
              <div>
                <label className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  <div className="h-1 w-1 rounded-full bg-teal-400" />
                  Patient Details
                </label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">Patient Name *</label>
                    <input className="input" placeholder="e.g. Suresh Iyer" value={emPatientName} onChange={(e) => setEmPatientName(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">Age</label>
                    <input className="input" placeholder="e.g. 45" value={emPatientAge} onChange={(e) => setEmPatientAge(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">Gender</label>
                    <select className="input" value={emPatientGender} onChange={(e) => setEmPatientGender(e.target.value)}>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">Phone / Contact</label>
                    <input className="input" placeholder="+91-XXXXX-XXXXX" value={emPatientPhone} onChange={(e) => setEmPatientPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">Brief ID (Aadhaar last 4)</label>
                    <input className="input" placeholder="e.g. 4532 or 'Unknown'" value={emBriefId} onChange={(e) => setEmBriefId(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* ABC Assessment */}
              <div>
                <label className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  <div className="h-1 w-1 rounded-full bg-amber-400" />
                  ABC Assessment
                </label>
                <div className="space-y-2.5">
                  {([
                    { key: 'airway' as ABCSection, label: 'Airway', icon: Wind, tags: AIRWAY_TAGS, notes: airwayNotes, setNotes: setAirwayNotes, selectedTags: airwayTags, setTags: setAirwayTags, gradient: 'from-sky-500 to-blue-600' },
                    { key: 'breathing' as ABCSection, label: 'Breathing', icon: Activity, tags: BREATHING_TAGS, notes: breathingNotes, setNotes: setBreathingNotes, selectedTags: breathingTags, setTags: setBreathingTags, gradient: 'from-violet-500 to-purple-600' },
                    { key: 'circulation' as ABCSection, label: 'Circulation', icon: HeartPulse, tags: CIRCULATION_TAGS, notes: circulationNotes, setNotes: setCirculationNotes, selectedTags: circulationTags, setTags: setCirculationTags, gradient: 'from-rose-500 to-red-600' },
                  ]).map((section) => {
                    const Icon = section.icon;
                    const isOpen = expandedABC === section.key;
                    return (
                      <div
                        key={section.key}
                        className={`overflow-hidden rounded-xl border transition-all duration-200 ${
                          isOpen
                            ? 'border-gray-200/80 bg-white shadow-md'
                            : 'border-gray-200/60 bg-white/80 shadow-sm hover:shadow-md'
                        }`}
                      >
                        <button
                          onClick={() => setExpandedABC(isOpen ? null : section.key)}
                          className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-gray-50/80"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`rounded-lg bg-gradient-to-br ${section.gradient} p-1.5 shadow-sm`}>
                              <Icon className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="text-sm font-bold text-gray-800">{section.label}</span>
                            {section.selectedTags.length > 0 && (
                              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 ring-1 ring-inset ring-indigo-500/10">
                                {section.selectedTags.join(', ')}
                              </span>
                            )}
                          </div>
                          <div className={`rounded-lg p-1 transition-colors ${isOpen ? 'bg-gray-100' : ''}`}>
                            {isOpen ? (
                              <ChevronUp className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-3 border-t border-gray-100/80 bg-gray-50/30 px-4 py-4">
                                <div className="flex flex-wrap gap-2">
                                  {section.tags.map((tag) => {
                                    const active = section.selectedTags.includes(tag);
                                    return (
                                      <motion.button
                                        key={tag}
                                        onClick={() => toggleTag(tag, section.selectedTags, section.setTags)}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.96 }}
                                        className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                                          active
                                            ? `bg-gradient-to-r ${section.gradient} text-white shadow-md`
                                            : 'border border-gray-200/80 bg-white text-gray-600 shadow-sm hover:border-gray-300 hover:shadow-md'
                                        }`}
                                      >
                                        {tag}
                                      </motion.button>
                                    );
                                  })}
                                </div>
                                <textarea
                                  value={section.notes}
                                  onChange={(e) => section.setNotes(e.target.value)}
                                  placeholder={`${section.label} notes...`}
                                  rows={2}
                                  className="input resize-none"
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vitals */}
              <div>
                <label className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  <div className="h-1 w-1 rounded-full bg-emerald-400" />
                  Vitals
                </label>
                <div className="grid grid-cols-5 gap-2.5">
                  {([
                    { key: 'hr' as const, label: 'HR', unit: 'bpm', icon: HeartPulse, gradient: 'from-rose-400 to-red-500' },
                    { key: 'bp' as const, label: 'BP', unit: 'mmHg', icon: Activity, gradient: 'from-violet-400 to-purple-500' },
                    { key: 'spo2' as const, label: 'SpO₂', unit: '%', icon: Droplets, gradient: 'from-sky-400 to-blue-500' },
                    { key: 'temp' as const, label: 'Temp', unit: '°C', icon: Thermometer, gradient: 'from-amber-400 to-orange-500' },
                    { key: 'rr' as const, label: 'RR', unit: '/min', icon: Wind, gradient: 'from-teal-400 to-emerald-500' },
                  ]).map((v) => {
                    const Icon = v.icon;
                    const hasValue = vitals[v.key] !== '';
                    return (
                      <div
                        key={v.key}
                        className={`group relative overflow-hidden rounded-xl border p-3 transition-all duration-200 ${
                          hasValue
                            ? 'border-gray-200/80 bg-white shadow-md'
                            : 'border-gray-200/60 bg-white/80 shadow-sm hover:shadow-md'
                        }`}
                      >
                        <div className="absolute -right-3 -top-3 h-10 w-10 rounded-full bg-gradient-to-br opacity-[0.06]"
                          style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
                        />
                        <div className="mb-1.5 flex items-center justify-center gap-1.5">
                          <div className={`rounded-md bg-gradient-to-br ${v.gradient} p-1`}>
                            <Icon className="h-2.5 w-2.5 text-white" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            {v.label}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={vitals[v.key]}
                          onChange={(e) => setVitals((prev) => ({ ...prev, [v.key]: e.target.value }))}
                          placeholder="—"
                          className="w-full border-0 bg-transparent p-0 text-center text-lg font-black text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-0"
                        />
                        <p className="mt-0.5 text-center text-[9px] font-medium text-gray-400">{v.unit}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chief Complaint */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    <div className="h-1 w-1 rounded-full bg-violet-400" />
                    Chief Complaint
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => voiceInput.toggle()}
                    className={`rounded-lg border p-2 shadow-sm transition-all hover:shadow-md ${
                      voiceInput.isListening
                        ? 'border-red-300 bg-red-50 text-red-600'
                        : 'border-gray-200/60 bg-white/80 text-gray-400 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                    title={voiceInput.isListening ? 'Stop voice input' : 'Voice input'}
                  >
                    {voiceInput.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </motion.button>
                </div>
                <textarea
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="Describe the chief complaint..."
                  rows={3}
                  className="input resize-none"
                />
              </div>

              {/* Interventions */}
              <div>
                <label className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  <div className="h-1 w-1 rounded-full bg-red-400" />
                  Interventions
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTERVENTION_OPTIONS.map((item) => {
                    const active = interventions.includes(item);
                    const icons: Record<string, typeof Zap> = {
                      'IV Access': Droplets,
                      'O₂': Wind,
                      Intubation: Activity,
                      CPR: HeartPulse,
                      Defibrillation: Zap,
                      Medications: Pill,
                    };
                    const Icon = icons[item] || Zap;
                    return (
                      <motion.button
                        key={item}
                        onClick={() => toggleIntervention(item)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
                          active
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/20'
                            : 'border border-gray-200/80 bg-white/80 text-gray-600 shadow-sm backdrop-blur-sm hover:border-gray-300 hover:shadow-md'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {item}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 border-t border-gray-100/80 pt-6 sm:flex-row">
                <motion.button
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={handleComplete}
                  className="btn-primary flex flex-1 items-center justify-center gap-2.5 py-4 text-base font-bold shadow-xl shadow-emerald-500/25"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  COMPLETE & SAVE
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={handleEscalate}
                  className="relative flex items-center justify-center gap-2.5 overflow-hidden rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50 to-amber-100/50 px-6 py-4 text-base font-bold text-amber-700 shadow-md shadow-amber-500/10 transition-all hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/15"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-200/0 via-amber-200/20 to-amber-200/0 opacity-0 transition-opacity hover:opacity-100" />
                  <Siren className="relative h-5 w-5" />
                  <span className="relative">ESCALATE TO SENIOR</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Emergencies Table */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="h-px flex-1 bg-gradient-to-r from-gray-200/60 to-transparent" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Recent Emergencies
          </h2>
          <div className="h-px flex-1 bg-gradient-to-l from-gray-200/60 to-transparent" />
        </div>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Time</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Patient</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Triage</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Complaint</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Duration</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/60">
                {recentList.map((em) => {
                  const cfg = TRIAGE_CONFIG[em.triage];
                  const statusConfig: Record<string, { bg: string; text: string; ring: string }> = {
                    'in-progress': { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-500/10' },
                    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-500/10' },
                    admitted: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-500/10' },
                    transferred: { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-500/10' },
                    referred: { bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-500/10' },
                  };
                  const sc = statusConfig[em.status];
                  const isExpanded = expandedRecent === em.id;
                  return (
                    <tr key={em.id} className="table-row cursor-pointer" onClick={() => setExpandedRecent(isExpanded ? null : em.id)}>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3.5 w-3.5 text-gray-300" />
                          <span className="font-mono font-medium">{em.time}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-gray-800">{em.patient}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm ${cfg.bg} ${cfg.color}`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="max-w-[200px] truncate px-5 py-3.5 text-xs font-medium text-gray-500">
                        {em.complaint}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-semibold text-gray-600">{em.duration}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ring-1 ring-inset ${sc.bg} ${sc.text} ${sc.ring}`}
                        >
                          {em.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Expanded Recent Emergency Detail */}
          <AnimatePresence>
            {expandedRecent && (() => {
              const em = recentList.find((e) => e.id === expandedRecent);
              if (!em) return null;
              return (
                <motion.div
                  key={em.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden border-t border-gray-100"
                >
                  <div className="space-y-4 p-5 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-800">
                        {em.patient} — Emergency Details
                      </h3>
                      <button onClick={() => setExpandedRecent(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-lg border border-gray-200/60 bg-white p-3">
                        <p className="text-[10px] font-bold uppercase text-gray-400">Triage</p>
                        <p className="text-sm font-semibold text-gray-800">{TRIAGE_CONFIG[em.triage].label}</p>
                      </div>
                      <div className="rounded-lg border border-gray-200/60 bg-white p-3">
                        <p className="text-[10px] font-bold uppercase text-gray-400">Complaint</p>
                        <p className="text-sm font-medium text-gray-800">{em.complaint}</p>
                      </div>
                      <div className="rounded-lg border border-gray-200/60 bg-white p-3">
                        <p className="text-[10px] font-bold uppercase text-gray-400">Duration</p>
                        <p className="text-sm font-mono font-semibold text-gray-800">{em.duration}</p>
                      </div>
                      <div className="rounded-lg border border-gray-200/60 bg-white p-3">
                        <p className="text-[10px] font-bold uppercase text-gray-400">Time</p>
                        <p className="text-sm font-mono font-semibold text-gray-800">{em.time}</p>
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Update Status</p>
                      <div className="flex flex-wrap gap-2">
                        {(['in-progress', 'admitted', 'transferred', 'completed', 'referred'] as const).map((status) => {
                          const active = em.status === status;
                          const colors: Record<string, string> = {
                            'in-progress': 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
                            admitted: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
                            transferred: 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100',
                            completed: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                            referred: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
                          };
                          return (
                            <button
                              key={status}
                              onClick={(e) => {
                                e.stopPropagation();
                                setRecentList((prev) => prev.map((r) => (r.id === em.id ? { ...r, status } : r)));
                                updateEmergencyStatusInStore(em.id, status as any, `Status changed to ${status}`);
                                toast.success(`${em.patient}: status updated to ${status}`);
                              }}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${active ? 'ring-2 ring-offset-1 ' : ''} ${colors[status]}`}
                            >
                              {status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
