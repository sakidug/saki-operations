import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, LoadingSpinner } from '@saki-operations/ui';
import { useAppTranslation, useLocale, type AppLocale } from '@saki-operations/i18n';

import { useBootstrap } from '@/app/bootstrap/bootstrap-provider';
import { FullScreenLayout } from '@/app/layouts/shell-layouts';
import { paths } from '@/app/router/paths';

const options: Array<{
  code: AppLocale;
  flag: string;
  labelKey: 'shell.language.optionSi' | 'shell.language.optionEn';
}> = [
  { code: 'si', flag: '🇱🇰', labelKey: 'shell.language.optionSi' },
  { code: 'en', flag: '🇬🇧', labelKey: 'shell.language.optionEn' },
];

export function LanguageScreen() {
  const { t } = useAppTranslation();
  const { setLocale } = useLocale();
  const { acknowledgeLanguageSelected } = useBootstrap();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [selectingCode, setSelectingCode] = useState<AppLocale | null>(null);

  const choose = async (code: AppLocale) => {
    setSelectingCode(code);
    try {
      await setLocale(code);
      acknowledgeLanguageSelected();
      navigate(paths.entry, { replace: true });
    } catch {
      setSelectingCode(null);
    }
  };

  const selecting = selectingCode !== null;

  return (
    <FullScreenLayout className="dark flex items-center justify-center px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.2),_transparent_60%)]"
      />
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.35 }}
      >
        <Card
          variant="glass"
          padding="lg"
          className="relative space-y-6 overflow-hidden"
          aria-busy={selecting}
        >
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight">{t('shell.language.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('shell.language.description')}</p>
          </div>
          <div className="grid gap-3">
            {options.map((option) => (
              <Button
                key={option.code}
                type="button"
                variant="outline"
                size="xl"
                className="min-h-14 justify-start gap-3 text-base"
                disabled={selecting}
                loading={selectingCode === option.code}
                onClick={() => void choose(option.code)}
              >
                <span className="text-xl" aria-hidden>
                  {option.flag}
                </span>
                <span>{t(option.labelKey)}</span>
              </Button>
            ))}
          </div>

          {selecting ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-background/55 backdrop-blur-[2px]"
              role="status"
              aria-live="polite"
              aria-label={t('shell.loading.language')}
            >
              <div className="glass flex flex-col items-center gap-3 rounded-2xl px-6 py-5">
                <LoadingSpinner label={t('shell.loading.language')} size="md" />
                <p className="text-sm text-muted-foreground">{t('shell.loading.language')}</p>
              </div>
            </div>
          ) : null}
        </Card>
      </motion.div>
    </FullScreenLayout>
  );
}
