import { Link } from 'react-router-dom';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Card, cn } from '@saki-operations/ui';
import {
  CalendarDays,
  CalendarRange,
  ChevronRight,
  FileBarChart2,
  Package,
  Truck,
  Users,
} from 'lucide-react';

import { FadeIn } from '@/app/screens/loading/fade-in';
import { buildReportDetailPath, paths } from '@/app/router/paths';
import { REPORT_TYPES, type ReportPeriod, type ReportType } from '../lib/report-builders';

const REPORT_ICONS: Record<ReportType, typeof FileBarChart2> = {
  daily: CalendarDays,
  monthly: CalendarRange,
  employee: Users,
  vehicle: Truck,
  tours: FileBarChart2,
  hhco: Package,
};

const DEFAULT_PERIOD: ReportPeriod = 'daily';

export function ReportsHomeScreen() {
  const { t } = useAppTranslation();

  return (
    <FadeIn className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div data-brand="office" className="contents">
        <header className="space-y-2">
          <Badge variant="secondary" className="rounded-md">
            {t('reportsOps.badge')}
          </Badge>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('reportsOps.home.title')}
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            {t('reportsOps.home.description')}
          </p>
          <Link
            to={paths.officeDashboard}
            className={cn(
              'inline-flex text-sm font-medium text-primary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            {t('reportsOps.home.backOffice')}
          </Link>
        </header>

        <section aria-label={t('reportsOps.home.typesRegion')} className="space-y-2.5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('reportsOps.home.typesTitle')}
          </h2>
          <ul className="flex flex-col gap-2">
            {REPORT_TYPES.map((type) => {
              const Icon = REPORT_ICONS[type];
              return (
                <li key={type}>
                  <Link
                    to={buildReportDetailPath(type, DEFAULT_PERIOD)}
                    className={cn(
                      'glass group flex items-center gap-3 rounded-2xl border border-glass-border p-4',
                      'transition hover:brightness-110',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    )}
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{t(`reportsOps.types.${type}`)}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {t(`reportsOps.typesHint.${type}`)}
                      </span>
                    </span>
                    <ChevronRight
                      className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <Card variant="glass" padding="md">
          <p className="text-sm text-muted-foreground">{t('reportsOps.home.periodHint')}</p>
        </Card>
      </div>
    </FadeIn>
  );
}
