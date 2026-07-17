import type { ReactNode } from 'react';
import { RouterProvider } from 'react-router-dom';

import { ThemeProvider, Toaster, type BrandId, type ThemeMode } from '@saki-operations/ui';
import { I18nProvider, type AppLocale } from '@saki-operations/i18n';

import { BootstrapProvider } from '@/app/bootstrap/bootstrap-provider';
import { LocaleReadyGate } from '@/app/bootstrap/locale-ready-gate';
import { NetworkProvider } from '@/app/bootstrap/network-provider';
import { PwaProvider } from '@/app/bootstrap/pwa-provider';
import { SessionProvider } from '@/app/bootstrap/session-provider';
import { appRouter } from '@/app/router';
import { SyncProvider } from '@/modules/sync/sync-provider';

export type AppProvidersProps = {
  children?: ReactNode;
  defaultTheme?: ThemeMode;
  defaultBrand?: BrandId;
  defaultLocale?: AppLocale;
};

/**
 * Global providers for the application shell.
 */
export function AppProviders({
  defaultTheme = 'dark',
  defaultBrand = 'tours',
  defaultLocale = 'en',
}: AppProvidersProps) {
  return (
    <I18nProvider defaultLocale={defaultLocale}>
      <LocaleReadyGate>
        <ThemeProvider defaultTheme={defaultTheme} defaultBrand={defaultBrand}>
          <NetworkProvider>
            <SessionProvider>
              <SyncProvider>
                <PwaProvider>
                  <BootstrapProvider>
                    <RouterProvider router={appRouter} />
                    <Toaster />
                  </BootstrapProvider>
                </PwaProvider>
              </SyncProvider>
            </SessionProvider>
          </NetworkProvider>
        </ThemeProvider>
      </LocaleReadyGate>
    </I18nProvider>
  );
}
