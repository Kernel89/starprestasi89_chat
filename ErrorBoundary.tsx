import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  retryCount: number;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    retryCount: 0
  };

  public static getDerivedStateFromError(error: Error): State {
    let retry = 0;
    try {
      retry = parseInt(sessionStorage.getItem('err_retry_count') || '0');
    } catch (e) {}
    return { hasError: true, retryCount: isNaN(retry) ? 0 : retry, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
    // Removed automatic reload to allow users to see the "Terjadi Kendala Teknis" screen and report the issue.
  }

  private handleManualReset = () => {
    try {
        sessionStorage.removeItem('err_retry_count');
        localStorage.clear();
        sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl max-w-md w-full text-center border border-slate-100">
            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Terjadi Kendala Teknis</h1>
            <p className="text-slate-500 text-sm mb-4">
              Aplikasi mengalami crash (berhenti tiba-tiba). Silakan screenshot layar ini dan kirimkan ke tim IT.
            </p>
            <div className="bg-slate-100 text-left p-3 rounded-lg text-xs font-mono text-red-600 mb-6 overflow-auto max-h-32">
              {this.state.error ? this.state.error.toString() : 'Unknown error'}
              <br/>
              {this.state.errorInfo?.componentStack}
            </div>
            <button
              onClick={this.handleManualReset}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl transition-all active:scale-95 shadow-lg shadow-indigo-200"
            >
              Pulihkan & Muat Ulang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
