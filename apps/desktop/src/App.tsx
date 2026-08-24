import { HashRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './lib/auth';
import LoginPage from './pages/LoginPage';
import NocDashboard from './pages/NocDashboard';
import SupportQueue from './pages/SupportQueue';
import CustomerLookup from './pages/CustomerLookup';
import TechDispatch from './pages/TechDispatch';

function Sidebar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const nav = [
    { to: '/', icon: '🖥️', label: t('nav.nocDashboard', 'NOC Dashboard') },
    { to: '/queue', icon: '🎫', label: t('nav.tickets') },
    { to: '/customers', icon: '👤', label: t('nav.customerLookup', 'Customers') },
    { to: '/dispatch', icon: '🔧', label: t('nav.dispatch', 'Technicians') },
  ];
  return (
    <aside className="flex w-64 flex-col border-r border-gray-800 bg-gray-950">
      <div className="flex h-14 items-center gap-2 border-b border-gray-800 px-5">
        <span className="text-lg font-bold text-brand-400">{t('common.appName')} NOC</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}
            className={({ isActive }) => `w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-brand-600/20 text-brand-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <span>{item.icon}</span> {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-800 p-3 space-y-2">
        <button onClick={() => i18n.changeLanguage(i18n.language === 'pt-BR' ? 'en' : 'pt-BR')}
          className="w-full rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white">
          {i18n.language === 'pt-BR' ? '🇺🇸 US EN' : '🇧🇷 BR PT'}
        </button>
        {user && (
          <div className="flex items-center justify-between rounded-lg px-3 py-2 bg-gray-800/50">
            <span className="text-xs text-gray-400 truncate">{user.name}</span>
            <button onClick={logout} className="text-xs text-red-400 hover:text-red-300">{t('common.logout')}</button>
          </div>
        )}
      </div>
    </aside>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      className="flex-1 overflow-y-auto p-6">
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const loc = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={loc} key={loc.pathname}>
        <Route path="/" element={<PageWrapper><NocDashboard /></PageWrapper>} />
        <Route path="/queue" element={<PageWrapper><SupportQueue /></PageWrapper>} />
        <Route path="/customers" element={<PageWrapper><CustomerLookup /></PageWrapper>} />
        <Route path="/dispatch" element={<PageWrapper><TechDispatch /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

function AuthGate() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="mb-4 text-4xl">🖥️</div>
          <div className="text-gray-400">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;
  if (user.role !== 'staff') return <LoginPage />;

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <AnimatedRoutes />
      </main>
      <Toaster position="top-right" theme="dark" richColors closeButton />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </HashRouter>
  );
}
