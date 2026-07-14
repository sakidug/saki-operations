import type { AcceptedOdometerReading } from '@saki-operations/ocr';
import type { VehicleSelectorItem } from '@saki-operations/types';

export type ToursHireType = 'wedding_hire' | 'airport_transfer' | 'tour';

/** Photo + device-clock stamp for start or end work time. */
export type TimeEvidenceCapture = {
  capturedAt: string;
  photoBlob: Blob;
  previewUrl: string;
  fileName: string;
  mimeType: string;
};

export type StartOperationDraft = {
  vehicleId: string | null;
  vehicle: VehicleSelectorItem | null;
  hireType: ToursHireType | null;
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
};

export function createEmptyStartDraft(): StartOperationDraft {
  return {
    vehicleId: null,
    vehicle: null,
    hireType: null,
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
  };
}

export function isMultiDay(numberOfDays: number): boolean {
  return numberOfDays > 1;
}

export function hireTypeLabelKey(hireType: unknown): string {
  if (hireType === 'wedding_hire') return 'toursOps.hireType.wedding';
  if (hireType === 'airport_transfer') return 'toursOps.hireType.airport';
  if (hireType === 'tour') return 'toursOps.hireType.tour';
  return 'toursOps.success.unknownHire';
}
