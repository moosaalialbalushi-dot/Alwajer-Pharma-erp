import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { CurrencyProvider } from '@/providers/CurrencyProvider';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-8 font-mono bg-white text-slate-900 min-h-screen">
          <h2 className="text-red-600 mb-4 text-xl font-bold">Application Error</h2>
          <pre className="bg-slate-100 p-4 rounded-lg overflow-auto text-xs">
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-4 px-4 py-2 bg-[#D4AF37] text-slate-950 border-none rounded-lg cursor-pointer font-bold"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
