import { useState, useCallback, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '📊', i18nKey: 'nav.dashboard' },
  { to: '/outages', icon: '🔴', i18nKey: 'nav.outages' },
  { to: '/tickets', icon: '🎫', i18nKey: 'nav.tickets' },
  { to: '/billing', icon: '💳', i18nKey: 'nav.billing' },
  { to: '/speed-test', icon: '📏', i18nKey: 'nav.speedTest' },
  { to: '/reports', icon: '📈', i18nKey: 'nav.reports' },
] as const;

export default function DashboardShell() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change
  useEffect(() => setSidebarOpen(false), [location.pathname]);

  const toggleSidebar = useCallback(() => setSidebarOpen((p) => !p), []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:flex md:flex-col">
        <SidebarContent t={t} />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={toggleSidebar}
              aria-hidden="true"
            />
            {/* Slide-in sidebar */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:hidden"
            >
              <SidebarContent t={t} onClose={toggleSidebar} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Hamburger */}
            <button
              onClick={toggleSidebar}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 md:hidden"
              aria-label="Toggle navigation"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            {/* Mobile logo */}
            <span className="text-xl font-bold text-brand-600 dark:text-brand-400 md:hidden">
              {t('common.appName')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </header>

        {/* Page content with scroll shadow */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 dark:bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  t,
  onClose,
}: {
  t: (key: string) => string;
  onClose?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-gray-200 px-5 dark:border-gray-800">
        <span className="text-xl font-bold text-brand-600 dark:text-brand-400">
          {t('common.appName')}
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ to, icon, i18nKey }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-brand-50 text-brand-700 shadow-sm dark:bg-brand-950 dark:text-brand-400'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
              }`
            }
          >
            <span className="text-lg">{icon}</span>
            <span>{t(i18nKey)}</span>
          </NavLink>
        ))}
      </nav>

      {/* User card */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
        <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
            EA
          </div>
          <div className="min-w-0 flex-1 text-sm">
            <div className="truncate font-medium text-gray-900 dark:text-gray-100">
              Everton S. Andrade
            </div>
            <div className="truncate text-gray-500 dark:text-gray-400">
              Fibra Premium
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
