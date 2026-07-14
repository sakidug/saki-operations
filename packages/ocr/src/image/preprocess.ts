/**
 * Light client-side preprocessing before OCR.
 * Improves digital LCD contrast without binding to a vendor.
 */

export async function blobToImageBitmap(blob: Blob): Promise<ImageBitmap> {
  return createImageBitmap(blob);
}

/**
 * Resize + grayscale + contrast boost into a canvas suitable for digital OCR.
 */
export async function preprocessForDigitalOdometer(
  source: Blob | File | ImageBitmap,
  options?: { maxWidth?: number },
): Promise<HTMLCanvasElement> {
  const maxWidth = options?.maxWidth ?? 1600;
  const bitmap =
    source instanceof ImageBitmap ? source : await createImageBitmap(source);

  const scale = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    bitmap.close?.();
    throw new Error('Canvas 2D context unavailable');
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  if (!(source instanceof ImageBitmap)) {
    bitmap.close?.();
  } else {
    // Caller owns the bitmap; do not close.
  }

  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    // Luma
    let y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // Contrast stretch around mid-grey (helps LCD digits)
    y = (y - 128) * 1.45 + 128;
    y = Math.max(0, Math.min(255, y));
    // Soft threshold toward binary for digit clarity
    const v = y > 140 ? 255 : y < 90 ? 0 : y;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/jpeg', quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Failed to encode canvas'));
        else resolve(blob);
      },
      type,
      quality,
    );
  });
}
