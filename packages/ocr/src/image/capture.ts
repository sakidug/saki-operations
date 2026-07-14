/**
 * Camera capture helpers — opens the device camera via file input capture.
 */

export type CapturePhotoOptions = {
  /** Prefer rear camera on mobile */
  facingMode?: 'environment' | 'user';
  accept?: string;
  signal?: AbortSignal;
};

export type CapturedPhoto = {
  file: File;
  previewUrl: string;
};

/**
 * Opens the device camera (or picker) and returns one photo.
 * Uses `capture="environment"` so mobile OS opens the camera first.
 */
export function capturePhotoFromCamera(options: CapturePhotoOptions = {}): Promise<CapturedPhoto> {
  const { accept = 'image/*', signal } = options;

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.capture = 'environment';
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    document.body.appendChild(input);

    const cleanup = () => {
      input.removeEventListener('change', onChange);
      input.removeEventListener('cancel', onCancel);
      signal?.removeEventListener('abort', onAbort);
      input.remove();
    };

    const onAbort = () => {
      cleanup();
      reject(new DOMException('Aborted', 'AbortError'));
    };

    const onCancel = () => {
      cleanup();
      reject(new DOMException('Capture cancelled', 'AbortError'));
    };

    const onChange = () => {
      const file = input.files?.[0];
      cleanup();
      if (!file) {
        reject(new DOMException('Capture cancelled', 'AbortError'));
        return;
      }
      resolve({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    };

    signal?.addEventListener('abort', onAbort);
    input.addEventListener('change', onChange);
    // Some browsers fire cancel when dismissed
    input.addEventListener('cancel', onCancel);
    input.click();
  });
}
