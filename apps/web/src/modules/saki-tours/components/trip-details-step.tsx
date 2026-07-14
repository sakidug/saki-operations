import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Input, Label } from '@saki-operations/ui';

import { isMultiDay } from '../types';

type TripDetailsStepProps = {
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

export function TripDetailsStep({
  startLocation,
  destination,
  endingLocation,
  numberOfDays,
  onChange,
}: TripDetailsStepProps) {
  const { t } = useAppTranslation();
  const multiDay = isMultiDay(numberOfDays);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{t('toursOps.trip.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('toursOps.trip.description')}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tours-start-location">{t('toursOps.trip.startLocation')}</Label>
        <Input
          id="tours-start-location"
          autoComplete="off"
          value={startLocation}
          onChange={(e) => onChange({ startLocation: e.target.value })}
          placeholder={t('toursOps.trip.startLocationPlaceholder')}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tours-destination">{t('toursOps.trip.destination')}</Label>
        <Input
          id="tours-destination"
          autoComplete="off"
          value={destination}
          onChange={(e) => onChange({ destination: e.target.value })}
          placeholder={t('toursOps.trip.destinationPlaceholder')}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tours-ending-location">{t('toursOps.trip.endingLocation')}</Label>
        <Input
          id="tours-ending-location"
          autoComplete="off"
          value={endingLocation}
          onChange={(e) => onChange({ endingLocation: e.target.value })}
          placeholder={t('toursOps.trip.endingLocationPlaceholder')}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tours-number-of-days">{t('toursOps.trip.numberOfDays')}</Label>
        <Input
          id="tours-number-of-days"
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
            {t('toursOps.trip.multiDayBadge')}
          </Badge>
        ) : (
          <p className="mt-1.5 text-xs text-muted-foreground">{t('toursOps.trip.singleDayHint')}</p>
        )}
      </div>
    </div>
  );
}
