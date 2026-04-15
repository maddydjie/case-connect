import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar, { COLLAPSED_KEY } from './Sidebar';
import Header from './Header';

const pageVariants = {
  initial: { opacity: 0, y: 12, scale: 0.995 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.995 },
};

export default function Layout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem(COLLAPSED_KEY);
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const onKeyNav = useCallback((e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const el = document.querySelector<HTMLInputElement>('[data-caseconnect-search]');
      el?.focus();
    }
    if (mod && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      navigate('/doctor/case-sheets/new');
    }
  }, [navigate]);

  useEffect(() => {
    window.addEventListener('keydown', onKeyNav);
    return () => window.removeEventListener('keydown', onKeyNav);
  }, [onKeyNav]);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 dark:from-gray-950 dark:via-gray-950 dark:to-emerald-950/10" />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(true)} />

        <main className="relative flex-1 overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="p-4 pb-8 lg:p-6 xl:p-8"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
