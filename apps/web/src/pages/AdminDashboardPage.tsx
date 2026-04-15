import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { AlertTriangle, BedDouble, IndianRupee, Stethoscope, Users, TrendingUp, Clock, ShieldAlert, Activity, Award, ArrowUpRight, Sparkles } from 'lucide-react';

const KPI = [
  { label: 'OPD today', value: '842', icon: Users, tone: 'sky', delta: '+12%' },
  { label: 'IPD admissions', value: '64', icon: BedDouble, tone: 'violet', delta: '+3%' },
  { label: 'Revenue (₹ L)', value: '38.4', icon: IndianRupee, tone: 'emerald', delta: '+8.2%' },
  { label: 'Bed occupancy', value: '87%', icon: BedDouble, tone: 'amber', delta: '-2%' },
  { label: 'Emergency cases', value: '112', icon: Stethoscope, tone: 'red', delta: '+5%' },
] as const;

const TONE_MAP: Record<string, { iconBg: string; iconText: string; glow: string; ring: string; deltaBg: string; deltaText: string; accentBar: string }> = {
  sky: {
    iconBg: 'bg-gradient-to-br from-sky-400 to-sky-600',
    iconText: 'text-white',
    glow: 'shadow-lg shadow-sky-500/20',
    ring: 'ring-sky-500/10',
    deltaBg: 'bg-sky-50 dark:bg-sky-950/30',
    deltaText: 'text-sky-600 dark:text-sky-400',
    accentBar: 'bg-gradient-to-r from-sky-400 to-sky-500',
  },
  violet: {
    iconBg: 'bg-gradient-to-br from-violet-400 to-violet-600',
    iconText: 'text-white',
    glow: 'shadow-lg shadow-violet-500/20',
    ring: 'ring-violet-500/10',
    deltaBg: 'bg-violet-50 dark:bg-violet-950/30',
    deltaText: 'text-violet-600 dark:text-violet-400',
    accentBar: 'bg-gradient-to-r from-violet-400 to-violet-500',
  },
  emerald: {
    iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    iconText: 'text-white',
    glow: 'shadow-lg shadow-emerald-500/20',
    ring: 'ring-emerald-500/10',
    deltaBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    deltaText: 'text-emerald-600 dark:text-emerald-400',
    accentBar: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
  },
  amber: {
    iconBg: 'bg-gradient-to-br from-amber-400 to-amber-600',
    iconText: 'text-white',
    glow: 'shadow-lg shadow-amber-500/20',
    ring: 'ring-amber-500/10',
    deltaBg: 'bg-amber-50 dark:bg-amber-950/30',
    deltaText: 'text-amber-600 dark:text-amber-400',
    accentBar: 'bg-gradient-to-r from-amber-400 to-amber-500',
  },
  red: {
    iconBg: 'bg-gradient-to-br from-red-400 to-red-600',
    iconText: 'text-white',
    glow: 'shadow-lg shadow-red-500/20',
    ring: 'ring-red-500/10',
    deltaBg: 'bg-red-50 dark:bg-red-950/30',
    deltaText: 'text-red-600 dark:text-red-400',
    accentBar: 'bg-gradient-to-r from-red-400 to-red-500',
  },
};

const REV = Array.from({ length: 14 }).map((_, i) => ({
  day: `D${i + 1}`,
  revenue: 28 + Math.round(Math.random() * 12),
}));

const DEPT_PERF = [
  { dept: 'Cardiology', patients: 210, revenue: 12.4, doctors: 8, occ: 92 },
  { dept: 'Ortho', patients: 176, revenue: 9.1, doctors: 6, occ: 81 },
  { dept: 'General', patients: 402, revenue: 6.2, doctors: 14, occ: 76 },
];

const TOP_DOCS = [
  { name: 'Dr. Mehra', cases: 186 },
  { name: 'Dr. Iyer', cases: 164 },
  { name: 'Dr. Khan', cases: 151 },
  { name: 'Dr. Gupta', cases: 140 },
  { name: 'Dr. Reddy', cases: 128 },
];

const RANK_STYLES = [
  'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-400/30',
  'bg-gradient-to-r from-gray-300 to-gray-400 text-white shadow-lg shadow-gray-400/20',
  'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-600/20',
];

const RANK_ICONS = ['🥇', '🥈', '🥉'];

const OCC_COLORS: Record<string, string> = {
  high: 'from-red-400 to-red-500',
  mid: 'from-amber-400 to-amber-500',
  low: 'from-emerald-400 to-emerald-600',
};

function getOccColor(occ: number) {
  if (occ >= 90) return OCC_COLORS.high;
  if (occ >= 80) return OCC_COLORS.mid;
  return OCC_COLORS.low;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-glass rounded-xl px-4 py-3 text-sm backdrop-blur-xl border border-white/20 dark:border-white/10">
      <p className="font-semibold text-gray-800 dark:text-gray-100">{label}</p>
      <p className="gradient-text text-lg font-black">₹{payload[0].value}L</p>
    </div>
  );
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2 shadow-lg shadow-emerald-500/20">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
              Hospital <span className="gradient-text">Dashboard</span>
            </h1>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            India-specific KPIs · revenue · departments · alerts
          </p>
        </div>
        <div className="badge-emerald hidden sm:inline-flex">
          <Sparkles className="h-3 w-3" />
          Live
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {KPI.map((k) => {
          const Icon = k.icon;
          const tone = TONE_MAP[k.tone];
          const isNeg = k.delta.startsWith('-');
          return (
            <div key={k.label} className="stat-card group ring-1 ring-inset ${tone.ring}">
              <div className={`absolute left-0 top-0 h-1 w-full rounded-t-2xl ${tone.accentBar} opacity-80`} />
              <div className="flex items-center justify-between">
                <div className={`inline-flex rounded-xl p-2.5 ${tone.iconBg} ${tone.glow} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`h-5 w-5 ${tone.iconText}`} />
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${tone.deltaBg} ${tone.deltaText}`}>
                  {isNeg ? null : <ArrowUpRight className="h-3 w-3" />}
                  {k.delta}
                </span>
              </div>
              <p className="mt-4 text-3xl font-black tracking-tight text-gray-900 dark:text-white">{k.value}</p>
              <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">{k.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="card p-6 lg:col-span-7">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-1.5 shadow-md shadow-emerald-500/20">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Revenue trend</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">₹ Lakhs · last 14 days</p>
              </div>
            </div>
            <span className="badge-emerald">
              <TrendingUp className="h-3 w-3" />
              +8.2%
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REV} barCategoryGap="20%">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.85} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16,185,129,0.06)', radius: 8 }} />
                <Bar dataKey="revenue" fill="url(#barGrad)" radius={[10, 10, 2, 2]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-glass rounded-2xl p-6 lg:col-span-5 flex flex-col">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="rounded-xl bg-gradient-to-br from-amber-400 to-red-500 p-2 shadow-lg shadow-red-500/20">
              <ShieldAlert className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Live Alerts</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Requires attention</p>
            </div>
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex gap-3 rounded-xl border border-red-200/60 bg-gradient-to-r from-red-50 to-orange-50 p-4 dark:border-red-900/40 dark:from-red-950/30 dark:to-orange-950/20 glow-red transition-all duration-200 hover:scale-[1.01]">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-md shadow-red-500/20">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-red-800 dark:text-red-200">ICU Critical</p>
                  <span className="badge-red text-[10px]">Urgent</span>
                </div>
                <p className="mt-0.5 text-xs text-red-600 dark:text-red-300">Occupancy &gt; 95% — consider step-down transfers</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-amber-200/60 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 dark:border-amber-900/40 dark:from-amber-950/20 dark:to-yellow-950/10 transition-all duration-200 hover:scale-[1.01]">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-amber-500/20">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                    <span className="font-black">12</span> pending pre-auth
                  </p>
                  <span className="badge-amber text-[10px]">Action</span>
                </div>
                <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-300">Insurance TAT &gt; 48h — escalate</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-blue-200/60 bg-gradient-to-r from-blue-50 to-sky-50 p-4 dark:border-blue-900/40 dark:from-blue-950/20 dark:to-sky-950/10 glow-blue transition-all duration-200 hover:scale-[1.01]">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-500/20">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
                    <span className="font-black">28</span> overdue follow-ups
                  </p>
                  <span className="badge-blue text-[10px]">Review</span>
                </div>
                <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-300">Patient follow-ups pending &gt; 7 days</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-gray-100/80 px-6 py-4 dark:border-gray-800/60 flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-1.5 shadow-md shadow-violet-500/20">
              <Activity className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Department performance</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Current month metrics</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th>Dept</th>
                  <th>Patients</th>
                  <th>Rev (₹L)</th>
                  <th>Docs</th>
                  <th>Occ %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/60 dark:divide-gray-800/60">
                {DEPT_PERF.map((d) => (
                  <tr key={d.dept} className="table-row group">
                    <td>
                      <span className="font-bold text-gray-800 dark:text-gray-100">{d.dept}</span>
                    </td>
                    <td>
                      <span className="font-semibold text-gray-600 dark:text-gray-300">{d.patients}</span>
                    </td>
                    <td>
                      <span className="font-bold gradient-text">₹{d.revenue}</span>
                    </td>
                    <td>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-xs font-bold text-violet-600 dark:bg-violet-950/30 dark:text-violet-400">
                        {d.doctors}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${getOccColor(d.occ)} transition-all duration-500`}
                            style={{ width: `${d.occ}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{d.occ}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 p-1.5 shadow-md shadow-amber-500/20">
              <Award className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Top doctors by case volume</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">This month&apos;s leaders</p>
            </div>
          </div>
          <ol className="space-y-2.5">
            {TOP_DOCS.map((d, i) => {
              const maxCases = TOP_DOCS[0].cases;
              const pct = (d.cases / maxCases) * 100;
              return (
                <li
                  key={d.name}
                  className="card-interactive relative flex items-center justify-between overflow-hidden px-4 py-3.5"
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/[0.04] to-transparent transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative flex items-center gap-3">
                    {i < 3 ? (
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${RANK_STYLES[i]}`}
                      >
                        {RANK_ICONS[i]}
                      </span>
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-black text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        {i + 1}
                      </span>
                    )}
                    <div>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                        {d.name}
                      </span>
                      {i === 0 && (
                        <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Top performer</p>
                      )}
                    </div>
                  </div>
                  <div className="relative text-right">
                    <span className="text-xl font-black gradient-text">{d.cases}</span>
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">cases</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
