import { MotionConfig } from 'framer-motion';

import { AppErrorBoundary } from '@/app/errors';
import { AppProviders } from '@/app/providers/app-providers';

/**
 * Application root — providers + router (Phase 3 App Shell).
 * Global error boundary catches unexpected render crashes.
 */
export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AppErrorBoundary>
        <AppProviders />
      </AppErrorBoundary>
    </MotionConfig>
  );
}
