import { useState } from 'react';
import { useAppTranslation } from '@saki-operations/i18n';
import {
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  cn,
} from '@saki-operations/ui';

import type { EvidenceGalleryItem } from '../lib/history';
import { formatOperationDateTime } from '../lib/session-display';

type EvidenceGalleryProps = {
  items: EvidenceGalleryItem[];
  locale: string;
  className?: string;
};

function evidenceLabel(
  t: (key: string, options?: Record<string, unknown>) => string,
  item: EvidenceGalleryItem,
) {
  return item.day != null ? t(item.labelKey, { day: item.day }) : t(item.labelKey);
}

export function EvidenceGallery({ items, locale, className }: EvidenceGalleryProps) {
  const { t } = useAppTranslation();
  const [active, setActive] = useState<EvidenceGalleryItem | null>(null);

  if (items.length === 0) return null;

  return (
    <>
      <Card variant="glass" padding="lg" className={cn('space-y-4', className)}>
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {t('hhcoOps.history.photos.title')}
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => {
            const label = evidenceLabel(t, item);
            const isOpen = active?.id === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={cn(
                    'group w-full overflow-hidden rounded-xl border border-glass-border text-left',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                  aria-haspopup="dialog"
                  aria-expanded={isOpen}
                  aria-label={label}
                  onClick={() => setActive(item)}
                >
                  <img
                    src={item.photoDataUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/3] w-full object-cover transition duration-200 group-hover:brightness-110"
                  />
                  <span className="block truncate px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    {label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">{t('hhcoOps.history.photos.readOnly')}</p>
      </Card>

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent
          closeLabel={t('hhcoOps.history.photos.close')}
          className="max-w-3xl border-glass-border bg-background/95 p-0 sm:rounded-2xl"
        >
          {active ? (
            <>
              <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
                <DialogTitle>{evidenceLabel(t, active)}</DialogTitle>
                <DialogDescription>
                  {formatOperationDateTime(active.timestamp, locale)}
                </DialogDescription>
              </DialogHeader>
              <div className="px-4 pb-4 sm:px-6 sm:pb-6">
                <img
                  src={active.photoDataUrl}
                  alt={evidenceLabel(t, active)}
                  loading="eager"
                  decoding="async"
                  className="max-h-[70vh] w-full rounded-xl object-contain"
                />
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
