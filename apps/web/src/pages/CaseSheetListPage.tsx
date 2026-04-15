import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  Eye,
  Pencil,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  FileText,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/PageStates';

type ViewMode = 'grid' | 'list';
type StatusFilter = 'All' | 'Draft' | 'In Progress' | 'Completed' | 'Reviewed';

interface CaseSheet {
  id: string;
  patientName: string;
  mrn: string;
  department: string;
  chiefComplaint: string;
  date: string;
  status: StatusFilter;
  doctor: string;
}

const DEPARTMENTS = [
  'All Departments',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Gastroenterology',
  'Pulmonology',
  'Dermatology',
  'Ophthalmology',
  'ENT',
];

const DEPARTMENT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Cardiology: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  Neurology: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
  Orthopedics: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  Gastroenterology: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
  Pulmonology: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
  Dermatology: { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500' },
  Ophthalmology: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  ENT: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  Draft: 'badge-amber',
  'In Progress': 'badge-blue',
  Completed: 'badge-emerald',
  Reviewed: 'badge-violet',
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  'In Progress': { bg: 'bg-amber-100', text: 'text-amber-800' },
  Completed: { bg: 'bg-green-100', text: 'text-green-800' },
  Reviewed: { bg: 'bg-blue-100', text: 'text-blue-800' },
};

const STATUS_CHIP_STYLES: Record<string, { active: string; inactive: string }> = {
  All: {
    active: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-600/30',
    inactive: 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/50',
  },
  Draft: {
    active: 'bg-amber-500 text-white shadow-lg shadow-amber-500/25 ring-2 ring-amber-500/30',
    inactive: 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-amber-300 hover:text-amber-700 hover:bg-amber-50/50',
  },
  'In Progress': {
    active: 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-600/30',
    inactive: 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-blue-300 hover:text-blue-700 hover:bg-blue-50/50',
  },
  Completed: {
    active: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-600/30',
    inactive: 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/50',
  },
  Reviewed: {
    active: 'bg-violet-600 text-white shadow-lg shadow-violet-500/25 ring-2 ring-violet-600/30',
    inactive: 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-violet-300 hover:text-violet-700 hover:bg-violet-50/50',
  },
};

const MOCK_CASE_SHEETS: CaseSheet[] = [
  {
    id: 'CS-2024-001',
    patientName: 'Rajesh Sharma',
    mrn: 'MRN-00451',
    department: 'Cardiology',
    chiefComplaint: 'Chest pain radiating to left arm, onset 2 hours ago with diaphoresis',
    date: '2024-12-28',
    status: 'Completed',
    doctor: 'Dr. Ananya Iyer',
  },
  {
    id: 'CS-2024-002',
    patientName: 'Priya Nair',
    mrn: 'MRN-00672',
    department: 'Neurology',
    chiefComplaint: 'Recurrent episodes of severe headache with visual aura and photophobia',
    date: '2024-12-28',
    status: 'In Progress',
    doctor: 'Dr. Suresh Menon',
  },
  {
    id: 'CS-2024-003',
    patientName: 'Amit Patel',
    mrn: 'MRN-00893',
    department: 'Orthopedics',
    chiefComplaint: 'Lower back pain with radiculopathy to right leg for 3 weeks',
    date: '2024-12-27',
    status: 'Reviewed',
    doctor: 'Dr. Kavitha Reddy',
  },
  {
    id: 'CS-2024-004',
    patientName: 'Deepa Krishnan',
    mrn: 'MRN-01024',
    department: 'Gastroenterology',
    chiefComplaint: 'Persistent epigastric pain with bloating and early satiety for 2 weeks',
    date: '2024-12-27',
    status: 'Draft',
    doctor: 'Dr. Vikram Joshi',
  },
  {
    id: 'CS-2024-005',
    patientName: 'Manoj Deshmukh',
    mrn: 'MRN-01135',
    department: 'Pulmonology',
    chiefComplaint: 'Progressive dyspnea on exertion with productive cough for 1 month',
    date: '2024-12-26',
    status: 'Completed',
    doctor: 'Dr. Ananya Iyer',
  },
  {
    id: 'CS-2024-006',
    patientName: 'Sunita Gupta',
    mrn: 'MRN-01287',
    department: 'Dermatology',
    chiefComplaint: 'Erythematous scaly plaques on extensor surfaces with nail pitting',
    date: '2024-12-26',
    status: 'In Progress',
    doctor: 'Dr. Meera Bhat',
  },
  {
    id: 'CS-2024-007',
    patientName: 'Arjun Malhotra',
    mrn: 'MRN-01398',
    department: 'Cardiology',
    chiefComplaint: 'Palpitations with dizziness, intermittent for 5 days, no syncope',
    date: '2024-12-25',
    status: 'Draft',
    doctor: 'Dr. Suresh Menon',
  },
  {
    id: 'CS-2024-008',
    patientName: 'Lakshmi Venkatesh',
    mrn: 'MRN-01509',
    department: 'Ophthalmology',
    chiefComplaint: 'Gradual painless decrease in vision bilaterally over 6 months',
    date: '2024-12-25',
    status: 'Reviewed',
    doctor: 'Dr. Kavitha Reddy',
  },
];

const STATUS_OPTIONS: StatusFilter[] = ['All', 'Draft', 'In Progress', 'Completed', 'Reviewed'];

function DepartmentBadge({ department }: { department: string }) {
  const colors = DEPARTMENT_COLORS[department] ?? { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ring-current/10 ${colors.bg} ${colors.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot} animate-pulse`} />
      {department}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const badgeClass = STATUS_BADGE_CLASS[status] ?? 'badge-amber';
  return (
    <span className={badgeClass}>
      {status}
    </span>
  );
}

const PAGE_SIZE = 4;

export default function CaseSheetListPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('');

  const filtered = useMemo(() => {
    return MOCK_CASE_SHEETS.filter((cs) => {
      const matchesSearch =
        !searchQuery ||
        cs.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cs.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cs.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDepartment === 'All Departments' || cs.department === selectedDepartment;
      const matchesStatus = selectedStatus === 'All' || cs.status === selectedStatus;
      const matchesDate = !dateFilter || cs.date === dateFilter;
      return matchesSearch && matchesDept && matchesStatus && matchesDate;
    });
  }, [searchQuery, selectedDepartment, selectedStatus, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalCases = MOCK_CASE_SHEETS.length;
  const draftCount = MOCK_CASE_SHEETS.filter((cs) => cs.status === 'Draft').length;
  const thisWeekCount = MOCK_CASE_SHEETS.filter((cs) => {
    const d = new Date(cs.date);
    const now = new Date();
    return (now.getTime() - d.getTime()) / 86400000 < 7;
  }).length;

  const handleEdit = (cs: CaseSheet) => {
    navigate(`/doctor/case-sheets/${cs.id}`);
    toast.info(`Editing case for ${cs.patientName}`);
  };

  const handleDownload = (cs: CaseSheet) => {
    const blob = new Blob(
      [`Case Sheet: ${cs.id}\nPatient: ${cs.patientName}\nMRN: ${cs.mrn}\nComplaint: ${cs.chiefComplaint}\nDoctor: ${cs.doctor}\nDate: ${cs.date}\nStatus: ${cs.status}`],
      { type: 'text/plain' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cs.id}-${cs.patientName.replace(/ /g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${cs.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="gradient-text">Case Sheets</span>
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Manage and review clinical documentation
          </p>
        </div>
        <Link
          to="/doctor/case-sheets/new"
          className="btn-primary inline-flex items-center gap-2 text-sm"
        >
          <Plus className="h-4 w-4" />
          New Case Sheet
        </Link>
      </div>

      {/* Main Content Card */}
      <div className="card overflow-hidden">
        {/* Filter Bar — glass effect */}
        <div className="card-glass flex flex-col gap-3 rounded-none border-x-0 border-t-0 p-4 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-emerald-500" />
            <input
              type="text"
              placeholder="Search patients, MRN, complaints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Department dropdown */}
          <div className="relative min-w-[180px]">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="input appearance-none pr-9"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Date range */}
          <div className="relative min-w-[160px]">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
              className="input pl-10"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-gray-200/80 bg-gray-100/60 p-1 dark:border-gray-700 dark:bg-gray-800/60">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-2 transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white text-emerald-600 shadow-sm dark:bg-gray-700 dark:text-emerald-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-lg p-2 transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-white text-emerald-600 shadow-sm dark:bg-gray-700 dark:text-emerald-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Status chips + Stats */}
        <div className="flex flex-col gap-3 border-b border-gray-100/80 px-4 py-3.5 dark:border-gray-800/80 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_OPTIONS.map((s) => {
              const chipStyle = STATUS_CHIP_STYLES[s];
              return (
                <button
                  key={s}
                  onClick={() => setSelectedStatus(s)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    selectedStatus === s ? chipStyle.active : chipStyle.inactive
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-emerald-500" />
              <span className="font-bold text-gray-900 dark:text-gray-100">{totalCases}</span> total
            </span>
            <span className="h-3.5 w-px bg-gray-200 dark:bg-gray-700" />
            <span className="inline-flex items-center gap-1.5">
              <Pencil className="h-3.5 w-3.5 text-amber-500" />
              <span className="font-bold text-gray-900 dark:text-gray-100">{draftCount}</span> drafts
            </span>
            <span className="h-3.5 w-px bg-gray-200 dark:bg-gray-700" />
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-500" />
              <span className="font-bold text-gray-900 dark:text-gray-100">{thisWeekCount}</span> this week
            </span>
          </div>
        </div>

        {/* Grid / List View */}
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
            >
              {paginatedItems.map((cs, i) => (
                <motion.div
                  key={cs.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <Link
                    to={`/doctor/case-sheets/${cs.id}`}
                    className="card-interactive group relative block overflow-hidden p-5"
                  >
                    {/* Gradient hover overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-teal-500/0 to-cyan-500/0 opacity-0 transition-opacity duration-300 group-hover:from-emerald-500/[0.03] group-hover:via-teal-500/[0.04] group-hover:to-cyan-500/[0.03] group-hover:opacity-100" />

                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <DepartmentBadge department={cs.department} />
                        <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">{formatDate(cs.date)}</span>
                      </div>

                      <div className="mt-3.5">
                        <h3 className="text-sm font-bold text-gray-900 transition-colors group-hover:text-emerald-700 dark:text-gray-100 dark:group-hover:text-emerald-400">
                          {cs.patientName}
                        </h3>
                        <p className="mt-0.5 text-xs font-medium text-gray-400 dark:text-gray-500">{cs.mrn}</p>
                      </div>

                      <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                        {cs.chiefComplaint}
                      </p>

                      <p className="mt-2 text-xs font-medium text-gray-400 dark:text-gray-500">{cs.doctor}</p>

                      <div className="mt-4 flex items-center justify-between border-t border-gray-100/80 pt-3 dark:border-gray-800/60">
                        <StatusBadge status={cs.status} />
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 -translate-x-1 dark:text-emerald-400">
                          View
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full">
                  <EmptyState
                    icon={FileText}
                    title="No case sheets found"
                    description="Try adjusting filters or create a new case."
                    action={
                      <Link to="/doctor/case-sheets/new" className="btn-primary inline-flex items-center gap-2 text-sm">
                        <Plus className="h-4 w-4" />
                        New case sheet
                      </Link>
                    }
                  />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="overflow-x-auto"
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th>Patient</th>
                    <th>Department</th>
                    <th>Chief Complaint</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Doctor</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {paginatedItems.map((cs, i) => (
                    <motion.tr
                      key={cs.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="table-row"
                    >
                      <td className="whitespace-nowrap">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{cs.patientName}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{cs.mrn}</p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        <DepartmentBadge department={cs.department} />
                      </td>
                      <td className="max-w-[240px] truncate text-gray-600 dark:text-gray-400">{cs.chiefComplaint}</td>
                      <td className="whitespace-nowrap text-gray-500 dark:text-gray-400">{formatDate(cs.date)}</td>
                      <td className="whitespace-nowrap">
                        <StatusBadge status={cs.status} />
                      </td>
                      <td className="whitespace-nowrap text-gray-500 dark:text-gray-400">{cs.doctor}</td>
                      <td className="whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Link
                            to={`/doctor/case-sheets/${cs.id}`}
                            className="rounded-lg p-2 text-gray-400 transition-all hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button onClick={() => handleEdit(cs)} className="rounded-lg p-2 text-gray-400 transition-all hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30 dark:hover:text-amber-400">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDownload(cs)} className="rounded-lg p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30 dark:hover:text-blue-400">
                            <FileDown className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <EmptyState
                  icon={FileText}
                  title="No case sheets found"
                  description="Try adjusting filters or create a new case."
                  action={
                    <Link to="/doctor/case-sheets/new" className="btn-primary inline-flex items-center gap-2 text-sm">
                      <Plus className="h-4 w-4" />
                      New case sheet
                    </Link>
                  }
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100/80 px-5 py-3.5 dark:border-gray-800/80">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-bold text-gray-700 dark:text-gray-200">{Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> of{' '}
              <span className="font-bold text-gray-700 dark:text-gray-200">{filtered.length}</span> results
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="btn-secondary inline-flex items-center gap-1 !px-3 !py-1.5 !text-sm !shadow-none disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-9 w-9 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    currentPage === page
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary inline-flex items-center gap-1 !px-3 !py-1.5 !text-sm !shadow-none disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
