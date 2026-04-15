import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Download, Fingerprint, Search, Activity, Eye, PenLine, Trash2, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

type ActionType = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';

interface AuditRow {
  id: string;
  ts: string;
  user: string;
  action: ActionType;
  resourceType: string;
  resourceId: string;
  ip: string;
  checksum: string;
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return `sha256-sim:${(h >>> 0).toString(16).padStart(8, '0')}`;
}

const ROWS: AuditRow[] = Array.from({ length: 24 }).map((_, i) => {
  const actions: ActionType[] = ['CREATE', 'READ', 'UPDATE', 'DELETE'];
  const action = actions[i % 4];
  const user = ['admin@hospital.com', 'dr.mehra@hospital.com', 'system'][i % 3];
  const base = `${i}-${user}-${action}-CaseSheet`;
  return {
    id: `evt-${i}`,
    ts: new Date(Date.now() - i * 3600_000).toISOString(),
    user,
    action,
    resourceType: i % 5 === 0 ? 'ConsentRecord' : 'CaseSheet',
    resourceId: `res-${1000 + i}`,
    ip: `192.168.1.${(i % 200) + 10}`,
    checksum: simpleHash(base),
  };
});

const ACTION_BADGE: Record<ActionType, string> = {
  CREATE: 'badge-emerald',
  READ: 'badge-blue',
  UPDATE: 'badge-amber',
  DELETE: 'badge-red',
};

const ACTION_ICON: Record<ActionType, typeof Activity> = {
  CREATE: PlusCircle,
  READ: Eye,
  UPDATE: PenLine,
  DELETE: Trash2,
};

export default function AuditLogPage() {
  const [userQ, setUserQ] = useState('');
  const [actionF, setActionF] = useState<ActionType | 'ALL'>('ALL');

  const filtered = useMemo(() => {
    return ROWS.filter((r) => {
      if (actionF !== 'ALL' && r.action !== actionF) return false;
      if (userQ && !r.user.toLowerCase().includes(userQ.toLowerCase())) return false;
      return true;
    });
  }, [userQ, actionF]);

  const counts = useMemo(() => ({
    total: ROWS.length,
    create: ROWS.filter((r) => r.action === 'CREATE').length,
    read: ROWS.filter((r) => r.action === 'READ').length,
    update: ROWS.filter((r) => r.action === 'UPDATE').length,
    delete: ROWS.filter((r) => r.action === 'DELETE').length,
  }), []);

  const exportCsv = () => {
    const header = ['timestamp', 'user', 'action', 'resourceType', 'resourceId', 'ip', 'checksum'];
    const lines = filtered.map((r) =>
      [r.ts, r.user, r.action, r.resourceType, r.resourceId, r.ip, r.checksum].map((c) => `"${c}"`).join(','),
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-log.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="gradient-text">Audit Log</span>
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Immutable-style timeline · tamper-evident checksum (demo)
          </p>
        </div>
        <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={exportCsv}>
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
              <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{counts.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total events</p>
            </div>
          </div>
        </div>
        <div className="stat-card glow-emerald">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/50">
              <PlusCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{counts.create}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Creates</p>
            </div>
          </div>
        </div>
        <div className="stat-card glow-blue">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/50">
              <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{counts.read}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Reads</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/50">
              <PenLine className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{counts.update}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Updates</p>
            </div>
          </div>
        </div>
        <div className="stat-card glow-red">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/50">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{counts.delete}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Deletes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card flex flex-wrap gap-3 p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-10"
            placeholder="Filter by user"
            value={userQ}
            onChange={(e) => setUserQ(e.target.value)}
          />
        </div>
        <select
          className="input w-44"
          value={actionF}
          onChange={(e) => setActionF(e.target.value as ActionType | 'ALL')}
        >
          <option value="ALL">All actions</option>
          <option value="CREATE">Create</option>
          <option value="READ">Read</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
        </select>
        <div className="flex items-center">
          <span className="badge-blue">{filtered.length} results</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-8">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-300 via-gray-200 to-gray-200 dark:from-emerald-800 dark:via-gray-700 dark:to-gray-800" />
        <ul className="space-y-4">
          {filtered.map((r) => {
            const ActionIcon = ACTION_ICON[r.action];
            return (
              <li key={r.id} className="relative animate-fade-in">
                <span className="absolute -left-[18px] top-4 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-gray-900 ring-2 ring-gray-200 dark:ring-gray-700">
                  <ActionIcon className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                </span>
                <div className="card ml-4 p-5 transition-all hover:border-emerald-200/40 dark:hover:border-emerald-800/30">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <time className="font-mono text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(r.ts), 'yyyy-MM-dd HH:mm:ss')}
                    </time>
                    <span className={ACTION_BADGE[r.action]}>
                      {r.action}
                    </span>
                  </div>
                  <p className="mt-2.5 text-sm text-gray-800 dark:text-gray-100">
                    <span className="font-semibold">{r.user}</span>{' '}
                    <span className="text-gray-500 dark:text-gray-400">on</span>{' '}
                    <span className="font-medium">{r.resourceType}</span>{' '}
                    <code className="rounded-lg bg-gray-100/80 dark:bg-gray-800/80 px-1.5 py-0.5 text-xs font-mono text-gray-600 dark:text-gray-300">
                      {r.resourceId}
                    </code>
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-2.5 py-1 font-mono">
                      IP {r.ip}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 px-2.5 py-1 font-mono">
                      <Fingerprint className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                      {r.checksum}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
