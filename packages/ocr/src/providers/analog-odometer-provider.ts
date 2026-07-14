import type { OcrProvider, OcrRecognizeInput } from './ocr-provider';
import type { OcrEngineResult } from '../types';

/**
 * Placeholder for future analog gauge OCR.
 * Always fails gracefully so callers fall back to manual entry + photo attach.
 */
export function createAnalogOdometerProvider(): OcrProvider {
  return {
    id: 'analog-stub-v0',
    supportedKinds: ['analog'],

    async recognize(input: OcrRecognizeInput): Promise<OcrEngineResult> {
      const started = performance.now();
      return {
        ok: false,
        kind: input.kind,
        value: null,
        confidence: 0,
        candidates: [],
        failureReason: 'unsupported_kind',
        meta: {
          providerId: 'analog-stub-v0',
          durationMs: Math.round(performance.now() - started),
          rawText: 'Analog odometer OCR is planned for a later phase.',
        },
      };
    },
  };
}
