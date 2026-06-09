import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorId: null };
  }

  static getDerivedStateFromError(error) {
    return { error, errorId: Date.now().toString(36) + Math.random().toString(36).slice(2) };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lexora-error', {
        detail: { message: error.message, stack: error.stack, componentStack: errorInfo.componentStack }
      }));
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-background p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <span className="text-destructive text-2xl font-bold">!</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.errorId && (
              <p className="text-[10px] text-muted-foreground/50 font-mono">
                Error ID: {this.state.errorId}
              </p>
            )}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => { this.setState({ error: null }); window.location.reload(); }}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:opacity-90 transition-all"
              >
                Reload Page
              </button>
              <button
                onClick={() => { this.setState({ error: null }); window.location.href = '/'; }}
                className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-bold rounded-xl hover:opacity-90 transition-all"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
