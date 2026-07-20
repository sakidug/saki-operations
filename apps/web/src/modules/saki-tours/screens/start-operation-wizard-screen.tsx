import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmployeeSelector } from '@saki-operations/forms';
import { OdometerCapture } from '@saki-operations/ocr';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Button, Card, Input, Label, LoadingSpinner, cn } from '@saki-operations/ui';
import type { CompanySelectorItem, EmployeeSelectorItem } from '@saki-operations/types';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Car,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  MapPin,
  UserRound,
  UsersRound,
} from 'lucide-react';

import { FadeIn } from '@/app/screens/loading/fade-in';
import { paths, buildSakiToursOperationStartedPath } from '@/app/router/paths';
import {
  COMPANY_ID_HHCO,
  listCompanies,
} from '@/modules/companies/data/company-catalog';
import { listEmployees } from '@/modules/employees/lib/employee-store';
import { findAnyActiveOperation } from '@/app/operations/find-active-operation';
import { useAnyActiveOperation } from '@/app/operations/use-any-active-operation';

import { ActiveOperationBlocked } from '../components/active-operation-blocked';
import { ToursVehicleStep } from '../components/tours-vehicle-step';
import { TOURS_FLEET_CATALOG } from '../data/fleet-catalog';
import {
  VehicleActiveOperationError,
  commitStartOperation,
} from '../lib/commit-start-operation';
import { findActiveToursSession } from '../lib/find-active-session';
import { reportOperationError } from '../lib/report-operation-error';
import {
  resolveToursVehicleStatuses,
  type ToursVehicleStatus,
} from '../lib/vehicle-operational-status';
import { createEmptyStartDraft, type StartOperationDraft } from '../types';

const STEP_COUNT = 8;

function canAdvance(
  step: number,
  draft: StartOperationDraft,
  opts?: { vehicleAvailable?: boolean },
): boolean {
  switch (step) {
    case 1:
      return Boolean(draft.companyId);
    case 2:
      return Boolean(draft.vehicleId) && (opts?.vehicleAvailable ?? false);
    case 3:
      return Boolean(draft.driverId);
    case 4:
      return true;
    case 5:
      return draft.destination.trim().length > 0;
    case 6:
      return Boolean(draft.startOdometer);
    case 7:
      return Boolean(draft.startOdometer);
    case 8:
      return true;
    default:
      return false;
  }
}

function employeeItems(role: 'driver' | 'assistant'): EmployeeSelectorItem[] {
  return listEmployees(role).map((employee) => ({
    id: employee.employeeId,
    employeeId: employee.employeeId,
    displayName: employee.displayName,
    phone: employee.phone || null,
    role: employee.role,
    available: true,
    photoUrl: employee.photoDataUrl ?? null,
  }));
}

function StepShell({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          {icon}
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function CompanyStep({
  companies,
  value,
  onChange,
}: {
  companies: CompanySelectorItem[];
  value: string | null;
  onChange: (company: CompanySelectorItem) => void;
}) {
  const { t } = useAppTranslation();
  return (
    <StepShell
      icon={<Building2 className="size-5" aria-hidden />}
      title={t('toursOps.company.title')}
      description={t('toursOps.company.description')}
    >
      <div className="grid gap-3">
        {companies.map((company) => {
          const selected = value === company.id;
          return (
            <button
              key={company.id}
              type="button"
              onClick={() => onChange(company)}
              className={cn(
                'flex min-h-20 w-full items-center justify-between gap-4 rounded-2xl border px-4 py-4 text-left',
                'bg-background text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected ? 'border-primary ring-2 ring-primary/35' : 'border-border hover:bg-accent',
              )}
            >
              <span>
                <span className="block text-base font-semibold">{company.shortName ?? company.name}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{company.name}</span>
              </span>
              {selected ? <Check className="size-5 text-primary" aria-hidden /> : null}
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}

function DestinationStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useAppTranslation();
  return (
    <StepShell
      icon={<MapPin className="size-5" aria-hidden />}
      title={t('toursOps.destination.title')}
      description={t('toursOps.destination.description')}
    >
      <div className="space-y-2">
        <Label htmlFor="tours-v2-destination">{t('toursOps.destination.label')}</Label>
        <Input
          id="tours-v2-destination"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('toursOps.destination.placeholder')}
          autoComplete="off"
          className="min-h-14 text-base"
        />
      </div>
    </StepShell>
  );
}

function StartKmStep({ draft }: { draft: StartOperationDraft }) {
  const { t } = useAppTranslation();
  return (
    <StepShell
      icon={<Gauge className="size-5" aria-hidden />}
      title={t('toursOps.startKm.title')}
      description={t('toursOps.startKm.description')}
    >
      <div className="rounded-2xl border border-border bg-background p-5 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t('toursOps.startKm.confirmed')}
        </p>
        <p className="mt-3 font-display text-4xl font-bold tabular-nums text-foreground">
          {draft.startOdometer?.displayValue ?? '—'}
          <span className="ml-2 text-lg text-muted-foreground">{t('toursOps.odometer.unit')}</span>
        </p>
        <p className="mt-3 text-sm text-muted-foreground">{t('toursOps.startKm.changeHint')}</p>
      </div>
    </StepShell>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

/**
 * Phase 7.2A — Start Operation wizard (offline-capable).
 */
export function StartOperationWizardScreen() {
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  const { session: activeSession, loading: activeLoading } = useAnyActiveOperation();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<StartOperationDraft>(createEmptyStartDraft);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicleStatuses, setVehicleStatuses] = useState<Map<string, ToursVehicleStatus>>(
    () => new Map(),
  );
  const [vehicleStatusLoading, setVehicleStatusLoading] = useState(false);
  const companies = useMemo(() => listCompanies(), []);
  const drivers = useMemo(() => employeeItems('driver'), []);
  const assistants = useMemo(() => employeeItems('assistant'), []);

  // Refresh vehicle lock state whenever the operator opens the vehicle step so the
  // ordering, status badges, and one-active-per-vehicle rule reflect current data.
  useEffect(() => {
    if (step !== 2) return;
    let cancelled = false;
    setVehicleStatusLoading(true);
    void resolveToursVehicleStatuses(TOURS_FLEET_CATALOG.map((vehicle) => vehicle.id))
      .then((statuses) => {
        if (!cancelled) setVehicleStatuses(statuses);
      })
      .finally(() => {
        if (!cancelled) setVehicleStatusLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step]);

  const selectedVehicleAvailable =
    Boolean(draft.vehicleId) && vehicleStatuses.get(draft.vehicleId ?? '')?.status === 'AVAILABLE';

  const stepTitle = useMemo(() => {
    switch (step) {
      case 1:
        return t('toursOps.wizard.stepCompany');
      case 2:
        return t('toursOps.wizard.stepVehicle');
      case 3:
        return t('toursOps.wizard.stepDriver');
      case 4:
        return t('toursOps.wizard.stepAssistants');
      case 5:
        return t('toursOps.wizard.stepDestination');
      case 6:
        return t('toursOps.wizard.stepOdometerPhoto');
      case 7:
        return t('toursOps.wizard.stepStartKm');
      default:
        return t('toursOps.wizard.stepConfirm');
    }
  }, [step, t]);

  const nextEnabled = canAdvance(step, draft, { vehicleAvailable: selectedVehicleAvailable });

  const onStart = async () => {
    if (!draft.driverId) {
      setError(t('toursOps.wizard.missingDriver'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const deviceActive = await findAnyActiveOperation();
      if (deviceActive) {
        setError(t('toursOps.active.blockedDescription'));
        return;
      }
      const existing = await findActiveToursSession(draft.driverId);
      if (existing) {
        setError(t('toursOps.active.blockedDescription'));
        return;
      }
      const session = await commitStartOperation({
        employeeId: draft.driverId,
        operatorId: draft.driverId,
        draft,
      });
      navigate(buildSakiToursOperationStartedPath(session.id), { replace: true });
    } catch (err) {
      if (err instanceof VehicleActiveOperationError) {
        setError(t('toursOps.vehicleBlocked.title'));
        setStep(2);
      } else {
        reportOperationError('start-operation', err);
        setError(t('toursOps.wizard.startFailed'));
      }
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
      <div data-brand="tours" className="contents">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Badge variant="secondary" className="rounded-md">
            {t('toursOps.wizard.stepOf', { current: step, total: STEP_COUNT })}
          </Badge>
          <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            {t('toursOps.wizard.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{stepTitle}</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to={paths.entry}>{t('toursOps.wizard.cancel')}</Link>
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

      <Card variant="glass" padding="lg" className="space-y-5 pb-0">
        {step === 1 ? (
          <CompanyStep
            companies={companies}
            value={draft.companyId}
            onChange={(company) =>
              setDraft((prev) => ({
                ...prev,
                companyId: company.id,
                company,
              }))
            }
          />
        ) : null}

        {step === 2 ? (
          <StepShell
            icon={<Car className="size-5" aria-hidden />}
            title={t('toursOps.vehicle.title')}
            description={t('toursOps.vehicle.description')}
          >
            <ToursVehicleStep
              items={TOURS_FLEET_CATALOG}
              statuses={vehicleStatuses}
              loading={vehicleStatusLoading}
              value={draft.vehicleId}
              onChange={(vehicleId, vehicle) =>
                setDraft((prev) => ({
                  ...prev,
                  vehicleId,
                  vehicle,
                }))
              }
            />
          </StepShell>
        ) : null}

        {step === 3 ? (
          <StepShell
            icon={<UserRound className="size-5" aria-hidden />}
            title={t('toursOps.driver.title')}
            description={t('toursOps.driver.description')}
          >
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
              label={t('toursOps.driver.label')}
              description={t('toursOps.driver.selectorDescription')}
            />
          </StepShell>
        ) : null}

        {step === 4 ? (
          <StepShell
            icon={<UsersRound className="size-5" aria-hidden />}
            title={t('toursOps.assistants.title')}
            description={t('toursOps.assistants.description')}
          >
            <EmployeeSelector
              items={assistants}
              value={draft.assistantIds}
              multiple
              roleFilter="assistant"
              availabilityFilter="available"
              onChange={(assistantIds, employees) =>
                setDraft((prev) => ({
                  ...prev,
                  assistantIds: Array.isArray(assistantIds) ? assistantIds : [],
                  assistants: employees ?? [],
                }))
              }
              label={t('toursOps.assistants.label')}
              description={t('toursOps.assistants.selectorDescription')}
            />
          </StepShell>
        ) : null}

        {step === 5 ? (
          <DestinationStep
            value={draft.destination}
            onChange={(destination) => setDraft((prev) => ({ ...prev, destination }))}
          />
        ) : null}

        {step === 6 ? (
          <OdometerCapture
            kind="digital"
            labels={{
              title: t('toursOps.odometer.title'),
              description: t('toursOps.odometer.description'),
              capture: t('toursOps.odometer.capture'),
              processing: t('toursOps.odometer.processing'),
              photoSaved: t('toursOps.odometer.photoSaved'),
              detected: t('toursOps.odometer.detected'),
              confidence: t('toursOps.odometer.confidence'),
              lowConfidenceWarning: t('toursOps.odometer.lowConfidence'),
              failedWarning: t('toursOps.odometer.failed'),
              accept: t('toursOps.odometer.accept'),
              edit: t('toursOps.odometer.edit'),
              enterManually: t('toursOps.odometer.enterManually'),
              saveEdit: t('toursOps.odometer.saveEdit'),
              confirmReading: t('toursOps.odometer.confirmReading'),
              cancel: t('toursOps.odometer.cancelEdit'),
              retake: t('toursOps.odometer.retake'),
              unit: t('toursOps.odometer.unit'),
              saved: t('toursOps.odometer.saved'),
              editedSuffix: t('toursOps.odometer.editedSuffix'),
              photoAlt: t('toursOps.odometer.photoAlt'),
              previousReading: t('toursOps.odometer.previousReading'),
              warningBelowPrevious: t('toursOps.odometer.warningBelowPrevious'),
              warningLargeJump: t('toursOps.odometer.warningLargeJump'),
              warningTooShort: t('toursOps.odometer.warningTooShort'),
              acknowledgeWarning: t('toursOps.odometer.acknowledgeWarning'),
              backspace: t('toursOps.odometer.backspace'),
            }}
            onAccepted={(reading) => setDraft((prev) => ({ ...prev, startOdometer: reading }))}
          />
        ) : null}

        {step === 7 ? (
          <StartKmStep draft={draft} />
        ) : null}

        {step === 8 ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <ClipboardCheck className="size-5" aria-hidden />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  {t('toursOps.confirm.title')}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t('toursOps.confirm.description')}</p>
              </div>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <ReviewItem label={t('toursOps.confirm.company')} value={draft.company?.shortName ?? draft.company?.name ?? '—'} />
              <ReviewItem
                label={t('toursOps.confirm.vehicle')}
                value={`${draft.vehicle?.name ?? '—'}${draft.vehicle?.registrationNumber ? ` · ${draft.vehicle.registrationNumber}` : ''}`}
              />
              <ReviewItem label={t('toursOps.confirm.driver')} value={draft.driver?.displayName ?? '—'} />
              <ReviewItem
                label={t('toursOps.confirm.assistants')}
                value={
                  draft.assistants.length
                    ? draft.assistants.map((assistant) => assistant.displayName).join(', ')
                    : t('toursOps.confirm.noAssistants')
                }
              />
              <ReviewItem label={t('toursOps.confirm.destination')} value={draft.destination.trim() || '—'} />
              <ReviewItem
                label={t('toursOps.confirm.startOdometer')}
                value={
                  draft.startOdometer
                    ? `${draft.startOdometer.displayValue} ${t('toursOps.odometer.unit')}`
                    : '—'
                }
              />
            </dl>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
              {t('toursOps.confirm.autoTimeNote')}
            </p>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="sticky bottom-0 -mx-6 flex items-center justify-between gap-3 border-t border-border/60 bg-card/95 px-6 py-4 backdrop-blur">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="min-w-[7.5rem]"
            disabled={step === 1 || submitting}
            onClick={() => {
              setError(null);
              setStep((s) => Math.max(1, s - 1));
            }}
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t('toursOps.wizard.back')}
          </Button>

          {step < STEP_COUNT ? (
            <Button
              type="button"
              size="lg"
              className="min-w-[7.5rem]"
              disabled={!nextEnabled}
              onClick={() => {
                setError(null);
                if (step === 1 && draft.companyId === COMPANY_ID_HHCO) {
                  navigate(paths.hhcoStart);
                  return;
                }
                setStep((s) => Math.min(STEP_COUNT, s + 1));
              }}
            >
              {t('toursOps.wizard.next')}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              className="min-w-[7.5rem]"
              loading={submitting}
              disabled={!canAdvance(7, draft) || submitting}
              onClick={() => void onStart()}
            >
              {t('toursOps.wizard.startOperation')}
            </Button>
          )}
        </div>
      </Card>
      </div>
    </FadeIn>
  );
}
