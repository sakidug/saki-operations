import type { AcceptedOdometerReading } from '@saki-operations/ocr';
import type { CompanySelectorItem, EmployeeSelectorItem, VehicleSelectorItem } from '@saki-operations/types';

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
  companyId: string | null;
  company: CompanySelectorItem | null;
  vehicleId: string | null;
  vehicle: VehicleSelectorItem | null;
  driverId: string | null;
  driver: EmployeeSelectorItem | null;
  assistantIds: string[];
  assistants: EmployeeSelectorItem[];
  destination: string;
  startOdometer: AcceptedOdometerReading | null;
  /** Legacy Tours fields retained for historical/session compatibility. */
  hireType: ToursHireType | null;
  startLocation: string;
  endingLocation: string;
  numberOfDays: number;
  startTime: TimeEvidenceCapture | null;
};

export type EndOperationDraft = {
  endOdometer: AcceptedOdometerReading | null;
  /**
   * Legacy optional field — V2 Finish records device time automatically
   * and no longer captures an end-time photo.
   */
  endTime: TimeEvidenceCapture | null;
};

export function createEmptyStartDraft(): StartOperationDraft {
  return {
    companyId: null,
    company: null,
    vehicleId: null,
    vehicle: null,
    driverId: null,
    driver: null,
    assistantIds: [],
    assistants: [],
    destination: '',
    hireType: null,
    startLocation: '',
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
