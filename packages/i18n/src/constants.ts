export const SUPPORTED_LOCALES = ['en', 'si'] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'en';

export const LOCALE_STORAGE_KEY = 'saki-operations.locale';

export const LOCALE_META: Record<
  AppLocale,
  {
    code: AppLocale;
    dir: 'ltr' | 'rtl';
    nativeNameKey: string;
  }
> = {
  en: {
    code: 'en',
    dir: 'ltr',
    nativeNameKey: 'languages.en',
  },
  si: {
    code: 'si',
    dir: 'ltr',
    nativeNameKey: 'languages.si',
  },
};

export function isAppLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
