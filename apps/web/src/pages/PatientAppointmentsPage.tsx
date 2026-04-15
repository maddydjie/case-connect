import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { Building2, CalendarClock, MessageCircle, Stethoscope, X, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';

const UPCOMING = [
  { id: '1', hospital: 'CaseConnect Hospital', dept: 'Cardiology', doctor: 'Dr. Mehra', when: addDays(new Date(), 2), status: 'confirmed' as const },
  { id: '2', hospital: 'CaseConnect Hospital', dept: 'Lab', doctor: 'Phlebotomy', when: addDays(new Date(), 5), status: 'pending' as const },
  { id: '3', hospital: 'City Clinic', dept: 'General', doctor: 'Dr. Iyer', when: addDays(new Date(), 9), status: 'confirmed' as const },
];

const PAST = [
  { id: 'p1', when: '2026-01-12', doctor: 'Dr. Khan', dept: 'Ortho', status: 'completed' },
  { id: 'p2', when: '2025-11-03', doctor: 'Dr. Mehra', dept: 'Cardio', status: 'cancelled' },
];

const HOSPITALS = ['CaseConnect Hospital', 'City Clinic', 'Metro Diagnostics'];
const DEPTS = ['Cardiology', 'General Medicine', 'Orthopedics'];
const DOCS: Record<string, string[]> = {
  Cardiology: ['Dr. Mehra', 'Dr. Reddy'],
  'General Medicine': ['Dr. Iyer', 'Dr. Gupta'],
  Orthopedics: ['Dr. Khan', 'Dr. Singh'],
};

export default function PatientAppointmentsPage() {
  const [wa, setWa] = useState(true);
  const [step, setStep] = useState(0);
  const [hospital, setHospital] = useState(HOSPITALS[0]);
  const [dept, setDept] = useState(DEPTS[0]);
  const [doctor, setDoctor] = useState(DOCS[DEPTS[0]][0]);
  const [slot, setSlot] = useState('10:00');

  const slots = ['09:00', '10:00', '11:30', '14:00', '16:30'];
  const confirmedCount = UPCOMING.filter((a) => a.status === 'confirmed').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="gradient-text">My Appointments</span>
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Book · manage · WhatsApp reminders
          </p>
        </div>
        <label className="card-glass flex cursor-pointer items-center gap-3 px-5 py-2.5 text-sm font-medium">
          <MessageCircle className={clsx('h-4 w-4 transition-colors', wa ? 'text-emerald-500' : 'text-gray-400')} />
          <span className="text-gray-700 dark:text-gray-200">WhatsApp reminders</span>
          <input type="checkbox" className="sr-only" checked={wa} onChange={() => setWa((v) => !v)} />
          <span
            className={clsx(
              'relative h-6 w-11 rounded-full transition-colors',
              wa ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600',
            )}
          >
            <span
              className={clsx(
                'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform',
                wa ? 'left-6' : 'left-1',
              )}
            />
          </span>
        </label>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="stat-card glow-blue">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/50">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{UPCOMING.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Upcoming</p>
            </div>
          </div>
        </div>
        <div className="stat-card glow-emerald">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/50">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{confirmedCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Confirmed</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
              <XCircle className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{PAST.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Past visits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming */}
      <section>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Upcoming</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {UPCOMING.map((a) => (
            <div
              key={a.id}
              className="card relative overflow-hidden border-l-4 border-l-emerald-500 p-5 transition-all hover:-translate-y-0.5"
            >
              <button
                type="button"
                className="absolute right-3 top-3 rounded-xl p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => toast.message('Cancel flow (demo)')}
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{a.hospital}</p>
              <p className="mt-1.5 text-lg font-bold text-gray-900 dark:text-white">{a.dept}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{a.doctor}</p>
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <CalendarClock className="h-4 w-4" />
                {format(a.when, 'EEE, dd MMM · HH:mm')}
              </div>
              <span
                className={clsx(
                  'mt-3 inline-block',
                  a.status === 'confirmed' ? 'badge-emerald' : 'badge-amber',
                )}
              >
                {a.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Book + Past visits */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-5 text-lg font-bold text-gray-900 dark:text-white">Book new appointment</h2>
          <div className="mb-5 flex items-center gap-1">
            {['Hospital', 'Department', 'Doctor', 'Slot'].map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <span
                  className={clsx(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                    i === step
                      ? 'bg-emerald-500 text-white'
                      : i < step
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500',
                  )}
                >
                  {i + 1}
                </span>
                <span className={clsx('text-xs font-medium', i === step ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500')}>
                  {s}
                </span>
                {i < 3 && <div className={clsx('mx-1 h-px w-4', i < step ? 'bg-emerald-300 dark:bg-emerald-800' : 'bg-gray-200 dark:bg-gray-700')} />}
              </div>
            ))}
          </div>
          {step === 0 && (
            <div className="space-y-2">
              {HOSPITALS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    setHospital(h);
                    setStep(1);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200/60 dark:border-gray-700/60 p-3.5 text-left text-sm font-medium text-gray-900 dark:text-white transition-all hover:bg-emerald-50/40 hover:border-emerald-200 dark:hover:bg-emerald-950/20 dark:hover:border-emerald-800"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
                    <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  {h}
                </button>
              ))}
            </div>
          )}
          {step === 1 && (
            <div className="space-y-2">
              {DEPTS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setDept(d);
                    setDoctor(DOCS[d][0]);
                    setStep(2);
                  }}
                  className="w-full rounded-xl border border-gray-200/60 dark:border-gray-700/60 p-3.5 text-left text-sm font-medium text-gray-900 dark:text-white transition-all hover:bg-emerald-50/40 hover:border-emerald-200 dark:hover:bg-emerald-950/20 dark:hover:border-emerald-800"
                >
                  {d}
                </button>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="space-y-2">
              {DOCS[dept].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setDoctor(d);
                    setStep(3);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200/60 dark:border-gray-700/60 p-3.5 text-left text-sm font-medium text-gray-900 dark:text-white transition-all hover:bg-emerald-50/40 hover:border-emerald-200 dark:hover:bg-emerald-950/20 dark:hover:border-emerald-800"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
                    <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  {d}
                </button>
              ))}
            </div>
          )}
          {step === 3 && (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s)}
                  className={clsx(
                    'rounded-xl border py-2.5 text-sm font-semibold transition-all',
                    slot === s
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700'
                      : 'border-gray-200/60 text-gray-700 dark:border-gray-700/60 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600',
                  )}
                >
                  {s}
                </button>
              ))}
              <button
                type="button"
                className="btn-primary col-span-3 mt-2"
                onClick={() => {
                  toast.success(`Booked ${doctor} @ ${slot}`);
                  setStep(0);
                }}
              >
                Confirm booking
              </button>
            </div>
          )}
          {step > 0 && (
            <button type="button" className="btn-secondary mt-3 w-full text-sm" onClick={() => setStep((s) => Math.max(0, s - 1))}>
              Back
            </button>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-gray-100/80 dark:border-gray-800/80 px-5 py-3.5">
            <h2 className="font-bold text-gray-900 dark:text-white">Past visits</h2>
          </div>
          <table className="min-w-full text-sm">
            <thead className="table-header">
              <tr>
                <th>Date</th>
                <th>Doctor</th>
                <th>Dept</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80 dark:divide-gray-800/80">
              {PAST.map((p) => (
                <tr key={p.id} className="table-row">
                  <td className="font-mono text-xs">{p.when}</td>
                  <td className="font-medium text-gray-900 dark:text-white">{p.doctor}</td>
                  <td className="text-gray-600 dark:text-gray-300">{p.dept}</td>
                  <td>
                    <span className={p.status === 'completed' ? 'badge-emerald' : 'badge-red'}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
