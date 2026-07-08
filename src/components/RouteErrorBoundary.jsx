import React from 'react';

export default class RouteErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[RouteError]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8 text-center">
          <div className="text-4xl">😵</div>
          <h2 className="text-lg font-bold text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            This page encountered an error. Your study data is safe.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/95 active:scale-95 transition-all"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
