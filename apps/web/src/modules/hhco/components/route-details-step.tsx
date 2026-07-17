import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Input, Label } from '@saki-operations/ui';

import { isMultiDay } from '../types';

type RouteDetailsStepProps = {
  startLocation: string;
  destination: string;
  endingLocation: string;
  numberOfDays: number;
  onChange: (patch: {
    startLocation?: string;
    destination?: string;
    endingLocation?: string;
    numberOfDays?: number;
  }) => void;
};

export function RouteDetailsStep({
  startLocation,
  destination,
  endingLocation,
  numberOfDays,
  onChange,
}: RouteDetailsStepProps) {
  const { t } = useAppTranslation();
  const multiDay = isMultiDay(numberOfDays);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{t('hhcoOps.trip.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('hhcoOps.trip.description')}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="hhco-start-location">{t('hhcoOps.trip.startLocation')}</Label>
        <Input
          id="hhco-start-location"
          autoComplete="off"
          value={startLocation}
          onChange={(e) => onChange({ startLocation: e.target.value })}
          placeholder={t('hhcoOps.trip.startLocationPlaceholder')}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="hhco-destination">{t('hhcoOps.trip.destination')}</Label>
        <Input
          id="hhco-destination"
          autoComplete="off"
          value={destination}
          onChange={(e) => onChange({ destination: e.target.value })}
          placeholder={t('hhcoOps.trip.destinationPlaceholder')}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="hhco-ending-location">{t('hhcoOps.trip.endingLocation')}</Label>
        <Input
          id="hhco-ending-location"
          autoComplete="off"
          value={endingLocation}
          onChange={(e) => onChange({ endingLocation: e.target.value })}
          placeholder={t('hhcoOps.trip.endingLocationPlaceholder')}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="hhco-number-of-days">{t('hhcoOps.trip.numberOfDays')}</Label>
        <Input
          id="hhco-number-of-days"
          type="number"
          inputMode="numeric"
          min={1}
          max={60}
          value={numberOfDays}
          onChange={(e) => {
            const next = Number.parseInt(e.target.value, 10);
            onChange({ numberOfDays: Number.isFinite(next) && next >= 1 ? next : 1 });
          }}
        />
        {multiDay ? (
          <Badge variant="warning" className="mt-2 rounded-md">
            {t('hhcoOps.trip.multiDayBadge')}
          </Badge>
        ) : (
          <p className="mt-1.5 text-xs text-muted-foreground">{t('hhcoOps.trip.singleDayHint')}</p>
        )}
      </div>
    </div>
  );
}
