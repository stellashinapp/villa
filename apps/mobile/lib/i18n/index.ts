import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ko from './ko.json';
import en from './en.json';

const LANG_STORAGE_KEY = '@villatolk/language';

export const SUPPORTED_LANGUAGES = ['ko', 'en'] as const;
export type Language = typeof SUPPORTED_LANGUAGES[number];

function detectInitialLanguage(): Language {
  try {
    const locales = Localization.getLocales();
    const first = locales?.[0]?.languageCode ?? 'ko';
    return (SUPPORTED_LANGUAGES as readonly string[]).includes(first) ? (first as Language) : 'ko';
  } catch {
    return 'ko';
  }
}

let initialized = false;

export async function initI18n() {
  if (initialized) return;
  let stored: string | null = null;
  try {
    stored = await AsyncStorage.getItem(LANG_STORAGE_KEY);
  } catch {}

  const lng = (stored as Language) ?? detectInitialLanguage();

  await i18n.use(initReactI18next).init({
    resources: {
      ko: { translation: ko },
      en: { translation: en },
    },
    lng,
    fallbackLng: 'ko',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });
  initialized = true;
}

export async function changeLanguage(lang: Language) {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {}
}

export function getCurrentLanguage(): Language {
  return (i18n.language as Language) ?? 'ko';
}

export { i18n };
