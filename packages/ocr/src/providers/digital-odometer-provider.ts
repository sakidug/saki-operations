import type { OcrProvider, OcrRecognizeInput } from './ocr-provider';
import { buildDigitalOcrVariants } from '../image/preprocess';
import {
  mergeOcrCandidates,
  parseOdometerCandidates,
  pickBestCandidate,
} from '../parse/odometer-parse';
import type { OcrEngineResult, OcrRawCandidate } from '../types';
import { OCR_LOW_CONFIDENCE_THRESHOLD } from '../types';

/**
 * Default digital-odometer provider powered by Tesseract.js.
 * Multi-pass preprocess (band / LCD / full) — accuracy over speed.
 */
export function createDigitalOdometerProvider(): OcrProvider {
  return {
    id: 'tesseract-digital-v2',
    supportedKinds: ['digital'],

    async recognize(input: OcrRecognizeInput): Promise<OcrEngineResult> {
      const started = performance.now();
      const providerId = 'tesseract-digital-v2';

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

        const canvases =
          input.image instanceof HTMLCanvasElement
            ? [input.image]
            : await buildDigitalOcrVariants(input.image);

        input.onProgress?.(0.2);
        input.signal?.throwIfAborted();

        const { createWorker, PSM } = await import('tesseract.js');
        const worker = await createWorker('eng', 1, {
          logger: (message) => {
            if (message.status === 'recognizing text' && typeof message.progress === 'number') {
              input.onProgress?.(0.2 + message.progress * 0.75);
            }
          },
        });

        try {
          input.signal?.throwIfAborted();
          await worker.setParameters({
            tessedit_char_whitelist: '0123456789',
            tessedit_pageseg_mode: PSM.SINGLE_LINE,
          });

          const groups: OcrRawCandidate[][] = [];
          const rawParts: string[] = [];

          for (let i = 0; i < canvases.length; i++) {
            input.signal?.throwIfAborted();
            const canvas = canvases[i]!;
            const {
              data: { text, confidence },
            } = await worker.recognize(canvas);
            rawParts.push(text ?? '');
            const base = typeof confidence === 'number' && confidence > 0 ? confidence : 60;
            groups.push(parseOdometerCandidates(text ?? '', base));
          }

          // Second pass: sparse word mode can recover clipped leading digits.
          await worker.setParameters({
            tessedit_char_whitelist: '0123456789',
            tessedit_pageseg_mode: PSM.SINGLE_WORD,
          });
          const primary = canvases[0]!;
          const {
            data: { text: textWord, confidence: confWord },
          } = await worker.recognize(primary);
          rawParts.push(textWord ?? '');
          groups.push(
            parseOdometerCandidates(
              textWord ?? '',
              typeof confWord === 'number' && confWord > 0 ? confWord : 55,
            ),
          );

          const merged = mergeOcrCandidates(groups);
          const best = pickBestCandidate(merged, {
            previousKm: input.previousOdometerKm,
          });

          if (!best) {
            return {
              ok: false,
              kind: 'digital',
              value: null,
              confidence: 0,
              candidates: merged,
              failureReason: 'no_digits_found',
              meta: {
                providerId,
                durationMs: Math.round(performance.now() - started),
                rawText: rawParts.join('\n---\n'),
                passes: canvases.length + 1,
              },
            };
          }

          input.onProgress?.(1);

          return {
            ok: true,
            kind: 'digital',
            value: best.value,
            confidence: best.confidence,
            candidates: merged,
            failureReason:
              best.confidence < OCR_LOW_CONFIDENCE_THRESHOLD ? 'low_confidence' : undefined,
            meta: {
              providerId,
              durationMs: Math.round(performance.now() - started),
              rawText: rawParts.join('\n---\n'),
              passes: canvases.length + 1,
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
