import { useEffect, useMemo, useState } from 'react';
import {
  TECHNOLOGY_STACK,
  environmentLabel,
  formatBuildInfoCopy,
  formatReleasedDate,
} from '@saki-operations/build-info';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Button, Card, StatusIndicator, cn } from '@saki-operations/ui';
import { Check, Copy, Settings } from 'lucide-react';

import { getClientBuildInfo } from '@/app/bootstrap/constants';
import { useNetwork } from '@/app/bootstrap/network-provider';
import { useSession } from '@/app/bootstrap/session-provider';
import { FadeIn } from '@/app/screens/loading/fade-in';
import { useSyncStatus } from '@/modules/sync/sync-provider';

type ServiceState = 'online' | 'offline' | 'unknown' | 'healthy' | 'degraded';

type HealthResponse = {
  status?: string;
  database?: string;
  apiStatus?: string;
};

type BrowserSystemInfo = {
  browser: string;
  os: string;
  deviceType: string;
  platform: string;
  language: string;
  timezone: string;
  connectionType: string;
  pwaInstalled: string;
  storageUsage: string;
  indexedDb: string;
  cameraPermission: string;
  notificationPermission: string;
  screenSize: string;
};

type NavigatorWithConnection = Navigator & {
  connection?: { effectiveType?: string; type?: string };
  standalone?: boolean;
};

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/40 py-2.5 last:border-b-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={cn('text-right text-sm font-semibold', mono && 'font-mono')}>{value}</dd>
    </div>
  );
}

function StatusRow({
  label,
  state,
  onlineLabel,
  offlineLabel,
  unknownLabel,
}: {
  label: string;
  state: ServiceState;
  onlineLabel: string;
  offlineLabel: string;
  unknownLabel: string;
}) {
  const ok = state === 'online' || state === 'healthy';
  const labelText =
    state === 'unknown' ? unknownLabel : ok ? onlineLabel : offlineLabel;
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <StatusIndicator
        status={ok ? 'online' : state === 'unknown' ? 'idle' : state === 'degraded' ? 'busy' : 'offline'}
        label={labelText}
      />
    </div>
  );
}

function parseUserAgent(ua: string): Pick<BrowserSystemInfo, 'browser' | 'os' | 'deviceType'> {
  const browser = /Edg\//.test(ua)
    ? 'Microsoft Edge'
    : /Chrome\//.test(ua)
      ? 'Chrome'
      : /Safari\//.test(ua) && !/Chrome\//.test(ua)
        ? 'Safari'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : 'Unknown';

  const os = /Windows NT/i.test(ua)
    ? 'Windows'
    : /Android/i.test(ua)
      ? 'Android'
      : /iPhone|iPad|iPod/i.test(ua)
        ? 'iOS'
        : /Mac OS X/i.test(ua)
          ? 'macOS'
          : /Linux/i.test(ua)
            ? 'Linux'
            : 'Unknown';

  const deviceType = /Mobi|Android|iPhone|iPad/i.test(ua) ? 'Mobile / Tablet' : 'Desktop';
  return { browser, os, deviceType };
}

function readBaseSystemInfo(labels: {
  yes: string;
  no: string;
  checking: string;
  unavailable: string;
  available: string;
  unknown: string;
}): BrowserSystemInfo {
  const nav = navigator as NavigatorWithConnection;
  const parsed = parseUserAgent(nav.userAgent);
  const installed =
    window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;

  return {
    browser: parsed.browser,
    os: parsed.os,
    deviceType: parsed.deviceType,
    platform: nav.platform || labels.unknown,
    language: nav.language || labels.unknown,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || labels.unknown,
    connectionType: nav.connection?.effectiveType || nav.connection?.type || labels.unknown,
    pwaInstalled: installed ? labels.yes : labels.no,
    storageUsage: labels.checking,
    indexedDb: labels.checking,
    cameraPermission: labels.checking,
    notificationPermission:
      typeof Notification === 'undefined' ? labels.unavailable : Notification.permission,
    screenSize: `${window.screen.width} x ${window.screen.height}`,
  };
}

async function resolveSystemInfo(labels: {
  yes: string;
  no: string;
  checking: string;
  unavailable: string;
  available: string;
  unknown: string;
}): Promise<BrowserSystemInfo> {
  const next = readBaseSystemInfo(labels);

  try {
    const estimate = await navigator.storage?.estimate?.();
    if (estimate?.usage != null && estimate.quota != null) {
      const usedMb = Math.round(estimate.usage / 1024 / 1024);
      const quotaMb = Math.round(estimate.quota / 1024 / 1024);
      next.storageUsage = `${usedMb} MB / ${quotaMb} MB`;
    } else {
      next.storageUsage = labels.unavailable;
    }
  } catch {
    next.storageUsage = labels.unavailable;
  }

  next.indexedDb = 'indexedDB' in window ? labels.available : labels.unavailable;

  try {
    const permission = await navigator.permissions?.query?.({
      name: 'camera' as PermissionName,
    });
    next.cameraPermission = permission?.state ?? labels.unknown;
  } catch {
    next.cameraPermission = labels.unknown;
  }

  return next;
}

function formatSystemInfoCopy(input: {
  app: ReturnType<typeof getClientBuildInfo>;
  system: BrowserSystemInfo;
  api: string;
  database: string;
  sync: string;
  role: string;
}): string {
  return [
    formatBuildInfoCopy(input.app),
    `Browser: ${input.system.browser}`,
    `OS: ${input.system.os}`,
    `Device: ${input.system.deviceType}`,
    `Screen: ${input.system.screenSize}`,
    `Route: ${window.location.pathname}`,
    `User Role: ${input.role}`,
    `API: ${input.api}`,
    `Database: ${input.database}`,
    `Sync: ${input.sync}`,
    `Storage: ${input.system.storageUsage}`,
    `Camera: ${input.system.cameraPermission}`,
    `Notifications: ${input.system.notificationPermission}`,
  ].join('\n');
}

/**
 * Settings → About — enterprise build identity + live service status.
 */
export function SettingsAboutScreen() {
  const { t, i18n } = useAppTranslation();
  const info = getClientBuildInfo();
  const { isOnline } = useNetwork();
  const { user } = useSession();
  const { status: syncStatus } = useSyncStatus();
  const [copied, setCopied] = useState(false);
  const [copiedSystem, setCopiedSystem] = useState(false);
  const [apiState, setApiState] = useState<ServiceState>('unknown');
  const [dbState, setDbState] = useState<ServiceState>('unknown');
  const systemLabels = useMemo(
    () => ({
      yes: t('settingsAbout.yes'),
      no: t('settingsAbout.no'),
      checking: t('settingsAbout.checking'),
      unavailable: t('settingsAbout.unavailable'),
      available: t('settingsAbout.available'),
      unknown: t('settingsAbout.statusUnknown'),
    }),
    [t],
  );
  const [systemInfo, setSystemInfo] = useState<BrowserSystemInfo>(() =>
    readBaseSystemInfo({
      yes: 'Yes',
      no: 'No',
      checking: 'Checking...',
      unavailable: 'Unavailable',
      available: 'Available',
      unknown: 'Unknown',
    }),
  );

  useEffect(() => {
    if (!isOnline) {
      setApiState('offline');
      setDbState('unknown');
      return;
    }
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    const controller = new AbortController();
    void fetch(`${apiBase}/health`, { signal: controller.signal, credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          setApiState('offline');
          setDbState('unknown');
          return;
        }
        const body = (await res.json()) as HealthResponse & { data?: HealthResponse };
        const payload = body.data ?? body;
        setApiState('online');
        if (payload.database === 'connected') setDbState('online');
        else if (payload.database === 'disconnected') setDbState('offline');
        else setDbState('unknown');
      })
      .catch(() => {
        setApiState('offline');
        setDbState('unknown');
      });
    return () => controller.abort();
  }, [isOnline]);

  const syncHealthy =
    syncStatus.failedCount === 0 && syncStatus.conflictCount === 0 && !syncStatus.lastError;

  const apiLabel = apiState === 'online' ? t('settingsAbout.statusOnline') : t('settingsAbout.statusOffline');
  const dbLabel =
    dbState === 'online'
      ? t('settingsAbout.statusConnected')
      : dbState === 'offline'
        ? t('settingsAbout.statusDisconnected')
        : t('settingsAbout.statusUnknown');
  const syncLabel = syncHealthy
    ? t('settingsAbout.statusHealthy')
    : t('settingsAbout.statusAttention');

  useEffect(() => {
    void resolveSystemInfo(systemLabels).then(setSystemInfo);
  }, [systemLabels]);

  const systemRows = useMemo<ReadonlyArray<readonly [string, string]>>(
    () => [
      [t('settingsAbout.browser'), systemInfo.browser],
      [t('settingsAbout.platformLabel'), systemInfo.platform],
      [t('settingsAbout.operatingSystem'), systemInfo.os],
      [t('settingsAbout.deviceType'), systemInfo.deviceType],
      [t('settingsAbout.language'), systemInfo.language],
      [t('settingsAbout.timezone'), systemInfo.timezone],
      [t('settingsAbout.connectionType'), systemInfo.connectionType],
      [t('settingsAbout.pwaInstalled'), systemInfo.pwaInstalled],
      [t('settingsAbout.storageUsage'), systemInfo.storageUsage],
      [t('settingsAbout.indexedDb'), systemInfo.indexedDb],
      [t('settingsAbout.cameraPermission'), systemInfo.cameraPermission],
      [t('settingsAbout.notifications'), systemInfo.notificationPermission],
      [t('settingsAbout.screenSize'), systemInfo.screenSize],
    ],
    [systemInfo, t],
  );

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatBuildInfoCopy(info));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const onCopySystem = async () => {
    try {
      await navigator.clipboard.writeText(
        formatSystemInfoCopy({
          app: info,
          system: systemInfo,
          api: apiLabel,
          database: dbLabel,
          sync: syncLabel,
          role: user?.role ?? 'Unknown',
        }),
      );
      setCopiedSystem(true);
      window.setTimeout(() => setCopiedSystem(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <FadeIn className="mx-auto flex w-full max-w-lg flex-col gap-5">
      <header className="space-y-2">
        <Badge variant="secondary" className="rounded-md">
          {t('shell.ready.settings.badge')}
        </Badge>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('settingsAbout.title')}
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          {t('settingsAbout.description')}
        </p>
      </header>

      <Card variant="glass" padding="lg" className="space-y-5">
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 p-2">
            <img src="/favicon.svg" alt={t('settingsAbout.logoAlt')} className="size-10" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="font-display text-xl font-semibold tracking-tight">{info.name}</p>
            <p className="text-sm text-muted-foreground">{info.company}</p>
          </div>
        </div>

        <dl>
          <MetaRow label={t('buildInfo.version')} value={`v${info.version}`} mono />
          <MetaRow label={t('buildInfo.build')} value={info.build} mono />
          <MetaRow
            label={t('buildInfo.released')}
            value={formatReleasedDate(info.builtAt, i18n.language)}
          />
          <MetaRow
            label={t('buildInfo.environment')}
            value={environmentLabel(info.environment)}
          />
          <MetaRow label={t('buildInfo.platform')} value={info.platform} />
          <MetaRow label={t('settingsAbout.support')} value={info.supportContact} />
          <MetaRow label={t('settingsAbout.license')} value={info.license} />
        </dl>

        <div className="rounded-xl bg-muted/40 px-3 py-2">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('settingsAbout.services')}
          </p>
          <StatusRow
            label={t('settingsAbout.api')}
            state={apiState}
            onlineLabel={t('settingsAbout.statusOnline')}
            offlineLabel={t('settingsAbout.statusOffline')}
            unknownLabel={t('settingsAbout.statusUnknown')}
          />
          <StatusRow
            label={t('settingsAbout.database')}
            state={dbState}
            onlineLabel={t('settingsAbout.statusConnected')}
            offlineLabel={t('settingsAbout.statusDisconnected')}
            unknownLabel={t('settingsAbout.statusUnknown')}
          />
          <StatusRow
            label={t('settingsAbout.sync')}
            state={syncHealthy ? 'healthy' : 'degraded'}
            onlineLabel={t('settingsAbout.statusHealthy')}
            offlineLabel={t('settingsAbout.statusAttention')}
            unknownLabel={t('settingsAbout.statusUnknown')}
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('settingsAbout.stack')}
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {TECHNOLOGY_STACK.map((item) => (
              <li
                key={item}
                className="rounded-md border border-border/60 bg-background/40 px-2 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Button type="button" variant="secondary" className="w-full" onClick={() => void onCopy()}>
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? t('buildInfo.copied') : t('buildInfo.copy')}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {t('settingsAbout.copyright', {
            year: info.copyrightYear,
            company: info.company,
          })}
        </p>
        {info.website ? (
          <p className="text-center text-xs">
            <a
              href={info.website}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              {info.website.replace(/^https?:\/\//, '')}
            </a>
          </p>
        ) : null}
      </Card>

      <Card variant="glass" padding="lg" className="space-y-4">
        <div className="space-y-1">
          <p className="font-display text-lg font-semibold tracking-tight">
            {t('settingsAbout.systemInformation')}
          </p>
          <p className="text-sm text-muted-foreground">{t('settingsAbout.systemDescription')}</p>
        </div>

        <dl>
          {systemRows.map(([label, value]) => (
            <MetaRow key={label} label={label} value={value} />
          ))}
        </dl>

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => void onCopySystem()}
        >
          {copiedSystem ? (
            <Check className="size-4" aria-hidden />
          ) : (
            <Copy className="size-4" aria-hidden />
          )}
          {copiedSystem ? t('buildInfo.copied') : t('settingsAbout.copySystem')}
        </Button>
      </Card>

      <Card variant="glass" className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
        <Settings className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>{t('shell.ready.settings.body')}</p>
      </Card>
    </FadeIn>
  );
}
