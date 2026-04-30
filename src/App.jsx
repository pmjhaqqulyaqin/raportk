import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSession } from './lib/authClient';
import { Toaster } from 'sonner';
import { useState, useEffect } from 'react';

// ─── Lazy-loaded pages (code splitting) ──────────────────
const Login = lazy(() => import('./pages/Login'));
const Home = lazy(() => import('./pages/Home'));
const SetupSekolah = lazy(() => import('./pages/SetupSekolah'));
const ReportEditor = lazy(() => import('./pages/ReportEditor'));
const TemplateManager = lazy(() => import('./pages/TemplateManager'));
const SchoolHub = lazy(() => import('./pages/SchoolHub'));
const PrintPreview = lazy(() => import('./pages/PrintPreview'));
const Legal = lazy(() => import('./pages/Legal'));
const PublicRaport = lazy(() => import('./pages/PublicRaport'));
const Marketplace = lazy(() => import('./pages/Marketplace'));

const queryClient = new QueryClient();

// ─── Loading Spinner ─────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center gap-4"
    style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
    <div className="w-10 h-10 border-[3px] border-white/10 border-t-blue-500 rounded-full animate-spin" />
    <p className="text-slate-500 text-xs font-medium">Memuat halaman...</p>
  </div>
);

// ─── Offline Indicator ───────────────────────────────────
const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 w-full bg-red-500/90 backdrop-blur-sm text-white text-[11px] font-bold py-1.5 px-4 text-center z-[9999] shadow-lg flex items-center justify-center gap-2">
      <span className="material-symbols-outlined text-[14px]">wifi_off</span>
      Anda sedang offline. Beberapa fitur mungkin tidak berfungsi.
    </div>
  );
};


// ─── Protected Route ─────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center gap-6" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
        <img src="/logo.png" alt="Logo" className="w-24 h-24 rounded-3xl object-contain animate-pulse" />
        <p className="text-slate-400 text-sm font-bold tracking-wider">Memuat...</p>
        <div className="w-10 h-10 border-[3px] border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AuthBottomNav = () => {
  const { data: session } = useSession();
  if (!session) return null;
  return <BottomNav />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineBanner />
      <Toaster position="top-center" richColors theme="dark" />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/master" element={<Navigate to="/setup" replace />} />
            <Route path="/setup" element={<ProtectedRoute><SetupSekolah /></ProtectedRoute>} />
            <Route path="/editor" element={<ProtectedRoute><ReportEditor /></ProtectedRoute>} />
            <Route path="/editor/:id" element={<ProtectedRoute><ReportEditor /></ProtectedRoute>} />
            <Route path="/templates" element={<ProtectedRoute><TemplateManager /></ProtectedRoute>} />
            <Route path="/school-hub" element={<ProtectedRoute><SchoolHub /></ProtectedRoute>} />
            <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
            <Route path="/print" element={<ProtectedRoute><PrintPreview /></ProtectedRoute>} />
            <Route path="/print/:id" element={<ProtectedRoute><PrintPreview /></ProtectedRoute>} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/raport/:token" element={<PublicRaport />} />
          </Routes>
        </Suspense>
        <AuthBottomNav />
        <PwaInstallPrompt />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
