export type FleetAvailabilityStatus = 'HOLD' | 'BOOKED';

/** Vehicle availability reservation — no customer / hire details. */
export type FleetAvailability = {
  id: string;
  vehicleId: string;
  /** Inclusive ISO date `YYYY-MM-DD` */
  startDate: string;
  /** Inclusive ISO date `YYYY-MM-DD` */
  endDate: string;
  status: FleetAvailabilityStatus;
};

export type FleetAvailabilityInput = {
  vehicleId: string;
  startDate: string;
  endDate: string;
  status: FleetAvailabilityStatus;
};
