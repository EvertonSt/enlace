import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { enResources, ptBRResources } from '@enlace/core';

const STORAGE_KEY = 'enlace-noc-lang';

function getInitialLanguage(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;

  const browserLang = navigator.language;
  if (browserLang.startsWith('pt')) return 'pt-BR';
  return 'en';
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enResources },
    'pt-BR': { translation: ptBRResources },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (lng: string) => {
  localStorage.setItem(STORAGE_KEY, lng);
  document.documentElement.lang = lng;
});

export default i18n;
