import React from 'react';
import { Button } from './ui/Button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
          <div className="max-w-md w-full space-y-8 p-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                Something went wrong
              </h2>
              <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full sm:w-auto"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
