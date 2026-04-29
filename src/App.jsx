import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import DataMaster from './pages/Dashboard'; // Formerly Dashboard.jsx
import ReportEditor from './pages/ReportEditor';
import PrintPreview from './pages/PrintPreview';
import SetupSekolah from './pages/SetupSekolah';
import TemplateManager from './pages/TemplateManager';
import SchoolHub from './pages/SchoolHub';
import BottomNav from './components/BottomNav';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSession } from './lib/authClient';
import Login from './pages/Login';

const queryClient = new QueryClient();

// Protected Route Component
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
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/master" element={<Navigate to="/setup" replace />} />
          <Route path="/setup" element={<ProtectedRoute><SetupSekolah /></ProtectedRoute>} />
          <Route path="/editor" element={<ProtectedRoute><ReportEditor /></ProtectedRoute>} />
          <Route path="/editor/:id" element={<ProtectedRoute><ReportEditor /></ProtectedRoute>} />
          <Route path="/templates" element={<ProtectedRoute><TemplateManager /></ProtectedRoute>} />
          <Route path="/school-hub" element={<ProtectedRoute><SchoolHub /></ProtectedRoute>} />
          <Route path="/print" element={<ProtectedRoute><PrintPreview /></ProtectedRoute>} />
          <Route path="/print/:id" element={<ProtectedRoute><PrintPreview /></ProtectedRoute>} />
        </Routes>
        <AuthBottomNav />
        <PwaInstallPrompt />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
