import { useEffect, useMemo } from 'react';

import { STORAGE_KEYS } from '@/app/bootstrap/constants';
import { paths } from '@/app/router/paths';

type CrashCopy = {
  title: string;
  description: string;
  errorIdLabel: string;
  reload: string;
  returnHome: string;
};

const EN_COPY: CrashCopy = {
  title: 'Something went wrong',
  description: 'An unexpected error occurred. You can reload the app or return home.',
  errorIdLabel: 'Error ID',
  reload: 'Reload Application',
  returnHome: 'Return Home',
};

const SI_COPY: CrashCopy = {
  title: 'යම් දෙයක් වැරදී ඇත',
  description: 'අනපේක්ෂිත දෝෂයක් ඇති විය. යෙදුම නැවත පූරණය කරන්න හෝ මුල් පිටුවට යන්න.',
  errorIdLabel: 'දෝෂ හඳුනාගැනීමේ අංකය',
  reload: 'යෙදුම නැවත පූරණය කරන්න',
  returnHome: 'මුල් පිටුවට',
};

function readCrashCopy(): CrashCopy {
  try {
    if (window.localStorage.getItem(STORAGE_KEYS.locale) === 'si') {
      return SI_COPY;
    }
  } catch {
    // ignore storage failures during crash recovery
  }
  return EN_COPY;
}

export type AppErrorFallbackProps = {
  errorId: string;
};

/**
 * Self-contained crash UI — does not depend on providers, i18n, or the router.
 * Uses design-system CSS variables already loaded via global styles.
 */
export function AppErrorFallback({ errorId }: AppErrorFallbackProps) {
  const copy = useMemo(() => readCrashCopy(), []);

  const reload = () => {
    window.location.reload();
  };

  const returnHome = () => {
    window.location.assign(paths.home);
  };

  // ThemeProvider is unmounted when the boundary catches — keep dark shell consistent.
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    document.documentElement.dataset.theme = 'dark';
  }, []);

  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-x-hidden bg-background px-4 py-10 text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.18),_transparent_55%)]"
      />
      <div
        role="alert"
        aria-live="assertive"
        aria-labelledby="app-error-title"
        aria-describedby="app-error-description app-error-id"
        className="glass relative z-10 w-full max-w-md space-y-6 rounded-3xl px-6 py-8 text-center shadow-lg sm:px-8"
      >
        <div className="space-y-2">
          <h1 id="app-error-title" className="text-2xl font-bold tracking-tight">
            {copy.title}
          </h1>
          <p id="app-error-description" className="text-sm text-muted-foreground">
            {copy.description}
          </p>
        </div>

        <p
          id="app-error-id"
          className="rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground break-all"
        >
          <span className="block text-[11px] uppercase tracking-wide text-muted-foreground/80">
            {copy.errorIdLabel}
          </span>
          <span className="mt-1 block text-foreground">{errorId}</span>
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reload}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {copy.reload}
          </button>
          <button
            type="button"
            onClick={returnHome}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-transparent px-6 text-sm font-semibold transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {copy.returnHome}
          </button>
        </div>
      </div>
    </div>
  );
}
