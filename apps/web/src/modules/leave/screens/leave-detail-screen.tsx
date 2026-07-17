import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@saki-operations/ui';

import { useSession } from '@/app/bootstrap/session-provider';
import { FadeIn } from '@/app/screens/loading/fade-in';
import { paths } from '@/app/router/paths';
import {
  canManageLeave,
  countLeaveDays,
  decideLeaveRequest,
  getLeaveRequest,
  type LeaveStatus,
} from '../lib/leave-store';

function statusVariant(status: LeaveStatus): 'default' | 'secondary' | 'danger' {
  if (status === 'approved') return 'default';
  if (status === 'rejected') return 'danger';
  return 'secondary';
}

export function LeaveDetailScreen() {
  const { t, i18n } = useAppTranslation();
  const { id = '' } = useParams<{ id: string }>();
  const { user } = useSession();
  const [version, setVersion] = useState(0);

  const request = useMemo(() => {
    void version;
    return getLeaveRequest(id);
  }, [id, version]);

  const isManager = user ? canManageLeave(user.permissions) : false;
  const isOwner = Boolean(user && request && user.employeeId === request.employeeId);
  const canView = isManager || isOwner;
  const canDecide = isManager && request?.status === 'pending';

  const locale = i18n.language === 'si' ? 'si-LK' : 'en-LK';

  function decide(status: 'approved' | 'rejected') {
    if (!user || !request) return;
    decideLeaveRequest({
      id: request.id,
      status,
      decidedBy: user.employeeId,
    });
    setVersion((n) => n + 1);
  }

  if (!request || !canView) {
    return (
      <FadeIn className="mx-auto max-w-lg space-y-4">
        <Card variant="glass" padding="lg">
          <p className="text-sm text-muted-foreground">{t('leaveOps.detail.missing')}</p>
          <Button asChild className="mt-4" variant="outline">
            <Link to={paths.leave}>{t('leaveOps.detail.back')}</Link>
          </Button>
        </Card>
      </FadeIn>
    );
  }

  const days = countLeaveDays(request.startDate, request.endDate);
  const formatDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <FadeIn className="mx-auto flex w-full max-w-lg flex-col gap-5">
      <header className="space-y-2">
        <Badge variant="secondary" className="rounded-md">
          {t('leaveOps.badge')}
        </Badge>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {t('leaveOps.detail.title')}
          </h1>
          <Badge variant={statusVariant(request.status)}>
            {t(`leaveOps.status.${request.status}`)}
          </Badge>
        </div>
      </header>

      <Card variant="glass">
        <CardHeader>
          <CardTitle>{t(`leaveOps.types.${request.type}`)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">{t('leaveOps.detail.employee')}</span>
            <span className="font-medium">{request.employeeId}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">{t('leaveOps.detail.start')}</span>
            <span className="font-medium">{formatDate(request.startDate)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">{t('leaveOps.detail.end')}</span>
            <span className="font-medium">{formatDate(request.endDate)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">{t('leaveOps.detail.days')}</span>
            <span className="font-medium tabular-nums">{days}</span>
          </div>
          <div>
            <p className="text-muted-foreground">{t('leaveOps.detail.reason')}</p>
            <p className="mt-1 whitespace-pre-wrap">{request.reason}</p>
          </div>
          {request.decidedAt ? (
            <div className="border-t border-glass-border pt-3 text-muted-foreground">
              {t('leaveOps.detail.decided', {
                by: request.decidedBy ?? '—',
                at: new Date(request.decidedAt).toLocaleString(locale),
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {canDecide ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" className="flex-1" onClick={() => decide('approved')}>
            {t('leaveOps.detail.approve')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            onClick={() => decide('rejected')}
          >
            {t('leaveOps.detail.reject')}
          </Button>
        </div>
      ) : null}

      <Button asChild variant="outline">
        <Link to={paths.leave}>{t('leaveOps.detail.back')}</Link>
      </Button>
    </FadeIn>
  );
}
