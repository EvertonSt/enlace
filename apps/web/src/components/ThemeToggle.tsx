import { useTheme } from '../lib/theme';
import { useTranslation } from 'react-i18next';

export default function ThemeToggle() {
  const { theme, setTheme, resolved } = useTheme();
  const { t } = useTranslation();

  const cycle = () => {
    const next: Record<string, 'light' | 'dark' | 'system'> = {
      system: 'light',
      light: 'dark',
      dark: 'system',
    };
    setTheme(next[theme]!);
  };

  const icon = resolved === 'dark' ? '🌙' : theme === 'system' ? '🖥️' : '☀️';
  const label = theme === 'system'
    ? t('themeToggle.system')
    : theme === 'dark'
      ? t('themeToggle.dark')
      : t('themeToggle.light');

  return (
    <button
      onClick={cycle}
      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      aria-label={label}
      title={`${t('themeToggle.label')}: ${label}`}
    >
      <span className="text-base">{icon}</span>
    </button>
  );
}
