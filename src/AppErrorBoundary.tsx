import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Why this exists: `useQuery` from convex/react THROWS a failed query during
 * render, and React removes the whole tree on an uncaught render error. With
 * nothing to catch it, a generated app rendered once and then went white —
 * with no message for the person looking at it. The most common trigger is
 * harmless and temporary: the preview reloads while a build is still running,
 * before `convex dev` has deployed the functions the new code calls
 * ("Could not find public function …"). That case retries by itself here.
 * Any other error is shown, with a Reload button, and reported to the builder
 * (STUNNING_APP_ERROR) so the chat can offer to fix it.
 */

export type AppErrorKind = 'functions-deploying' | 'runtime';

/** Errors that fix themselves once the deploy in progress lands. Only Convex's
 *  own "function not found" wording qualifies: a looser `server error` +
 *  `not found` match also swallowed real app errors ("Server Error: Document
 *  not found") behind an endless "finishing the last changes…". */
export function classifyAppError(message: string): AppErrorKind {
  const m = message.toLowerCase();
  if (
    m.includes('could not find public function') ||
    m.includes('could not find function') ||
    m.includes('convex functions are being deployed')
  ) {
    return 'functions-deploying';
  }
  return 'runtime';
}

/** Retry schedule while functions deploy: 2s, 4s, 6s … up to ten times (~1 min). */
export function retryDelayMs(attempt: number): number | null {
  return attempt < 10 ? 2000 * (attempt + 1) : null;
}

type Props = { children: ReactNode };
type State = { error: Error | null; attempt: number };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null, attempt: 0 };
  private _timer: ReturnType<typeof setTimeout> | null = null;

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const message = error?.message ?? String(error);
    const kind = classifyAppError(message);
    try {
      window.parent?.postMessage(
        {
          type: 'STUNNING_APP_ERROR',
          error: 'RUNTIME_ERROR',
          kind,
          message,
          stack: (error?.stack ?? '').slice(0, 4000),
          componentStack: (info?.componentStack ?? '').slice(0, 2000),
        },
        '*',
      );
    } catch {
      // Not inside the builder — nothing to report to.
    }
    if (kind === 'functions-deploying') {
      const delay = retryDelayMs(this.state.attempt);
      if (delay !== null) {
        this._timer = setTimeout(() => {
          this.setState((s) => ({ error: null, attempt: s.attempt + 1 }));
        }, delay);
      }
    }
  }

  componentWillUnmount() {
    if (this._timer) {
      clearTimeout(this._timer);
    }
  }

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }
    const message = error.message ?? String(error);
    const deploying = classifyAppError(message) === 'functions-deploying' && retryDelayMs(this.state.attempt) !== null;
    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
          background: '#fafafa',
          color: '#111827',
        }}
      >
        <div
          style={{
            maxWidth: 560,
            width: '100%',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '1.5rem',
          }}
        >
          {deploying ? (
            <>
              <h1 style={{ fontSize: '1.125rem', margin: '0 0 .5rem' }}>Finishing the last changes…</h1>
              <p style={{ margin: 0, color: '#6b7280' }}>
                The app&apos;s backend is still being updated. This page will retry on its own.
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: '1.125rem', margin: '0 0 .5rem' }}>This page hit an error</h1>
              <p style={{ margin: '0 0 1rem', color: '#6b7280' }}>
                Something in the app crashed while loading. The builder has been told about it.
              </p>
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: 12,
                  background: '#f3f4f6',
                  borderRadius: 8,
                  padding: '.75rem',
                  margin: '0 0 1rem',
                  maxHeight: 160,
                  overflow: 'auto',
                }}
              >
                {message}
              </pre>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  padding: '.5rem 1rem',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                Reload
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
}
