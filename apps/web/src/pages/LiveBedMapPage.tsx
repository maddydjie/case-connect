import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  CheckCircle2,
  UserRound,
  Wrench,
  Clock,
  X,
  Plus,
  Bed,
  ShieldAlert,
  ArrowRightLeft,
  ClipboardEdit,
  History,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

type BedStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'reserved';
type BedType = 'ICU' | 'General' | 'Private';

interface Patient {
  name: string;
  admissionDate: string;
  expectedDischarge: string;
  doctor: string;
  doctorInitials: string;
  readmissionRisk: number;
}

interface AssignmentRecord {
  patient: string;
  from: string;
  to: string;
}

interface BedData {
  id: string;
  number: string;
  type: BedType;
  status: BedStatus;
  patient?: Patient;
  cleaningMinutesLeft?: number;
  maintenanceNote?: string;
  reservedFor?: string;
  history: AssignmentRecord[];
}

interface Ward {
  id: string;
  name: string;
  beds: BedData[];
}

interface Floor {
  id: number;
  label: string;
  wards: Ward[];
}

const FLOORS: Floor[] = [
  {
    id: 1,
    label: 'Floor 1',
    wards: [
      {
        id: 'f1-cardiac-a',
        name: 'Cardiac Ward A',
        beds: [
          { id: 'b101', number: '101', type: 'ICU', status: 'occupied', patient: { name: 'Rajesh Sharma', admissionDate: '2026-03-28', expectedDischarge: '2026-04-07', doctor: 'Dr. Priya Menon', doctorInitials: 'PM', readmissionRisk: 34 }, history: [{ patient: 'Anand Gupta', from: '2026-03-10', to: '2026-03-25' }, { patient: 'Sunita Devi', from: '2026-02-20', to: '2026-03-08' }, { patient: 'Vikram Joshi', from: '2026-01-15', to: '2026-02-18' }] },
          { id: 'b102', number: '102', type: 'ICU', status: 'occupied', patient: { name: 'Meena Kumari', admissionDate: '2026-04-01', expectedDischarge: '2026-04-10', doctor: 'Dr. Arun Patel', doctorInitials: 'AP', readmissionRisk: 72 }, history: [{ patient: 'Suresh Yadav', from: '2026-03-15', to: '2026-03-30' }] },
          { id: 'b103', number: '103', type: 'General', status: 'available', history: [{ patient: 'Kavita Nair', from: '2026-03-01', to: '2026-03-20' }] },
          { id: 'b104', number: '104', type: 'General', status: 'cleaning', cleaningMinutesLeft: 12, history: [{ patient: 'Deepak Verma', from: '2026-03-22', to: '2026-04-03' }] },
          { id: 'b105', number: '105', type: 'Private', status: 'occupied', patient: { name: 'Anjali Reddy', admissionDate: '2026-04-02', expectedDischarge: '2026-04-06', doctor: 'Dr. Priya Menon', doctorInitials: 'PM', readmissionRisk: 18 }, history: [] },
          { id: 'b106', number: '106', type: 'General', status: 'maintenance', maintenanceNote: 'Mattress replacement', history: [] },
          { id: 'b107', number: '107', type: 'General', status: 'available', history: [] },
          { id: 'b108', number: '108', type: 'ICU', status: 'occupied', patient: { name: 'Vikram Singh', admissionDate: '2026-03-30', expectedDischarge: '2026-04-12', doctor: 'Dr. Sunil Desai', doctorInitials: 'SD', readmissionRisk: 85 }, history: [{ patient: 'Rohit Malhotra', from: '2026-02-10', to: '2026-03-28' }] },
          { id: 'b109', number: '109', type: 'General', status: 'reserved', reservedFor: 'Priya Iyer (Transfer)', history: [] },
          { id: 'b110', number: '110', type: 'Private', status: 'available', history: [] },
        ],
      },
      {
        id: 'f1-neuro-b',
        name: 'Neurology Ward B',
        beds: [
          { id: 'b111', number: '111', type: 'ICU', status: 'occupied', patient: { name: 'Lakshmi Venkatesh', admissionDate: '2026-03-25', expectedDischarge: '2026-04-08', doctor: 'Dr. Kavitha Rao', doctorInitials: 'KR', readmissionRisk: 45 }, history: [] },
          { id: 'b112', number: '112', type: 'General', status: 'available', history: [] },
          { id: 'b113', number: '113', type: 'General', status: 'occupied', patient: { name: 'Arjun Nambiar', admissionDate: '2026-04-03', expectedDischarge: '2026-04-09', doctor: 'Dr. Kavitha Rao', doctorInitials: 'KR', readmissionRisk: 22 }, history: [] },
          { id: 'b114', number: '114', type: 'Private', status: 'cleaning', cleaningMinutesLeft: 5, history: [{ patient: 'Geeta Pillai', from: '2026-03-20', to: '2026-04-03' }] },
          { id: 'b115', number: '115', type: 'General', status: 'available', history: [] },
          { id: 'b116', number: '116', type: 'ICU', status: 'occupied', patient: { name: 'Mohan Das', admissionDate: '2026-03-29', expectedDischarge: '2026-04-15', doctor: 'Dr. Sunil Desai', doctorInitials: 'SD', readmissionRisk: 91 }, history: [{ patient: 'Ramesh Chandra', from: '2026-02-15', to: '2026-03-27' }] },
          { id: 'b117', number: '117', type: 'General', status: 'maintenance', maintenanceNote: 'Electrical wiring repair', history: [] },
          { id: 'b118', number: '118', type: 'General', status: 'occupied', patient: { name: 'Sita Devi Pandey', admissionDate: '2026-04-01', expectedDischarge: '2026-04-05', doctor: 'Dr. Arun Patel', doctorInitials: 'AP', readmissionRisk: 10 }, history: [] },
        ],
      },
    ],
  },
  {
    id: 2,
    label: 'Floor 2',
    wards: [
      {
        id: 'f2-ortho-a',
        name: 'Orthopaedic Ward A',
        beds: [
          { id: 'b201', number: '201', type: 'General', status: 'occupied', patient: { name: 'Ramesh Babu', admissionDate: '2026-03-27', expectedDischarge: '2026-04-10', doctor: 'Dr. Harish Kumar', doctorInitials: 'HK', readmissionRisk: 28 }, history: [] },
          { id: 'b202', number: '202', type: 'General', status: 'available', history: [] },
          { id: 'b203', number: '203', type: 'Private', status: 'occupied', patient: { name: 'Fatima Begum', admissionDate: '2026-04-02', expectedDischarge: '2026-04-08', doctor: 'Dr. Harish Kumar', doctorInitials: 'HK', readmissionRisk: 15 }, history: [] },
          { id: 'b204', number: '204', type: 'General', status: 'cleaning', cleaningMinutesLeft: 22, history: [] },
          { id: 'b205', number: '205', type: 'General', status: 'available', history: [] },
          { id: 'b206', number: '206', type: 'ICU', status: 'occupied', patient: { name: 'Anil Kapoor', admissionDate: '2026-03-31', expectedDischarge: '2026-04-14', doctor: 'Dr. Nandini Shah', doctorInitials: 'NS', readmissionRisk: 67 }, history: [{ patient: 'Pooja Mehta', from: '2026-03-01', to: '2026-03-29' }] },
          { id: 'b207', number: '207', type: 'General', status: 'reserved', reservedFor: 'Post-Op Patient', history: [] },
          { id: 'b208', number: '208', type: 'General', status: 'available', history: [] },
          { id: 'b209', number: '209', type: 'Private', status: 'cleaning', cleaningMinutesLeft: 8, history: [] },
          { id: 'b210', number: '210', type: 'General', status: 'occupied', patient: { name: 'Sundar Rajan', admissionDate: '2026-04-01', expectedDischarge: '2026-04-06', doctor: 'Dr. Nandini Shah', doctorInitials: 'NS', readmissionRisk: 40 }, history: [] },
        ],
      },
    ],
  },
  {
    id: 3,
    label: 'Floor 3',
    wards: [
      {
        id: 'f3-peds',
        name: 'Paediatrics Ward',
        beds: [
          { id: 'b301', number: '301', type: 'General', status: 'occupied', patient: { name: 'Baby Aryan Gupta', admissionDate: '2026-04-03', expectedDischarge: '2026-04-06', doctor: 'Dr. Shalini Bhat', doctorInitials: 'SB', readmissionRisk: 12 }, history: [] },
          { id: 'b302', number: '302', type: 'ICU', status: 'occupied', patient: { name: 'Baby Diya Sharma', admissionDate: '2026-03-30', expectedDischarge: '2026-04-10', doctor: 'Dr. Shalini Bhat', doctorInitials: 'SB', readmissionRisk: 55 }, history: [] },
          { id: 'b303', number: '303', type: 'General', status: 'available', history: [] },
          { id: 'b304', number: '304', type: 'General', status: 'available', history: [] },
          { id: 'b305', number: '305', type: 'Private', status: 'occupied', patient: { name: 'Baby Krish Patel', admissionDate: '2026-04-02', expectedDischarge: '2026-04-05', doctor: 'Dr. Rekha Menon', doctorInitials: 'RM', readmissionRisk: 8 }, history: [] },
          { id: 'b306', number: '306', type: 'General', status: 'maintenance', maintenanceNote: 'Bed rail replacement', history: [] },
          { id: 'b307', number: '307', type: 'General', status: 'available', history: [] },
          { id: 'b308', number: '308', type: 'General', status: 'cleaning', cleaningMinutesLeft: 18, history: [] },
          { id: 'b309', number: '309', type: 'General', status: 'occupied', patient: { name: 'Baby Ananya Reddy', admissionDate: '2026-04-01', expectedDischarge: '2026-04-07', doctor: 'Dr. Rekha Menon', doctorInitials: 'RM', readmissionRisk: 30 }, history: [] },
          { id: 'b310', number: '310', type: 'General', status: 'available', history: [] },
          { id: 'b311', number: '311', type: 'ICU', status: 'cleaning', cleaningMinutesLeft: 3, history: [{ patient: 'Baby Rohan Iyer', from: '2026-03-20', to: '2026-04-03' }] },
          { id: 'b312', number: '312', type: 'General', status: 'available', history: [] },
        ],
      },
    ],
  },
  {
    id: 4,
    label: 'Floor 4',
    wards: [
      {
        id: 'f4-gen-surg',
        name: 'General Surgery Ward',
        beds: [
          { id: 'b401', number: '401', type: 'General', status: 'occupied', patient: { name: 'Ravi Shankar', admissionDate: '2026-03-29', expectedDischarge: '2026-04-08', doctor: 'Dr. Ajay Mishra', doctorInitials: 'AM', readmissionRisk: 38 }, history: [] },
          { id: 'b402', number: '402', type: 'ICU', status: 'occupied', patient: { name: 'Kamala Devi', admissionDate: '2026-04-01', expectedDischarge: '2026-04-12', doctor: 'Dr. Ajay Mishra', doctorInitials: 'AM', readmissionRisk: 62 }, history: [] },
          { id: 'b403', number: '403', type: 'General', status: 'available', history: [] },
          { id: 'b404', number: '404', type: 'Private', status: 'occupied', patient: { name: 'Suresh Raina', admissionDate: '2026-04-03', expectedDischarge: '2026-04-06', doctor: 'Dr. Pooja Kapoor', doctorInitials: 'PK', readmissionRisk: 20 }, history: [] },
          { id: 'b405', number: '405', type: 'General', status: 'cleaning', cleaningMinutesLeft: 15, history: [] },
          { id: 'b406', number: '406', type: 'General', status: 'maintenance', maintenanceNote: 'IV stand repair', history: [] },
          { id: 'b407', number: '407', type: 'General', status: 'available', history: [] },
          { id: 'b408', number: '408', type: 'General', status: 'occupied', patient: { name: 'Nirmala Sitharaman', admissionDate: '2026-04-02', expectedDischarge: '2026-04-09', doctor: 'Dr. Pooja Kapoor', doctorInitials: 'PK', readmissionRisk: 48 }, history: [] },
          { id: 'b409', number: '409', type: 'ICU', status: 'reserved', reservedFor: 'Emergency Hold', history: [] },
          { id: 'b410', number: '410', type: 'General', status: 'available', history: [] },
        ],
      },
    ],
  },
];

const STATUS_CONFIG: Record<BedStatus, { label: string; border: string; bg: string; dot: string; text: string; badge: string }> = {
  available: { label: 'Available', border: 'border-emerald-300', bg: 'bg-emerald-50', dot: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
  occupied: { label: 'Occupied', border: 'border-red-300', bg: 'bg-red-50', dot: 'bg-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
  cleaning: { label: 'Cleaning', border: 'border-amber-300', bg: 'bg-amber-50', dot: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
  maintenance: { label: 'Maintenance', border: 'border-gray-300', bg: 'bg-gray-100', dot: 'bg-gray-500', text: 'text-gray-700', badge: 'bg-gray-200 text-gray-800' },
  reserved: { label: 'Reserved', border: 'border-purple-300', bg: 'bg-purple-50', dot: 'bg-purple-500', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
};

const TYPE_COLORS: Record<BedType, string> = {
  ICU: 'bg-rose-100 text-rose-700',
  General: 'bg-sky-100 text-sky-700',
  Private: 'bg-violet-100 text-violet-700',
};

const STAT_ICON_GRADIENTS = {
  indigo: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
  emerald: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
  red: 'bg-gradient-to-br from-red-500 to-red-600',
  amber: 'bg-gradient-to-br from-amber-500 to-amber-600',
} as const;

const STAT_BAR_GRADIENTS = {
  indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-400',
  emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
  red: 'bg-gradient-to-r from-red-500 to-red-400',
  amber: 'bg-gradient-to-r from-amber-500 to-amber-400',
} as const;

function getRiskColor(risk: number) {
  if (risk >= 70) return { bar: 'bg-gradient-to-r from-red-600 to-red-400', text: 'text-red-600', ring: 'ring-red-500/20', bg: 'bg-red-50' };
  if (risk >= 40) return { bar: 'bg-gradient-to-r from-amber-600 to-amber-400', text: 'text-amber-600', ring: 'ring-amber-500/20', bg: 'bg-amber-50' };
  return { bar: 'bg-gradient-to-r from-emerald-600 to-emerald-400', text: 'text-emerald-600', ring: 'ring-emerald-500/20', bg: 'bg-emerald-50' };
}

function getRiskLabel(risk: number) {
  if (risk >= 70) return 'High';
  if (risk >= 40) return 'Moderate';
  return 'Low';
}

export default function LiveBedMapPage() {
  const [floors, setFloors] = useState<Floor[]>(FLOORS);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [selectedBed, setSelectedBed] = useState<BedData | null>(null);
  const [selectedWardName, setSelectedWardName] = useState('');
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [newBedNumber, setNewBedNumber] = useState('');
  const [newBedType, setNewBedType] = useState<BedType>('General');
  const [newBedWardId, setNewBedWardId] = useState('');

  const currentFloor = floors.find((f) => f.id === selectedFloor)!;
  const allBeds = floors.flatMap((f) => f.wards.flatMap((w) => w.beds));

  const allWards = useMemo(() => floors.flatMap((f) => f.wards.map((w) => ({ ...w, floorLabel: f.label }))), [floors]);

  const handleAddBed = () => {
    if (!newBedNumber.trim()) {
      toast.error('Bed number is required');
      return;
    }
    if (!newBedWardId) {
      toast.error('Select a ward');
      return;
    }
    const exists = allBeds.some((b) => b.number === newBedNumber.trim());
    if (exists) {
      toast.error(`Bed ${newBedNumber} already exists`);
      return;
    }
    const newBed: BedData = {
      id: `b-${Date.now()}`,
      number: newBedNumber.trim(),
      type: newBedType,
      status: 'available',
      history: [],
    };
    setFloors((prev) =>
      prev.map((f) => ({
        ...f,
        wards: f.wards.map((w) => (w.id === newBedWardId ? { ...w, beds: [...w.beds, newBed] } : w)),
      })),
    );
    toast.success(`Bed ${newBedNumber} added`, { description: `${newBedType} bed in ${allWards.find((w) => w.id === newBedWardId)?.name}` });
    setShowAddBedModal(false);
    setNewBedNumber('');
  };

  const stats = useMemo(() => {
    const total = allBeds.length;
    const available = allBeds.filter((b) => b.status === 'available').length;
    const occupied = allBeds.filter((b) => b.status === 'occupied').length;
    const cleanMaint = allBeds.filter((b) => b.status === 'cleaning' || b.status === 'maintenance').length;
    return { total, available, occupied, cleanMaint };
  }, [allBeds]);

  const handleBedClick = (bed: BedData, wardName: string) => {
    setSelectedBed(bed);
    setSelectedWardName(wardName);
  };

  return (
    <div className="relative min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
              <Bed className="h-5 w-5 text-white" />
            </div>
            LiveBedMap
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">Real-time bed occupancy across all floors</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 rounded-full border border-gray-200/60 bg-white/80 px-3.5 py-1.5 text-xs text-gray-500 shadow-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live &middot; {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button
            onClick={() => {
              setNewBedWardId(currentFloor.wards[0]?.id || '');
              setShowAddBedModal(true);
            }}
            className="btn-primary inline-flex items-center gap-1.5 text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Bed
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {([
          { label: 'Total Beds', value: stats.total, pct: 100, color: 'indigo' as const, icon: Building2 },
          { label: 'Available', value: stats.available, pct: Math.round((stats.available / stats.total) * 100), color: 'emerald' as const, icon: CheckCircle2 },
          { label: 'Occupied', value: stats.occupied, pct: Math.round((stats.occupied / stats.total) * 100), color: 'red' as const, icon: UserRound },
          { label: 'Cleaning / Maint.', value: stats.cleanMaint, pct: Math.round((stats.cleanMaint / stats.total) * 100), color: 'amber' as const, icon: Wrench },
        ]).map((s, idx) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.4 }}
              className="stat-card group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
                  <p className="mt-1.5 text-3xl font-extrabold tracking-tight text-gray-900">{s.value}</p>
                </div>
                <div className={`rounded-xl ${STAT_ICON_GRADIENTS[s.color]} p-2.5 shadow-lg shadow-${s.color}-500/20 transition-transform duration-200 group-hover:scale-110`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-gray-400">of total</span>
                  <span className="font-bold text-gray-600">{s.pct}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100/80">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.pct}%` }}
                    transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1], delay: idx * 0.05 + 0.2 }}
                    className={`h-full rounded-full ${STAT_BAR_GRADIENTS[s.color]}`}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Floor Tabs */}
      <div className="mt-8">
        <div className="inline-flex gap-1 rounded-2xl border border-gray-200/60 bg-white/60 p-1.5 shadow-sm backdrop-blur-sm">
          {FLOORS.map((floor) => (
            <button
              key={floor.id}
              onClick={() => setSelectedFloor(floor.id)}
              className={`relative rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                selectedFloor === floor.id ? 'text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {selectedFloor === floor.id && (
                <motion.div
                  layoutId="floor-tab"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-lg shadow-indigo-500/25"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" />
                {floor.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Ward Sections */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedFloor}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="mt-6 space-y-6"
        >
          {currentFloor.wards.map((ward) => {
            const occupied = ward.beds.filter((b) => b.status === 'occupied').length;
            const availCount = ward.beds.filter((b) => b.status === 'available').length;
            return (
              <div key={ward.id} className="card overflow-hidden">
                {/* Ward header with glass effect */}
                <div className="card-glass flex items-center justify-between rounded-none border-x-0 border-t-0 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/10 to-indigo-500/5">
                      <Building2 className="h-4 w-4 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-bold tracking-tight text-gray-800">{ward.name}</h3>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="badge-emerald">
                      <CheckCircle2 className="h-3 w-3" />
                      {availCount} free
                    </span>
                    <span className="badge-red">
                      <UserRound className="h-3 w-3" />
                      {occupied}/{ward.beds.length}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {ward.beds.map((bed, i) => {
                    const cfg = STATUS_CONFIG[bed.status];
                    const isAvailable = bed.status === 'available';
                    return (
                      <motion.button
                        key={bed.id}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03, duration: 0.3 }}
                        whileHover={{ scale: 1.04, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleBedClick(bed, ward.name)}
                        className={`relative flex flex-col items-start rounded-xl border-2 ${cfg.border} ${cfg.bg} p-3.5 text-left transition-all duration-200 ${
                          isAvailable ? 'glow-emerald hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10' : 'hover:shadow-lg'
                        }`}
                      >
                        {isAvailable && (
                          <div className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-50" />
                          </div>
                        )}
                        <div className="flex w-full items-center justify-between">
                          <span className="text-base font-extrabold tracking-tight text-gray-900">{bed.number}</span>
                          {!isAvailable && <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot} ring-2 ring-white/80`} />}
                        </div>
                        <span className={`mt-1.5 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide ${TYPE_COLORS[bed.type]}`}>
                          {bed.type}
                        </span>
                        <div className="mt-2.5 min-h-[2.5rem] w-full">
                          {bed.status === 'occupied' && bed.patient && (
                            <div className="space-y-1">
                              <p className="truncate text-xs font-semibold text-gray-800">{bed.patient.name}</p>
                              <div className="flex items-center gap-1.5">
                                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 text-[8px] font-bold text-indigo-700">
                                  {bed.patient.doctorInitials}
                                </div>
                                <span className="text-[10px] text-gray-400">{bed.patient.doctor.split(' ').slice(-1)}</span>
                              </div>
                            </div>
                          )}
                          {bed.status === 'cleaning' && (
                            <div className="flex items-center gap-1.5 text-amber-600">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100">
                                <Clock className="h-3 w-3" />
                              </div>
                              <span className="text-xs font-semibold">{bed.cleaningMinutesLeft}m</span>
                            </div>
                          )}
                          {bed.status === 'maintenance' && (
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200">
                                <Wrench className="h-3 w-3" />
                              </div>
                              <span className="text-[10px] font-medium">Under repair</span>
                            </div>
                          )}
                          {bed.status === 'available' && (
                            <div className="flex items-center gap-1.5">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              </div>
                              <p className="text-xs font-semibold text-emerald-600">Ready</p>
                            </div>
                          )}
                          {bed.status === 'reserved' && (
                            <div className="flex items-center gap-1.5">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100">
                                <Clock className="h-3 w-3 text-purple-600" />
                              </div>
                              <p className="truncate text-[10px] font-semibold text-purple-600">{bed.reservedFor}</p>
                            </div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      <div className="mt-8 card-glass flex flex-wrap items-center gap-5 px-6 py-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Legend</span>
        <div className="h-4 w-px bg-gray-200" />
        {(Object.entries(STATUS_CONFIG) as [BedStatus, (typeof STATUS_CONFIG)[BedStatus]][]).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${cfg.dot} ring-2 ring-white shadow-sm`} />
            <span className="text-xs font-medium text-gray-600">{cfg.label}</span>
          </div>
        ))}
        <div className="h-4 w-px bg-gray-200" />
        {(['ICU', 'General', 'Private'] as BedType[]).map((t) => (
          <div key={t} className="flex items-center gap-1.5">
            <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide ${TYPE_COLORS[t]}`}>{t}</span>
          </div>
        ))}
      </div>

      {/* Add Bed Modal */}
      <AnimatePresence>
        {showAddBedModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddBedModal(false)} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 z-50 w-[min(100%,400px)] -translate-x-1/2 -translate-y-1/2 card rounded-2xl p-0 shadow-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-bold">
                    <Plus className="h-5 w-5" />
                    Add New Bed
                  </h3>
                  <button onClick={() => setShowAddBedModal(false)} className="rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Ward</label>
                  <select className="input" value={newBedWardId} onChange={(e) => setNewBedWardId(e.target.value)}>
                    {allWards.map((w) => (
                      <option key={w.id} value={w.id}>{w.name} ({w.floorLabel})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Bed Number</label>
                  <input className="input" placeholder="e.g. 501" value={newBedNumber} onChange={(e) => setNewBedNumber(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Bed Type</label>
                  <div className="flex gap-2">
                    {(['General', 'ICU', 'Private'] as BedType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setNewBedType(t)}
                        className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
                          newBedType === t
                            ? `${TYPE_COLORS[t]} ring-2 ring-offset-1`
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleAddBed} className="btn-primary w-full py-3">
                  Add Bed
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bed Detail Side Panel */}
      <AnimatePresence>
        {selectedBed && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBed(null)}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-md"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-gray-200/40 bg-gradient-to-b from-white via-white to-gray-50/80 shadow-2xl scrollbar-thin"
            >
              {/* Panel Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100/80 bg-white/90 px-6 py-4 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${STATUS_CONFIG[selectedBed.status].bg} border ${STATUS_CONFIG[selectedBed.status].border}`}>
                    <Bed className={`h-5 w-5 ${STATUS_CONFIG[selectedBed.status].text}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-gray-900">Bed {selectedBed.number}</h2>
                    <p className="text-xs text-gray-400">{selectedWardName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBed(null)}
                  className="rounded-xl border border-gray-200/60 p-2 text-gray-400 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-600 hover:shadow-sm"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-6 p-6">
                {/* Bed Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Ward', value: selectedWardName },
                    { label: 'Floor', value: `Floor ${selectedFloor}` },
                    { label: 'Type', value: selectedBed.type },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-gray-100/80 bg-gradient-to-br from-gray-50/80 to-gray-50/40 p-3.5 transition-colors hover:border-gray-200">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{item.label}</p>
                      <p className="mt-1 text-sm font-bold text-gray-800">{item.value}</p>
                    </div>
                  ))}
                  <div className="rounded-xl border border-gray-100/80 bg-gradient-to-br from-gray-50/80 to-gray-50/40 p-3.5 transition-colors hover:border-gray-200">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</p>
                    <span className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_CONFIG[selectedBed.status].badge} ring-1 ring-inset ring-current/10`}>
                      <span className={`h-2 w-2 rounded-full ${STATUS_CONFIG[selectedBed.status].dot}`} />
                      {STATUS_CONFIG[selectedBed.status].label}
                    </span>
                  </div>
                </div>

                {/* Patient Info */}
                {selectedBed.status === 'occupied' && selectedBed.patient && (
                  <div className="space-y-4 rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/20">
                        {selectedBed.patient.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{selectedBed.patient.name}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{selectedBed.patient.doctor}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-gray-50/80 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Admitted</p>
                        <p className="mt-0.5 text-xs font-bold text-gray-700">{new Date(selectedBed.patient.admissionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50/80 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Expected Discharge</p>
                        <p className="mt-0.5 text-xs font-bold text-gray-700">{new Date(selectedBed.patient.expectedDischarge).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>

                    {/* Readmission Risk */}
                    <div className={`rounded-xl ${getRiskColor(selectedBed.patient.readmissionRisk).bg} p-4 ring-1 ring-inset ${getRiskColor(selectedBed.patient.readmissionRisk).ring}`}>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                          <ShieldAlert className="h-4 w-4" />
                          Readmission Risk
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getRiskColor(selectedBed.patient.readmissionRisk).text} ${getRiskColor(selectedBed.patient.readmissionRisk).bg}`}>
                            {getRiskLabel(selectedBed.patient.readmissionRisk)}
                          </span>
                          <span className={`text-lg font-extrabold ${getRiskColor(selectedBed.patient.readmissionRisk).text}`}>
                            {selectedBed.patient.readmissionRisk}
                            <span className="text-xs font-medium text-gray-400">/100</span>
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/60">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedBed.patient.readmissionRisk}%` }}
                          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                          className={`h-full rounded-full ${getRiskColor(selectedBed.patient.readmissionRisk).bar}`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Quick Actions</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { icon: Sparkles, label: 'Discharge', hoverBg: 'hover:bg-emerald-50', hoverBorder: 'hover:border-emerald-200', hoverText: 'hover:text-emerald-700', gradient: 'from-emerald-500 to-emerald-600', action: () => { toast.success(`Discharge initiated for Bed ${selectedBed?.number}`, { description: 'Housekeeping notified for cleaning.' }); setSelectedBed(null); } },
                      { icon: ArrowRightLeft, label: 'Transfer', hoverBg: 'hover:bg-blue-50', hoverBorder: 'hover:border-blue-200', hoverText: 'hover:text-blue-700', gradient: 'from-blue-500 to-blue-600', action: () => toast.info(`Transfer request created for Bed ${selectedBed?.number}`, { description: 'Awaiting ward coordinator approval.' }) },
                      { icon: ClipboardEdit, label: 'Update', hoverBg: 'hover:bg-amber-50', hoverBorder: 'hover:border-amber-200', hoverText: 'hover:text-amber-700', gradient: 'from-amber-500 to-amber-600', action: () => toast.info(`Bed ${selectedBed?.number} status updated`) },
                    ].map((act) => {
                      const ActionIcon = act.icon;
                      return (
                        <button
                          key={act.label}
                          onClick={act.action}
                          className={`group/action flex flex-col items-center gap-2 rounded-xl border border-gray-200/80 bg-white px-3 py-4 text-xs font-semibold text-gray-600 shadow-sm transition-all duration-200 ${act.hoverBg} ${act.hoverBorder} ${act.hoverText} hover:shadow-md hover:-translate-y-0.5`}
                        >
                          <div className={`rounded-lg bg-gray-100 p-2 transition-all duration-200 group-hover/action:bg-gradient-to-br group-hover/action:${act.gradient} group-hover/action:text-white group-hover/action:shadow-md`}>
                            <ActionIcon className="h-4 w-4" />
                          </div>
                          {act.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Assignment History */}
                {selectedBed.history.length > 0 && (
                  <div className="space-y-3">
                    <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                      <History className="h-3.5 w-3.5" />
                      Assignment History
                    </p>
                    <div className="relative space-y-0">
                      <div className="absolute bottom-2 left-5 top-2 w-px bg-gradient-to-b from-indigo-200 via-gray-200 to-transparent" />
                      {selectedBed.history.slice(0, 3).map((h, i) => (
                        <div key={i} className="relative flex gap-3.5 py-2">
                          <div className="relative z-10 mt-1 flex h-3 w-3 shrink-0 items-center justify-center rounded-full border-2 border-indigo-300 bg-white ml-[14px]" />
                          <div className="flex-1 rounded-xl border border-gray-100/80 bg-gradient-to-r from-gray-50/80 to-white p-3.5 transition-all duration-200 hover:border-gray-200 hover:shadow-sm">
                            <p className="text-sm font-bold text-gray-800">{h.patient}</p>
                            <p className="mt-1 text-[11px] font-medium text-gray-400">
                              {new Date(h.from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(h.to).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
