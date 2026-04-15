import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Brain,
  GraduationCap,
  Mic,
  RotateCcw,
  Sparkles,
  Timer,
  Volume2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';

const DEPTS = [
  { id: 'cardio', name: 'Cardiology', cases: 24, color: 'from-rose-500/20 to-rose-600/10', icon: '🫀' },
  { id: 'neuro', name: 'Neurology', cases: 18, color: 'from-violet-500/20 to-violet-600/10', icon: '🧠' },
  { id: 'pulm', name: 'Pulmonology', cases: 15, color: 'from-sky-500/20 to-sky-600/10', icon: '🫁' },
  { id: 'ortho', name: 'Orthopedics', cases: 12, color: 'from-amber-500/20 to-amber-600/10', icon: '🦴' },
];

const CASE_CARD = {
  presentation:
    '58-year-old male with diabetes and hypertension presents with crushing retrosternal chest pain radiating to the left jaw and arm for 90 minutes. Diaphoretic. BP 160/95.',
  q1: 'Most urgent initial investigation?',
  options: ['Chest X-ray only', 'ECG + troponin', 'CT pulmonary angiogram', 'Stress echo'],
  correct: 1,
  diagnosis: 'Acute coronary syndrome (STEMI/NSTEMI pathway)',
  why: 'Typical ischemic symptoms + risk factors → immediate ECG and troponin per ACS protocol.',
};

const DIFF_COLORS = {
  easy: { active: 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-lg shadow-emerald-500/25', inactive: 'bg-white/60 text-gray-600 hover:bg-emerald-50 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:bg-emerald-950/30' },
  medium: { active: 'bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-lg shadow-amber-500/25', inactive: 'bg-white/60 text-gray-600 hover:bg-amber-50 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:bg-amber-950/30' },
  hard: { active: 'bg-gradient-to-r from-red-500 to-rose-400 text-white shadow-lg shadow-red-500/25', inactive: 'bg-white/60 text-gray-600 hover:bg-red-50 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:bg-red-950/30' },
};

export default function CasePracticePage() {
  const [dept, setDept] = useState(DEPTS[0].id);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [flipped, setFlipped] = useState(false);
  const [step, setStep] = useState<'case' | 'quiz' | 'reveal'>('case');
  const [selected, setSelected] = useState<number | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const fireConfetti = useCallback(() => {
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.65 } });
  }, []);

  const reveal = (idx: number) => {
    setSelected(idx);
    setStep('reveal');
    if (idx === CASE_CARD.correct) {
      fireConfetti();
      toast.success('Correct diagnosis pathway!');
    } else {
      toast.message('Review the key findings');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Case Practice <span className="gradient-text">Tutor</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Flip cards · voice mode · department tracks
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="card-glass flex items-center gap-2.5 rounded-full px-4 py-2">
            <Timer className="h-4 w-4 text-emerald-500" />
            <span className="font-mono text-sm font-bold tabular-nums text-gray-800 dark:text-gray-200">
              {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
            </span>
          </div>
          <button
            type="button"
            className={clsx(
              'rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
              running
                ? 'bg-gradient-to-r from-red-500 to-rose-400 text-white shadow-lg shadow-red-500/20 hover:-translate-y-0.5'
                : 'btn-primary',
            )}
            onClick={() => setRunning((r) => !r)}
          >
            {running ? 'Pause' : 'Start timer'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card-glass p-5">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Department</p>
            <div className="grid grid-cols-2 gap-2.5">
              {DEPTS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDept(d.id)}
                  className={clsx(
                    'group relative rounded-xl border p-3.5 text-left text-sm font-medium transition-all duration-200 bg-gradient-to-br',
                    d.color,
                    dept === d.id
                      ? 'border-emerald-500/50 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10 scale-[1.02]'
                      : 'border-gray-200/60 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 dark:border-gray-700/60 dark:hover:border-gray-600',
                  )}
                >
                  <span className="text-lg">{d.icon}</span>
                  <span className="mt-1 block font-semibold text-gray-900 dark:text-white">{d.name}</span>
                  <span className="mt-0.5 block text-[11px] text-gray-500 dark:text-gray-400">{d.cases} cases</span>
                  {dept === d.id && (
                    <motion.div
                      layoutId="dept-indicator"
                      className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="card-glass p-5">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Difficulty</p>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={clsx(
                    'flex-1 rounded-xl py-2.5 text-xs font-bold capitalize transition-all duration-200',
                    difficulty === d
                      ? DIFF_COLORS[d].active
                      : DIFF_COLORS[d].inactive,
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setVoiceMode((v) => {
                const next = !v;
                toast.message(
                  next ? 'Voice mode: speak your answer (demo)' : 'Voice mode off',
                );
                return next;
              });
            }}
            className={clsx(
              'group flex w-full items-center justify-center gap-2.5 rounded-xl border-2 py-3.5 text-sm font-semibold transition-all duration-300',
              voiceMode
                ? 'border-emerald-500/50 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 shadow-lg shadow-emerald-500/10 glow-emerald dark:from-emerald-950/40 dark:to-teal-950/40 dark:text-emerald-300'
                : 'border-gray-200/80 bg-white/60 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-md dark:border-gray-700/60 dark:bg-gray-800/40 dark:hover:border-emerald-800',
            )}
          >
            {voiceMode ? (
              <Mic className="h-4.5 w-4.5 animate-pulse text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Volume2 className="h-4.5 w-4.5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
            )}
            {voiceMode ? 'Voice on' : 'Voice mode'}
          </button>
        </div>

        {/* Flip card area */}
        <div className="lg:col-span-8">
          <div className="relative h-[420px] perspective-1000">
            <motion.div
              className="relative h-full w-full cursor-pointer"
              style={{ transformStyle: 'preserve-3d' }}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 80 }}
              onClick={() => step === 'case' && setFlipped((f) => !f)}
            >
              {/* Front */}
              <div
                className="card-glass absolute inset-0 rounded-2xl p-8 shadow-xl"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="mb-5 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/20">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Presentation</span>
                </div>
                <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-100">{CASE_CARD.presentation}</p>
                <div className="absolute bottom-6 left-0 right-0 text-center">
                  <p className="inline-flex items-center gap-2 rounded-full bg-gray-100/80 px-4 py-1.5 text-xs text-gray-400 dark:bg-gray-800/60">
                    <RotateCcw className="h-3 w-3" />
                    Tap card to flip → questions
                  </p>
                </div>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 text-white shadow-2xl"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_60%)]" />
                <div className="relative">
                  <div className="mb-5 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-300 shadow-lg shadow-emerald-400/30">
                      <Brain className="h-5 w-5 text-gray-900" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">Question</span>
                  </div>
                  <p className="text-lg font-semibold">{CASE_CARD.q1}</p>
                  <div className="mt-6 space-y-2.5">
                    {CASE_CARD.options.map((opt, i) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          reveal(i);
                        }}
                        className="group w-full rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-left text-sm backdrop-blur-sm transition-all duration-200 hover:bg-white/15 hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5"
                      >
                        <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-emerald-300 group-hover:bg-emerald-500/20">
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {step === 'reveal' && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              className="card mt-5 overflow-hidden border-2 border-emerald-500/20 glow-emerald"
            >
              <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-6 py-4 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(255,255,255,0.15),transparent_70%)]" />
                <div className="relative flex items-center gap-2.5">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-lg font-bold">Reveal</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Likely diagnosis</p>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{CASE_CARD.diagnosis}</p>
                </div>
                <div className="rounded-xl bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Why: </span>
                    {CASE_CARD.why}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm">
                    Your choice:{' '}
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1.5 font-bold',
                        selected === CASE_CARD.correct ? 'text-emerald-600' : 'text-amber-600',
                      )}
                    >
                      {selected === CASE_CARD.correct ? '✓ Correct' : '✗ Incorrect — review'}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-secondary inline-flex items-center gap-2 text-sm"
                  onClick={() => {
                    setFlipped(false);
                    setStep('case');
                    setSelected(null);
                    setSeconds(0);
                    setRunning(false);
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Next case
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  );
}
