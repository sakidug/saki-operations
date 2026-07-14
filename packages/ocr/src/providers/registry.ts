import type { OcrProvider } from './ocr-provider';
import { createAnalogOdometerProvider } from './analog-odometer-provider';
import { createDigitalOdometerProvider } from './digital-odometer-provider';
import type { OdometerKind } from '../types';

export type OcrProviderRegistry = {
  get(kind: OdometerKind): OcrProvider;
  register(kind: OdometerKind, provider: OcrProvider): void;
  list(): ReadonlyMap<OdometerKind, OcrProvider>;
};

/**
 * Kind → provider map. Swap Tesseract for a cloud OCR API without touching UI.
 */
export function createOcrProviderRegistry(
  overrides?: Partial<Record<OdometerKind, OcrProvider>>,
): OcrProviderRegistry {
  const map = new Map<OdometerKind, OcrProvider>([
    ['digital', overrides?.digital ?? createDigitalOdometerProvider()],
    ['analog', overrides?.analog ?? createAnalogOdometerProvider()],
  ]);

  return {
    get(kind) {
      const provider = map.get(kind);
      if (!provider) {
        throw new Error(`No OCR provider registered for kind: ${kind}`);
      }
      return provider;
    },
    register(kind, provider) {
      map.set(kind, provider);
    },
    list() {
      return map;
    },
  };
}
