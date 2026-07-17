import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Card, cn } from '@saki-operations/ui';
import {
  Activity,
  Building2,
  FileBarChart2,
  Package,
  Radio,
  RefreshCw,
  Truck,
  Users,
} from 'lucide-react';

import { FadeIn } from '@/app/screens/loading/fade-in';
import { paths } from '@/app/router/paths';
import { getEmployee } from '@/modules/employees/lib/employee-store';
import {
  aggregateOfficeDashboardMetrics,
  type OfficeDashboardMetrics,
} from '../lib/aggregate-office-metrics';

function formatCompactHours(durationMs: number | null, empty = '—'): string {
  if (durationMs == null || !Number.isFinite(durationMs) || durationMs <= 0) return empty;
  const hours = Math.floor(durationMs / 3_600_000);
  const minutes = Math.floor((durationMs % 3_600_000) / 60_000);
  if (hours > 0 && minutes === 0) return `${hours}h`;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function OfficeDashboardScreen() {
  const { t, i18n } = useAppTranslation();
  const [metrics, setMetrics] = useState<OfficeDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const locale = i18n.language === 'si' ? 'si-LK' : 'en-LK';

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const next = await aggregateOfficeDashboardMetrics();
        if (!cancelled) setMetrics(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const kpiCards = metrics
    ? [
        {
          key: 'operationsToday' as const,
          value: metrics.operationsToday,
          icon: Activity,
        },
        {
          key: 'deliveriesToday' as const,
          value: metrics.deliveriesToday,
          icon: Package,
        },
        {
          key: 'pendingSync' as const,
          value: metrics.pendingSync,
          icon: RefreshCw,
        },
        {
          key: 'multiDayActive' as const,
          value: metrics.multiDayActive,
          icon: Radio,
        },
      ]
    : [];

  const liveCards = metrics
    ? [
        {
          key: 'liveOperations' as const,
          value: metrics.liveOperations,
          icon: Activity,
        },
        {
          key: 'liveDeliveries' as const,
          value: metrics.liveDeliveries,
          icon: Package,
        },
        {
          key: 'employeesOnline' as const,
          value: metrics.employeesOnline,
          icon: Users,
        },
        {
          key: 'vehiclesActive' as const,
          value: metrics.vehiclesActive,
          icon: Truck,
        },
      ]
    : [];

  return (
    <FadeIn className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div data-brand="office" className="contents">
        <header className="space-y-2">
          <Badge variant="secondary" className="rounded-md">
            {t('officeDash.badge')}
          </Badge>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('officeDash.title')}
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            {t('officeDash.description')}
          </p>
          <Link
            to={paths.reports}
            className={cn(
              'inline-flex items-center gap-2 text-sm font-medium text-primary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <FileBarChart2 className="size-4" aria-hidden />
            {t('officeDash.openReports')}
          </Link>
        </header>

        {loading || !metrics ? (
          <Card variant="glass" padding="md">
            <p className="text-sm text-muted-foreground">{t('officeDash.loading')}</p>
          </Card>
        ) : (
          <>
            <section aria-label={t('officeDash.kpiRegion')} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {kpiCards.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.key} variant="glass" padding="sm" className="text-center">
                    <span className="mx-auto mb-1.5 flex size-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
                      {t(`officeDash.kpi.${item.key}`)}
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold tabular-nums sm:text-3xl">
                      {item.value}
                    </p>
                  </Card>
                );
              })}
            </section>

            <section aria-label={t('officeDash.liveRegion')} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {liveCards.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.key} variant="glass" padding="sm">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
                          {t(`officeDash.live.${item.key}`)}
                        </p>
                        <p className="font-display text-xl font-semibold tabular-nums">{item.value}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </section>

            <section aria-label={t('officeDash.activityRegion')} className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <Building2 className="size-4" aria-hidden />
                {t('officeDash.activityTitle')}
              </h2>
              {metrics.recentActivity.length === 0 ? (
                <Card variant="glass" padding="md">
                  <p className="text-sm text-muted-foreground">{t('officeDash.activityEmpty')}</p>
                </Card>
              ) : (
                <ul className="flex flex-col gap-2">
                  {metrics.recentActivity.map((item) => {
                    const employee = getEmployee(item.employeeId);
                    const ended = new Date(item.endedAt).toLocaleString(locale, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    });
                    const moduleLabel =
                      item.moduleId === 'hhco'
                        ? t('officeDash.module.hhco')
                        : t('officeDash.module.tours');
                    return (
                      <li key={item.id}>
                        <Card variant="glass" padding="sm" className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">
                              {moduleLabel}
                              <span className="font-normal text-muted-foreground">
                                {' · '}
                                {employee?.displayName ?? item.employeeId}
                              </span>
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{ended}</p>
                          </div>
                          <div className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                            <p>{formatCompactHours(item.workingDurationMs)}</p>
                            <p>
                              {item.totalKm != null
                                ? t('officeDash.km', { km: item.totalKm })
                                : '—'}
                            </p>
                          </div>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </FadeIn>
  );
}
