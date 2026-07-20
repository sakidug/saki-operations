import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmployeeSelector, VehicleSelector } from '@saki-operations/forms';
import { OdometerCapture } from '@saki-operations/ocr';
import { useAppTranslation } from '@saki-operations/i18n';
import type { EmployeeSelectorItem } from '@saki-operations/types';
import { Badge, Button, Card, cn, LoadingSpinner } from '@saki-operations/ui';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

import { findAnyActiveOperation } from '@/app/operations/find-active-operation';
import { useAnyActiveOperation } from '@/app/operations/use-any-active-operation';
import { FadeIn } from '@/app/screens/loading/fade-in';
import { paths, buildHhcoOperationStartedPath } from '@/app/router/paths';
import { listEmployees } from '@/modules/employees/lib/employee-store';

import { ActiveOperationBlocked } from '../components/active-operation-blocked';
import { DealerSelectStep } from '../components/dealer-select-step';
import { StartTimeCaptureStep } from '../components/start-time-capture-step';
import { RouteDetailsStep } from '../components/route-details-step';
import { TOURS_FLEET_CATALOG } from '../data/fleet-catalog';
import { commitStartOperation } from '../lib/commit-start-operation';
import { findActiveHhcoSession } from '../lib/find-active-session';
import {
  createEmptyStartDraft,
  dealerLabelKey,
  isMultiDay,
  type StartOperationDraft,
} from '../types';

const STEP_COUNT = 7;

function employeeItems(role: 'driver' | 'assistant'): EmployeeSelectorItem[] {
  return listEmployees(role).map((employee) => ({
    id: employee.employeeId,
    employeeId: employee.employeeId,
    displayName: employee.displayName,
    phone: employee.phone || null,
    role: employee.role,
    available: true,
  }));
}

function canAdvance(step: number, draft: StartOperationDraft): boolean {
  switch (step) {
    case 1:
      return Boolean(draft.driverId);
    case 2:
      return Boolean(draft.vehicleId);
    case 3:
      return Boolean(draft.dealerId);
    case 4:
      return (
        draft.startLocation.trim().length > 0 &&
        draft.destination.trim().length > 0 &&
        draft.endingLocation.trim().length > 0 &&
        draft.numberOfDays >= 1
      );
    case 5:
      return Boolean(draft.startOdometer);
    case 6:
      return Boolean(draft.startTime);
    case 7:
      return true;
    default:
      return false;
  }
}

/**
 * Phase 7.2A — Start Operation wizard (offline-capable).
 * Session owner is the selected driver (no JWT required).
 */
export function StartOperationWizardScreen() {
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  const { session: activeSession, loading: activeLoading } = useAnyActiveOperation();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<StartOperationDraft>(createEmptyStartDraft);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const drivers = useMemo(() => employeeItems('driver'), []);

  const stepTitle = useMemo(() => {
    switch (step) {
      case 1:
        return t('hhcoOps.wizard.stepDriver');
      case 2:
        return t('hhcoOps.wizard.stepVehicle');
      case 3:
        return t('hhcoOps.wizard.stepDealer');
      case 4:
        return t('hhcoOps.wizard.stepTrip');
      case 5:
        return t('hhcoOps.wizard.stepOdometer');
      case 6:
        return t('hhcoOps.wizard.stepStartTime');
      default:
        return t('hhcoOps.wizard.stepConfirm');
    }
  }, [step, t]);

  const nextEnabled = canAdvance(step, draft);

  const onStart = async () => {
    if (!draft.driverId) {
      setError(t('hhcoOps.wizard.missingDriver'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const deviceActive = await findAnyActiveOperation();
      if (deviceActive) {
        setError(t('hhcoOps.active.blockedDescription'));
        return;
      }
      const existing = await findActiveHhcoSession(draft.driverId);
      if (existing) {
        setError(t('hhcoOps.active.blockedDescription'));
        return;
      }
      const session = await commitStartOperation({
        employeeId: draft.driverId,
        operatorId: draft.driverId,
        draft,
      });
      navigate(buildHhcoOperationStartedPath(session.id), { replace: true });
    } catch {
      setError(t('hhcoOps.wizard.startFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (activeLoading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center">
        <LoadingSpinner label={t('shell.loading.module')} />
      </div>
    );
  }

  if (activeSession) {
    return (
      <FadeIn className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <ActiveOperationBlocked session={activeSession} />
      </FadeIn>
    );
  }

  return (
    <FadeIn className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div data-brand="hhco" className="contents">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Badge variant="secondary" className="rounded-md">
            {t('hhcoOps.wizard.stepOf', { current: step, total: STEP_COUNT })}
          </Badge>
          <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            {t('hhcoOps.wizard.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{stepTitle}</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to={paths.entry}>{t('hhcoOps.wizard.cancel')}</Link>
        </Button>
      </div>

      <ol className="flex gap-1.5" aria-hidden>
        {Array.from({ length: STEP_COUNT }, (_, index) => {
          const n = index + 1;
          return (
            <li
              key={n}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                n <= step ? 'bg-primary' : 'bg-muted',
              )}
            />
          );
        })}
      </ol>

      <Card variant="glass" padding="lg" className="space-y-5">
        {step === 1 ? (
          <EmployeeSelector
            items={drivers}
            value={draft.driverId}
            roleFilter="driver"
            availabilityFilter="available"
            onChange={(driverId, employees) =>
              setDraft((prev) => ({
                ...prev,
                driverId: typeof driverId === 'string' ? driverId : null,
                driver: employees?.[0] ?? null,
              }))
            }
            label={t('hhcoOps.driver.label')}
            description={t('hhcoOps.driver.selectorDescription')}
          />
        ) : null}

        {step === 2 ? (
          <VehicleSelector
            items={TOURS_FLEET_CATALOG}
            value={draft.vehicleId}
            onChange={(vehicleId, vehicle) =>
              setDraft((prev) => ({
                ...prev,
                vehicleId,
                vehicle: vehicle ?? null,
              }))
            }
            label={t('hhcoOps.vehicle.label')}
            description={t('hhcoOps.vehicle.description')}
          />
        ) : null}

        {step === 3 ? (
          <DealerSelectStep
            value={draft.dealerId}
            onChange={(dealerId) => setDraft((prev) => ({ ...prev, dealerId }))}
          />
        ) : null}

        {step === 4 ? (
          <RouteDetailsStep
            startLocation={draft.startLocation}
            destination={draft.destination}
            endingLocation={draft.endingLocation}
            numberOfDays={draft.numberOfDays}
            onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
          />
        ) : null}

        {step === 5 ? (
          <OdometerCapture
            kind="digital"
            labels={{
              title: t('hhcoOps.odometer.title'),
              description: t('hhcoOps.odometer.description'),
              capture: t('hhcoOps.odometer.capture'),
              processing: t('hhcoOps.odometer.processing'),
              photoSaved: t('hhcoOps.odometer.photoSaved'),
              detected: t('hhcoOps.odometer.detected'),
              confidence: t('hhcoOps.odometer.confidence'),
              lowConfidenceWarning: t('hhcoOps.odometer.lowConfidence'),
              failedWarning: t('hhcoOps.odometer.failed'),
              accept: t('hhcoOps.odometer.accept'),
              edit: t('hhcoOps.odometer.edit'),
              enterManually: t('hhcoOps.odometer.enterManually'),
              saveEdit: t('hhcoOps.odometer.saveEdit'),
              confirmReading: t('hhcoOps.odometer.confirmReading'),
              cancel: t('hhcoOps.odometer.cancelEdit'),
              retake: t('hhcoOps.odometer.retake'),
              unit: t('hhcoOps.odometer.unit'),
              saved: t('hhcoOps.odometer.saved'),
              editedSuffix: t('hhcoOps.odometer.editedSuffix'),
              photoAlt: t('hhcoOps.odometer.photoAlt'),
              previousReading: t('hhcoOps.odometer.previousReading'),
              warningBelowPrevious: t('hhcoOps.odometer.warningBelowPrevious'),
              warningLargeJump: t('hhcoOps.odometer.warningLargeJump'),
              warningTooShort: t('hhcoOps.odometer.warningTooShort'),
              acknowledgeWarning: t('hhcoOps.odometer.acknowledgeWarning'),
              backspace: t('hhcoOps.odometer.backspace'),
            }}
            onAccepted={(reading) => setDraft((prev) => ({ ...prev, startOdometer: reading }))}
          />
        ) : null}

        {step === 6 ? (
          <StartTimeCaptureStep
            value={draft.startTime}
            onChange={(startTime) => setDraft((prev) => ({ ...prev, startTime }))}
          />
        ) : null}

        {step === 7 ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {t('hhcoOps.confirm.title')}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{t('hhcoOps.confirm.description')}</p>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-muted/40 px-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t('hhcoOps.confirm.driver')}
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  {draft.driver?.displayName ?? '—'}
                </dd>
              </div>
              <div className="rounded-xl bg-muted/40 px-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t('hhcoOps.confirm.vehicle')}
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  {draft.vehicle?.name ?? '—'}
                  {draft.vehicle?.registrationNumber
                    ? ` · ${draft.vehicle.registrationNumber}`
                    : null}
                </dd>
              </div>
              <div className="rounded-xl bg-muted/40 px-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t('hhcoOps.confirm.dealer')}
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  {draft.dealerId ? t(dealerLabelKey(draft.dealerId)) : '—'}
                </dd>
              </div>
              <div className="rounded-xl bg-muted/40 px-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t('hhcoOps.confirm.route')}
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  {draft.startLocation} → {draft.destination} → {draft.endingLocation}
                </dd>
              </div>
              <div className="rounded-xl bg-muted/40 px-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t('hhcoOps.confirm.days')}
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  {draft.numberOfDays}
                  {isMultiDay(draft.numberOfDays) ? (
                    <Badge variant="warning" className="ml-2 rounded-md">
                      {t('hhcoOps.trip.multiDayBadge')}
                    </Badge>
                  ) : null}
                </dd>
              </div>
              <div className="rounded-xl bg-muted/40 px-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t('hhcoOps.confirm.startOdometer')}
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  {draft.startOdometer
                    ? `${draft.startOdometer.displayValue} ${t('hhcoOps.odometer.unit')}`
                    : '—'}
                </dd>
              </div>
              <div className="rounded-xl bg-muted/40 px-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t('hhcoOps.confirm.startTime')}
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  {draft.startTime
                    ? new Intl.DateTimeFormat(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'medium',
                      }).format(new Date(draft.startTime.capturedAt))
                    : '—'}
                </dd>
              </div>
            </dl>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
              {t('hhcoOps.confirm.offlineNote')}
            </p>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <Button
            type="button"
            variant="secondary"
            disabled={step === 1 || submitting}
            onClick={() => {
              setError(null);
              setStep((s) => Math.max(1, s - 1));
            }}
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t('hhcoOps.wizard.back')}
          </Button>

          {step < STEP_COUNT ? (
            <Button
              type="button"
              disabled={!nextEnabled}
              onClick={() => {
                setError(null);
                setStep((s) => Math.min(STEP_COUNT, s + 1));
              }}
            >
              {t('hhcoOps.wizard.next')}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              loading={submitting}
              disabled={!canAdvance(STEP_COUNT, draft) || submitting}
              onClick={() => void onStart()}
            >
              {t('hhcoOps.wizard.startOperation')}
            </Button>
          )}
        </div>
      </Card>
      </div>
    </FadeIn>
  );
}
