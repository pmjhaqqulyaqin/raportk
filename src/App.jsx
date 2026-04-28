import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import DataMaster from './pages/Dashboard'; // Formerly Dashboard.jsx
import ReportEditor from './pages/ReportEditor';
import PrintPreview from './pages/PrintPreview';
import SetupSekolah from './pages/SetupSekolah';
import TemplateManager from './pages/TemplateManager';
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
    return <div className="min-h-[max(884px,100dvh)] w-full flex items-center justify-center text-white font-bold">Memuat...</div>;
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
          <Route path="/master" element={<ProtectedRoute><DataMaster /></ProtectedRoute>} />
          <Route path="/setup" element={<ProtectedRoute><SetupSekolah /></ProtectedRoute>} />
          <Route path="/editor" element={<ProtectedRoute><ReportEditor /></ProtectedRoute>} />
          <Route path="/editor/:id" element={<ProtectedRoute><ReportEditor /></ProtectedRoute>} />
          <Route path="/templates" element={<ProtectedRoute><TemplateManager /></ProtectedRoute>} />
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
