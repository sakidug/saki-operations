import type { AcceptedOdometerReading } from '@saki-operations/ocr';
import type { EmployeeSelectorItem, VehicleSelectorItem } from '@saki-operations/types';

export type HhcoDealerId = 'dealer_colombo' | 'dealer_kandy' | 'dealer_galle';

/** Photo + device-clock stamp for start or end work time. */
export type TimeEvidenceCapture = {
  capturedAt: string;
  photoBlob: Blob;
  previewUrl: string;
  fileName: string;
  mimeType: string;
};

export type StartOperationDraft = {
  driverId: string | null;
  driver: EmployeeSelectorItem | null;
  vehicleId: string | null;
  vehicle: VehicleSelectorItem | null;
  dealerId: HhcoDealerId | null;
  startLocation: string;
  destination: string;
  endingLocation: string;
  numberOfDays: number;
  startOdometer: AcceptedOdometerReading | null;
  startTime: TimeEvidenceCapture | null;
};

export type EndOperationDraft = {
  endOdometer: AcceptedOdometerReading | null;
  endTime: TimeEvidenceCapture | null;
  deliveryPhotos: TimeEvidenceCapture[];
};

export function createEmptyStartDraft(): StartOperationDraft {
  return {
    driverId: null,
    driver: null,
    vehicleId: null,
    vehicle: null,
    dealerId: null,
    startLocation: '',
    destination: '',
    endingLocation: '',
    numberOfDays: 1,
    startOdometer: null,
    startTime: null,
  };
}

export function createEmptyEndDraft(): EndOperationDraft {
  return {
    endOdometer: null,
    endTime: null,
    deliveryPhotos: [],
  };
}

export function isMultiDay(numberOfDays: number): boolean {
  return numberOfDays > 1;
}

export function dealerLabelKey(dealerId: unknown): string {
  if (dealerId === 'dealer_colombo') return 'hhcoOps.dealer.colombo';
  if (dealerId === 'dealer_kandy') return 'hhcoOps.dealer.kandy';
  if (dealerId === 'dealer_galle') return 'hhcoOps.dealer.galle';
  return 'hhcoOps.success.unknownDealer';
}
