import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppTranslation } from '@saki-operations/i18n';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from '@saki-operations/ui';

import { useSession } from '@/app/bootstrap/session-provider';
import { FadeIn } from '@/app/screens/loading/fade-in';
import { buildLeaveDetailPath, paths } from '@/app/router/paths';
import { applyLeave, countLeaveDays, type LeaveType } from '../lib/leave-store';

const LEAVE_TYPES: LeaveType[] = ['sick', 'casual', 'annual'];

export function ApplyLeaveScreen() {
  const { t } = useAppTranslation();
  const { user } = useSession();
  const navigate = useNavigate();

  const [type, setType] = useState<LeaveType>('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const days = startDate && endDate ? countLeaveDays(startDate, endDate) : 0;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user?.employeeId) return;

    if (!startDate || !endDate) {
      setErrorKey('leaveOps.apply.errors.datesRequired');
      return;
    }
    if (days < 1) {
      setErrorKey('leaveOps.apply.errors.invalidRange');
      return;
    }
    if (!reason.trim()) {
      setErrorKey('leaveOps.apply.errors.reasonRequired');
      return;
    }

    setSubmitting(true);
    setErrorKey(null);
    try {
      const request = applyLeave({
        employeeId: user.employeeId,
        type,
        startDate,
        endDate,
        reason,
      });
      navigate(buildLeaveDetailPath(request.id), { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FadeIn className="mx-auto flex w-full max-w-lg flex-col gap-5">
      <header className="space-y-2">
        <Badge variant="secondary" className="rounded-md">
          {t('leaveOps.badge')}
        </Badge>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t('leaveOps.apply.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('leaveOps.apply.description')}</p>
      </header>

      <form onSubmit={onSubmit}>
        <Card variant="glass">
          <CardHeader>
            <CardTitle>{t('leaveOps.apply.formTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{t('leaveOps.apply.typeLabel')}</legend>
              <div className="grid grid-cols-3 gap-2">
                {LEAVE_TYPES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setType(option)}
                    className={
                      type === option
                        ? 'rounded-xl border border-primary bg-primary/15 px-2 py-2.5 text-sm font-semibold text-primary'
                        : 'rounded-xl border border-glass-border bg-muted/20 px-2 py-2.5 text-sm text-muted-foreground'
                    }
                  >
                    {t(`leaveOps.types.${option}`)}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="leave-start">{t('leaveOps.apply.startDate')}</Label>
                <Input
                  id="leave-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="leave-end">{t('leaveOps.apply.endDate')}</Label>
                <Input
                  id="leave-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {days > 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('leaveOps.apply.dayCount', { count: days })}
              </p>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="leave-reason">{t('leaveOps.apply.reason')}</Label>
              <Textarea
                id="leave-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder={t('leaveOps.apply.reasonPlaceholder')}
                required
              />
            </div>

            {errorKey ? (
              <p className="text-sm text-destructive" role="alert">
                {t(errorKey)}
              </p>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button asChild variant="outline" type="button">
                <Link to={paths.leave}>{t('leaveOps.apply.cancel')}</Link>
              </Button>
              <Button type="submit" loading={submitting}>
                {t('leaveOps.apply.submit')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </FadeIn>
  );
}
