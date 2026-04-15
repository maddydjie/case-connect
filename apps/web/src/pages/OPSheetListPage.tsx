import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { pdf } from '@react-pdf/renderer';
import {
  ClipboardList,
  Download,
  Filter,
  Search,
  FileText,
  X,
  Loader2,
  AlertTriangle,
  Printer,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { debounce, searchIcd10Cm, type Icd10Result } from '@/lib/icd10';
import {
  PrescriptionPdfDocument,
  type PrescriptionDrugRow,
} from '@/components/prescription/PrescriptionPdfDocument';
import { EmptyState } from '@/components/ui/PageStates';
import { analyzeSymptomsAI, suggestForOPSheet, type AIEntities } from '@/lib/medicalAI';
import { getModelName } from '@/lib/openrouter';
import { Sparkles, Save, CheckCircle2 } from 'lucide-react';
import { useCaseStore, type InvestigationOrder } from '@/stores/case.store';
import { useAuthStore } from '@/stores/auth.store';

type OpStatus = 'draft' | 'final' | 'signed';

interface OpSheetRow {
  id: string;
  patientName: string;
  mrn: string;
  visitDate: string;
  status: OpStatus;
  department: string;
}

const MOCK_ROWS: OpSheetRow[] = [
  {
    id: 'op-1001',
    patientName: 'Rajesh Sharma',
    mrn: 'MRN-00451',
    visitDate: '2026-04-03',
    status: 'final',
    department: 'Cardiology',
  },
  {
    id: 'op-1002',
    patientName: 'Priya Nair',
    mrn: 'MRN-00672',
    visitDate: '2026-04-02',
    status: 'draft',
    department: 'General Medicine',
  },
  {
    id: 'op-1003',
    patientName: 'Amit Patel',
    mrn: 'MRN-00893',
    visitDate: '2026-04-01',
    status: 'signed',
    department: 'Orthopedics',
  },
];

const DEFAULT_RX: PrescriptionDrugRow = {
  genericNameCaps: '',
  dosageForm: '',
  strength: '',
  route: 'Oral',
  frequency: '',
  duration: '',
  totalQuantity: '',
};

export default function OPSheetListPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [patientQ, setPatientQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<OpStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rows, setRows] = useState<OpSheetRow[]>(MOCK_ROWS);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newMrn, setNewMrn] = useState('');
  const [newDept, setNewDept] = useState('General Medicine');
  const [newChiefComplaint, setNewChiefComplaint] = useState('');

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const handleCreateNew = () => {
    if (!newPatientName.trim()) {
      toast.error('Patient name is required');
      return;
    }
    const newRow: OpSheetRow = {
      id: `op-${Date.now()}`,
      patientName: newPatientName.trim(),
      mrn: newMrn.trim() || `MRN-${String(Date.now()).slice(-5)}`,
      visitDate: format(new Date(), 'yyyy-MM-dd'),
      status: 'draft',
      department: newDept,
    };
    setRows((prev) => [newRow, ...prev]);
    setSelectedId(newRow.id);
    setCreatingNew(false);
    setNewPatientName('');
    setNewMrn('');
    setNewChiefComplaint('');

    if (newChiefComplaint.trim()) {
      toast.info(`Asking ${getModelName()} for diagnoses…`);
      analyzeSymptomsAI([newChiefComplaint], '', '').then((ai) => {
        if (ai.suggestedDiagnoses.length > 0) {
          setDiagnoses(ai.suggestedDiagnoses.map((d) => `${d.icdCode} — ${d.name}`));
          toast.success(`AI diagnoses applied via ${ai.modelUsed}`);
        }
      }).catch(() => toast.error('AI suggestion failed'));
    } else {
      toast.success('New OP Sheet created');
    }
  };

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (dateFrom && r.visitDate < dateFrom) return false;
      if (patientQ) {
        const q = patientQ.toLowerCase();
        if (!r.patientName.toLowerCase().includes(q) && !r.mrn.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [dateFrom, patientQ, statusFilter]);

  const [doctorName, setDoctorName] = useState('Dr. Rajesh Sharma');
  const [qualifications, setQualifications] = useState('MD, DM (Cardiology)');
  const [nmcRegistration, setNmcRegistration] = useState('123456');
  const [hospitalName, setHospitalName] = useState('CaseConnect Multi-Specialty Hospital');
  const [hospitalAddress, setHospitalAddress] = useState('New Delhi, India');
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('M');
  const [weightKg, setWeightKg] = useState('');
  const [address, setAddress] = useState('');
  const [icdQuery, setIcdQuery] = useState('');
  const [icdResults, setIcdResults] = useState<Icd10Result[]>([]);
  const [icdLoading, setIcdLoading] = useState(false);
  const [icdOpen, setIcdOpen] = useState(false);
  const [diagnoses, setDiagnoses] = useState<string[]>([]);
  const [drugs, setDrugs] = useState<PrescriptionDrugRow[]>([{ ...DEFAULT_RX }]);
  const [refillNote, setRefillNote] = useState('Do not refill without review.');
  const [opAiLoading, setOpAiLoading] = useState(false);
  const [opAiResult, setOpAiResult] = useState<AIEntities | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [opInvestigations, setOpInvestigations] = useState<{ id: string; name: string; reasoning: string }[]>([]);
  const [opInvestigationInput, setOpInvestigationInput] = useState('');
  const [opSaving, setOpSaving] = useState(false);
  const [currentOpStatus, setCurrentOpStatus] = useState<'draft' | 'final' | 'signed'>('draft');

  const addOPSheetToStore = useCaseStore((s) => s.addOPSheet);
  const updateOPSheetInStore = useCaseStore((s) => s.updateOPSheet);
  const addInvestigationOrder = useCaseStore((s) => s.addInvestigationOrder);
  const addToHistory = useCaseStore((s) => s.addToHistory);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (selected) {
      setCurrentOpStatus(selected.status);
    }
  }, [selected?.id]);

  const handleSaveOpSheet = useCallback(async () => {
    if (!selected) return;
    setOpSaving(true);
    const now = new Date().toISOString();
    const opData = {
      id: selected.id,
      status: currentOpStatus,
      createdAt: selected.visitDate,
      updatedAt: now,
      patientName,
      mrn: selected.mrn,
      department: selected.department,
      chiefComplaint: '',
      doctorName,
      qualifications,
      nmcRegistration,
      hospitalName,
      hospitalAddress,
      age,
      gender,
      weightKg,
      address,
      diagnoses,
      drugs: drugs.map((d) => ({
        genericNameCaps: d.genericNameCaps,
        dosageForm: d.dosageForm,
        strength: d.strength,
        route: d.route,
        frequency: d.frequency,
        duration: d.duration,
        totalQuantity: d.totalQuantity,
      })),
      investigations: [],
      refillNote,
    };
    addOPSheetToStore(opData as any);

    opInvestigations.forEach((inv) => {
      addInvestigationOrder({
        id: inv.id,
        name: inv.name,
        reasoning: inv.reasoning,
        status: 'ordered',
        linkedTo: { type: 'opsheet', id: selected.id },
        patientName,
        orderedAt: now,
      });
    });

    addToHistory('diagnoses', diagnoses);
    addToHistory('medications', drugs.filter((d) => d.genericNameCaps).map((d) => d.genericNameCaps));
    addToHistory('investigations', opInvestigations.map((inv) => inv.name));

    setRows((prev) => prev.map((r) => (r.id === selected.id ? { ...r, status: currentOpStatus } : r)));

    await new Promise((r) => setTimeout(r, 500));
    setOpSaving(false);
    toast.success(`OP Sheet saved as ${currentOpStatus}`);
  }, [selected, currentOpStatus, patientName, doctorName, qualifications, nmcRegistration, hospitalName, hospitalAddress, age, gender, weightKg, address, diagnoses, drugs, opInvestigations, refillNote, addOPSheetToStore, addInvestigationOrder, addToHistory]);

  const handleOpStatusChange = useCallback((status: 'draft' | 'final' | 'signed') => {
    setCurrentOpStatus(status);
    if (selected) {
      setRows((prev) => prev.map((r) => (r.id === selected.id ? { ...r, status } : r)));
    }
  }, [selected]);

  const handleOpAiSuggest = useCallback(async () => {
    const complaint = selected?.patientName ? `Visit for ${selected.patientName}` : '';
    const dxList = diagnoses.map((d) => d.replace(/^[A-Z0-9.]+ — /, ''));
    if (dxList.length === 0 && !complaint) {
      toast.error('Add a diagnosis or chief complaint first');
      return;
    }
    setOpAiLoading(true);
    try {
      const result = await suggestForOPSheet(dxList.join(', '), dxList);
      setOpAiResult(result);
      if (result.suggestedPrescriptions && result.suggestedPrescriptions.length > 0) {
        const newDrugs: PrescriptionDrugRow[] = result.suggestedPrescriptions.map((p) => ({
          genericNameCaps: (p.genericName || p.drug).toUpperCase(),
          dosageForm: p.form || 'Tab',
          strength: p.strength || '',
          route: p.route || 'Oral',
          frequency: p.frequency || '',
          duration: p.duration || '',
          totalQuantity: '',
        }));
        setDrugs(newDrugs);
      } else if (result.suggestedMedications.length > 0) {
        const newDrugs: PrescriptionDrugRow[] = result.suggestedMedications.map((m) => ({
          genericNameCaps: m.name.toUpperCase().replace(/^TAB\.\s*|^CAP\.\s*|^INJ\.\s*|^SYP\.\s*/i, ''),
          dosageForm: m.name.match(/^(Tab|Cap|Inj|Syp)/i)?.[1] ?? 'Tab',
          strength: m.name.match(/\d+\s*mg/i)?.[0] ?? '',
          route: 'Oral',
          frequency: m.dosage,
          duration: '',
          totalQuantity: '',
        }));
        setDrugs(newDrugs);
      }
      if (result.suggestedDiagnoses.length > 0) {
        const aiDx = result.suggestedDiagnoses.map((d) => `${d.icdCode} — ${d.name}`);
        setDiagnoses((prev) => {
          const combined = [...prev];
          aiDx.forEach((d) => { if (!combined.includes(d)) combined.push(d); });
          return combined;
        });
      }
      toast.success(`AI suggestions applied via ${result.modelUsed}`);
    } catch {
      toast.error('AI suggestion failed');
    } finally {
      setOpAiLoading(false);
    }
  }, [selected, diagnoses]);

  useEffect(() => {
    if (!selected) return;
    setPatientName(selected.patientName);
    setAge(selected.patientName === 'Rajesh Sharma' ? '58' : '40');
    setAddress('Sample address, India');
  }, [selected]);

  const runIcdSearch = useCallback(async (q: string) => {
    abortRef.current?.abort();
    if (q.trim().length < 2) {
      setIcdResults([]);
      return;
    }
    const ac = new AbortController();
    abortRef.current = ac;
    setIcdLoading(true);
    try {
      const list = await searchIcd10Cm(q, ac.signal);
      setIcdResults(list);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        toast.error('ICD-10 lookup failed. Check network or try again.');
        setIcdResults([]);
      }
    } finally {
      setIcdLoading(false);
    }
  }, []);

  const debouncedIcd = useMemo(() => debounce(runIcdSearch, 300), [runIcdSearch]);

  useEffect(() => {
    debouncedIcd(icdQuery);
  }, [icdQuery, debouncedIcd]);

  const addDiagnosis = (code: string, name: string) => {
    const line = `${code} — ${name}`;
    if (!diagnoses.includes(line)) setDiagnoses((d) => [...d, line]);
    setIcdQuery('');
    setIcdOpen(false);
  };

  const updateDrug = (i: number, patch: Partial<PrescriptionDrugRow>) => {
    setDrugs((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const addDrugRow = () => setDrugs((r) => [...r, { ...DEFAULT_RX, genericNameCaps: '' }]);

  const exportPdf = async () => {
    try {
      const doc = (
        <PrescriptionPdfDocument
          doctorName={doctorName}
          qualifications={qualifications}
          nmcRegistration={nmcRegistration}
          hospitalName={hospitalName}
          hospitalAddress={hospitalAddress}
          patientName={patientName}
          age={age}
          gender={gender}
          weightKg={weightKg || '—'}
          address={address}
          date={format(new Date(), 'dd MMM yyyy')}
          diagnosisIcd={diagnoses}
          drugs={drugs.filter((d) => d.genericNameCaps.trim())}
          refillNote={refillNote}
          signatureLine={`${doctorName} | Reg. ${nmcRegistration}`}
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription-${selected?.mrn ?? 'patient'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Prescription PDF downloaded');
    } catch {
      toast.error('Could not generate PDF');
    }
  };

  const printPrescription = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="gradient-text">OP Sheets</span>
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            NMC-compliant prescriptions · ICD-10-CM · PDF export
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCreatingNew(true)}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            New OP Sheet
          </button>
          <div className="stat-card flex items-center gap-3 px-4 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
              <ClipboardList className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{rows.length}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Total visits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card p-5 print:hidden">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <Filter className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
          </div>
          Filters
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
              From date
            </label>
            <input
              type="date"
              className="input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Patient / MRN
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-10"
                placeholder="Search..."
                value={patientQ}
                onChange={(e) => setPatientQ(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Status
            </label>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OpStatus | 'all')}
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="final">Final</option>
              <option value="signed">Signed</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="btn-secondary w-full text-sm"
              onClick={() => {
                setDateFrom('');
                setPatientQ('');
                setStatusFilter('all');
              }}
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      {/* New OP Sheet Form */}
      {creatingNew && (
        <div className="card overflow-hidden border-emerald-200/60 print:hidden">
          <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 px-5 py-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Create New OP Sheet</h3>
              <button onClick={() => setCreatingNew(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Patient Name *</label>
                <input className="input" placeholder="e.g. Amit Patel" value={newPatientName} onChange={(e) => setNewPatientName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">MRN (auto-generated if empty)</label>
                <input className="input" placeholder="MRN-XXXXX" value={newMrn} onChange={(e) => setNewMrn(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Department</label>
                <select className="input" value={newDept} onChange={(e) => setNewDept(e.target.value)}>
                  {['General Medicine', 'Cardiology', 'Orthopedics', 'Neurology', 'Pulmonology', 'Dermatology', 'ENT', 'Pediatrics'].map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Chief Complaint (AI will suggest ICD codes)</label>
                <input className="input" placeholder="e.g. chest pain, fever..." value={newChiefComplaint} onChange={(e) => setNewChiefComplaint(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary text-sm" onClick={() => setCreatingNew(false)}>Cancel</button>
              <button type="button" className="btn-primary text-sm inline-flex items-center gap-1.5" onClick={handleCreateNew}>
                <Plus className="h-3.5 w-3.5" />
                Create OP Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12 print:block">
        {/* Visit list */}
        <div className="lg:col-span-5 print:hidden">
          <div className="card overflow-hidden">
            <div className="border-b border-gray-100 dark:border-gray-800/80 px-5 py-3.5 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900 dark:text-white">Visits</span>
              <span className="badge-blue">{filtered.length} shown</span>
            </div>
            {filtered.length === 0 ? (
              <EmptyState
                title="No OP sheets match filters"
                description="Adjust filters or create a new visit from Case Sheets."
              />
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800/80 max-h-[520px] overflow-y-auto scrollbar-thin">
                {filtered.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(row.id)}
                      className={`flex w-full flex-col gap-1.5 px-5 py-4 text-left transition-all duration-200 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 ${
                        selectedId === row.id
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-l-2 border-l-emerald-500'
                          : 'border-l-2 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {row.patientName}
                        </span>
                        <StatusBadge status={row.status} />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {row.mrn} · {row.visitDate} · {row.department}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Prescription editor */}
        <div className="lg:col-span-7">
          {!selected ? (
            <div className="card p-10 print:hidden">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                  <ClipboardList className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="mt-4 font-semibold text-gray-700 dark:text-gray-300">
                  Select a visit to edit prescription
                </p>
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                  NMC format with ICD-10 autocomplete and PDF export.
                </p>
              </div>
            </div>
          ) : (
            <div
              id="op-prescription-print"
              className="card overflow-hidden print:shadow-none print:border-gray-300"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800/80 bg-gradient-to-r from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 px-5 py-3.5 print:hidden">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                    <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    Prescription · {selected.patientName}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn-secondary inline-flex items-center gap-2 text-sm" onClick={printPrescription}>
                    <Printer className="h-4 w-4" />
                    Print
                  </button>
                  <button
                    type="button"
                    className="btn-primary inline-flex items-center gap-2 text-sm"
                    onClick={exportPdf}
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-100 px-3 py-2 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-200 disabled:opacity-50 dark:bg-violet-900/40 dark:text-violet-300"
                    onClick={handleOpAiSuggest}
                    disabled={opAiLoading}
                  >
                    {opAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    AI Suggest
                  </button>
                  <button
                    type="button"
                    className="btn-primary inline-flex items-center gap-2 text-sm"
                    onClick={handleSaveOpSheet}
                    disabled={opSaving}
                  >
                    {opSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                  </button>
                  <button
                    type="button"
                    className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setSelectedId(null)}
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-6 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 print:hidden">
                  <div className="flex items-center gap-1.5 rounded-lg border border-gray-200/60 bg-white/50 px-1.5 py-1">
                    {(['draft', 'final', 'signed'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleOpStatusChange(s)}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                          currentOpStatus === s
                            ? s === 'signed' ? 'bg-emerald-100 text-emerald-700' : s === 'final' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400">Status: {currentOpStatus}</span>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800/50 px-4 py-3 print:hidden">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    Validate billability of ICD codes with your billing team. NLM search is for coding assistance only.
                  </p>
                </div>

                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Doctor & Hospital</p>
                  <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
                    <Field label="Doctor name" value={doctorName} onChange={setDoctorName} />
                    <Field label="Qualifications" value={qualifications} onChange={setQualifications} />
                    <Field label="NMC registration no." value={nmcRegistration} onChange={setNmcRegistration} />
                    <Field label="Hospital" value={hospitalName} onChange={setHospitalName} />
                    <div className="sm:col-span-2">
                      <Field label="Hospital address" value={hospitalAddress} onChange={setHospitalAddress} />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Patient Details</p>
                  <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
                    <Field label="Patient name" value={patientName} onChange={setPatientName} />
                    <Field label="Age" value={age} onChange={setAge} />
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Gender
                      </label>
                      <select
                        className="input"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                      >
                        <option value="M">M</option>
                        <option value="F">F</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <Field label="Weight (kg)" value={weightKg} onChange={setWeightKg} />
                    <div className="sm:col-span-2">
                      <Field label="Patient address" value={address} onChange={setAddress} />
                    </div>
                  </div>
                </div>

                {/* ICD-10 */}
                <div className="relative print:hidden">
                  <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                    ICD-10-CM search (NLM)
                  </label>
                  <div className="relative">
                    <input
                      className="input"
                      placeholder="Type e.g. diabetes, I10..."
                      value={icdQuery}
                      onChange={(e) => {
                        setIcdQuery(e.target.value);
                        setIcdOpen(true);
                      }}
                      onFocus={() => setIcdOpen(true)}
                    />
                    {icdLoading && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
                    )}
                  </div>
                  {icdOpen && icdResults.length > 0 && (
                    <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white/95 dark:bg-gray-950/95 shadow-lg backdrop-blur-xl">
                      {icdResults.map((r) => (
                        <li key={r.code}>
                          <button
                            type="button"
                            className="flex w-full flex-col px-4 py-2.5 text-left text-sm transition-colors hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20"
                            onClick={() => addDiagnosis(r.code, r.name)}
                          >
                            <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">{r.code}</span>
                            <span className="text-gray-800 dark:text-gray-200">{r.name}</span>
                            {!r.likelyBillable && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400">Review billability</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Selected diagnoses
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {diagnoses.map((d) => (
                      <span
                        key={d}
                        className="badge-emerald"
                      >
                        {d}
                        <button
                          type="button"
                          className="print:hidden ml-1 rounded-full p-0.5 transition-colors hover:bg-emerald-200/50 dark:hover:bg-emerald-800/50"
                          onClick={() => setDiagnoses((x) => x.filter((y) => y !== d))}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between print:hidden">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Drugs (CAPS generic)
                    </p>
                    <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400" onClick={addDrugRow}>
                      <Plus className="h-3.5 w-3.5" />
                      Add line
                    </button>
                  </div>
                  <div className="space-y-3">
                    {drugs.map((d, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-50/30 dark:bg-gray-800/20 p-4 space-y-3 print:break-inside-avoid transition-colors hover:border-gray-300 dark:hover:border-gray-600"
                      >
                        <input
                          className="input font-semibold uppercase"
                          value={d.genericNameCaps}
                          onChange={(e) => updateDrug(i, { genericNameCaps: e.target.value.toUpperCase() })}
                          placeholder="GENERIC NAME"
                        />
                        <div className="grid gap-2 sm:grid-cols-3">
                          <Mini label="Form" v={d.dosageForm} onChange={(v) => updateDrug(i, { dosageForm: v })} />
                          <Mini label="Strength" v={d.strength} onChange={(v) => updateDrug(i, { strength: v })} />
                          <Mini label="Route" v={d.route} onChange={(v) => updateDrug(i, { route: v })} />
                          <Mini label="Frequency" v={d.frequency} onChange={(v) => updateDrug(i, { frequency: v })} />
                          <Mini label="Duration" v={d.duration} onChange={(v) => updateDrug(i, { duration: v })} />
                          <Mini label="Total qty" v={d.totalQuantity} onChange={(v) => updateDrug(i, { totalQuantity: v })} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Refill instructions
                  </label>
                  <input
                    className="input"
                    value={refillNote}
                    onChange={(e) => setRefillNote(e.target.value)}
                  />
                </div>

                {/* Investigation Orders */}
                <div className="print:hidden">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Investigation Orders
                    </p>
                    <span className="text-[10px] text-gray-400">{opInvestigations.length} ordered</span>
                  </div>
                  {opInvestigations.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {opInvestigations.map((inv) => (
                        <div key={inv.id} className="flex items-start justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/30 dark:border-blue-800/40 dark:bg-blue-950/20 px-4 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{inv.name}</p>
                            {inv.reasoning && <p className="mt-0.5 text-[10px] text-gray-500">{inv.reasoning}</p>}
                          </div>
                          <button onClick={() => setOpInvestigations((prev) => prev.filter((i) => i.id !== inv.id))} className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add investigation (e.g. CBC, ECG)..."
                      value={opInvestigationInput}
                      onChange={(e) => setOpInvestigationInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && opInvestigationInput.trim()) {
                          e.preventDefault();
                          setOpInvestigations((prev) => [...prev, { id: `inv-${Date.now()}`, name: opInvestigationInput.trim(), reasoning: '' }]);
                          setOpInvestigationInput('');
                        }
                      }}
                      className="input flex-1"
                    />
                    <button
                      onClick={() => {
                        if (opInvestigationInput.trim()) {
                          setOpInvestigations((prev) => [...prev, { id: `inv-${Date.now()}`, name: opInvestigationInput.trim(), reasoning: '' }]);
                          setOpInvestigationInput('');
                        }
                      }}
                      className="btn-secondary px-3"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {opAiResult && opAiResult.suggestedInvestigations.length > 0 && (
                  <div className="print:hidden">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      AI-Recommended Investigations
                    </p>
                    <div className="space-y-1.5">
                      {opAiResult.suggestedInvestigations.map((inv) => {
                        const alreadyOrdered = opInvestigations.some((o) => o.name === inv.name);
                        return (
                          <div key={inv.name} className="flex items-start justify-between gap-2 rounded-lg border border-violet-100 bg-violet-50/30 px-3 py-2 dark:border-violet-800/40 dark:bg-violet-950/20">
                            <div>
                              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{inv.name}</span>
                              <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">{inv.reasoning}</p>
                            </div>
                            <button
                              onClick={() => {
                                if (!alreadyOrdered) {
                                  setOpInvestigations((prev) => [...prev, { id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, name: inv.name, reasoning: inv.reasoning }]);
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
                    <p className="mt-2 text-[10px] text-violet-500">Suggested by {opAiResult.modelUsed}</p>
                  </div>
                )}

                <p className="rounded-xl bg-gray-50/60 dark:bg-gray-800/30 px-4 py-3 text-xs text-gray-500 dark:text-gray-400 print:block">
                  Habit-forming drugs: document separately as per NMC · DPDP: clinical consent distinct
                  from data processing consent.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OpStatus }) {
  const cls: Record<OpStatus, string> = {
    draft: 'badge-amber',
    final: 'badge-blue',
    signed: 'badge-emerald',
  };
  return <span className={cls[status]}>{status}</span>;
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Mini({
  label,
  v,
  onChange,
}: {
  label: string;
  v: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</label>
      <input
        className="input py-2 text-sm"
        value={v}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
