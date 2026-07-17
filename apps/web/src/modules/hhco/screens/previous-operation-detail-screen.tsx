import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getDefaultOperationsSessionEngine,
  type OperationsSession,
  type SessionEvidenceItem,
} from '@saki-operations/operations-session';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Button, Card, LoadingSpinner } from '@saki-operations/ui';

import { FadeIn } from '@/app/screens/loading/fade-in';
import { paths } from '@/app/router/paths';

import { EvidenceGallery } from '../components/evidence-gallery';
import { OperationTimeline } from '../components/operation-timeline';
import {
  buildOperationTimeline,
  getHistorySyncKind,
  getSessionWorkingMs,
  toEvidenceGallery,
} from '../lib/history';
import { historySyncBadgeVariant, historySyncLabelKey } from '../lib/history-sync-ui';
import {
  formatKm,
  formatOperationDateTime,
  formatWorkingHoursLabel,
  getSessionHireTypeKey,
  getSessionNumberOfDays,
  getSessionStringField,
  getSessionVehicleLabel,
  isMultiDaySession,
} from '../lib/session-display';

/**
 * Read-only Previous Operations detail — timeline + photos.
 */
export function PreviousOperationDetailScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { t, i18n } = useAppTranslation();
  const [session, setSession] = useState<OperationsSession | null>(null);
  const [evidence, setEvidence] = useState<SessionEvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!sessionId) {
        setLoading(false);
        return;
      }
      const engine = getDefaultOperationsSessionEngine();
      const found = await engine.getSession(sessionId);
      if (cancelled) return;

      if (!found || (found.status !== 'completed' && found.status !== 'synced')) {
        setSession(found);
        setLoading(false);
        return;
      }

      const items = await engine.listEvidence(sessionId);
      if (cancelled) return;
      setSession(found);
      setEvidence(items);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const timeline = useMemo(
    () => (session ? buildOperationTimeline(session) : []),
    [session],
  );
  const gallery = useMemo(() => toEvidenceGallery(evidence), [evidence]);

  if (loading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center">
        <LoadingSpinner label={t('shell.loading.module')} />
      </div>
    );
  }

  if (!session || (session.status !== 'completed' && session.status !== 'synced')) {
    return (
      <FadeIn className="mx-auto max-w-lg space-y-4">
        <Card variant="glass" padding="lg" className="space-y-3" data-brand="hhco">
          <h1 className="font-display text-xl font-semibold">
            {t('hhcoOps.history.detail.missingTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('hhcoOps.history.detail.missingDescription')}
          </p>
          <Button asChild>
            <Link to={paths.hhcoHistory}>{t('hhcoOps.history.backList')}</Link>
          </Button>
        </Card>
      </FadeIn>
    );
  }

  const multiDay = isMultiDaySession(session);
  const sync = getHistorySyncKind(session);

  return (
    <FadeIn className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div data-brand="hhco" className="contents">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Badge variant={historySyncBadgeVariant(sync)} className="rounded-md">
              {t(historySyncLabelKey(sync))}
            </Badge>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {multiDay
                ? t('hhcoOps.multiDay.tripLabel', {
                    days: getSessionNumberOfDays(session),
                    hire: t(getSessionHireTypeKey(session)),
                  })
                : t(getSessionHireTypeKey(session))}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('hhcoOps.history.detail.readOnly')}
            </p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link to={paths.hhcoHistory}>{t('hhcoOps.history.backList')}</Link>
          </Button>
        </header>

        <Card variant="glass" padding="lg" className="space-y-4">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            {t('hhcoOps.history.detail.summary')}
          </h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Detail label={t('hhcoOps.continue.vehicle')} value={getSessionVehicleLabel(session)} />
            <Detail
              label={t('hhcoOps.continue.dealer')}
              value={t(getSessionHireTypeKey(session))}
            />
            <Detail
              label={t('hhcoOps.continue.startLocation')}
              value={getSessionStringField(session, 'startLocation')}
            />
            <Detail
              label={t('hhcoOps.continue.destination')}
              value={getSessionStringField(session, 'destination')}
            />
            <Detail
              label={t('hhcoOps.continue.endingLocation')}
              value={getSessionStringField(session, 'endingLocation')}
            />
            <Detail
              label={t('hhcoOps.continue.numberOfDays')}
              value={String(getSessionNumberOfDays(session))}
            />
            <Detail
              label={t('hhcoOps.completed.workingHours')}
              value={formatWorkingHoursLabel(getSessionWorkingMs(session))}
            />
            <Detail
              label={t('hhcoOps.completed.totalKm')}
              value={`${formatKm(session.totalKm, i18n.language)} ${t('hhcoOps.odometer.unit')}`}
            />
            <Detail
              label={t('hhcoOps.history.detail.startOdometer')}
              value={
                session.startOdometer != null
                  ? `${formatKm(session.startOdometer, i18n.language)} ${t('hhcoOps.odometer.unit')}`
                  : '—'
              }
            />
            <Detail
              label={t('hhcoOps.history.detail.endOdometer')}
              value={
                session.endOdometer != null
                  ? `${formatKm(session.endOdometer, i18n.language)} ${t('hhcoOps.odometer.unit')}`
                  : '—'
              }
            />
            <Detail
              label={t('hhcoOps.confirm.startTime')}
              value={formatOperationDateTime(session.startTime, i18n.language)}
            />
            <Detail
              label={t('hhcoOps.endReview.endTime')}
              value={formatOperationDateTime(session.endTime, i18n.language)}
            />
          </dl>
        </Card>

        <OperationTimeline
          events={timeline}
          endOdometer={session.endOdometer}
          locale={i18n.language}
        />

        <EvidenceGallery items={gallery} locale={i18n.language} />
      </div>
    </FadeIn>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 px-3 py-2.5">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  );
}
