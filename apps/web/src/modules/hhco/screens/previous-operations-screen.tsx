import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { OperationsSession } from '@saki-operations/operations-session';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Button, EmptyState, LoadingSpinner } from '@saki-operations/ui';
import { History as HistoryIcon } from 'lucide-react';

import { useSession } from '@/app/bootstrap/session-provider';
import { FadeIn } from '@/app/screens/loading/fade-in';
import { paths } from '@/app/router/paths';

import { HistoryFiltersBar } from '../components/history-filters-bar';
import { HistoryOperationCard } from '../components/history-operation-card';
import { HistoryStatsCard } from '../components/history-stats-card';
import {
  availableFilterYears,
  listPreviousHhcoDeliveries,
  matchesHistoryFilters,
  type HistoryFilters,
} from '../lib/history';

const DEFAULT_FILTERS: HistoryFilters = {
  query: '',
  month: 'all',
  year: 'all',
  sync: 'all',
};

function filtersAreActive(filters: HistoryFilters): boolean {
  return (
    filters.query.trim().length > 0 ||
    filters.month !== 'all' ||
    filters.year !== 'all' ||
    filters.sync !== 'all'
  );
}

/**
 * Phase 7.2D — Previous Operations list (read-only, offline IndexedDB).
 */
export function PreviousOperationsScreen() {
  const { t } = useAppTranslation();
  const { user } = useSession();
  const [sessions, setSessions] = useState<OperationsSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<HistoryFilters>(DEFAULT_FILTERS);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.employeeId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const rows = await listPreviousHhcoDeliveries(user.employeeId);
        if (!cancelled) setSessions(rows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.employeeId]);

  const filtered = useMemo(
    () =>
      sessions.filter((session) =>
        matchesHistoryFilters(session, filters, (key) => t(key)),
      ),
    [filters, sessions, t],
  );

  const years = useMemo(() => availableFilterYears(sessions), [sessions]);
  const hasData = sessions.length > 0;
  const filtersActive = filtersAreActive(filters);

  return (
    <FadeIn className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div data-brand="hhco" className="contents">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <Badge variant="secondary" className="rounded-md">
              {t('hhcoOps.badge')}
            </Badge>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {t('hhcoOps.history.title')}
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              {t('hhcoOps.history.description')}
            </p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link to={paths.hhco}>{t('hhcoOps.history.backHome')}</Link>
          </Button>
        </header>

        {loading ? (
          <div className="flex min-h-[10rem] items-center justify-center">
            <LoadingSpinner label={t('shell.loading.module')} />
          </div>
        ) : !hasData ? (
          <EmptyState
            icon={<HistoryIcon aria-hidden />}
            title={t('hhcoOps.history.emptyTitle')}
            description={t('hhcoOps.history.emptyDescription')}
            className="glass min-h-[12rem] border-solid"
          />
        ) : (
          <>
            <HistoryStatsCard sessions={sessions} />
            <HistoryFiltersBar filters={filters} years={years} onChange={setFilters} />

            {filtered.length === 0 ? (
              <EmptyState
                icon={<HistoryIcon aria-hidden />}
                title={t('hhcoOps.history.filterEmptyTitle')}
                description={t('hhcoOps.history.filterEmptyDescription')}
                className="glass min-h-[12rem] border-solid"
                actionLabel={filtersActive ? t('hhcoOps.history.clearFilters') : undefined}
                onAction={filtersActive ? () => setFilters(DEFAULT_FILTERS) : undefined}
              />
            ) : (
              <ul className="flex flex-col gap-3" aria-label={t('hhcoOps.history.listRegion')}>
                {filtered.map((session, index) => (
                  <li key={session.id}>
                    <HistoryOperationCard session={session} index={index} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </FadeIn>
  );
}
