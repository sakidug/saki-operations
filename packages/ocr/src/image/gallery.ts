/**
 * Best-effort save of a captured photo into the user's device gallery / Downloads.
 *
 * Web platform limits:
 * - True MediaStore gallery insert is not available in standard browser PWAs.
 * - We download the file (triggers Photos / Downloads on many mobile browsers).
 * - When the File System Access API exists, we offer a save picker.
 */

export type GallerySaveResult = {
  method: 'download' | 'file_picker' | 'noop';
  ok: boolean;
  detail?: string;
};

export async function savePhotoToGallery(
  blob: Blob,
  fileName: string,
): Promise<GallerySaveResult> {
  const typed =
    blob.type && blob.type.startsWith('image/')
      ? blob
      : new Blob([blob], { type: 'image/jpeg' });

  // Chromium File System Access — closest to "Save to device"
  const anyWindow = window as Window & {
    showSaveFilePicker?: (options: unknown) => Promise<FileSystemFileHandle>;
  };

  if (typeof anyWindow.showSaveFilePicker === 'function') {
    try {
      const handle = await anyWindow.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'Photo',
            accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(typed);
      await writable.close();
      return { method: 'file_picker', ok: true };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { method: 'file_picker', ok: false, detail: 'cancelled' };
      }
      // Fall through to download
    }
  }

  try {
    const url = URL.createObjectURL(typed);
    // Avoid auto-download on touch devices — it interrupts field capture and
    // has raced Safari camera teardown. Caller can still opt into file picker above.
    const coarsePointer =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches;
    if (coarsePointer) {
      URL.revokeObjectURL(url);
      return { method: 'noop', ok: true, detail: 'skipped_mobile_auto_download' };
    }

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4_000);
    return { method: 'download', ok: true };
  } catch {
    return { method: 'noop', ok: false, detail: 'gallery_unavailable' };
  }
}

