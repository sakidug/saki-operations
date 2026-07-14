import { Component, type ErrorInfo, type ReactNode } from 'react';

import { AppErrorFallback } from '@/app/errors/app-error-fallback';
import { createErrorId } from '@/app/errors/create-error-id';
import { buildClientErrorReport, reportClientError } from '@/app/errors/report-client-error';

export type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  errorId: string | null;
};

/**
 * Global React error boundary — catches unexpected render/lifecycle failures
 * so the user sees a recovery screen instead of a blank page.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  override state: AppErrorBoundaryState = {
    hasError: false,
    errorId: null,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return {
      hasError: true,
      errorId: createErrorId(),
    };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    const errorId = this.state.errorId ?? createErrorId();
    if (!this.state.errorId) {
      this.setState({ errorId });
    }

    reportClientError(
      buildClientErrorReport({
        errorId,
        error,
        componentStack: info.componentStack,
      }),
    );
  }

  override render(): ReactNode {
    if (this.state.hasError && this.state.errorId) {
      return <AppErrorFallback errorId={this.state.errorId} />;
    }

    return this.props.children;
  }
}
