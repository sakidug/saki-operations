import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, cn } from '@saki-operations/ui';
import { CalendarDays, ChevronRight, Plus } from 'lucide-react';

import { useSession } from '@/app/bootstrap/session-provider';
import { FadeIn } from '@/app/screens/loading/fade-in';
import { buildLeaveDetailPath, paths } from '@/app/router/paths';
import {
  canManageLeave,
  getLeaveBalances,
  getMonthCalendarSummary,
  listLeaveRequests,
  type LeaveRequest,
  type LeaveStatus,
  type LeaveType,
} from '../lib/leave-store';

function statusVariant(status: LeaveStatus): 'default' | 'secondary' | 'danger' {
  if (status === 'approved') return 'default';
  if (status === 'rejected') return 'danger';
  return 'secondary';
}

export function LeaveHomeScreen() {
  const { t, i18n } = useAppTranslation();
  const { user } = useSession();
  const employeeId = user?.employeeId ?? '';
  const isManager = user ? canManageLeave(user.permissions) : false;

  const balances = useMemo(
    () => (employeeId ? getLeaveBalances(employeeId) : { sick: 0, casual: 0, annual: 0 }),
    [employeeId],
  );

  const history = useMemo(
    () => (employeeId ? listLeaveRequests(employeeId) : []),
    [employeeId],
  );

  const pendingQueue = useMemo(() => {
    if (!isManager) return [];
    return listLeaveRequests().filter((r) => r.status === 'pending');
  }, [isManager]);

  const monthLeaves = useMemo(
    () => (employeeId ? getMonthCalendarSummary(employeeId) : []),
    [employeeId],
  );

  const locale = i18n.language === 'si' ? 'si-LK' : 'en-LK';
  const formatRange = (r: LeaveRequest) => {
    const start = new Date(`${r.startDate}T00:00:00`).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
    });
    const end = new Date(`${r.endDate}T00:00:00`).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
    });
    return start === end ? start : `${start} – ${end}`;
  };

  const balanceCards: { type: LeaveType; value: number }[] = [
    { type: 'sick', value: balances.sick },
    { type: 'casual', value: balances.casual },
    { type: 'annual', value: balances.annual },
  ];

  return (
    <FadeIn className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <header className="space-y-2">
        <Badge variant="secondary" className="rounded-md">
          {t('leaveOps.badge')}
        </Badge>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('leaveOps.home.title')}
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
          {t('leaveOps.home.description')}
        </p>
      </header>

      <section aria-label={t('leaveOps.home.balancesRegion')} className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {balanceCards.map((item) => (
          <Card key={item.type} variant="glass" padding="sm" className="text-center">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
              {t(`leaveOps.types.${item.type}`)}
            </p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums sm:text-3xl">
              {item.value}
            </p>
            <p className="text-[0.65rem] text-muted-foreground sm:text-xs">
              {t('leaveOps.home.daysRemaining')}
            </p>
          </Card>
        ))}
      </section>

      <Button asChild size="lg" className="w-full sm:w-auto sm:self-start">
        <Link to={paths.leaveApply}>
          <Plus className="size-4" aria-hidden />
          {t('leaveOps.home.applyCta')}
        </Link>
      </Button>

      {isManager && pendingQueue.length > 0 ? (
        <section aria-label={t('leaveOps.home.pendingRegion')} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('leaveOps.home.pendingTitle')}
          </h2>
          <ul className="flex flex-col gap-2">
            {pendingQueue.map((r) => (
              <li key={r.id}>
                <Link
                  to={buildLeaveDetailPath(r.id)}
                  className={cn(
                    'glass flex items-center gap-3 rounded-2xl border border-glass-border p-3.5',
                    'transition hover:brightness-110',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">
                      {r.employeeId} · {t(`leaveOps.types.${r.type}`)} · {formatRange(r)}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                      {r.reason || t('leaveOps.home.noReason')}
                    </span>
                  </span>
                  <Badge variant="secondary">{t('leaveOps.status.pending')}</Badge>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" aria-hidden />
            {t('leaveOps.home.calendarTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthLeaves.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('leaveOps.home.calendarEmpty')}</p>
          ) : (
            <ul className="space-y-2">
              {monthLeaves.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-glass-border bg-muted/20 px-3 py-2 text-sm"
                >
                  <span>
                    {t(`leaveOps.types.${r.type}`)} · {formatRange(r)}
                  </span>
                  <Badge variant="default">{t('leaveOps.status.approved')}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <section aria-label={t('leaveOps.home.historyRegion')} className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('leaveOps.home.historyTitle')}
        </h2>
        {history.length === 0 ? (
          <Card variant="glass" padding="md">
            <p className="text-sm text-muted-foreground">{t('leaveOps.home.historyEmpty')}</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {history.map((r) => (
              <li key={r.id}>
                <Link
                  to={buildLeaveDetailPath(r.id)}
                  className={cn(
                    'glass flex items-center gap-3 rounded-2xl border border-glass-border p-3.5',
                    'transition hover:brightness-110',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">
                      {t(`leaveOps.types.${r.type}`)} · {formatRange(r)}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                      {r.reason || t('leaveOps.home.noReason')}
                    </span>
                  </span>
                  <Badge variant={statusVariant(r.status)}>{t(`leaveOps.status.${r.status}`)}</Badge>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </FadeIn>
  );
}
