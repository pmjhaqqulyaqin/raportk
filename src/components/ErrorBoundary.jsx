import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-6 p-6 text-center"
          style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-red-400">error</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white mb-2">Terjadi Kesalahan</h1>
            <p className="text-sm text-slate-400 max-w-sm">
              Aplikasi mengalami masalah. Silakan muat ulang halaman.
            </p>
          </div>
          <div className="bg-white/5 rounded-xl px-4 py-3 max-w-sm w-full">
            <p className="text-[11px] text-red-300/70 font-mono break-all line-clamp-3">
              {this.state.error?.message || 'Unknown error'}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-sm mr-1 align-middle">refresh</span>
            Muat Ulang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
