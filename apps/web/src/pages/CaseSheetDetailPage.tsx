import { useMemo } from 'react';
import {
  ArrowLeft,
  Edit,
  Share2,
  Printer,
  FileText,
  Paperclip,
  Clock,
  Stethoscope,
  Activity,
  ClipboardList,
  FlaskConical,
  HeartPulse,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';

const SECTION_ICONS: Record<string, typeof FileText> = {
  Demographics: ClipboardList,
  'Presenting complaint': HeartPulse,
  History: Stethoscope,
  Examination: Activity,
  Investigations: FlaskConical,
  'Assessment & plan': FileText,
};

const SECTIONS = [
  { title: 'Demographics', items: ['MRN-00451', '58y / Male', 'B+', 'No known drug allergy'] },
  {
    title: 'Presenting complaint',
    items: ['Chest tightness 2h, radiating to left arm', 'Associated diaphoresis'],
  },
  {
    title: 'History',
    items: ['HTN — Amlodipine 5mg OD', 'DLP — Atorvastatin 20mg HS', 'Father — CAD'],
  },
  {
    title: 'Examination',
    items: ['BP 154/96, HR 92, SpO2 97%', 'CVS: S1S2 normal, no murmur', 'Lungs: clear'],
  },
  {
    title: 'Investigations',
    items: ['Trop-I pending', 'ECG — ST depression V4-V6', 'CXR — normal cardiac silhouette'],
  },
  {
    title: 'Assessment & plan',
    items: ['ACS rule-out — ACS pathway', 'Dual antiplatelet after cardiology review', 'Admit under Cardiology'],
  },
];

const TIMELINE = [
  { t: '2026-04-04 09:10', label: 'ED arrival & triage', type: 'event' },
  { t: '2026-04-04 09:25', label: 'ECG + labs ordered', type: 'order' },
  { t: '2026-04-04 10:00', label: 'Cardiology consult requested', type: 'consult' },
  { t: '2026-04-04 11:15', label: 'Draft case sheet updated (voice)', type: 'doc' },
];

const TIMELINE_TYPE_BADGE: Record<string, string> = {
  event: 'badge-blue',
  order: 'badge-amber',
  consult: 'badge-violet',
  doc: 'badge-emerald',
};

const RELATED_DOCS = [
  { name: 'ECG_04Apr2026.pdf', type: 'PDF' },
  { name: 'Consent_ACS.pdf', type: 'PDF' },
  { name: 'Previous_discharge_2024.pdf', type: 'PDF' },
];

export default function CaseSheetDetailPage() {
  const { id } = useParams();
  const isDraft = useMemo(() => id === 'new' || id?.endsWith('draft'), [id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 print:hidden lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/doctor/case-sheets"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              <span className="gradient-text">Case Sheet</span>
              <span className="ml-2 text-gray-400 dark:text-gray-500">#{id}</span>
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Structured view · timeline · related documents
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-2 text-sm"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button type="button" className="btn-secondary inline-flex items-center gap-2 text-sm">
            <Share2 className="h-4 w-4" />
            Share
          </button>
          {isDraft ? (
            <Link to="/doctor/case-sheets/new" className="btn-primary inline-flex items-center gap-2 text-sm">
              <Edit className="h-4 w-4" />
              Edit draft
            </Link>
          ) : (
            <button type="button" className="btn-secondary inline-flex items-center gap-2 text-sm opacity-60" disabled>
              <Edit className="h-4 w-4" />
              Finalized
            </button>
          )}
        </div>
      </div>

      {/* Status badge */}
      <div className="card-glass flex items-center gap-3 px-5 py-3 print:hidden">
        <span className={isDraft ? 'badge-amber' : 'badge-emerald'}>{isDraft ? 'Draft' : 'Finalized'}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Last updated {format(new Date(), 'dd MMM yyyy, HH:mm')}
        </span>
      </div>

      <div id="case-sheet-print" className="grid gap-6 xl:grid-cols-12">
        {/* Main content */}
        <div className="space-y-4 xl:col-span-8">
          {SECTIONS.map((s) => {
            const SectionIcon = SECTION_ICONS[s.title] ?? FileText;
            return (
              <section
                key={s.title}
                className="card p-5 print:break-inside-avoid"
              >
                <div className="mb-3 flex items-center gap-2.5 border-b border-gray-100/80 dark:border-gray-800/60 pb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100/60 dark:bg-emerald-950/40">
                    <SectionIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-gray-100">
                    {s.title}
                  </h2>
                </div>
                <ul className="space-y-2 pl-1">
                  {s.items.map((it) => (
                    <li key={it} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 dark:bg-emerald-500" />
                      {it}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 xl:col-span-4 print:hidden">
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="font-bold text-gray-900 dark:text-white">Progression timeline</h2>
            </div>
            <ol className="relative border-l-2 border-gray-200 dark:border-gray-700 pl-5">
              {TIMELINE.map((ev, i) => (
                <li key={i} className="mb-5 ml-1">
                  <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-gray-900" />
                  <time className="text-xs font-mono text-gray-500 dark:text-gray-400">{ev.t}</time>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">{ev.label}</p>
                  <span className={`mt-1 inline-block ${TIMELINE_TYPE_BADGE[ev.type] ?? 'badge-blue'}`}>
                    {ev.type}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/50">
                <Paperclip className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <h2 className="font-bold text-gray-900 dark:text-white">Related documents</h2>
            </div>
            <ul className="space-y-2">
              {RELATED_DOCS.map((d) => (
                <li key={d.name}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-gray-200/60 dark:border-gray-700/60 px-4 py-3 text-left text-sm transition-all hover:bg-emerald-50/30 hover:border-emerald-200/60 dark:hover:bg-emerald-950/10 dark:hover:border-emerald-800/40"
                  >
                    <span className="truncate font-medium text-gray-800 dark:text-gray-200">{d.name}</span>
                    <span className="badge-blue shrink-0 text-[10px]">{d.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            Generated preview · {format(new Date(), 'dd MMM yyyy HH:mm')}
          </p>
        </aside>
      </div>
    </div>
  );
}
