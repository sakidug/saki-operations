/**
 * Light client-side preprocessing before OCR.
 * Improves digital LCD contrast without binding to a vendor.
 */

export async function blobToImageBitmap(blob: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(blob);
  } catch {
    // Safari / HEIC / odd MIME types — decode via <img> then bitmap.
    const url = URL.createObjectURL(blob);
    try {
      const image = await loadHtmlImage(url);
      return await createImageBitmap(image);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode captured image'));
    img.src = src;
  });
}

/**
 * Copy camera File bytes into a stable in-memory File.
 * Safari can invalidate `input.files` when the input is removed (I/O read failure).
 */
export async function materializeFile(file: File): Promise<File> {
  const buffer = await file.arrayBuffer();
  const name = file.name && file.name.trim() ? file.name : `capture-${Date.now()}.jpg`;
  const type = file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg';
  return new File([buffer], name, {
    type,
    lastModified: file.lastModified || Date.now(),
  });
}

/**
 * Decode → optional resize → JPEG File for OCR / IndexedDB / preview.
 * Avoids HEIC / huge phone camera files that break FileReader on iOS.
 */
export async function normalizeCapturedImage(
  source: Blob | File,
  options?: { maxEdge?: number; quality?: number },
): Promise<File> {
  const maxEdge = options?.maxEdge ?? 2048;
  const quality = options?.quality ?? 0.86;
  const bitmap = await blobToImageBitmap(source);

  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = longest > maxEdge ? maxEdge / longest : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    const baseName =
      source instanceof File && source.name
        ? source.name.replace(/\.[^.]+$/, '')
        : `odometer-${Date.now()}`;
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close?.();
  }
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
    source instanceof ImageBitmap ? source : await blobToImageBitmap(source);

  const scale = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    if (!(source instanceof ImageBitmap)) bitmap.close?.();
    throw new Error('Canvas 2D context unavailable');
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  if (!(source instanceof ImageBitmap)) {
    bitmap.close?.();
  }

  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    let y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    y = (y - 128) * 1.45 + 128;
    y = Math.max(0, Math.min(255, y));
    const v = y > 140 ? 255 : y < 90 ? 0 : y;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/jpeg',
  quality = 0.92,
): Promise<Blob> {
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
