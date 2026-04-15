import { useState, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  ClipboardList,
  AlertTriangle,
  CalendarCheck,
  Bed,
  FileStack,
  Calendar,
  GraduationCap,
  Trophy,
  TrendingUp,
  ShieldCheck,
  Stethoscope,
  Activity,
  LayoutDashboard,
  Users,
  ScrollText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  X,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/stores/auth.store';

const COLLAPSED_KEY = 'caseconnect-sidebar-collapsed';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  color: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Clinical',
    icon: Stethoscope,
    color: 'emerald',
    items: [
      { label: 'Case Sheets', path: '/doctor/case-sheets', icon: FileText },
      { label: 'OP Sheets', path: '/doctor/op-sheets', icon: ClipboardList },
      { label: 'Emergency', path: '/doctor/emergency', icon: AlertTriangle },
      { label: 'Follow-ups', path: '/doctor/follow-ups', icon: CalendarCheck },
    ],
  },
  {
    label: 'Hospital',
    icon: Activity,
    color: 'blue',
    items: [
      { label: 'Bed Map', path: '/hms/beds', icon: Bed },
      { label: 'Documents', path: '/hms/documents', icon: FileStack },
      { label: 'Appointments', path: '/hms/appointments', icon: Calendar },
    ],
  },
  {
    label: 'Education',
    icon: GraduationCap,
    color: 'violet',
    items: [
      { label: 'Practice Cases', path: '/student/practice', icon: GraduationCap },
      { label: 'Leaderboard', path: '/student/leaderboard', icon: Trophy },
      { label: 'My Progress', path: '/student/progress', icon: TrendingUp },
    ],
  },
  {
    label: 'Patient',
    icon: Heart,
    color: 'rose',
    items: [
      { label: 'Health Vault', path: '/patient/vault', icon: ShieldCheck },
      { label: 'Appointments', path: '/patient/appointments', icon: Calendar },
      { label: 'Triage', path: '/patient/triage', icon: Activity },
    ],
  },
  {
    label: 'Administration',
    icon: LayoutDashboard,
    color: 'amber',
    items: [
      { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Users', path: '/admin/users', icon: Users },
      { label: 'Audit Log', path: '/admin/audit', icon: ScrollText },
    ],
  },
];

const sidebarVariants = {
  expanded: { width: 280 },
  collapsed: { width: 68 },
};

const mobileOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const mobileSidebarVariants = {
  hidden: { x: '-100%' },
  visible: { x: 0 },
};

function NavGroupSection({
  group,
  collapsed,
  expandedGroups,
  onToggle,
  onNavigate,
}: {
  group: NavGroup;
  collapsed: boolean;
  expandedGroups: Set<string>;
  onToggle: (label: string) => void;
  onNavigate: () => void;
}) {
  const location = useLocation();
  const isExpanded = expandedGroups.has(group.label);
  const GroupIcon = group.icon;
  const hasActiveChild = group.items.some((item) =>
    location.pathname.startsWith(item.path),
  );

  if (collapsed) {
    return (
      <div className="mb-1 space-y-0.5">
        {group.items.map((item) => {
          const ItemIcon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.label}
              onClick={onNavigate}
              className={({ isActive }) =>
                clsx(
                  'group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/10'
                    : 'text-gray-500 hover:bg-white/[0.06] hover:text-gray-300',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-collapsed"
                      className="absolute -left-0.5 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-400"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <ItemIcon className="h-[18px] w-[18px]" />
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mb-1.5">
      <button
        onClick={() => onToggle(group.label)}
        className={clsx(
          'flex w-full items-center justify-between rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition-all duration-200',
          hasActiveChild
            ? 'text-gray-200'
            : 'text-gray-500 hover:text-gray-300',
        )}
      >
        <div className="flex items-center gap-2.5">
          <GroupIcon className="h-3.5 w-3.5" />
          <span>{group.label}</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="mt-0.5 space-y-0.5 pb-1">
              {group.items.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      clsx(
                        'group relative flex items-center gap-2.5 rounded-xl px-3 py-[7px] text-[13px] font-medium transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-white'
                          : 'text-gray-400 hover:bg-white/[0.05] hover:text-gray-200',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active"
                            className="absolute -left-0.5 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-400"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <ItemIcon className={clsx('h-4 w-4 shrink-0 transition-colors', isActive && 'text-emerald-400')} />
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarContent({
  collapsed,
  onCollapsedChange,
  onNavigate,
}: {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onNavigate: () => void;
}) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const active = navGroups.find((g) =>
      g.items.some((item) => location.pathname.startsWith(item.path)),
    );
    return new Set(active ? [active.label] : ['Clinical']);
  });

  const toggleGroup = useCallback((label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const displayName = user?.name ?? 'Dr. Rajesh Sharma';
  const displayRole = user?.specialization ?? 'Cardiologist';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#0c1222] via-[#0f172a] to-[#0c1222]">
      {/* Logo */}
      <div
        className={clsx(
          'flex shrink-0 items-center border-b border-white/[0.06] transition-all duration-300',
          collapsed ? 'h-[65px] justify-center px-2' : 'h-[65px] gap-3 px-5',
        )}
      >
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/25">
          <div className="absolute inset-0 rounded-xl bg-emerald-400/20 blur-lg" />
          <Stethoscope className="relative h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="min-w-0 flex-1"
          >
            <h1 className="text-[15px] font-bold tracking-tight text-white">
              CaseConnect
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-400/70">
              Clinical Platform
            </p>
          </motion.div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="shrink-0 px-3 pt-4 pb-1">
          <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.06] px-3.5 py-2.5 text-gray-400 transition-all duration-200 hover:bg-white/[0.09] cursor-pointer group">
            <Search className="h-3.5 w-3.5 shrink-0 transition-colors group-hover:text-gray-300" />
            <span className="text-[13px]">Search...</span>
            <kbd className="ml-auto rounded-md bg-white/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-gray-500 border border-white/[0.06]">
              ⌘K
            </kbd>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav
        className={clsx(
          'flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-thin',
          collapsed ? 'flex flex-col items-center px-2' : 'px-3',
        )}
      >
        {/* Dashboard */}
        <NavLink
          to="/"
          end
          onClick={onNavigate}
          title={collapsed ? 'Dashboard' : undefined}
          className={({ isActive }) =>
            clsx(
              'group relative mb-3 flex items-center transition-all duration-200',
              collapsed
                ? clsx(
                    'h-10 w-10 justify-center rounded-xl',
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/10'
                      : 'text-gray-500 hover:bg-white/[0.06] hover:text-gray-300',
                  )
                : clsx(
                    'gap-2.5 rounded-xl px-3 py-[8px] text-[13px] font-medium',
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-white'
                      : 'text-gray-400 hover:bg-white/[0.05] hover:text-gray-200',
                  ),
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId={collapsed ? 'sidebar-active-collapsed' : 'sidebar-active'}
                  className="absolute -left-0.5 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-400"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <LayoutDashboard className={clsx(
                collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4 shrink-0',
                isActive && 'text-emerald-400',
              )} />
              {!collapsed && <span>Dashboard</span>}
            </>
          )}
        </NavLink>

        <div className={clsx('mb-3', collapsed ? 'mx-auto w-8' : 'mx-2')}>
          <div className="h-px bg-white/[0.06]" />
        </div>

        {/* Groups */}
        {navGroups.map((group) => (
          <NavGroupSection
            key={group.label}
            group={group}
            collapsed={collapsed}
            expandedGroups={expandedGroups}
            onToggle={toggleGroup}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* AI Banner (collapsed = icon only) */}
      {!collapsed && (
        <div className="shrink-0 mx-3 mb-3">
          <div className="rounded-xl bg-gradient-to-r from-violet-500/10 to-emerald-500/10 border border-white/[0.06] p-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-emerald-500/20">
                <Sparkles className="h-3.5 w-3.5 text-violet-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-white">AI Assistant</p>
                <p className="text-[10px] text-gray-400">Voice-first docs</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <div
        className={clsx(
          'hidden shrink-0 border-t border-white/[0.06] lg:block',
          collapsed ? 'px-2 py-2' : 'px-3 py-2',
        )}
      >
        <button
          onClick={() => {
            const next = !collapsed;
            onCollapsedChange(next);
            localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
          }}
          className={clsx(
            'flex items-center rounded-xl text-gray-500 transition-all duration-200 hover:bg-white/[0.05] hover:text-gray-300',
            collapsed ? 'h-10 w-10 justify-center' : 'w-full gap-2.5 px-3 py-[7px] text-[13px]',
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* User Section */}
      <div
        className={clsx(
          'shrink-0 border-t border-white/[0.06] transition-all duration-300',
          collapsed ? 'flex justify-center px-2 py-3' : 'px-3 py-3',
        )}
      >
        <div
          className={clsx(
            'flex items-center rounded-xl transition-all duration-200 hover:bg-white/[0.05]',
            collapsed ? 'h-10 w-10 justify-center' : 'gap-3 px-2.5 py-2',
          )}
        >
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 text-xs font-bold text-emerald-400 ring-2 ring-emerald-500/25">
            {initials}
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0f172a]" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="min-w-0 flex-1"
            >
              <p className="truncate text-[13px] font-medium text-gray-200">
                {displayName}
              </p>
              <p className="truncate text-[11px] text-gray-500">{displayRole}</p>
            </motion.div>
          )}
          {!collapsed && (
            <button className="shrink-0 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-gray-300">
              <Settings className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({
  isOpen,
  onClose,
  collapsed,
  onCollapsedChange,
}: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={collapsed ? 'collapsed' : 'expanded'}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-20 hidden h-screen shrink-0 overflow-hidden border-r border-white/[0.06] lg:block"
      >
        <SidebarContent
          collapsed={collapsed}
          onCollapsedChange={onCollapsedChange}
          onNavigate={() => {}}
        />
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              variants={mobileOverlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              variants={mobileSidebarVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden"
            >
              <div className="relative h-full">
                <button
                  onClick={onClose}
                  className="absolute right-3 top-4 z-10 rounded-xl p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
                <SidebarContent
                  collapsed={false}
                  onCollapsedChange={onCollapsedChange}
                  onNavigate={onClose}
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export { COLLAPSED_KEY };
