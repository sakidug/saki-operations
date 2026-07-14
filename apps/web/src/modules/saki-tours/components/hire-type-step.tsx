import { useAppTranslation } from '@saki-operations/i18n';
import { cn } from '@saki-operations/ui';
import { Heart, MapPinned, Plane } from 'lucide-react';

import type { ToursHireType } from '../types';

const HIRE_OPTIONS: {
  id: ToursHireType;
  icon: typeof Heart;
  labelKey: string;
  hintKey: string;
}[] = [
  {
    id: 'wedding_hire',
    icon: Heart,
    labelKey: 'toursOps.hireType.wedding',
    hintKey: 'toursOps.hireType.weddingHint',
  },
  {
    id: 'airport_transfer',
    icon: Plane,
    labelKey: 'toursOps.hireType.airport',
    hintKey: 'toursOps.hireType.airportHint',
  },
  {
    id: 'tour',
    icon: MapPinned,
    labelKey: 'toursOps.hireType.tour',
    hintKey: 'toursOps.hireType.tourHint',
  },
];

type HireTypeStepProps = {
  value: ToursHireType | null;
  onChange: (next: ToursHireType) => void;
};

export function HireTypeStep({ value, onChange }: HireTypeStepProps) {
  const { t } = useAppTranslation();

  return (
    <fieldset className="space-y-3">
      <legend className="text-base font-semibold text-foreground">{t('toursOps.hireType.title')}</legend>
      <p className="text-sm text-muted-foreground">{t('toursOps.hireType.description')}</p>
      <div className="grid gap-3" role="radiogroup" aria-label={t('toursOps.hireType.title')}>
        {HIRE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.id)}
              className={cn(
                'glass flex items-start gap-3 rounded-2xl border p-4 text-left transition duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                selected
                  ? 'border-primary bg-primary/10'
                  : 'border-glass-border hover:brightness-110',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl',
                  selected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold text-foreground">{t(option.labelKey)}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{t(option.hintKey)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
