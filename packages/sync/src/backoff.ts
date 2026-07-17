/** Exponential backoff with jitter (ms). Cap at ~5 minutes. */
export function computeRetryDelayMs(retryCount: number): number {
  const base = Math.min(5 * 60_000, 1000 * 2 ** Math.min(retryCount, 8));
  const jitter = Math.floor(Math.random() * 400);
  return base + jitter;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
