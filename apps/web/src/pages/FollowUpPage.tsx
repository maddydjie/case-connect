import { useCallback, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  Activity,
  AlertTriangle,
  CalendarCheck,
  ChevronRight,
  HeartPulse,
  Stethoscope,
  Sparkles,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/PageStates';
import { useCaseStore, type CaseSheet, type DailyNote } from '@/stores/case.store';
import { chatCompletion, getModelName } from '@/lib/openrouter';

const ICU_LETTER_COLORS: Record<string, string> = {
  A: 'from-red-500 to-rose-600',
  B: 'from-sky-500 to-blue-600',
  C: 'from-rose-500 to-pink-600',
  D: 'from-violet-500 to-purple-600',
  E: 'from-amber-500 to-orange-600',
  F: 'from-cyan-500 to-teal-600',
  G: 'from-yellow-500 to-amber-600',
  H: 'from-indigo-500 to-blue-600',
  I: 'from-emerald-500 to-green-600',
  L: 'from-gray-500 to-slate-600',
};

const ICU_SECTIONS = [
  { k: 'A', l: 'Airway' },
  { k: 'B', l: 'Breathing' },
  { k: 'C', l: 'Circulation' },
  { k: 'D', l: 'Disability' },
  { k: 'E', l: 'Exposure' },
  { k: 'F', l: 'Fluids' },
  { k: 'G', l: 'Glucose' },
  { k: 'H', l: 'Head / Haem' },
  { k: 'I', l: 'Infection' },
  { k: 'L', l: 'Lines' },
];

function VitalDelta({ label, y, t }: { label: string; y: string; t: string }) {
  const parseBp = (s: string) => {
    const m = s.match(/(\d+)\s*\/\s*(\d+)/);
    return m ? { sys: Number(m[1]), dia: Number(m[2]) } : null;
  };
  const parseNum = (s: string) => Number(s.replace(/[^\d.]/g, '')) || 0;

  let alert = false;
  let deltaStr = '';
  if (label === 'BP') {
    const py = parseBp(y);
    const pt = parseBp(t);
    if (py && pt) {
      const d = Math.abs(pt.sys - py.sys);
      deltaStr = `${pt.sys - py.sys >= 0 ? '+' : ''}${pt.sys - py.sys} sys`;
      if (d >= 15) alert = true;
    }
  } else if (label === 'HR') {
    const d = parseNum(t) - parseNum(y);
    deltaStr = `${d >= 0 ? '+' : ''}${d}`;
    if (Math.abs(d) >= 15) alert = true;
  } else if (label === 'SpO2') {
    const d = parseNum(t) - parseNum(y);
    deltaStr = `${d >= 0 ? '+' : ''}${d}%`;
    if (d <= -2) alert = true;
  }

  return (
    <div
      className={clsx(
        'rounded-2xl border-2 p-3.5 transition-all duration-200',
        alert
          ? 'border-red-300 bg-gradient-to-br from-red-50 to-rose-50 shadow-sm shadow-red-200/30 glow-red dark:border-red-900 dark:from-red-950/40 dark:to-rose-950/40'
          : 'border-gray-200/60 bg-white hover:border-gray-300/60 hover:shadow-sm dark:border-gray-700 dark:bg-gray-950',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</span>
        {alert && <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />}
      </div>
      {y && <p className="mt-1.5 text-xs text-gray-400 line-through">{y}</p>}
      <p className="text-xl font-bold text-gray-900 dark:text-white">{t || '—'}</p>
      {deltaStr && (
        <p className={clsx('mt-0.5 text-[10px] font-semibold', alert ? 'text-red-600' : 'text-gray-500')}>
          Δ {deltaStr}
        </p>
      )}
    </div>
  );
}

export default function FollowUpPage() {
  const caseSheets = useCaseStore((s) => s.caseSheets);
  const investigationOrders = useCaseStore((s) => s.investigationOrders);
  const addDailyNote = useCaseStore((s) => s.addDailyNote);

  const followUpQueue = useMemo(() => {
    return caseSheets.filter((cs) => cs.status === 'in-progress' || cs.status === 'review');
  }, [caseSheets]);

  const [mode, setMode] = useState<'soap' | 'icu'>('soap');
  const [selectedId, setSelectedId] = useState<string | null>(followUpQueue[0]?.id ?? null);
  const selected = followUpQueue.find((cs) => cs.id === selectedId);

  const [todayNotes, setTodayNotes] = useState('');
  const [todayVitals, setTodayVitals] = useState({ BP: '', HR: '', RR: '', SpO2: '', Temp: '', GRBS: '', UOP: '', GCS: '' });
  const [icuNotes, setIcuNotes] = useState<Record<string, string>>({});
  const [aiPlanLoading, setAiPlanLoading] = useState(false);

  const deliveredInvestigations = useMemo(() => {
    if (!selected) return [];
    return investigationOrders.filter(
      (o) => o.status === 'delivered' && o.patientName === selected.patientName,
    );
  }, [selected, investigationOrders]);

  const yesterdayNote = useMemo(() => {
    if (!selected || selected.dailyNotes.length === 0) return null;
    return selected.dailyNotes[selected.dailyNotes.length - 1];
  }, [selected]);

  const yesterdaySoap = useMemo(() => {
    if (!yesterdayNote) {
      if (!selected) return '';
      const medsStr = selected.prescriptions?.length
        ? selected.prescriptions.map((p) => `${p.drug} ${p.strength}`).filter(Boolean).join(', ')
        : selected.medications.map((m) => m.name).filter(Boolean).join(', ');
      return `S: ${selected.complaints.join(', ') || 'No complaints recorded'}\nO: Vitals: ${selected.vitals.map((v) => `${v.label}: ${v.value}`).join(', ') || 'Not recorded'}\nA: ${selected.diagnoses.join(', ') || 'Pending assessment'}\nP: ${medsStr || 'Pending plan'}`;
    }
    return `S: ${yesterdayNote.subjective}\nO: ${yesterdayNote.objective}\nA: ${yesterdayNote.assessment}\nP: ${yesterdayNote.plan}`;
  }, [yesterdayNote, selected]);

  const yesterdayVitals = useMemo(() => {
    if (yesterdayNote && yesterdayNote.vitals.length > 0) {
      const v: Record<string, string> = {};
      yesterdayNote.vitals.forEach((vi) => { v[vi.label] = vi.value; });
      return v;
    }
    if (!selected) return {};
    const v: Record<string, string> = {};
    selected.vitals.forEach((vi) => { v[vi.label] = vi.value; });
    return v;
  }, [yesterdayNote, selected]);

  const handleSuggestPlan = useCallback(async () => {
    if (!selected) return;
    setAiPlanLoading(true);
    try {
      const context = `Patient: ${selected.patientName}, Age: ${selected.patientAge}, Gender: ${selected.patientGender}
Diagnoses: ${selected.diagnoses.join(', ')}
Current medications: ${selected.prescriptions?.length ? selected.prescriptions.map((p) => `${p.drug} ${p.strength} ${p.frequency}`).join(', ') : selected.medications.map((m) => `${m.name} ${m.dosage}`).join(', ')}
Yesterday's notes: ${yesterdaySoap}
Today's vitals so far: ${Object.entries(todayVitals).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ') || 'Not entered yet'}
Delivered investigation results: ${deliveredInvestigations.map((i) => `${i.name}: ${i.resultNotes || 'Result pending'}`).join(', ') || 'None'}`;

      const res = await chatCompletion([
        {
          role: 'system',
          content: 'You are a senior physician doing ward rounds. Based on the patient data, generate a concise SOAP note for today. Be specific with medication changes, vitals to monitor, and investigations to follow up. Format as S: / O: / A: / P: sections.',
        },
        { role: 'user', content: context },
      ], { temperature: 0.3, maxTokens: 800 });

      const text = res.choices?.[0]?.message?.content || '';
      setTodayNotes(text);
      toast.success(`Plan suggested by ${getModelName()}`);
    } catch {
      toast.error('AI suggestion failed. Try again.');
    } finally {
      setAiPlanLoading(false);
    }
  }, [selected, yesterdaySoap, todayVitals, deliveredInvestigations]);

  const handleSaveDailyNote = useCallback(() => {
    if (!selected) return;
    const lines = todayNotes.split('\n');
    const extract = (prefix: string) => lines.find((l) => l.startsWith(prefix))?.slice(prefix.length).trim() || '';

    const note: DailyNote = {
      date: new Date().toISOString(),
      subjective: extract('S:') || todayNotes,
      objective: extract('O:'),
      assessment: extract('A:'),
      plan: extract('P:'),
      vitals: Object.entries(todayVitals).filter(([, v]) => v).map(([k, v]) => ({ label: k, value: v })),
      investigationResults: deliveredInvestigations.map((i) => `${i.name}: ${i.resultNotes || 'Delivered'}`),
    };
    addDailyNote(selected.id, note);
    toast.success('Daily note saved');
  }, [selected, todayNotes, todayVitals, deliveredInvestigations, addDailyNote]);

  const dueToday = followUpQueue.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Follow-ups & Ward Rounds</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            SOAP split-panel · ICU ABCDEFGHIL · vital deltas · AI-assisted planning
          </p>
        </div>
        <div className="card-glass flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-emerald-500 shadow-sm">
            <CalendarCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-primary-900 dark:text-primary-100">{dueToday} follow-ups due today</p>
            <p className="text-xs text-primary-700/70 dark:text-primary-300/70">In-progress & review case sheets</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('soap')}
          className={clsx(
            'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200',
            mode === 'soap'
              ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-md shadow-gray-900/20 dark:from-white dark:to-gray-100 dark:text-gray-900'
              : 'bg-white/80 text-gray-600 ring-1 ring-gray-200/60 hover:bg-white hover:shadow-sm dark:bg-gray-800/80 dark:text-gray-300 dark:ring-gray-700/60',
          )}
        >
          <Stethoscope className="h-4 w-4" />
          SOAP rounds
        </button>
        <button
          type="button"
          onClick={() => setMode('icu')}
          className={clsx(
            'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200',
            mode === 'icu'
              ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-md shadow-gray-900/20 dark:from-white dark:to-gray-100 dark:text-gray-900'
              : 'bg-white/80 text-gray-600 ring-1 ring-gray-200/60 hover:bg-white hover:shadow-sm dark:bg-gray-800/80 dark:text-gray-300 dark:ring-gray-700/60',
          )}
        >
          <Activity className="h-4 w-4" />
          ICU ABCDEFGHIL
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Queue ({followUpQueue.length})</p>
          {followUpQueue.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-sm text-gray-500">No active case sheets.</p>
              <p className="text-xs text-gray-400 mt-1">Case sheets with "In Progress" or "Review" status appear here.</p>
            </div>
          ) : (
            followUpQueue.map((cs) => (
              <button
                key={cs.id}
                type="button"
                onClick={() => { setSelectedId(cs.id); setTodayNotes(''); }}
                className={clsx(
                  'flex w-full flex-col rounded-2xl border-2 p-4 text-left transition-all duration-200',
                  selectedId === cs.id
                    ? 'border-primary-500/60 bg-gradient-to-br from-primary-50 to-emerald-50 shadow-md shadow-primary-500/10 ring-1 ring-primary-400/20 dark:from-primary-950/30 dark:to-emerald-950/30'
                    : 'border-gray-200/60 bg-white hover:border-gray-300/60 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{cs.patientName || 'Unknown'}</span>
                  <span className={clsx(
                    'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase',
                    cs.status === 'review' ? 'badge-blue' : 'badge-amber',
                  )}>
                    {cs.status}
                  </span>
                </div>
                <span className="mt-1 text-xs text-gray-500">
                  {cs.department} · {cs.bed || 'No bed'} · MRN: {cs.patientMrn}
                </span>
                <span className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                  {cs.diagnoses.slice(0, 2).join(', ') || 'No diagnoses yet'}
                </span>
              </button>
            ))
          )}
        </aside>

        <section className="lg:col-span-8 space-y-4">
          {!selected ? (
            <EmptyState title="Select a patient" description="Choose from today's follow-up queue or create a case sheet with 'In Progress' status." />
          ) : mode === 'icu' ? (
            <div className="card dark:bg-gray-900 dark:border-gray-800 p-6">
              <div className="mb-5 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-sm">
                  <HeartPulse className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  ABCDEFGHIL — {selected.patientName}
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {ICU_SECTIONS.map((row) => (
                  <div
                    key={row.k}
                    className="rounded-2xl border border-gray-200/60 bg-gradient-to-br from-gray-50/80 to-white p-4 transition-all hover:shadow-sm dark:border-gray-700 dark:from-gray-950/50 dark:to-gray-900/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={clsx(
                        'flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-[11px] font-black text-white shadow-sm',
                        ICU_LETTER_COLORS[row.k] ?? 'from-gray-500 to-slate-600'
                      )}>
                        {row.k}
                      </span>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{row.l}</span>
                    </div>
                    <textarea
                      className="mt-2 w-full resize-none rounded-lg border border-gray-200/60 bg-white/80 p-2 text-sm text-gray-600 dark:text-gray-300 dark:bg-gray-900 dark:border-gray-700 focus:ring-1 focus:ring-primary-500/30"
                      rows={2}
                      placeholder={`${row.l} notes...`}
                      value={icuNotes[row.k] || ''}
                      onChange={(e) => setIcuNotes((prev) => ({ ...prev, [row.k]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Vital Deltas */}
              <div className="grid gap-3 sm:grid-cols-4">
                <VitalDelta label="BP" y={yesterdayVitals['BP Sys'] ? `${yesterdayVitals['BP Sys']}/${yesterdayVitals['BP Dia'] || ''}` : ''} t={todayVitals.BP} />
                <VitalDelta label="HR" y={yesterdayVitals['Pulse'] || ''} t={todayVitals.HR} />
                <VitalDelta label="SpO2" y={yesterdayVitals['SpO2'] || ''} t={todayVitals.SpO2} />
                <VitalDelta label="Temp °F" y={yesterdayVitals['Temp'] || ''} t={todayVitals.Temp} />
              </div>

              {/* SOAP Split Panel */}
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="card dark:bg-gray-900 dark:border-gray-800 overflow-hidden">
                  <div className="border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30 px-4 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300">
                    {yesterdayNote ? `Previous Note (${format(new Date(yesterdayNote.date), 'dd MMM')})` : 'Admission Data'}
                  </div>
                  <div className="space-y-2 p-4 font-mono text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {yesterdaySoap || '—'}
                  </div>
                </div>
                <div className="card dark:bg-gray-900 dark:border-gray-800 overflow-hidden ring-2 ring-primary-500/20 glow-emerald">
                  <div className="border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-primary-50 to-emerald-50 dark:from-primary-950/40 dark:to-emerald-950/30 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-primary-900 dark:text-primary-100">
                      Today
                      <ChevronRight className="h-4 w-4" />
                      <span className="text-xs font-normal opacity-80">{format(new Date(), 'dd MMM yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSuggestPlan}
                        disabled={aiPlanLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-violet-100 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700 transition-colors hover:bg-violet-200 disabled:opacity-50"
                      >
                        {aiPlanLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                        AI Suggest
                      </button>
                      <button
                        onClick={handleSaveDailyNote}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-200"
                      >
                        <FileCheck className="h-3.5 w-3.5" />
                        Save Note
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="min-h-[220px] w-full resize-y border-0 bg-transparent p-4 font-mono text-sm leading-relaxed text-gray-900 dark:text-white focus:ring-0"
                    value={todayNotes}
                    onChange={(e) => setTodayNotes(e.target.value)}
                    placeholder="S: Subjective findings...\nO: Objective findings...\nA: Assessment...\nP: Plan..."
                  />
                </div>
              </div>

              {/* Delivered Investigations */}
              {deliveredInvestigations.length > 0 && (
                <div className="card dark:bg-gray-900 dark:border-gray-800 p-5">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-emerald-600">Delivered Investigation Results</p>
                  <div className="space-y-2">
                    {deliveredInvestigations.map((inv) => (
                      <div key={inv.id} className="flex items-start justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/30 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{inv.name}</p>
                          {inv.resultNotes && <p className="mt-0.5 text-xs text-gray-500">{inv.resultNotes}</p>}
                          {inv.deliveredAt && <p className="mt-0.5 text-[10px] text-gray-400">Delivered {format(new Date(inv.deliveredAt), 'dd MMM HH:mm')}</p>}
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Delivered</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Vitals Entry */}
              <div className="card dark:bg-gray-900 dark:border-gray-800 p-5">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Quick vitals entry</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(Object.keys(todayVitals) as (keyof typeof todayVitals)[]).map((k) => (
                    <div key={k}>
                      <label className="mb-1.5 block text-[10px] font-semibold text-gray-500">{k}</label>
                      <input
                        className="input py-2 text-sm dark:bg-gray-950"
                        placeholder="—"
                        value={todayVitals[k]}
                        onChange={(e) => setTodayVitals((prev) => ({ ...prev, [k]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
