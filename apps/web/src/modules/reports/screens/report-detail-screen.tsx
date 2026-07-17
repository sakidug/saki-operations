import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Button, Card, cn } from '@saki-operations/ui';
import { ArrowLeft, FileDown, Sheet } from 'lucide-react';

import { FadeIn } from '@/app/screens/loading/fade-in';
import { buildReportDetailPath, paths } from '@/app/router/paths';
import { exportReportCsv, exportReportPdf } from '../lib/export-report';
import {
  buildReport,
  isReportPeriod,
  isReportType,
  type BuiltReport,
  type ReportPeriod,
} from '../lib/report-builders';

export function ReportDetailScreen() {
  const { t, i18n } = useAppTranslation();
  const { reportType: reportTypeParam } = useParams<{ reportType: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const periodParam = searchParams.get('period');

  const reportType = isReportType(reportTypeParam) ? reportTypeParam : null;
  const period: ReportPeriod =
    isReportPeriod(periodParam)
      ? periodParam
      : reportType === 'monthly'
        ? 'monthly'
        : reportType === 'daily'
          ? 'daily'
          : 'daily';

  const [report, setReport] = useState<BuiltReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reportType) {
      setReport(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const next = await buildReport(reportType, period);
        if (!cancelled) setReport(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportType, period]);

  const columnLabels = useMemo(() => {
    if (!report) return {} as Record<string, string>;
    const labels: Record<string, string> = {};
    for (const col of report.columns) {
      labels[col.key] = t(col.labelKey);
    }
    return labels;
  }, [report, t]);

  const locale = i18n.language === 'si' ? 'si-LK' : 'en-LK';
  const hours = report ? (report.summary.workingDurationMs / 3_600_000).toFixed(2) : '0';

  const setPeriod = (next: ReportPeriod) => {
    setSearchParams({ period: next }, { replace: true });
  };

  if (!reportType) {
    return (
      <FadeIn className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Card variant="glass" padding="md">
          <p className="text-sm text-muted-foreground">{t('reportsOps.detail.missing')}</p>
          <Button asChild className="mt-3" variant="secondary">
            <Link to={paths.reports}>{t('reportsOps.detail.back')}</Link>
          </Button>
        </Card>
      </FadeIn>
    );
  }

  const title = t(`reportsOps.types.${reportType}`);
  const filenameBase = `saki-${reportType}-${period}`;

  const onExportExcel = () => {
    if (!report) return;
    exportReportCsv(report, columnLabels, filenameBase);
  };

  const onExportPdf = () => {
    if (!report) return;
    exportReportPdf(report, {
      title,
      columnLabels,
      summaryLabel: t('reportsOps.detail.summary'),
      sessionsLabel: t('reportsOps.columns.sessions'),
      hoursLabel: t('reportsOps.columns.hours'),
      kmLabel: t('reportsOps.columns.km'),
      generatedLabel: t('reportsOps.detail.generated'),
      filenameBase,
    });
  };

  return (
    <FadeIn className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div data-brand="office" className="contents">
        <header className="space-y-2">
          <Link
            to={paths.reports}
            className={cn(
              'inline-flex items-center gap-1.5 text-sm text-muted-foreground',
              'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t('reportsOps.detail.back')}
          </Link>
          <Badge variant="secondary" className="rounded-md">
            {t('reportsOps.badge')}
          </Badge>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="text-sm text-muted-foreground">{t(`reportsOps.typesHint.${reportType}`)}</p>
        </header>

        {reportType !== 'daily' && reportType !== 'monthly' ? (
          <section aria-label={t('reportsOps.detail.periodRegion')} className="flex flex-wrap gap-2">
            {(['daily', 'monthly'] as const).map((p) => (
              <Button
                key={p}
                type="button"
                size="sm"
                variant={period === p ? 'default' : 'secondary'}
                onClick={() => setPeriod(p)}
              >
                {t(`reportsOps.period.${p}`)}
              </Button>
            ))}
          </section>
        ) : (
          <p className="text-xs text-muted-foreground">
            <Link
              to={buildReportDetailPath(reportType === 'daily' ? 'monthly' : 'daily')}
              className="text-primary underline-offset-2 hover:underline"
            >
              {reportType === 'daily'
                ? t('reportsOps.detail.switchMonthly')
                : t('reportsOps.detail.switchDaily')}
            </Link>
          </p>
        )}

        {loading || !report ? (
          <Card variant="glass" padding="md">
            <p className="text-sm text-muted-foreground">{t('reportsOps.detail.loading')}</p>
          </Card>
        ) : (
          <>
            <section
              aria-label={t('reportsOps.detail.summary')}
              className="grid grid-cols-3 gap-2.5"
            >
              <Card variant="glass" padding="sm" className="text-center">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('reportsOps.columns.sessions')}
                </p>
                <p className="mt-1 font-display text-xl font-semibold tabular-nums">
                  {report.summary.sessions}
                </p>
              </Card>
              <Card variant="glass" padding="sm" className="text-center">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('reportsOps.columns.hours')}
                </p>
                <p className="mt-1 font-display text-xl font-semibold tabular-nums">{hours}</p>
              </Card>
              <Card variant="glass" padding="sm" className="text-center">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('reportsOps.columns.km')}
                </p>
                <p className="mt-1 font-display text-xl font-semibold tabular-nums">
                  {report.summary.totalKm.toLocaleString(locale)}
                </p>
              </Card>
            </section>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={onExportPdf}>
                <FileDown className="size-4" aria-hidden />
                {t('reportsOps.export.pdf')}
              </Button>
              <Button type="button" variant="secondary" onClick={onExportExcel}>
                <Sheet className="size-4" aria-hidden />
                {t('reportsOps.export.excel')}
              </Button>
            </div>

            <Card variant="glass" padding="sm" className="overflow-x-auto">
              {report.rows.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">{t('reportsOps.detail.empty')}</p>
              ) : (
                <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-glass-border text-xs uppercase tracking-wide text-muted-foreground">
                      {report.columns.map((col) => (
                        <th key={col.key} className="px-2 py-2 font-semibold">
                          {columnLabels[col.key]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((row, index) => (
                      <tr key={`${index}-${String(row.employee ?? row.module ?? '')}`} className="border-b border-glass-border/60">
                        {report.columns.map((col) => (
                          <td key={col.key} className="px-2 py-2 tabular-nums">
                            {row[col.key] === '' || row[col.key] == null
                              ? '—'
                              : String(row[col.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </>
        )}
      </div>
    </FadeIn>
  );
}
