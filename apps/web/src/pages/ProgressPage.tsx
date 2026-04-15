import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Award, Flame, Target, TrendingUp, Zap, Lock } from 'lucide-react';
import { subDays, format } from 'date-fns';
import { clsx } from 'clsx';

const RADAR = [
  { subject: 'Cardio', A: 88, fullMark: 100 },
  { subject: 'Neuro', A: 72, fullMark: 100 },
  { subject: 'Pulm', A: 80, fullMark: 100 },
  { subject: 'Ortho', A: 65, fullMark: 100 },
  { subject: 'GI', A: 74, fullMark: 100 },
  { subject: 'Renal', A: 70, fullMark: 100 },
  { subject: 'Endo', A: 82, fullMark: 100 },
  { subject: 'ID', A: 77, fullMark: 100 },
];

const TREND = Array.from({ length: 14 }).map((_, i) => ({
  day: format(subDays(new Date(), 13 - i), 'MMM d'),
  acc: 70 + Math.round(Math.sin(i / 2) * 8 + i),
}));

const HEATMAP = Array.from({ length: 120 }).map((_, i) => ({
  date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
  count: Math.random() > 0.35 ? Math.floor(Math.random() * 4) + 1 : 0,
}));

const BADGES = [
  { id: '1', name: 'First Case', earned: true },
  { id: '2', name: 'Streak 7', earned: true },
  { id: '3', name: 'Cardio Master', earned: false },
  { id: '4', name: 'Night Owl', earned: false },
];

export default function ProgressPage() {
  const xp = 4200;
  const nextLevel = 5000;
  const pct = Math.round((xp / nextLevel) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My <span className="gradient-text">Progress</span>
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Radar strengths · streak heat map · badges · XP
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Radar Chart */}
        <div className="card-glass p-6 lg:col-span-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-teal-500/[0.02]" />
          <div className="relative mb-3 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20">
              <Target className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Department Strengths</span>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={RADAR}>
                <PolarGrid stroke="#94a3b8" strokeOpacity={0.3} />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar name="You" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* XP & Level */}
        <div className="card-glass p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.04] to-amber-500/[0.04]" />
          <div className="relative">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-amber-400 shadow-md shadow-orange-400/20">
                <Flame className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">XP & Level</span>
            </div>
            <p className="mt-6 text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              {xp.toLocaleString()}
              <span className="ml-2 text-sm font-semibold text-gray-400">XP</span>
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Next milestone: <span className="font-semibold text-gray-700 dark:text-gray-200">{nextLevel.toLocaleString()} XP</span>
            </p>
            <div className="mt-5 relative">
              <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 transition-all duration-700 ease-out relative"
                  style={{ width: `${pct}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-pulse" />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-500">{pct}% to next level</span>
                <span className="badge-emerald text-[10px]">
                  <Zap className="h-3 w-3" /> Level {Math.floor(xp / 1000) + 1}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-3 text-center">
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">220</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Cases done</p>
              </div>
              <div className="rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-3 text-center">
                <p className="text-lg font-black text-blue-600 dark:text-blue-400">84%</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Accuracy</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Streak Calendar */}
        <div className="card-glass p-6 overflow-x-auto">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 shadow-md shadow-violet-500/20">
              <Flame className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Streak Calendar</span>
            <span className="badge-violet text-[10px] ml-auto">5 day streak</span>
          </div>
          <CalendarHeatmap
            startDate={subDays(new Date(), 119)}
            endDate={new Date()}
            values={HEATMAP}
            classForValue={(v) => {
              if (!v || !v.count) return 'color-empty';
              return `color-scale-${Math.min(4, v.count)}`;
            }}
            tooltipDataAttrs={(v: { date?: string; count?: number }) => ({
              'data-tip': v.date ? `${v.date}: ${v.count ?? 0} sessions` : '',
            })}
          />
          <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-gray-400">
            <span>Less</span>
            <span className="h-2.5 w-2.5 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: '#bbf7d0' }} />
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: '#4ade80' }} />
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: '#16a34a' }} />
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: '#14532d' }} />
            <span>More</span>
          </div>
          <style>{`
            .react-calendar-heatmap text { font-size: 8px; fill: #94a3b8; }
            .react-calendar-heatmap .color-empty { fill: #f3f4f6; }
            .dark .react-calendar-heatmap .color-empty { fill: #1f2937; }
            .react-calendar-heatmap .color-scale-1 { fill: #bbf7d0; }
            .react-calendar-heatmap .color-scale-2 { fill: #4ade80; }
            .react-calendar-heatmap .color-scale-3 { fill: #16a34a; }
            .react-calendar-heatmap .color-scale-4 { fill: #14532d; }
          `}</style>
        </div>

        {/* Accuracy Chart */}
        <div className="card-glass p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md shadow-blue-500/20">
              <TrendingUp className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Accuracy Trend</span>
            <span className="badge-blue text-[10px] ml-auto">14 days</span>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TREND}>
                <defs>
                  <linearGradient id="accGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255,255,255,0.95)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                />
                <Line type="monotone" dataKey="acc" stroke="url(#accGradient)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="grid gap-4 lg:grid-cols-3">
        {BADGES.map((b) => (
          <div
            key={b.id}
            className={clsx(
              'card-glass rounded-2xl p-4 flex items-center gap-4 transition-all duration-200',
              b.earned
                ? 'glow-emerald hover:shadow-lg'
                : 'opacity-50 hover:opacity-70',
            )}
          >
            <div className={clsx(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
              b.earned
                ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20'
                : 'bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600',
            )}>
              {b.earned ? (
                <Award className="h-6 w-6 text-white" />
              ) : (
                <Lock className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{b.name}</p>
              <p className={clsx(
                'text-xs',
                b.earned ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-gray-400',
              )}>
                {b.earned ? '✓ Earned' : 'Locked'}
              </p>
            </div>
          </div>
        ))}

        {/* Weak Area */}
        <div className="card-glass rounded-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.06]" />
          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-amber text-[10px]">Focus area</span>
            </div>
            <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Weak area detected</p>
            <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/80">Orthopedics — trauma imaging</p>
            <button type="button" className="btn-primary mt-4 w-full py-2.5 text-sm">
              Practice now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
