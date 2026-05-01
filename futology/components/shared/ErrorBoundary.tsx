"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary]", error, info);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="container-page py-12">
          <div className="surface mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-10 text-center">
            <div
              aria-hidden
              className="grid h-12 w-12 place-items-center rounded-full bg-bg-elevated text-warning"
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Something broke on this page</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-text-secondary">
                The rest of the app is still fine. Try the action below to recover.
              </p>
            </div>
            <button
              type="button"
              onClick={this.reset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-sm text-text-primary transition-colors hover:border-accent/40"
            >
              <RefreshCw className="h-4 w-4" aria-hidden /> Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
