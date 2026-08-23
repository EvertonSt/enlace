import { useTranslation } from 'react-i18next';

export default function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const isPT = i18n.language === 'pt-BR';

  function toggle() {
    void i18n.changeLanguage(isPT ? 'en' : 'pt-BR');
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      aria-label={t('languageToggle.label')}
    >
      <span className="text-base">{isPT ? '🇧🇷' : '🇺🇸'}</span>
      <span>{isPT ? 'PT' : 'EN'}</span>
    </button>
  );
}
