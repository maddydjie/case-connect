import { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Mic,
  MicOff,
  Menu,
  User,
  Settings,
  LogOut,
  HelpCircle,
  ChevronRight,
  Moon,
  Sun,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useAuthStore } from '@/stores/auth.store';
import { applyTheme, getStoredTheme, type ThemeMode } from '@/lib/theme';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface HeaderProps {
  onMenuToggle: () => void;
}

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/doctor/case-sheets': 'Case Sheets',
  '/doctor/op-sheets': 'OP Sheets',
  '/doctor/emergency': 'Emergency',
  '/doctor/follow-ups': 'Follow-ups',
  '/hms/beds': 'Bed Map',
  '/hms/documents': 'Documents',
  '/hms/appointments': 'Appointments',
  '/student/practice': 'Practice Cases',
  '/student/leaderboard': 'Leaderboard',
  '/student/progress': 'My Progress',
  '/patient/vault': 'Health Vault',
  '/patient/appointments': 'Appointments',
  '/patient/triage': 'Triage',
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/users': 'Users',
  '/admin/audit': 'Audit Log',
};

const routeParents: Record<string, string> = {
  '/doctor/case-sheets': 'Clinical',
  '/doctor/op-sheets': 'Clinical',
  '/doctor/emergency': 'Clinical',
  '/doctor/follow-ups': 'Clinical',
  '/hms/beds': 'Hospital',
  '/hms/documents': 'Hospital',
  '/hms/appointments': 'Hospital',
  '/student/practice': 'Education',
  '/student/leaderboard': 'Education',
  '/student/progress': 'Education',
  '/patient/vault': 'Patient',
  '/patient/appointments': 'Patient',
  '/patient/triage': 'Patient',
  '/admin/dashboard': 'Administration',
  '/admin/users': 'Administration',
  '/admin/audit': 'Administration',
};

const mockNotifications = [
  {
    id: '1',
    title: 'New lab results',
    description: 'Patient Aarav Patel — CBC report ready',
    time: '2m ago',
    unread: true,
    type: 'lab',
  },
  {
    id: '2',
    title: 'Appointment reminder',
    description: 'Dr. Mehra — 3:00 PM consultation',
    time: '15m ago',
    unread: true,
    type: 'appointment',
  },
  {
    id: '3',
    title: 'Bed assignment updated',
    description: 'Ward B, Bed 12 now available',
    time: '1h ago',
    unread: true,
    type: 'bed',
  },
];

const notifTypeColors: Record<string, string> = {
  lab: 'bg-violet-500',
  appointment: 'bg-blue-500',
  bed: 'bg-emerald-500',
};

function Breadcrumbs() {
  const location = useLocation();
  const currentLabel = routeLabels[location.pathname];
  const parentLabel = routeParents[location.pathname];

  if (!currentLabel || location.pathname === '/') {
    return (
      <div className="flex items-center gap-1.5">
        <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">Dashboard</h2>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-sm">
      {parentLabel && (
        <>
          <span className="text-gray-400 dark:text-gray-500 font-medium">{parentLabel}</span>
          <ChevronRight className="h-3 w-3 text-gray-300 dark:text-gray-600" />
        </>
      )}
      <h2 className="font-bold text-gray-900 dark:text-white">{currentLabel}</h2>
    </div>
  );
}

function VoiceButton() {
  const navigate = useNavigate();
  const voice = useSpeechRecognition({
    lang: 'en-IN',
    onResult: (text, isFinal) => {
      if (isFinal && text.trim()) {
        toast.success('Voice captured — opening new case sheet', { description: text.slice(0, 80) });
        navigate('/doctor/case-sheets/new');
      }
    },
    onError: (err) => toast.error(`Voice error: ${err}`),
  });

  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            onClick={() => voice.toggle()}
            className={clsx(
              'relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300',
              voice.isListening
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105'
                : 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105',
            )}
          >
            {voice.isListening && (
              <motion.div
                className="absolute inset-0 rounded-xl bg-red-400"
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            {voice.isListening ? <MicOff className="relative h-4 w-4" /> : <Mic className="relative h-4 w-4" />}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            sideOffset={8}
            className="z-50 rounded-xl bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-xl dark:bg-gray-800 border border-gray-700"
          >
            {voice.isListening ? 'Stop Recording' : 'Quick Voice Note'}
            <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const count = notifications.filter((n) => n.unread).length;

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    toast.success('All notifications marked as read');
  }, []);

  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <DropdownMenu.Root open={open} onOpenChange={setOpen}>
          <Tooltip.Trigger asChild>
            <DropdownMenu.Trigger asChild>
              <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-all duration-200 hover:bg-gray-100/80 hover:text-gray-700 dark:hover:bg-gray-800/80 dark:hover:text-gray-300 dark:text-gray-400">
                <Bell className="h-[18px] w-[18px]" />
                {count > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm shadow-red-500/30">
                    {count}
                  </span>
                )}
              </button>
            </DropdownMenu.Trigger>
          </Tooltip.Trigger>

          <Tooltip.Portal>
            <Tooltip.Content
              sideOffset={8}
              className="z-50 rounded-xl bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-xl dark:bg-gray-800 border border-gray-700"
            >
              Notifications
              <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-800" />
            </Tooltip.Content>
          </Tooltip.Portal>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 w-[360px] rounded-2xl border border-gray-200/80 bg-white/95 p-0 shadow-2xl shadow-black/[0.08] backdrop-blur-xl dark:border-gray-800/80 dark:bg-gray-900/95 animate-scale-in"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-5 py-3.5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Notifications
                </h3>
                <button onClick={markAllRead} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition-colors">
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notif) => (
                  <DropdownMenu.Item
                    key={notif.id}
                    className="flex cursor-pointer items-start gap-3 border-b border-gray-50 dark:border-gray-800/50 px-5 py-4 outline-none transition-colors last:border-0 hover:bg-gray-50/80 focus:bg-gray-50/80 dark:hover:bg-gray-800/50 dark:focus:bg-gray-800/50"
                  >
                    <div
                      className={clsx(
                        'mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full',
                        notif.unread ? notifTypeColors[notif.type] || 'bg-emerald-500' : 'bg-transparent',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {notif.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                        {notif.description}
                      </p>
                      <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">{notif.time}</p>
                    </div>
                  </DropdownMenu.Item>
                ))}
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800 p-2">
                <button
                  onClick={() => { setOpen(false); toast.info('Notifications center coming soon'); }}
                  className="w-full rounded-xl py-2.5 text-center text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                >
                  View all notifications
                </button>
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const displayName = user?.name ?? 'Dr. Rajesh Sharma';
  const displayEmail = user?.email ?? 'rajesh.sharma@hospital.com';
  const displayRole = user?.specialization ?? 'Cardiologist';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2.5 rounded-xl p-1.5 transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 text-sm font-bold text-emerald-600 ring-2 ring-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-500/20">
            {initials}
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-gray-900" />
          </div>
          <div className="hidden text-left md:block">
            <p className="text-[13px] font-semibold text-gray-900 dark:text-white">{displayName}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">{displayRole}</p>
          </div>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-64 rounded-2xl border border-gray-200/80 bg-white/95 p-0 shadow-2xl shadow-black/[0.08] backdrop-blur-xl dark:border-gray-800/80 dark:bg-gray-900/95 animate-scale-in"
        >
          <div className="border-b border-gray-100 dark:border-gray-800 px-5 py-4">
            <p className="text-sm font-bold text-gray-900 dark:text-white">{displayName}</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{displayEmail}</p>
          </div>

          <div className="py-1.5">
            <DropdownMenu.Item
              onSelect={() => toast.info('Profile page coming soon')}
              className="flex cursor-pointer items-center gap-3 px-5 py-2.5 text-sm text-gray-700 dark:text-gray-300 outline-none transition-colors hover:bg-gray-50 focus:bg-gray-50 dark:hover:bg-gray-800/60 dark:focus:bg-gray-800/60"
            >
              <User className="h-4 w-4 text-gray-400" />
              My Profile
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => toast.info('Settings page coming soon')}
              className="flex cursor-pointer items-center gap-3 px-5 py-2.5 text-sm text-gray-700 dark:text-gray-300 outline-none transition-colors hover:bg-gray-50 focus:bg-gray-50 dark:hover:bg-gray-800/60 dark:focus:bg-gray-800/60"
            >
              <Settings className="h-4 w-4 text-gray-400" />
              Settings
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => toast.info('Help & support docs coming soon')}
              className="flex cursor-pointer items-center gap-3 px-5 py-2.5 text-sm text-gray-700 dark:text-gray-300 outline-none transition-colors hover:bg-gray-50 focus:bg-gray-50 dark:hover:bg-gray-800/60 dark:focus:bg-gray-800/60"
            >
              <HelpCircle className="h-4 w-4 text-gray-400" />
              Help & Support
            </DropdownMenu.Item>
          </div>

          <DropdownMenu.Separator className="h-px bg-gray-100 dark:bg-gray-800" />

          <div className="py-1.5">
            <DropdownMenu.Item
              onSelect={() => logout()}
              className="flex cursor-pointer items-center gap-3 px-5 py-2.5 text-sm text-red-600 dark:text-red-400 outline-none transition-colors hover:bg-red-50 focus:bg-red-50 dark:hover:bg-red-950/30 dark:focus:bg-red-950/30"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => getStoredTheme());

  const cycle = () => {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setMode(next);
  };

  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            onClick={cycle}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-all duration-200 hover:bg-gray-100/80 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-gray-100"
            aria-label="Toggle dark mode"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {mode === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </motion.div>
            </AnimatePresence>
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            sideOffset={8}
            className="z-50 rounded-xl bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-xl dark:bg-gray-800 border border-gray-700"
          >
            {mode === 'dark' ? 'Switch to light' : 'Switch to dark'}
            <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const headerNavigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && searchQuery.trim()) {
        toast.info(`Searching for "${searchQuery}"...`);
        headerNavigate(`/doctor/case-sheets?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchQuery('');
      }
    },
    [searchQuery, headerNavigate],
  );

  return (
    <header className="sticky top-0 z-30 flex h-[65px] shrink-0 items-center justify-between border-b border-gray-200/60 bg-white/70 px-4 backdrop-blur-2xl dark:border-gray-800/60 dark:bg-gray-900/70 lg:px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-all duration-200 hover:bg-gray-100/80 hover:text-gray-700 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Breadcrumbs />
      </div>

      {/* Center: Search */}
      <div className="mx-4 hidden max-w-lg flex-1 md:block">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-emerald-500" />
          <input
            data-caseconnect-search
            type="text"
            placeholder="Search patients, cases, beds... (Enter to search)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="h-10 w-full rounded-2xl border border-gray-200/80 bg-gray-50/80 pl-11 pr-20 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-300 focus:border-emerald-300 focus:bg-white focus:shadow-lg focus:shadow-emerald-500/5 focus:ring-2 focus:ring-emerald-500/10 dark:border-gray-700/80 dark:bg-gray-800/60 dark:text-white dark:placeholder-gray-500 dark:focus:border-emerald-600 dark:focus:bg-gray-800 dark:focus:shadow-emerald-500/10"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <kbd className="hidden sm:inline-flex items-center rounded-lg border border-gray-200/80 bg-white/80 px-1.5 py-0.5 font-mono text-[10px] text-gray-400 dark:border-gray-700 dark:bg-gray-800/80">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <button className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-all duration-200 hover:bg-gray-100/80 hover:text-gray-700 md:hidden dark:hover:bg-gray-800/80 dark:text-gray-400">
          <Search className="h-[18px] w-[18px]" />
        </button>

        <ThemeToggle />

        <VoiceButton />

        <NotificationsButton />

        <div className="mx-1.5 h-6 w-px bg-gray-200/80 dark:bg-gray-700/80" />

        <UserMenu />
      </div>
    </header>
  );
}
