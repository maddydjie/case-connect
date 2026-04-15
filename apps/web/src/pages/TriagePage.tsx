import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertCircle, Copy, Stethoscope, Zap, HeartPulse, Brain, Timer, Plus, X, Sparkles, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import { triageSymptomsAI, type AIEntities } from '@/lib/medicalAI';
import { getModelName } from '@/lib/openrouter';

type Region = 'head' | 'chest' | 'abdomen' | 'limbs' | 'back' | null;

const CONDITIONS = ['Diabetes', 'Hypertension', 'Asthma', 'Heart disease', 'Pregnancy'];

const EMOJI_SCALE = ['😴', '😐', '😟', '😣', '😫', '😖', '😰', '😨', '😱', '🔥'];

type Urgency = 'blue' | 'green' | 'yellow' | 'orange' | 'red';

const REGION_LABELS: Record<string, string> = {
  head: 'Head',
  chest: 'Chest',
  abdomen: 'Abdomen',
  limbs: 'Limbs',
};

const URGENCY_CONFIG: Record<Urgency, { bg: string; border: string; glow: string; badge: string; gradientFrom: string; gradientTo: string; textMain: string; textSub: string }> = {
  red: {
    bg: 'bg-gradient-to-br from-red-50 via-red-50/50 to-orange-50 dark:from-red-950/60 dark:via-red-950/30 dark:to-orange-950/20',
    border: 'border-red-300 dark:border-red-800',
    glow: 'glow-red',
    badge: 'badge-red',
    gradientFrom: 'from-red-600',
    gradientTo: 'to-orange-600',
    textMain: 'text-red-900 dark:text-red-100',
    textSub: 'text-red-700 dark:text-red-200',
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-50 via-amber-50/50 to-yellow-50 dark:from-orange-950/50 dark:via-amber-950/20 dark:to-yellow-950/10',
    border: 'border-orange-300 dark:border-orange-800',
    glow: '',
    badge: 'badge-amber',
    gradientFrom: 'from-orange-600',
    gradientTo: 'to-amber-600',
    textMain: 'text-orange-900 dark:text-orange-100',
    textSub: 'text-orange-700 dark:text-orange-200',
  },
  yellow: {
    bg: 'bg-gradient-to-br from-amber-50 via-yellow-50/50 to-lime-50/30 dark:from-amber-950/40 dark:via-yellow-950/20 dark:to-lime-950/10',
    border: 'border-amber-300 dark:border-amber-800',
    glow: '',
    badge: 'badge-amber',
    gradientFrom: 'from-amber-600',
    gradientTo: 'to-yellow-600',
    textMain: 'text-amber-900 dark:text-amber-100',
    textSub: 'text-amber-700 dark:text-amber-200',
  },
  green: {
    bg: 'bg-gradient-to-br from-emerald-50 via-green-50/50 to-teal-50/30 dark:from-emerald-950/40 dark:via-green-950/20 dark:to-teal-950/10',
    border: 'border-emerald-300 dark:border-emerald-800',
    glow: 'glow-emerald',
    badge: 'badge-emerald',
    gradientFrom: 'from-emerald-600',
    gradientTo: 'to-teal-600',
    textMain: 'text-emerald-900 dark:text-emerald-100',
    textSub: 'text-emerald-700 dark:text-emerald-200',
  },
  blue: {
    bg: 'bg-gradient-to-br from-sky-50 via-blue-50/50 to-indigo-50/30 dark:from-sky-950/40 dark:via-blue-950/20 dark:to-indigo-950/10',
    border: 'border-sky-300 dark:border-sky-800',
    glow: 'glow-blue',
    badge: 'badge-blue',
    gradientFrom: 'from-sky-600',
    gradientTo: 'to-blue-600',
    textMain: 'text-sky-900 dark:text-sky-100',
    textSub: 'text-sky-700 dark:text-sky-200',
  },
};

const SEVERITY_COLORS = [
  'from-emerald-400 to-emerald-500',
  'from-emerald-400 to-emerald-500',
  'from-lime-400 to-lime-500',
  'from-lime-400 to-yellow-500',
  'from-yellow-400 to-amber-500',
  'from-amber-400 to-amber-500',
  'from-amber-500 to-orange-500',
  'from-orange-500 to-red-500',
  'from-red-500 to-red-600',
  'from-red-600 to-rose-700',
];

export default function TriagePage() {
  const [region, setRegion] = useState<Region>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState(6);
  const [durationDays, setDurationDays] = useState(1);
  const [durationHours, setDurationHours] = useState(2);
  const [comorb, setComorb] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');

  const [aiAnalysis, setAiAnalysis] = useState<AIEntities & { triageAdvice?: string; redFlags?: string[] }>({
    symptoms: [], suggestedDiagnoses: [], suggestedMedications: [], suggestedInvestigations: [],
    vitals: {}, triageUrgency: 'low', modelUsed: 'none',
  });
  const [triageAiLoading, setTriageAiLoading] = useState(false);
  const triageDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (triageDebounceRef.current) clearTimeout(triageDebounceRef.current);
    if (symptoms.length === 0) return;

    setTriageAiLoading(true);
    triageDebounceRef.current = setTimeout(async () => {
      try {
        const result = await triageSymptomsAI(symptoms, severity, region ?? '', comorb);
        setAiAnalysis(result);
      } catch {
        /* keep previous state */
      } finally {
        setTriageAiLoading(false);
      }
    }, 800);

    return () => { if (triageDebounceRef.current) clearTimeout(triageDebounceRef.current); };
  }, [symptoms, severity, region, comorb]);

  const result = useMemo(() => {
    const aiUrgMap: Record<string, Urgency> = {
      critical: 'red', high: 'orange', moderate: 'yellow', low: 'green',
    };
    let urgency: Urgency = aiUrgMap[aiAnalysis.triageUrgency] ?? 'green';

    if (urgency === 'green' && severity <= 3) urgency = 'blue';

    const actions = aiAnalysis.triageAdvice
      ? aiAnalysis.triageAdvice
      : urgency === 'red' || urgency === 'orange'
        ? 'Proceed to emergency / call 112. Do not drive yourself.'
        : urgency === 'yellow'
          ? 'Same-day clinic consult recommended.'
          : urgency === 'blue'
            ? 'Self-care / teleconsult may be appropriate.'
            : 'Routine outpatient evaluation within a few days.';

    const conditions = aiAnalysis.suggestedDiagnoses.length > 0
      ? aiAnalysis.suggestedDiagnoses.map((d) => `${d.name} (${d.confidence}%)`)
      : symptoms.length > 0
        ? ['Analyzing symptoms…']
        : ['Add symptoms to begin triage'];

    return { urgency, actions, conditions };
  }, [severity, symptoms.length, aiAnalysis]);

  const banner =
    result.urgency === 'red'
      ? 'Resuscitation / Immediate'
      : result.urgency === 'orange'
        ? 'Emergent'
        : result.urgency === 'yellow'
          ? 'Urgent'
          : result.urgency === 'green'
            ? 'Less urgent'
            : 'Non-urgent';

  const summary = `AIIMS-style triage (demo): ${banner}. Symptoms: ${symptoms.join(', ')}. Duration: ${durationDays}d ${durationHours}h. Region: ${region ?? '—'}. Comorbidities: ${comorb.join(', ')}.`;

  const urgencyStyle = URGENCY_CONFIG[result.urgency];

  const bodyRegionClass = (r: Region) =>
    clsx(
      'cursor-pointer stroke-[1.5] transition-all duration-300',
      region === r
        ? 'fill-emerald-200/80 stroke-emerald-600 dark:fill-emerald-800/40 dark:stroke-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]'
        : 'fill-gray-100/80 stroke-gray-300/80 hover:fill-emerald-100/50 hover:stroke-emerald-400/60 dark:fill-gray-800/60 dark:stroke-gray-600 dark:hover:fill-emerald-900/30',
    );

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-2 shadow-lg shadow-violet-500/20">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              AI-Guided <span className="gradient-text">Triage</span>
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Body map · severity · duration · pre-consult summary
          </p>
        </div>
        <div className="badge-violet hidden sm:inline-flex">
          <Sparkles className="h-3 w-3" />
          AI-Powered
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-glass rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-500/5 to-teal-500/10" />
          <div className="relative">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-1.5 shadow-md shadow-emerald-500/20">
                  <HeartPulse className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Tap body region</p>
              </div>
              {region && (
                <span className="badge-emerald animate-scale-in">
                  <Activity className="h-3 w-3" />
                  {REGION_LABELS[region]}
                </span>
              )}
            </div>
            <svg viewBox="0 0 200 360" className="mx-auto max-h-[420px] w-full">
              <ellipse
                cx="100"
                cy="38"
                rx="28"
                ry="32"
                className={bodyRegionClass('head')}
                onClick={() => setRegion('head')}
              />
              <rect
                x="62"
                y="72"
                width="76"
                height="70"
                rx="14"
                className={bodyRegionClass('chest')}
                onClick={() => setRegion('chest')}
              />
              <rect
                x="66"
                y="148"
                width="68"
                height="72"
                rx="12"
                className={bodyRegionClass('abdomen')}
                onClick={() => setRegion('abdomen')}
              />
              <path
                d="M70 224 L130 224 L124 260 L76 260 Z"
                className={bodyRegionClass('abdomen')}
                onClick={() => setRegion('abdomen')}
              />
              <rect
                x="40"
                y="80"
                width="18"
                height="120"
                rx="8"
                className={bodyRegionClass('limbs')}
                onClick={() => setRegion('limbs')}
              />
              <rect
                x="142"
                y="80"
                width="18"
                height="120"
                rx="8"
                className={bodyRegionClass('limbs')}
                onClick={() => setRegion('limbs')}
              />
              <rect
                x="74"
                y="260"
                width="22"
                height="90"
                rx="9"
                className={bodyRegionClass('limbs')}
                onClick={() => setRegion('limbs')}
              />
              <rect
                x="104"
                y="260"
                width="22"
                height="90"
                rx="9"
                className={bodyRegionClass('limbs')}
                onClick={() => setRegion('limbs')}
              />
              <text x="100" y="352" textAnchor="middle" className="fill-gray-400 dark:fill-gray-500 text-[9px] font-medium">
                Front view — select closest region
              </text>
            </svg>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 shadow-md shadow-blue-500/20">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Symptom tags</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {symptoms.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="group inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200/60 transition-all hover:from-red-50 hover:to-orange-50 hover:text-red-700 hover:ring-red-200/60 dark:from-emerald-950/30 dark:to-teal-950/20 dark:text-emerald-300 dark:ring-emerald-800/40 dark:hover:from-red-950/30 dark:hover:to-orange-950/20 dark:hover:text-red-300"
                  onClick={() => setSymptoms(symptoms.filter((x) => x !== s))}
                >
                  {s}
                  <X className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                className="input flex-1"
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                placeholder="Type a symptom and press Enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && symptomInput.trim()) {
                    setSymptoms([...symptoms, symptomInput.trim()]);
                    setSymptomInput('');
                  }
                }}
              />
              <button
                type="button"
                className="btn-secondary flex items-center gap-1 !px-3"
                onClick={() => {
                  if (symptomInput.trim()) {
                    setSymptoms([...symptoms, symptomInput.trim()]);
                    setSymptomInput('');
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`rounded-lg bg-gradient-to-br ${SEVERITY_COLORS[severity - 1]} p-1.5 shadow-md transition-all duration-300`}>
                  <Activity className="h-3.5 w-3.5 text-white" />
                </div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Severity (1–10)</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl leading-none transition-all duration-200">{EMOJI_SCALE[severity - 1]}</span>
                <span className={`rounded-xl bg-gradient-to-r ${SEVERITY_COLORS[severity - 1]} px-2.5 py-1 text-sm font-black text-white shadow-md`}>
                  {severity}
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gray-100 dark:bg-gray-800" />
              <div
                className={`absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r ${SEVERITY_COLORS[severity - 1]} transition-all duration-300`}
                style={{ width: `${((severity - 1) / 9) * 100}%` }}
              />
              <input
                type="range"
                min={1}
                max={10}
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="relative w-full accent-emerald-600 cursor-pointer"
                style={{ WebkitAppearance: 'none', background: 'transparent' }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-semibold text-gray-400 dark:text-gray-500">
              <span>Mild</span>
              <span>Moderate</span>
              <span>Severe</span>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 p-1.5 shadow-md shadow-amber-500/20">
                <Timer className="h-3.5 w-3.5 text-white" />
              </div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Duration</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Days</label>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Hours</label>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 p-1.5 shadow-md shadow-rose-500/20">
                <HeartPulse className="h-3.5 w-3.5 text-white" />
              </div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Pre-existing conditions</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((c) => {
                const on = comorb.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() =>
                      setComorb(on ? comorb.filter((x) => x !== c) : [...comorb, c])
                    }
                    className={clsx(
                      'rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200',
                      on
                        ? 'border-emerald-400/60 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 shadow-sm ring-1 ring-inset ring-emerald-500/10 dark:border-emerald-700/40 dark:from-emerald-950/40 dark:to-teal-950/30 dark:text-emerald-300'
                        : 'border-gray-200/80 bg-white/60 text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-700/60 dark:bg-gray-900/40 dark:text-gray-400 dark:hover:border-gray-600',
                    )}
                  >
                    {on && <span className="mr-1">✓</span>}
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div
        className={clsx(
          'relative overflow-hidden rounded-2xl border-2 p-6 shadow-xl transition-all duration-300',
          urgencyStyle.bg,
          urgencyStyle.border,
          urgencyStyle.glow,
        )}
      >
        <div className={`absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-to-br ${urgencyStyle.gradientFrom} ${urgencyStyle.gradientTo} opacity-[0.04]`} />
        <div className={`absolute -left-12 -bottom-12 h-32 w-32 rounded-full bg-gradient-to-br ${urgencyStyle.gradientFrom} ${urgencyStyle.gradientTo} opacity-[0.03]`} />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className={`rounded-xl bg-gradient-to-br ${urgencyStyle.gradientFrom} ${urgencyStyle.gradientTo} p-2 shadow-lg`}>
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${urgencyStyle.textSub}`}>
                  AI triage result
                </span>
                <span className={urgencyStyle.badge}>{banner}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <p className={`text-3xl font-black ${urgencyStyle.textMain}`}>{banner}</p>
              {triageAiLoading && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/40 px-2.5 py-1 text-xs font-medium text-gray-600 backdrop-blur-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {getModelName()} analyzing…
                </span>
              )}
            </div>
            <p className={`mt-2 text-sm font-medium ${urgencyStyle.textSub}`}>{result.actions}</p>
            <div className="mt-4">
              <p className={`text-xs font-bold uppercase tracking-wider ${urgencyStyle.textSub} opacity-70`}>
                AI-suggested conditions (not diagnosis)
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.conditions.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1.5 rounded-lg bg-white/50 px-3 py-1.5 text-sm font-semibold text-gray-800 ring-1 ring-inset ring-gray-200/40 backdrop-blur-sm dark:bg-black/20 dark:text-gray-200 dark:ring-white/10">
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40" />
                    {c}
                  </span>
                ))}
              </div>
              {aiAnalysis.suggestedDiagnoses.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {aiAnalysis.suggestedDiagnoses.map((dx) => (
                    <div key={dx.icdCode} className="rounded-lg bg-white/30 px-3 py-2 backdrop-blur-sm ring-1 ring-inset ring-gray-200/20 dark:bg-black/10 dark:ring-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{dx.name}</span>
                        <span className="font-mono text-[10px] text-gray-500">{dx.icdCode}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-gray-600 dark:text-gray-400">{dx.reasoning}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {aiAnalysis.redFlags && aiAnalysis.redFlags.length > 0 && (
              <div className="mt-4 rounded-xl bg-red-50/60 px-4 py-3 ring-1 ring-inset ring-red-200/40 dark:bg-red-950/20 dark:ring-red-800/30">
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <p className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-300">Red Flags — Seek ER if any develop</p>
                </div>
                <ul className="space-y-0.5">
                  {aiAnalysis.redFlags.map((flag) => (
                    <li key={flag} className="text-xs text-red-700 dark:text-red-300">• {flag}</li>
                  ))}
                </ul>
              </div>
            )}
            {aiAnalysis.suggestedInvestigations.length > 0 && (
              <div className="mt-3">
                <p className={`text-xs font-bold uppercase tracking-wider ${urgencyStyle.textSub} opacity-70 mb-1.5`}>Suggested Tests</p>
                <div className="flex flex-wrap gap-1.5">
                  {aiAnalysis.suggestedInvestigations.map((inv) => (
                    <span key={inv.name} className="rounded-lg bg-white/40 px-2.5 py-1 text-[11px] font-medium text-gray-700 backdrop-blur-sm ring-1 ring-inset ring-gray-200/30 dark:bg-black/20 dark:text-gray-300 dark:ring-white/10" title={inv.reasoning}>
                      {inv.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2.5">
            {(result.urgency === 'red' || result.urgency === 'orange') && (
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/25 transition-all hover:shadow-xl animate-pulse"
                onClick={() => {
                  toast.error('Emergency: Dial 112 or 108 (ambulance) immediately', {
                    description: 'Based on your symptoms, seek emergency care NOW.',
                    duration: 10000,
                  });
                }}
              >
                <AlertCircle className="h-4 w-4" />
                Call 112 Emergency
              </button>
            )}
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-2 text-sm"
              onClick={() => {
                void navigator.clipboard.writeText(summary);
                toast.success('Copied summary to share with your doctor');
              }}
            >
              <Copy className="h-4 w-4" />
              Copy for doctor
            </button>
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-2 text-sm"
              onClick={() => {
                toast.success('Redirecting to appointment booking with triage context');
              }}
            >
              <Stethoscope className="h-4 w-4" />
              Book appointment
            </button>
          </div>
        </div>
        <div className="relative mt-5 flex items-start justify-between gap-2.5 rounded-xl bg-white/40 p-3.5 text-xs font-medium text-gray-600 backdrop-blur-sm dark:bg-black/20 dark:text-gray-300 ring-1 ring-inset ring-gray-200/30 dark:ring-white/5">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            Educational demo only — not a substitute for licensed clinical triage. Emergency: call local EMS.
          </div>
          {aiAnalysis.modelUsed && aiAnalysis.modelUsed !== 'none' && aiAnalysis.modelUsed !== 'offline' && (
            <span className="shrink-0 text-[10px] text-gray-400">Powered by {aiAnalysis.modelUsed}</span>
          )}
        </div>
      </div>
    </div>
  );
}
