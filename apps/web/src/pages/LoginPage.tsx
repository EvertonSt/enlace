import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth';
import LanguageToggle from '../components/LanguageToggle';
import ThemeToggle from '../components/ThemeToggle';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!email) errs.email = t('auth.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = t('auth.invalidEmail');
    if (!password) errs.password = t('auth.passwordRequired');
    else if (password.length < 6) errs.password = t('auth.passwordMinLength');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t('auth.welcomeBack') + '! 👋');
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-brand-50/30 to-gray-50 px-4 dark:from-gray-950 dark:via-brand-950/20 dark:to-gray-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex justify-end gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:shadow-2xl">
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            >
              <h1 className="text-3xl font-bold text-brand-700 dark:text-brand-400">
                {t('common.appName')}
              </h1>
            </motion.div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('auth.welcomeBack')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 ${
                  errors.email
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-800'
                    : 'border-gray-300 focus:border-brand-500 focus:ring-brand-200 dark:border-gray-700 dark:focus:ring-brand-800'
                }`}
                placeholder="everton@andrade.com.br"
              />
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 text-xs text-red-600 dark:text-red-400"
                >
                  {errors.email}
                </motion.p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 ${
                  errors.password
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-800'
                    : 'border-gray-300 focus:border-brand-500 focus:ring-brand-200 dark:border-gray-700 dark:focus:ring-brand-800'
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 text-xs text-red-600 dark:text-red-400"
                >
                  {errors.password}
                </motion.p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-700" />
                <span className="text-gray-600 dark:text-gray-400">{t("auth.rememberMe")}</span>
              </label>
              <a href="#" className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                {t('auth.forgotPassword')}
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full overflow-hidden rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-600"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('auth.signingIn')}
                </span>
              ) : (
                t('auth.signIn')
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
            Demo: everton@andrade.com.br / password123
          </p>
        </div>
      </motion.div>
    </div>
  );
}
