import { useEffect, useState } from 'react';

export type LiveClockState = {
  now: Date;
  hours: number;
  minutes: number;
  seconds: number;
};

/**
 * One-second live clock for the home header.
 * Pauses updates when the tab is hidden to avoid wasted work.
 */
export function useLiveClock(): LiveClockState {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let intervalId: number | undefined;

    const tick = () => setNow(new Date());

    const start = () => {
      tick();
      intervalId = window.setInterval(tick, 1000);
    };

    const stop = () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stop();
      } else {
        start();
      }
    };

    if (document.visibilityState !== 'hidden') {
      start();
    }

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return {
    now,
    hours: now.getHours(),
    minutes: now.getMinutes(),
    seconds: now.getSeconds(),
  };
}

export type GreetingPeriod = 'morning' | 'afternoon' | 'evening';

export function getGreetingPeriod(hours: number): GreetingPeriod {
  if (hours < 12) return 'morning';
  if (hours < 17) return 'afternoon';
  return 'evening';
}
