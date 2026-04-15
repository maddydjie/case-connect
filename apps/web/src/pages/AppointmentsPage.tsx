import { useCallback, useMemo, useState } from 'react';
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addHours,
  addMinutes,
  startOfDay,
  addDays,
  isSameDay,
  isWithinInterval,
  getHours,
} from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { Calendar, dateFnsLocalizer, type View, type SlotInfo } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { AlertTriangle, CalendarPlus, Users, X, Clock, ArrowUpRight, Settings, Filter } from 'lucide-react';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import { clsx } from 'clsx';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

type Priority = 'normal' | 'moderate' | 'emergency';

interface DoctorAvailability {
  startHour: number;
  endHour: number;
  slotMinutes: number;
  days: number[];
}

interface Doctor {
  id: string;
  name: string;
  department: string;
  availability: DoctorAvailability;
}

interface CalEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string;
  priority: Priority;
  patient: string;
}

const DEPARTMENTS = ['All', 'Cardiology', 'General Medicine', 'Orthopedics'];

const DOCTORS: Doctor[] = [
  { id: 'd1', name: 'Dr. Mehra', department: 'Cardiology', availability: { startHour: 9, endHour: 13, slotMinutes: 30, days: [1, 2, 3, 4, 5] } },
  { id: 'd2', name: 'Dr. Iyer', department: 'General Medicine', availability: { startHour: 10, endHour: 16, slotMinutes: 20, days: [1, 2, 3, 4, 5, 6] } },
  { id: 'd3', name: 'Dr. Khan', department: 'Orthopedics', availability: { startHour: 14, endHour: 18, slotMinutes: 30, days: [1, 3, 5] } },
];

const base = startOfDay(new Date());
const INITIAL_EVENTS: CalEvent[] = [
  { id: 'e1', title: 'Rajesh Sharma', start: addHours(base, 10), end: addMinutes(addHours(base, 10), 30), resourceId: 'd1', priority: 'moderate', patient: 'Rajesh Sharma' },
  { id: 'e2', title: 'Priya Nair', start: addMinutes(addHours(base, 10), 30), end: addHours(base, 11), resourceId: 'd1', priority: 'emergency', patient: 'Priya Nair' },
  { id: 'e3', title: 'Amit Patel', start: addHours(addDays(base, 1), 14), end: addMinutes(addHours(addDays(base, 1), 14), 30), resourceId: 'd2', priority: 'normal', patient: 'Amit Patel' },
];

const WAITLIST_INIT = [
  { id: 'w1', patient: 'Neha Gupta', reason: 'Follow-up HTN', doctor: 'd1' },
  { id: 'w2', patient: 'Ravi Kumar', reason: 'Post-op review', doctor: 'd3' },
];

function eventStyle(ev: CalEvent) {
  const border =
    ev.priority === 'emergency' ? '3px solid #ef4444' : ev.priority === 'moderate' ? '3px solid #f59e0b' : '3px solid #3b82f6';
  const bg =
    ev.priority === 'emergency' ? 'rgba(254, 226, 226, 0.95)' : ev.priority === 'moderate' ? 'rgba(254, 243, 199, 0.95)' : 'rgba(219, 234, 254, 0.95)';
  return { style: { backgroundColor: bg, borderLeft: border, color: '#111', borderRadius: '8px', fontSize: '12px', fontWeight: 500 } };
}

function isDoctorAvailable(doctor: Doctor, slotStart: Date): boolean {
  const dayOfWeek = getDay(slotStart);
  if (!doctor.availability.days.includes(dayOfWeek)) return false;
  const hour = getHours(slotStart);
  return hour >= doctor.availability.startHour && hour < doctor.availability.endHour;
}

function hasConflict(events: CalEvent[], doctorId: string, start: Date, end: Date, excludeId?: string): boolean {
  return events.some((e) => {
    if (e.resourceId !== doctorId) return false;
    if (excludeId && e.id === excludeId) return false;
    return e.start < end && start < e.end;
  });
}

function findNextFreeSlot(doctor: Doctor, events: CalEvent[], fromDate: Date): Date | null {
  const slotDuration = doctor.availability.slotMinutes;
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const day = addDays(startOfDay(fromDate), dayOffset);
    const dayOfWeek = getDay(day);
    if (!doctor.availability.days.includes(dayOfWeek)) continue;

    for (let hour = doctor.availability.startHour; hour < doctor.availability.endHour; hour++) {
      for (let min = 0; min < 60; min += slotDuration) {
        const slotStart = addMinutes(addHours(day, hour), min);
        if (slotStart <= fromDate) continue;
        const slotEnd = addMinutes(slotStart, slotDuration);
        if (getHours(slotEnd) > doctor.availability.endHour) continue;
        if (!hasConflict(events, doctor.id, slotStart, slotEnd)) {
          return slotStart;
        }
      }
    }
  }
  return null;
}

export default function AppointmentsPage() {
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState<CalEvent[]>(INITIAL_EVENTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [doctorId, setDoctorId] = useState(DOCTORS[0].id);
  const [priority, setPriority] = useState<Priority>('normal');
  const [slotStart, setSlotStart] = useState<Date | null>(null);
  const [deptFilter, setDeptFilter] = useState('All');
  const [showAvailConfig, setShowAvailConfig] = useState(false);
  const [waitlist, setWaitlist] = useState(WAITLIST_INIT);

  const filteredDoctors = useMemo(() => {
    if (deptFilter === 'All') return DOCTORS;
    return DOCTORS.filter((d) => d.department === deptFilter);
  }, [deptFilter]);

  const resources = useMemo(
    () => filteredDoctors.map((d) => ({
      resourceId: d.id,
      resourceTitle: `${d.name} — ${d.department} (${d.availability.startHour}:00–${d.availability.endHour}:00)`,
    })),
    [filteredDoctors],
  );

  const filteredEvents = useMemo(() => {
    const docIds = new Set(filteredDoctors.map((d) => d.id));
    return events.filter((e) => docIds.has(e.resourceId));
  }, [events, filteredDoctors]);

  const conflicts = useMemo(() => {
    const list: string[] = [];
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const a = events[i];
        const b = events[j];
        if (a.resourceId !== b.resourceId) continue;
        if (a.start < b.end && b.start < a.end) {
          list.push(`${a.patient} ↔ ${b.patient} (${DOCTORS.find((d) => d.id === a.resourceId)?.name})`);
        }
      }
    }
    return list;
  }, [events]);

  const onSelectSlot = useCallback((slot: SlotInfo) => {
    setSlotStart(slot.start as Date);
    setModalOpen(true);
  }, []);

  const book = () => {
    if (!patientName.trim() || !slotStart) {
      toast.error('Patient name and slot required');
      return;
    }
    const doctor = DOCTORS.find((d) => d.id === doctorId);
    if (!doctor) return;

    if (!isDoctorAvailable(doctor, slotStart)) {
      toast.error(`${doctor.name} is not available at this time`, {
        description: `Available ${doctor.availability.startHour}:00–${doctor.availability.endHour}:00 on selected days`,
      });
      return;
    }

    const slotEnd = addMinutes(slotStart, doctor.availability.slotMinutes);

    if (hasConflict(events, doctorId, slotStart, slotEnd)) {
      toast.error('Double booking prevented', {
        description: `${doctor.name} already has an appointment at this time. Choose another slot.`,
      });

      const sameDeptDoctors = DOCTORS.filter((d) => d.department === doctor.department && d.id !== doctor.id);
      for (const alt of sameDeptDoctors) {
        if (!hasConflict(events, alt.id, slotStart, addMinutes(slotStart, alt.availability.slotMinutes)) && isDoctorAvailable(alt, slotStart)) {
          toast.info(`${alt.name} is available at this time`, { duration: 6000 });
          break;
        }
      }
      return;
    }

    setEvents((e) => [
      ...e,
      {
        id: `e-${Date.now()}`,
        title: patientName,
        start: slotStart,
        end: slotEnd,
        resourceId: doctorId,
        priority,
        patient: patientName,
      },
    ]);
    toast.success(`Appointment booked with ${doctor.name}`, {
      description: `${format(slotStart, 'dd MMM HH:mm')} – ${format(slotEnd, 'HH:mm')} (${doctor.availability.slotMinutes} min)`,
    });
    setModalOpen(false);
    setPatientName('');
  };

  const promote = (wid: string) => {
    const w = waitlist.find((x) => x.id === wid);
    if (!w) return;
    const doctor = DOCTORS.find((d) => d.id === w.doctor);
    if (!doctor) return;

    const nextSlot = findNextFreeSlot(doctor, events, new Date());
    if (!nextSlot) {
      toast.error(`No available slots for ${doctor.name} in the next 2 weeks`);
      return;
    }

    const slotEnd = addMinutes(nextSlot, doctor.availability.slotMinutes);
    setEvents((e) => [
      ...e,
      {
        id: `e-${Date.now()}`,
        title: w.patient,
        start: nextSlot,
        end: slotEnd,
        resourceId: w.doctor,
        priority: 'normal',
        patient: w.patient,
      },
    ]);
    setWaitlist((prev) => prev.filter((x) => x.id !== wid));
    toast.success(`${w.patient} booked with ${doctor.name}`, {
      description: `${format(nextSlot, 'dd MMM HH:mm')} – ${format(slotEnd, 'HH:mm')}`,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Appoint<span className="gradient-text">ments</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Slot-based booking · department filter · double-booking prevented
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200/60 bg-white/80 px-3 py-1.5 dark:border-gray-700/60 dark:bg-gray-800/80">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              className="bg-transparent text-sm font-semibold text-gray-700 dark:text-gray-200 focus:outline-none"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          {(['day', 'week', 'month'] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={clsx(
                'rounded-xl px-4 py-2 text-sm font-semibold capitalize transition-all duration-200',
                view === v
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-md dark:bg-gray-800/80 dark:text-gray-200 dark:hover:bg-gray-700/80',
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="card-glass glow-red flex items-start gap-3 border-2 border-red-300/40 dark:border-red-800/40 px-5 py-4 text-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-500 shadow-md shadow-red-500/20">
            <AlertTriangle className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-red-800 dark:text-red-200">Scheduling conflicts detected</p>
            <ul className="mt-1.5 space-y-1 text-xs text-red-700 dark:text-red-300">
              {conflicts.map((c) => (
                <li key={c} className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-red-400" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-12">
        <div className="card-glass p-3 xl:col-span-9 overflow-hidden">
          <div className="rbc-dark-wrapper dark:text-gray-100 [&_.rbc-toolbar]:mb-2 [&_.rbc-toolbar]:flex-wrap [&_.rbc-toolbar_button]:rounded-lg [&_.rbc-toolbar_button]:border-gray-200 [&_.rbc-toolbar_button]:text-sm dark:[&_.rbc-toolbar_button]:border-gray-700 [&_.rbc-header]:border-gray-200/60 [&_.rbc-header]:text-xs [&_.rbc-header]:font-semibold [&_.rbc-header]:uppercase [&_.rbc-header]:tracking-wider dark:[&_.rbc-header]:border-gray-700/60 [&_.rbc-time-content]:border-gray-200/60 dark:[&_.rbc-time-content]:border-gray-700/60 [&_.rbc-day-slot_.rbc-time-slot]:border-gray-100/60 dark:[&_.rbc-day-slot_.rbc-time-slot]:border-gray-800/60 [&_.rbc-time-header-content]:border-gray-200/60 dark:[&_.rbc-time-header-content]:border-gray-700/60 [&_.rbc-today]:bg-emerald-50/40 dark:[&_.rbc-today]:bg-emerald-950/20">
            <Calendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 640 }}
              view={view}
              date={date}
              onNavigate={setDate}
              onView={setView}
              resources={resources}
              resourceIdAccessor="resourceId"
              resourceTitleAccessor="resourceTitle"
              selectable
              onSelectSlot={onSelectSlot}
              eventPropGetter={(ev: object) => eventStyle(ev as CalEvent)}
              views={['month', 'week', 'day']}
            />
          </div>
        </div>

        <aside className="space-y-4 xl:col-span-3">
          {/* Doctor Availability */}
          <div className="card-glass p-4">
            <button
              onClick={() => setShowAvailConfig(!showAvailConfig)}
              className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              <span className="flex items-center gap-2">
                <Settings className="h-3.5 w-3.5" />
                Doctor Availability
              </span>
              <span className="text-[10px] text-gray-400">{showAvailConfig ? 'Hide' : 'Show'}</span>
            </button>
            {showAvailConfig && (
              <div className="mt-3 space-y-3">
                {DOCTORS.map((doc) => (
                  <div key={doc.id} className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/50 dark:bg-gray-800/30 p-3 space-y-1.5">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{doc.name}</p>
                    <p className="text-[10px] text-gray-400">{doc.department}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <Clock className="h-3 w-3 text-emerald-500" />
                      {doc.availability.startHour}:00 – {doc.availability.endHour}:00
                      <span className="text-gray-400">·</span>
                      {doc.availability.slotMinutes} min slots
                    </div>
                    <div className="flex gap-1">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <span
                          key={`${doc.id}-${i}`}
                          className={clsx(
                            'flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-bold',
                            doc.availability.days.includes(i)
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                              : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600',
                          )}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Waitlist */}
          <div className="card-glass p-5">
            <div className="mb-2 flex items-center gap-2.5 font-semibold text-gray-900 dark:text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 shadow-md shadow-violet-500/20">
                <Users className="h-3.5 w-3.5 text-white" />
              </div>
              Waitlist
              <span className="badge-violet text-[10px] ml-auto">{waitlist.length}</span>
            </div>
            <p className="mb-3 text-[10px] leading-relaxed text-gray-400">
              Auto-promote scans the doctor's actual free slots based on availability config.
            </p>
            {waitlist.length === 0 && (
              <p className="py-4 text-center text-xs text-gray-400">No patients waiting</p>
            )}
            <ul className="space-y-3">
              {waitlist.map((w) => {
                const doc = DOCTORS.find((d) => d.id === w.doctor);
                return (
                  <li key={w.id} className="rounded-xl border border-gray-100/80 dark:border-gray-800/80 bg-white/50 dark:bg-gray-800/30 p-3.5 backdrop-blur-sm transition-all duration-200 hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{w.patient}</p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{w.reason} · {doc?.name}</p>
                      </div>
                      <span className="badge-blue text-[9px]">Waiting</span>
                    </div>
                    <button
                      type="button"
                      className="btn-primary mt-3 w-full py-2 text-xs flex items-center justify-center gap-1.5"
                      onClick={() => promote(w.id)}
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      Auto-promote next slot
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Legend */}
          <div className="card-glass p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Priority legend</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-gray-300">
                <span className="h-3 w-3 rounded-full bg-blue-100 ring-2 ring-blue-400 shadow-sm" />
                <span className="font-medium">Normal</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-gray-300">
                <span className="h-3 w-3 rounded-full bg-amber-100 ring-2 ring-amber-400 shadow-sm" />
                <span className="font-medium">Moderate</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-gray-300">
                <span className="h-3 w-3 rounded-full bg-red-100 ring-2 ring-red-400 shadow-sm" />
                <span className="font-medium">Emergency</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card-glass p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Today's overview</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Clock className="h-3.5 w-3.5 text-emerald-500" />
                  Appointments
                </span>
                <span className="font-bold text-gray-900 dark:text-white">{events.filter((e) => isSameDay(e.start, new Date())).length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                  Conflicts
                </span>
                <span className={clsx('font-bold', conflicts.length > 0 ? 'text-red-600' : 'text-emerald-600')}>
                  {conflicts.length}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(100%,440px)] -translate-x-1/2 -translate-y-1/2 card-glass rounded-2xl p-0 shadow-2xl animate-scale-in overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <Dialog.Title className="flex items-center gap-2.5 text-lg font-bold">
                  <CalendarPlus className="h-5 w-5" />
                  Book Appointment
                </Dialog.Title>
                <Dialog.Close className="rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  <X className="h-5 w-5" />
                </Dialog.Close>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Patient</label>
                <input
                  className="input"
                  placeholder="Patient name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Doctor</label>
                <select className="input" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                  {DOCTORS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.department} ({d.availability.startHour}:00–{d.availability.endHour}:00, {d.availability.slotMinutes}min)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Priority</label>
                <div className="flex gap-2">
                  {(['normal', 'moderate', 'emergency'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={clsx(
                        'flex-1 rounded-xl py-2.5 text-xs font-bold capitalize transition-all duration-200',
                        priority === p && p === 'normal' && 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-lg shadow-blue-500/20',
                        priority === p && p === 'moderate' && 'bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-lg shadow-amber-500/20',
                        priority === p && p === 'emergency' && 'bg-gradient-to-r from-red-500 to-rose-400 text-white shadow-lg shadow-red-500/20',
                        priority !== p && 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/80 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-700/80',
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              {slotStart && (() => {
                const doc = DOCTORS.find((d) => d.id === doctorId);
                const available = doc ? isDoctorAvailable(doc, slotStart) : false;
                return (
                  <div className={clsx(
                    'rounded-xl border p-3 flex items-center gap-2',
                    available ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30' : 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900/30',
                  )}>
                    <Clock className={clsx('h-4 w-4', available ? 'text-emerald-500' : 'text-red-500')} />
                    <div>
                      <p className={clsx('text-xs font-medium', available ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-800 dark:text-red-200')}>
                        {format(slotStart, 'dd MMM yyyy HH:mm')}
                      </p>
                      {!available && <p className="text-[10px] text-red-600">Doctor not available at this time</p>}
                    </div>
                  </div>
                );
              })()}
              <button type="button" className="btn-primary w-full py-3" onClick={book}>
                Confirm booking
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
