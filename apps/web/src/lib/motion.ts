/** Shared motion easing aligned with design-system “premium” feel (~250ms normal). */
export const MOTION_EASE = [0.16, 1, 0.3, 1] as const;

export const MOTION_DURATION = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
} as const;

export function fadeUpTransition(reduceMotion: boolean | null, delay = 0) {
  if (reduceMotion) return { duration: 0 };
  return { duration: MOTION_DURATION.normal, delay, ease: MOTION_EASE };
}
