import { useAppTranslation } from '@saki-operations/i18n';
import {
  Label,
  SearchBar,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@saki-operations/ui';

import type { HistoryFilters, HistorySyncFilter } from '../lib/history';

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

type HistoryFiltersBarProps = {
  filters: HistoryFilters;
  years: number[];
  onChange: (next: HistoryFilters) => void;
};

export function HistoryFiltersBar({ filters, years, onChange }: HistoryFiltersBarProps) {
  const { t } = useAppTranslation();

  return (
    <div className="space-y-3">
      <SearchBar
        value={filters.query}
        onChange={(query) => onChange({ ...filters, query })}
        placeholder={t('toursOps.history.searchPlaceholder')}
        clearLabel={t('toursOps.history.searchClear')}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="history-filter-month">{t('toursOps.history.filters.month')}</Label>
          <Select
            value={filters.month === 'all' ? 'all' : String(filters.month)}
            onValueChange={(value) =>
              onChange({
                ...filters,
                month: value === 'all' ? 'all' : Number.parseInt(value, 10),
              })
            }
          >
            <SelectTrigger id="history-filter-month" className="h-11">
              <SelectValue placeholder={t('toursOps.history.filters.month')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('toursOps.history.filters.allMonths')}</SelectItem>
              {MONTHS.map((month) => (
                <SelectItem key={month} value={String(month)}>
                  {t(`toursOps.history.filters.months.${month}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="history-filter-year">{t('toursOps.history.filters.year')}</Label>
          <Select
            value={filters.year === 'all' ? 'all' : String(filters.year)}
            onValueChange={(value) =>
              onChange({
                ...filters,
                year: value === 'all' ? 'all' : Number.parseInt(value, 10),
              })
            }
          >
            <SelectTrigger id="history-filter-year" className="h-11">
              <SelectValue placeholder={t('toursOps.history.filters.year')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('toursOps.history.filters.allYears')}</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="history-filter-sync">{t('toursOps.history.filters.sync')}</Label>
          <Select
            value={filters.sync}
            onValueChange={(value) =>
              onChange({ ...filters, sync: value as HistorySyncFilter })
            }
          >
            <SelectTrigger id="history-filter-sync" className="h-11">
              <SelectValue placeholder={t('toursOps.history.filters.sync')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('toursOps.history.filters.allSync')}</SelectItem>
              <SelectItem value="waiting">{t('toursOps.history.sync.waiting')}</SelectItem>
              <SelectItem value="uploading">{t('toursOps.history.sync.uploading')}</SelectItem>
              <SelectItem value="synced">{t('toursOps.history.sync.synced')}</SelectItem>
              <SelectItem value="failed">{t('toursOps.history.sync.failed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
