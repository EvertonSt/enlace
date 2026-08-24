import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import en from './i18n/en.json';
import ptBR from './i18n/pt-BR.json';

const enResources = en;
const ptBRResources = ptBR;

const STORAGE_KEY = 'enlace-mobile-lang';

async function getInitialLanguage(): Promise<string> {
  const stored = await SecureStore.getItemAsync(STORAGE_KEY);
  if (stored) return stored;
  return 'en'; // Phase 2: detect device locale
}

export default i18n;

void (async () => {
  const lng = await getInitialLanguage();

  void i18n.use(initReactI18next).init({
    resources: {
      en: { translation: enResources },
      'pt-BR': { translation: ptBRResources },
    },
    lng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

  i18n.on('languageChanged', (newLng: string) => {
    void SecureStore.setItemAsync(STORAGE_KEY, newLng);
  });
})();
