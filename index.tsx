import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: string|null}> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  componentDidCatch(error: Error) {
    this.setState({ error: error.message + '\n' + error.stack });
  }
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{background:'#0f172a',color:'#f87171',padding:'40px',fontFamily:'monospace',minHeight:'100vh',whiteSpace:'pre-wrap'}}>
          <h1 style={{color:'#fbbf24',fontSize:'24px',marginBottom:'20px'}}>⚠️ AL WAJER ERP — Runtime Error</h1>
          <p style={{color:'#94a3b8',marginBottom:'16px'}}>The app crashed. Error details:</p>
          <div style={{background:'#1e293b',padding:'20px',borderRadius:'8px',border:'1px solid #ef4444'}}>
            {this.state.error}
          </div>
          <p style={{color:'#64748b',marginTop:'20px',fontSize:'12px'}}>Share this error with your developer to fix it.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element to mount to");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
