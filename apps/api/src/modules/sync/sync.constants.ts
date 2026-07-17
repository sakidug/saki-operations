/** Max events per batch request (H-02). */
export const SYNC_MAX_BATCH_EVENTS = 50;

/** Max decoded file size for sync uploads (H-02). */
export const SYNC_MAX_FILE_BYTES = 8 * 1024 * 1024;

/** Max data-URL string length (base64 overhead + header). */
export const SYNC_MAX_DATA_URL_CHARS = Math.ceil(SYNC_MAX_FILE_BYTES * 1.4) + 128;
