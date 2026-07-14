import type { OcrProvider, OcrRecognizeInput } from './ocr-provider';
import { preprocessForDigitalOdometer } from '../image/preprocess';
import { parseOdometerCandidates, pickBestCandidate } from '../parse/odometer-parse';
import type { OcrEngineResult } from '../types';

/**
 * Default digital-odometer provider powered by Tesseract.js.
 * Replace by registering another `OcrProvider` — no app code changes required.
 */
export function createDigitalOdometerProvider(): OcrProvider {
  return {
    id: 'tesseract-digital-v1',
    supportedKinds: ['digital'],

    async recognize(input: OcrRecognizeInput): Promise<OcrEngineResult> {
      const started = performance.now();
      const providerId = 'tesseract-digital-v1';

      if (input.kind !== 'digital') {
        return {
          ok: false,
          kind: input.kind,
          value: null,
          confidence: 0,
          candidates: [],
          failureReason: 'unsupported_kind',
          meta: { providerId, durationMs: Math.round(performance.now() - started) },
        };
      }

      try {
        input.signal?.throwIfAborted();
        input.onProgress?.(0.05);

        let canvas: HTMLCanvasElement;
        if (input.image instanceof HTMLCanvasElement) {
          canvas = input.image;
        } else if (input.image instanceof ImageBitmap) {
          canvas = await preprocessForDigitalOdometer(input.image);
        } else {
          canvas = await preprocessForDigitalOdometer(input.image);
        }

        input.onProgress?.(0.25);
        input.signal?.throwIfAborted();

        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng', 1, {
          logger: (message) => {
            if (message.status === 'recognizing text' && typeof message.progress === 'number') {
              input.onProgress?.(0.25 + message.progress * 0.7);
            }
          },
        });

        try {
          input.signal?.throwIfAborted();
          await worker.setParameters({
            tessedit_char_whitelist: '0123456789,.',
          });

          const {
            data: { text, confidence },
          } = await worker.recognize(canvas);

          const base = typeof confidence === 'number' && confidence > 0 ? confidence : 65;
          const candidates = parseOdometerCandidates(text ?? '', base);
          const best = pickBestCandidate(candidates);

          if (!best) {
            return {
              ok: false,
              kind: 'digital',
              value: null,
              confidence: 0,
              candidates: [],
              failureReason: 'no_digits_found',
              meta: {
                providerId,
                durationMs: Math.round(performance.now() - started),
                rawText: text,
              },
            };
          }

          input.onProgress?.(1);

          return {
            ok: true,
            kind: 'digital',
            value: best.value,
            confidence: best.confidence,
            candidates,
            failureReason: best.confidence < 75 ? 'low_confidence' : undefined,
            meta: {
              providerId,
              durationMs: Math.round(performance.now() - started),
              rawText: text,
            },
          };
        } finally {
          await worker.terminate();
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return {
            ok: false,
            kind: 'digital',
            value: null,
            confidence: 0,
            candidates: [],
            failureReason: 'cancelled',
            meta: { providerId, durationMs: Math.round(performance.now() - started) },
          };
        }

        return {
          ok: false,
          kind: 'digital',
          value: null,
          confidence: 0,
          candidates: [],
          failureReason: 'provider_unavailable',
          meta: { providerId, durationMs: Math.round(performance.now() - started) },
        };
      }
    },
  };
}
