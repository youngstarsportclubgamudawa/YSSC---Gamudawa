import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class RootErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled application error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center mx-auto">
              ⭐
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Young Star Sports Club Gamudawa</h2>
              <p className="text-xs text-amber-400 mt-0.5">තරුණ තරු ක්‍රීඩා සමාජය ගම්උදාව</p>
            </div>
            <div className="p-3 bg-slate-950/70 rounded-xl text-xs text-slate-400 text-left font-mono">
              {this.state.error?.message || 'An unexpected rendering issue occurred.'}
            </div>
            <div className="pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition"
              >
                Reset & Reload Portal
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
