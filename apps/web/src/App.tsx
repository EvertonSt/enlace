import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './lib/auth';
import { ThemeProvider, useTheme } from './lib/theme';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import DashboardShell from './components/DashboardShell';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OutagesPage from './pages/OutagesPage';
import TicketsPage from './pages/TicketsPage';
import BillingPage from './pages/BillingPage';
import SpeedTestPage from './pages/SpeedTestPage';
import ReportsPage from './pages/ReportsPage';

function ThemedToaster() {
  const { resolved } = useTheme();
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme={resolved}
      toastOptions={{
        className: 'font-sans',
        style: { borderRadius: '12px' },
      }}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <ThemedToaster />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<DashboardShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/outages" element={<OutagesPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/speed-test" element={<SpeedTestPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ErrorBoundary>
      </ThemeProvider>
    </AuthProvider>
  );
}
