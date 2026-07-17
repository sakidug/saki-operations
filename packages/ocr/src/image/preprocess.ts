/**
 * Image preprocessing for digital odometer OCR.
 * Favours accuracy: crop → glare dampen → contrast → sharpen → optional upscale.
 */

export async function blobToImageBitmap(blob: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(blob);
  } catch {
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

export async function materializeFile(file: File): Promise<File> {
  const buffer = await file.arrayBuffer();
  const name = file.name && file.name.trim() ? file.name : `capture-${Date.now()}.jpg`;
  const type = file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg';
  return new File([buffer], name, {
    type,
    lastModified: file.lastModified || Date.now(),
  });
}

export async function normalizeCapturedImage(
  source: Blob | File,
  options?: { maxEdge?: number; quality?: number },
): Promise<File> {
  const maxEdge = options?.maxEdge ?? 2400;
  const quality = options?.quality ?? 0.9;
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

export type DigitalPreprocessMode = 'full' | 'band' | 'lcd';

export type DigitalPreprocessOptions = {
  maxWidth?: number;
  mode?: DigitalPreprocessMode;
  /** Upscale short edges so Tesseract sees taller digits */
  minDigitHeightPx?: number;
};

type Rect = { x: number; y: number; w: number; h: number };

function cloneCanvasRegion(
  source: HTMLCanvasElement,
  rect: Rect,
): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = Math.max(1, rect.w);
  out.height = Math.max(1, rect.h);
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(source, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
  return out;
}

/**
 * Score horizontal bands by edge density — odometer digit strips tend to be
 * dense mid-frame / lower-mid on dashboards.
 */
function findDigitBand(image: ImageData): Rect {
  const { width, height, data } = image;
  const rowScore = new Float64Array(height);

  for (let y = 1; y < height - 1; y++) {
    let score = 0;
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      const lum = data[i]!;
      const left = data[i - 4]!;
      const right = data[i + 4]!;
      const up = data[((y - 1) * width + x) * 4]!;
      const down = data[((y + 1) * width + x) * 4]!;
      const gx = Math.abs(right - left);
      const gy = Math.abs(down - up);
      if (gx + gy > 40) score += 1;
    }
    // Prefer lower-middle dashboard region where KM digits usually sit.
    const bandBias = y / height;
    const weight =
      bandBias > 0.25 && bandBias < 0.85 ? 1.35 : bandBias > 0.15 ? 1.0 : 0.55;
    rowScore[y] = score * weight;
  }

  const window = Math.max(24, Math.round(height * 0.18));
  let bestY = Math.round(height * 0.35);
  let bestSum = -1;
  for (let y = 0; y <= height - window; y++) {
    let sum = 0;
    for (let k = 0; k < window; k++) sum += rowScore[y + k]!;
    if (sum > bestSum) {
      bestSum = sum;
      bestY = y;
    }
  }

  const padX = Math.round(width * 0.06);
  return {
    x: padX,
    y: Math.max(0, bestY - 4),
    w: Math.max(1, width - padX * 2),
    h: Math.min(window + 8, height - bestY),
  };
}

/** Bright LCD / white-on-black cluster crop (glare-tolerant). */
function findLcdRegion(image: ImageData): Rect {
  const { width, height, data } = image;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = Math.round(height * 0.15); y < Math.round(height * 0.9); y++) {
    for (let x = Math.round(width * 0.05); x < Math.round(width * 0.95); x++) {
      const i = (y * width + x) * 4;
      const lum = data[i]!;
      // Capture both bright LCD and dark digit-on-light clusters via extremes.
      if (lum > 200 || lum < 45) {
        found = true;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!found || maxX - minX < width * 0.15 || maxY - minY < 12) {
    return {
      x: Math.round(width * 0.08),
      y: Math.round(height * 0.3),
      w: Math.round(width * 0.84),
      h: Math.round(height * 0.35),
    };
  }

  const padX = Math.round((maxX - minX) * 0.08);
  const padY = Math.round((maxY - minY) * 0.25);
  const x = Math.max(0, minX - padX);
  const y = Math.max(0, minY - padY);
  const w = Math.min(width - x, maxX - minX + padX * 2);
  const h = Math.min(height - y, maxY - minY + padY * 2);
  return { x, y, w, h };
}

function applyPixelPipeline(image: ImageData): void {
  const data = image.data;
  const { width, height } = image;

  // Pass 1: luma + glare compression (tone down specular highlights).
  const luma = new Float32Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    let y = 0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!;
    if (y > 235) y = 235 - (y - 235) * 0.65; // compress glare
    luma[p] = y;
  }

  // Pass 2: contrast stretch using percentiles (ignore extremes).
  const sample: number[] = [];
  const step = Math.max(1, Math.floor(luma.length / 4000));
  for (let i = 0; i < luma.length; i += step) sample.push(luma[i]!);
  sample.sort((a, b) => a - b);
  const lo = sample[Math.floor(sample.length * 0.08)] ?? 0;
  const hi = sample[Math.floor(sample.length * 0.92)] ?? 255;
  const range = Math.max(18, hi - lo);

  for (let p = 0; p < luma.length; p++) {
    let y = ((luma[p]! - lo) / range) * 255;
    y = Math.max(0, Math.min(255, y));
    // Mild unsharp toward binary for LCD digits.
    y = (y - 128) * 1.55 + 128;
    y = Math.max(0, Math.min(255, y));
    const v = y > 165 ? 255 : y < 70 ? 0 : y;
    luma[p] = v;
  }

  // Pass 3: light sharpen via simple Laplacian boost on retained greys.
  const sharpened = new Float32Array(luma);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const center = luma[i]!;
      const lap =
        center * 5 -
        luma[i - 1]! -
        luma[i + 1]! -
        luma[i - width]! -
        luma[i + width]!;
      sharpened[i] = Math.max(0, Math.min(255, center + lap * 0.18));
    }
  }

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const v = Math.round(sharpened[p]!);
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
  }
}

function upscaleIfNeeded(
  canvas: HTMLCanvasElement,
  minHeight: number,
): HTMLCanvasElement {
  if (canvas.height >= minHeight) return canvas;
  const scale = minHeight / canvas.height;
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(canvas.width * scale));
  out.height = Math.max(1, Math.round(canvas.height * scale));
  const ctx = out.getContext('2d');
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out;
}

/**
 * Build an OCR-ready canvas. Modes produce different crops for multi-pass recognition.
 */
export async function preprocessForDigitalOdometer(
  source: Blob | File | ImageBitmap,
  options?: DigitalPreprocessOptions,
): Promise<HTMLCanvasElement> {
  const maxWidth = options?.maxWidth ?? 2000;
  const mode = options?.mode ?? 'full';
  const minDigitHeightPx = options?.minDigitHeightPx ?? 64;

  const bitmap =
    source instanceof ImageBitmap ? source : await blobToImageBitmap(source);

  const scale = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const base = document.createElement('canvas');
  base.width = width;
  base.height = height;
  const baseCtx = base.getContext('2d', { willReadFrequently: true });
  if (!baseCtx) {
    if (!(source instanceof ImageBitmap)) bitmap.close?.();
    throw new Error('Canvas 2D context unavailable');
  }

  baseCtx.drawImage(bitmap, 0, 0, width, height);
  if (!(source instanceof ImageBitmap)) bitmap.close?.();

  // Greyscale preview for band detection.
  const probe = baseCtx.getImageData(0, 0, width, height);
  for (let i = 0; i < probe.data.length; i += 4) {
    const y =
      0.2126 * probe.data[i]! +
      0.7152 * probe.data[i + 1]! +
      0.0722 * probe.data[i + 2]!;
    probe.data[i] = y;
    probe.data[i + 1] = y;
    probe.data[i + 2] = y;
  }

  let working = base;
  if (mode === 'band') {
    working = cloneCanvasRegion(base, findDigitBand(probe));
  } else if (mode === 'lcd') {
    working = cloneCanvasRegion(base, findLcdRegion(probe));
  }

  const ctx = working.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  const image = ctx.getImageData(0, 0, working.width, working.height);
  applyPixelPipeline(image);
  ctx.putImageData(image, 0, 0);

  return upscaleIfNeeded(working, minDigitHeightPx);
}

/** Build the three crop variants used by the digital provider multi-pass. */
export async function buildDigitalOcrVariants(
  source: Blob | File | ImageBitmap,
): Promise<HTMLCanvasElement[]> {
  const modes: DigitalPreprocessMode[] = ['band', 'lcd', 'full'];
  const canvases: HTMLCanvasElement[] = [];
  for (const mode of modes) {
    canvases.push(await preprocessForDigitalOdometer(source, { mode }));
  }
  return canvases;
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
