import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  FileText,
  Users,
  Bed,
  AlertTriangle,
  Calendar,
  Plus,
  Mic,
  ClipboardList,
  Siren,
  Clock,
  Eye,
  ChevronRight,
  CheckCircle2,
  Stethoscope,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const recentCases = [
  { id: 'CS-2401', patient: 'Amit Kumar', department: 'Cardiology', date: '04 Apr 2026', status: 'In Progress' },
  { id: 'CS-2400', patient: 'Priya Patel', department: 'Neurology', date: '04 Apr 2026', status: 'Completed' },
  { id: 'CS-2399', patient: 'Ramesh Gupta', department: 'Orthopedics', date: '03 Apr 2026', status: 'Draft' },
  { id: 'CS-2398', patient: 'Anjali Desai', department: 'Gynecology', date: '03 Apr 2026', status: 'Reviewed' },
];

const schedule = [
  { time: '9:00 AM', patient: 'Vikram Singh', type: 'New', department: 'Cardiology' },
  { time: '10:30 AM', patient: 'Meera Nair', type: 'Follow-up', department: 'Neurology' },
  { time: '11:00 AM', patient: 'Kiran Rao', type: 'New', department: 'Orthopedics' },
  { time: '2:00 PM', patient: 'Deepa Iyer', type: 'Follow-up', department: 'Gynecology' },
];

const pendingActions = [
  { text: 'Review Lab Report — Amit Kumar', priority: 'urgent' as const },
  { text: 'Sign Discharge Summary — Priya Patel', priority: 'normal' as const },
  { text: 'Approve Medication Change — Ward B', priority: 'moderate' as const },
];

const departmentBadge: Record<string, string> = {
  Cardiology: 'badge-red',
  Neurology: 'badge-blue',
  Orthopedics: 'badge-amber',
  Gynecology: 'badge-violet',
};

const statusBadge: Record<string, string> = {
  Draft: 'bg-gray-100/80 text-gray-600 ring-1 ring-inset ring-gray-500/10',
  'In Progress': 'badge-amber',
  Completed: 'badge-emerald',
  Reviewed: 'badge-blue',
};

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } } };

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const today = useMemo(() => format(new Date(), 'EEEE, MMMM do, yyyy'), []);
  const greeting = useMemo(() => getGreeting(), []);
  const displayName = user?.name || 'Doctor';

  return (
    <motion.div className="space-y-6 pb-12" variants={container} initial="hidden" animate="visible">

      {/* Welcome Card */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-6 text-white shadow-xl shadow-emerald-600/15 lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/[0.06] blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/[0.04] blur-xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-emerald-100/80 text-sm font-medium">{today}</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
              {greeting}, {displayName}
            </h1>
            <p className="mt-1 text-emerald-100/70 text-sm">
              {user?.hospital || 'CaseConnect Hospital'} &middot; {user?.specialization || 'General Medicine'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link to="/doctor/case-sheets/new" className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold backdrop-blur-sm transition-all hover:bg-white/30">
              <Plus className="h-4 w-4" /> New Case Sheet
            </Link>
            <Link to="/doctor/emergency" className="inline-flex items-center gap-2 rounded-xl bg-red-500/80 px-4 py-2.5 text-sm font-semibold backdrop-blur-sm transition-all hover:bg-red-500">
              <Siren className="h-4 w-4" /> Emergency
            </Link>
            <Link to="/doctor/case-sheets/new" className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold backdrop-blur-sm transition-all hover:bg-white/30">
              <Mic className="h-4 w-4" /> Voice Record
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Active Cases', value: '156', sub: '+12% this week', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Patients Today', value: '42', sub: '5 pending', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Beds Available', value: '23/80', sub: '28.7% occupancy', icon: Bed, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Emergency', value: '3', sub: 'Critical', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', pulse: true },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card group relative overflow-hidden p-4 transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tracking-tight text-gray-900">{s.value}</p>
                  <p className="truncate text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
              <p className={`mt-2 text-xs ${s.pulse ? 'font-semibold text-red-600' : 'text-gray-400'}`}>
                {s.pulse && <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />}
                {s.sub}
              </p>
            </div>
          );
        })}
      </motion.div>

      {/* Main Grid: Cases + Schedule */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Cases */}
        <motion.div variants={item} className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
                <FileText className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">Recent Cases</h2>
            </div>
            <Link to="/doctor/case-sheets" className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              See All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Patient</th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Dept</th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Date</th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentCases.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-gray-50/60">
                    <td className="whitespace-nowrap px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">{c.patient.charAt(0)}</div>
                        <div>
                          <p className="font-semibold text-gray-900">{c.patient}</p>
                          <p className="text-[11px] text-gray-400">{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={departmentBadge[c.department] ?? 'badge-emerald'}>{c.department}</span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-500">{c.date}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusBadge[c.status]}`}>
                        {c.status === 'Completed' && <CheckCircle2 className="h-3 w-3" />}
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link to={`/doctor/case-sheets/${c.id}`} className="inline-flex items-center gap-1 rounded-lg border border-gray-200/80 px-2.5 py-1 text-[11px] font-semibold text-gray-600 transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700">
                        <Eye className="h-3 w-3" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Schedule */}
        <motion.div variants={item} className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">Today&apos;s Schedule</h2>
            </div>
            <Link to="/hms/appointments" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
              Full Schedule <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {schedule.map((s, i) => (
                <div key={i} className="group flex gap-3 rounded-xl p-2.5 transition-colors hover:bg-blue-50/40">
                  <div className="w-14 shrink-0 pt-0.5 text-[11px] font-bold text-gray-400">{s.time}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{s.patient}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                        s.type === 'New' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>{s.type}</span>
                      <span className="text-[11px] text-gray-400">{s.department}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row: Quick Actions + Pending */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <motion.div variants={item} className="card p-5">
          <h2 className="mb-4 text-sm font-bold text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'New Case Sheet', icon: Plus, to: '/doctor/case-sheets/new', color: 'from-emerald-500 to-teal-500' },
              { label: 'OP Sheet', icon: ClipboardList, to: '/doctor/op-sheets', color: 'from-blue-500 to-indigo-500' },
              { label: 'Emergency', icon: Siren, to: '/doctor/emergency', color: 'from-red-500 to-rose-500' },
              { label: 'Appointments', icon: Calendar, to: '/hms/appointments', color: 'from-violet-500 to-purple-500' },
              { label: 'Live Beds', icon: Bed, to: '/hms/beds', color: 'from-amber-500 to-orange-500' },
              { label: 'Follow-ups', icon: Activity, to: '/doctor/follow-ups', color: 'from-pink-500 to-rose-500' },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.label}
                  to={a.to}
                  className="group flex items-center gap-3 rounded-xl border border-gray-100/80 p-3 transition-all hover:border-gray-200 hover:shadow-sm"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${a.color} text-white shadow-sm`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{a.label}</span>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Pending Actions */}
        <motion.div variants={item} className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100">
                <Stethoscope className="h-3.5 w-3.5 text-rose-600" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">Pending Actions</h2>
            </div>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
              {pendingActions.length}
            </span>
          </div>
          <div className="divide-y divide-gray-50 px-5">
            {pendingActions.map((a, i) => (
              <div key={i} className="flex items-center gap-3 py-3.5">
                <div className={`h-2 w-2 rounded-full ${
                  a.priority === 'urgent' ? 'bg-red-500' : a.priority === 'moderate' ? 'bg-amber-400' : 'bg-gray-300'
                }`} />
                <p className="flex-1 text-sm text-gray-700">{a.text}</p>
                <button
                  onClick={() => navigate('/doctor/case-sheets')}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-50 px-5 py-3">
            <Link to="/doctor/follow-ups" className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
