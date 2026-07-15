/**
 * Camera capture helpers — opens the device camera via file input capture.
 *
 * Safari / iOS notes:
 * - File handles from `<input type="file" capture>` can become unreadable after
 *   the input is removed ("The I/O read operation failed.").
 * - Always materialize bytes (and preferably JPEG-normalize) before cleanup.
 */

import { materializeFile, normalizeCapturedImage } from './preprocess';

export type CapturePhotoOptions = {
  /** Prefer rear camera on mobile */
  facingMode?: 'environment' | 'user';
  accept?: string;
  signal?: AbortSignal;
  /** Max longest edge when normalizing (default 2048). */
  maxEdge?: number;
};

export type CapturedPhoto = {
  file: File;
  previewUrl: string;
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * Opens the device camera (or picker) and returns one durable JPEG photo.
 * Uses `capture="environment"` so mobile OS opens the camera first.
 */
export function capturePhotoFromCamera(options: CapturePhotoOptions = {}): Promise<CapturedPhoto> {
  const { accept = 'image/*', signal, maxEdge } = options;

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.capture = 'environment';
    // Keep off-screen but in the document so iOS can complete the handoff.
    input.setAttribute('aria-hidden', 'true');
    input.tabIndex = -1;
    input.style.position = 'fixed';
    input.style.inset = '0';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    input.style.width = '1px';
    input.style.height = '1px';
    document.body.appendChild(input);

    let settled = false;

    const cleanup = () => {
      input.removeEventListener('change', onChange);
      input.removeEventListener('cancel', onCancel);
      signal?.removeEventListener('abort', onAbort);
      // Delay removal slightly so Safari finishes File back-end teardown.
      window.setTimeout(() => {
        try {
          input.remove();
        } catch {
          /* ignore */
        }
      }, 0);
    };

    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (isAbortError(error)) {
        reject(error);
        return;
      }
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Could not read the photo. Please try again.';
      reject(new Error(message));
    };

    const succeed = (photo: CapturedPhoto) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(photo);
    };

    const onAbort = () => {
      fail(new DOMException('Aborted', 'AbortError'));
    };

    const onCancel = () => {
      fail(new DOMException('Capture cancelled', 'AbortError'));
    };

    const onChange = () => {
      void (async () => {
        const raw = input.files?.[0];
        if (!raw) {
          fail(new DOMException('Capture cancelled', 'AbortError'));
          return;
        }

        try {
          // 1) Copy bytes while the file input still owns the camera file.
          const materialized = await materializeFile(raw);
          // 2) Normalize to JPEG so OCR / IndexedDB never touch HEIC / huge RAW blobs.
          let file: File;
          try {
            file = await normalizeCapturedImage(materialized, { maxEdge });
          } catch {
            // Decode failure — still return materialized bytes if image/* typed.
            file = materialized;
          }
          succeed({
            file,
            previewUrl: URL.createObjectURL(file),
          });
        } catch (error) {
          if (
            error instanceof DOMException ||
            (error instanceof Error && /I\/O read operation failed|NotReadableError/i.test(error.message))
          ) {
            fail(new Error('Could not read the photo. Please try again.'));
            return;
          }
          fail(error);
        }
      })();
    };

    signal?.addEventListener('abort', onAbort, { once: true });
    input.addEventListener('change', onChange, { once: true });
    // Chromium fires cancel when dismissed; Safari may not.
    input.addEventListener('cancel', onCancel, { once: true });

    // User gesture → open camera
    input.click();
  });
}
