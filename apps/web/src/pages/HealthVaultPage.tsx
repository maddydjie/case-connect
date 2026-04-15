import { useState } from 'react';
import { format } from 'date-fns';
import { QrCode, Share2, Upload, Users, FileText, Microscope, Scan, Shield, Clock, Eye, Heart, ChevronRight, Fingerprint, ImageIcon, Pill, Building2 } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { toast } from 'sonner';
import { clsx } from 'clsx';

const ABHA = '91-1234-5678-9012';

const RECORDS = [
  { id: '1', type: 'Lab', title: 'Lipid panel', date: '2026-03-28', provider: 'CaseConnect Lab' },
  { id: '2', type: 'Imaging', title: 'Chest X-ray', date: '2026-03-10', provider: 'Radiology' },
  { id: '3', type: 'Prescription', title: 'OP Rx — Cardiology', date: '2026-02-02', provider: 'Dr. Mehra' },
  { id: '4', type: 'Discharge', title: 'IP summary', date: '2025-11-15', provider: 'Hospital' },
];

const FAMILY = [
  { id: 'self', label: 'Self' },
  { id: 'child', label: 'Daughter (minor)' },
  { id: 'parent', label: 'Father' },
];

const RECORD_ICONS: Record<string, { icon: typeof Microscope; bg: string; text: string }> = {
  Lab: { icon: Microscope, bg: 'bg-gradient-to-br from-violet-500 to-purple-600', text: 'text-white' },
  Imaging: { icon: ImageIcon, bg: 'bg-gradient-to-br from-blue-500 to-cyan-600', text: 'text-white' },
  Prescription: { icon: Pill, bg: 'bg-gradient-to-br from-emerald-500 to-teal-600', text: 'text-white' },
  Discharge: { icon: Building2, bg: 'bg-gradient-to-br from-amber-500 to-orange-600', text: 'text-white' },
};

const FILTER_STYLES: Record<string, string> = {
  all: 'from-gray-700 to-gray-900 dark:from-gray-100 dark:to-white',
  Lab: 'from-violet-500 to-purple-600',
  Imaging: 'from-blue-500 to-cyan-600',
  Prescription: 'from-emerald-500 to-teal-600',
  Discharge: 'from-amber-500 to-orange-600',
};

export default function HealthVaultPage() {
  const [filter, setFilter] = useState<string>('all');
  const [member, setMember] = useState('self');
  const [shareDoctor, setShareDoctor] = useState('');
  const [shareDays, setShareDays] = useState('7');
  // file upload is handled via the label+input pattern below

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    toast.success(`${files.length} file(s) uploaded to Health Vault`, {
      description: 'Documents will appear in your records after verification.',
    });
    e.target.value = '';
  };

  const filtered = RECORDS.filter((r) => filter === 'all' || r.type === filter);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2 shadow-lg shadow-emerald-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              Health <span className="gradient-text">Vault</span>
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            ABHA · timeline · consent-based sharing (ABDM-ready)
          </p>
        </div>
      </div>

      <Tabs.Root value={member} onValueChange={setMember}>
        <Tabs.List className="flex flex-wrap gap-2 rounded-2xl bg-gray-100/80 p-1.5 dark:bg-gray-800/60 w-fit">
          {FAMILY.map((f) => (
            <Tabs.Trigger
              key={f.id}
              value={f.id}
              className={clsx(
                'flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200',
                'data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md',
                'dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-white',
                'data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700',
                'dark:data-[state=inactive]:text-gray-400 dark:data-[state=inactive]:hover:text-gray-200',
              )}
            >
              {f.id === 'self' ? (
                <Fingerprint className="h-3.5 w-3.5" />
              ) : f.id === 'child' ? (
                <Heart className="h-3.5 w-3.5" />
              ) : (
                <Users className="h-3.5 w-3.5" />
              )}
              {f.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs.Root>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card-glass rounded-2xl p-6 lg:col-span-1 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/5" />
          <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500/5 to-teal-500/10" />
          <div className="relative">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-1.5 shadow-md shadow-emerald-500/20">
                <Scan className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">ABHA (Health ID)</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Ayushman Bharat Health Account</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-3 dark:from-white/10 dark:to-white/5">
              <p className="font-mono text-lg font-black tracking-[0.15em] text-white dark:text-emerald-300">{ABHA}</p>
            </div>
            <div className="mt-5 flex justify-center rounded-2xl border-2 border-dashed border-gray-200/80 bg-white/60 p-5 dark:border-gray-700/60 dark:bg-gray-950/40 backdrop-blur-sm">
              <div className="relative flex h-36 w-36 items-center justify-center rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-inner">
                <QrCode className="h-24 w-24 text-gray-800 dark:text-gray-100" />
                <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md" />
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] font-medium text-gray-500 dark:text-gray-400">
              Show at registration / HIP linking
            </p>
          </div>
        </div>

        <div className="card p-6 lg:col-span-2 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 shadow-md shadow-blue-500/20">
              <Share2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Share with doctor (consent)</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                DPDP: separate clinical consent from data processing consent in production flows.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Doctor / HIP
              </label>
              <input
                className="input"
                placeholder="Doctor name / HIP ID"
                value={shareDoctor}
                onChange={(e) => setShareDoctor(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Access duration
              </label>
              <select
                className="input"
                value={shareDays}
                onChange={(e) => setShareDays(e.target.value)}
              >
                <option value="1">Expires in 1 day</option>
                <option value="7">Expires in 7 days</option>
                <option value="30">Expires in 30 days</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            onClick={() => toast.success('Consent token issued (demo)')}
          >
            <Share2 className="h-4 w-4" />
            Grant access
          </button>

          <div className="group relative rounded-2xl border-2 border-dashed border-gray-200/80 bg-gradient-to-b from-gray-50/80 to-white/40 p-6 text-center transition-all duration-300 hover:border-emerald-300/60 hover:from-emerald-50/30 hover:to-white/60 dark:border-gray-700/60 dark:from-gray-900/40 dark:to-gray-950/20 dark:hover:border-emerald-700/40">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 transition-all duration-300 group-hover:from-emerald-100 group-hover:to-emerald-200 dark:from-gray-800 dark:to-gray-700 dark:group-hover:from-emerald-900/40 dark:group-hover:to-emerald-800/30">
              <Upload className="h-6 w-6 text-gray-400 transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
            </div>
            <p className="mt-3 text-sm font-bold text-gray-700 dark:text-gray-200">Upload physical records</p>
            <p className="mt-1 text-xs text-gray-500">Drag & drop PDF / images</p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.png,.doc,.docx"
              className="hidden"
              id="vault-upload"
              onChange={handleFileUpload}
            />
            <label htmlFor="vault-upload" className="btn-secondary mt-3 text-sm cursor-pointer inline-block">
              Choose files
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', 'Lab', 'Imaging', 'Prescription', 'Discharge'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={clsx(
              'rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200',
              filter === f
                ? `bg-gradient-to-r ${FILTER_STYLES[f]} text-white shadow-lg ${
                    f === 'all' ? 'dark:text-gray-900' : ''
                  }`
                : 'bg-white/80 text-gray-600 ring-1 ring-inset ring-gray-200/80 hover:ring-gray-300 dark:bg-gray-800/80 dark:text-gray-300 dark:ring-gray-700/80',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const recordStyle = RECORD_ICONS[r.type] ?? RECORD_ICONS.Lab;
          const Icon = recordStyle.icon;
          return (
            <div
              key={r.id}
              className="card-interactive flex items-center justify-between gap-4 px-5 py-4 group"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${recordStyle.bg} shadow-md transition-transform duration-200 group-hover:scale-105`}>
                  <Icon className={`h-5 w-5 ${recordStyle.text}`} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{r.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className={clsx(
                      'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase',
                      r.type === 'Lab' && 'bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400',
                      r.type === 'Imaging' && 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
                      r.type === 'Prescription' && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
                      r.type === 'Discharge' && 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
                    )}>
                      {r.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(r.date), 'dd MMM yyyy')}
                    </span>
                    <span>· {r.provider}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toast.info(`Opening ${r.title}`, { description: `${r.type} from ${r.provider} · ${format(new Date(r.date), 'dd MMM yyyy')}` })}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-emerald-600 transition-all hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              >
                <Eye className="h-4 w-4" />
                View
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
