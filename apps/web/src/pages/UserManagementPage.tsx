import { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Shield, UserPlus, X, Users, ShieldCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';

type Role = 'admin' | 'doctor' | 'nurse' | 'student';
type Status = 'active' | 'inactive';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  status: Status;
  mfa: boolean;
}

const INITIAL: UserRow[] = [
  { id: '1', name: 'Dr. Rajesh Sharma', email: 'rajesh@hospital.com', role: 'doctor', department: 'Cardiology', status: 'active', mfa: true },
  { id: '2', name: 'Nurse Anita', email: 'anita@hospital.com', role: 'nurse', department: 'ICU', status: 'active', mfa: false },
  { id: '3', name: 'Admin Prakash', email: 'prakash@hospital.com', role: 'admin', department: 'IT', status: 'active', mfa: true },
  { id: '4', name: 'Intern Riya', email: 'riya@edu.in', role: 'student', department: 'Medicine', status: 'inactive', mfa: false },
];

const ROLE_BADGE: Record<Role, string> = {
  admin: 'badge-violet',
  doctor: 'badge-blue',
  nurse: 'badge-emerald',
  student: 'badge-amber',
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserRow[]>(INITIAL);
  const [q, setQ] = useState('');
  const [roleF, setRoleF] = useState<Role | 'all'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'doctor' as Role, department: '' });

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleF !== 'all' && u.role !== roleF) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!u.name.toLowerCase().includes(s) && !u.email.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [users, q, roleF]);

  const activeCount = users.filter((u) => u.status === 'active').length;
  const mfaCount = users.filter((u) => u.mfa).length;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const bulk = (status: Status) => {
    if (selected.size === 0) return;
    setUsers((u) => u.map((row) => (selected.has(row.id) ? { ...row, status } : row)));
    toast.success(`Updated ${selected.size} users`);
    setSelected(new Set());
  };

  const addUser = () => {
    if (!form.name || !form.email) {
      toast.error('Name and email required');
      return;
    }
    setUsers((u) => [
      ...u,
      {
        id: String(Date.now()),
        name: form.name,
        email: form.email,
        role: form.role,
        department: form.department || '—',
        status: 'active',
        mfa: false,
      },
    ]);
    toast.success('User added');
    setOpen(false);
    setForm({ name: '', email: '', role: 'doctor', department: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="gradient-text">User Management</span>
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">RBAC · MFA badges · bulk actions</p>
        </div>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button type="button" className="btn-primary inline-flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add user
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(100%,440px)] -translate-x-1/2 -translate-y-1/2 card p-6">
              <div className="mb-5 flex items-center justify-between">
                <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">Add user</Dialog.Title>
                <Dialog.Close className="rounded-xl p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X className="h-5 w-5" />
                </Dialog.Close>
              </div>
              <div className="space-y-3">
                <input
                  className="input"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <select
                  className="input"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                >
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="admin">Admin</option>
                  <option value="student">Student</option>
                </select>
                <input
                  className="input"
                  placeholder="Department"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
                <button type="button" className="btn-primary w-full" onClick={addUser}>
                  Save
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/50">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{users.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total users</p>
            </div>
          </div>
        </div>
        <div className="stat-card glow-emerald">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/50">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{activeCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/50">
              <ShieldAlert className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{mfaCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">MFA enabled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <input
          className="input max-w-xs"
          placeholder="Search name / email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="input w-40"
          value={roleF}
          onChange={(e) => setRoleF(e.target.value as Role | 'all')}
        >
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="doctor">Doctor</option>
          <option value="nurse">Nurse</option>
          <option value="student">Student</option>
        </select>
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" className="btn-secondary text-sm" onClick={() => bulk('active')} disabled={selected.size === 0}>
            Activate selected
          </button>
          <button type="button" className="btn-secondary text-sm" onClick={() => bulk('inactive')} disabled={selected.size === 0}>
            Deactivate selected
          </button>
        </div>
      </div>

      {/* User table */}
      <div className="card overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="table-header">
            <tr>
              <th className="w-10">
                <input
                  type="checkbox"
                  className="rounded"
                  aria-label="Select all"
                  checked={filtered.length > 0 && filtered.every((u) => selected.has(u.id))}
                  onChange={() => {
                    if (filtered.every((u) => selected.has(u.id))) {
                      setSelected(new Set());
                    } else {
                      setSelected(new Set(filtered.map((u) => u.id)));
                    }
                  }}
                />
              </th>
              <th>User</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th>MFA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100/80 dark:divide-gray-800/80">
            {filtered.map((u) => (
              <tr key={u.id} className="table-row">
                <td>
                  <input type="checkbox" className="rounded" checked={selected.has(u.id)} onChange={() => toggle(u.id)} />
                </td>
                <td>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{u.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                  </div>
                </td>
                <td>
                  <span className={ROLE_BADGE[u.role]}>{u.role}</span>
                </td>
                <td className="text-gray-700 dark:text-gray-300">{u.department}</td>
                <td>
                  <span className={u.status === 'active' ? 'badge-emerald' : 'badge-red'}>
                    {u.status}
                  </span>
                </td>
                <td>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                    <Shield className={clsx('h-4 w-4', u.mfa ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600')} />
                    <span className={u.mfa ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}>
                      {u.mfa ? 'On' : 'Off'}
                    </span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
