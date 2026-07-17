import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Button, Card, cn } from '@saki-operations/ui';
import { ChevronRight, User } from 'lucide-react';

import { useSession } from '@/app/bootstrap/session-provider';
import { FadeIn } from '@/app/screens/loading/fade-in';
import { buildEmployeeDetailPath, paths } from '@/app/router/paths';
import {
  canManageEmployees,
  canViewEmployeeProfile,
  getEmployeeBySessionId,
  listEmployees,
  type EmployeeRole,
} from '../lib/employee-store';

type RoleFilter = 'all' | 'driver' | 'office';

export function EmployeeListScreen() {
  const { t } = useAppTranslation();
  const { user } = useSession();
  const [filter, setFilter] = useState<RoleFilter>('all');

  const isManager = user ? canManageEmployees(user.permissions) : false;

  const employees = useMemo(() => {
    if (!user) return [];
    if (!isManager) {
      const self = getEmployeeBySessionId(user.employeeId);
      return self ? [self] : [];
    }
    return listEmployees(filter === 'all' ? 'all' : filter);
  }, [user, isManager, filter]);

  const filters: RoleFilter[] = ['all', 'driver', 'office'];

  return (
    <FadeIn className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <header className="space-y-2">
        <Badge variant="secondary" className="rounded-md">
          {t('employeeOps.badge')}
        </Badge>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('employeeOps.list.title')}
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
          {isManager
            ? t('employeeOps.list.description')
            : t('employeeOps.list.descriptionDriver')}
        </p>
      </header>

      {isManager ? (
        <div
          role="group"
          aria-label={t('employeeOps.list.filterRegion')}
          className="flex flex-wrap gap-2"
        >
          {filters.map((key) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={filter === key ? 'default' : 'outline'}
              onClick={() => setFilter(key)}
            >
              {t(`employeeOps.list.filters.${key}`)}
            </Button>
          ))}
        </div>
      ) : null}

      <ul className="flex flex-col gap-2.5">
        {employees.map((employee) => {
          const canOpen =
            user &&
            canViewEmployeeProfile(user.role, user.employeeId, employee.employeeId);
          const roleKey = employee.role as EmployeeRole;
          const content = (
            <>
              <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/15 text-primary">
                {employee.photoDataUrl ? (
                  <img
                    src={employee.photoDataUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <User className="size-5" aria-hidden />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{employee.displayName}</span>
                  <Badge variant="secondary">{t(`employeeOps.roles.${roleKey}`)}</Badge>
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {employee.employeeId} · {employee.phone}
                </span>
              </span>
              {canOpen ? (
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              ) : null}
            </>
          );

          return (
            <li key={employee.id}>
              {canOpen ? (
                <Link
                  to={buildEmployeeDetailPath(employee.employeeId)}
                  className={cn(
                    'glass flex items-center gap-3 rounded-2xl border border-glass-border p-4',
                    'transition hover:brightness-110',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  {content}
                </Link>
              ) : (
                <div className="glass flex items-center gap-3 rounded-2xl border border-glass-border p-4 opacity-80">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {employees.length === 0 ? (
        <Card variant="glass" padding="md">
          <p className="text-sm text-muted-foreground">{t('employeeOps.list.empty')}</p>
          <Button asChild className="mt-3" variant="outline">
            <Link to={paths.home}>{t('employeeOps.list.backHome')}</Link>
          </Button>
        </Card>
      ) : null}
    </FadeIn>
  );
}
