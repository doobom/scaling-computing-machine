import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, type Language, type TranslationDict } from '@client/src/i18n/translations';

type TranslationKey = NestedKeyOf<TranslationDict>;

interface LanguageState {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: TranslationKey | (string & {})) => string;
}

type NestedKeyOf<T> = T extends object
  ? { [K in keyof T & string]: T[K] extends object ? `${K}.${NestedKeyOf<T[K]>}` : K }[keyof T & string]
  : never;

function getNestedValue<T>(obj: T, path: string): string {
  const keys: string[] = path.split('.');
  let result: unknown = obj;
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof result === 'string' ? result : path;
}

export const useLanguage = create<LanguageState>()(
  persist(
    (set, get) => ({
      lang: 'zh',
      setLang: (lang: Language) => set({ lang }),
      toggleLang: () => set({ lang: get().lang === 'zh' ? 'en' : 'zh' }),
      t: (key: NestedKeyOf<TranslationDict>) => {
        const { lang } = get();
        return getNestedValue(translations[lang], key);
      },
    }),
    {
      name: 'hk-life-store-lang',
    },
  ),
);
