import type { OcrEngineResult, OdometerKind } from '../types';

export type OcrRecognizeInput = {
  image: Blob | File | HTMLCanvasElement | ImageBitmap;
  kind: OdometerKind;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
};

/**
 * Swap OCR backends by implementing this interface.
 * Tours / HHCO call the service — never a concrete vendor SDK.
 */
export type OcrProvider = {
  readonly id: string;
  readonly supportedKinds: readonly OdometerKind[];
  recognize(input: OcrRecognizeInput): Promise<OcrEngineResult>;
};
