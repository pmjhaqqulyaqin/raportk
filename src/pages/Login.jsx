import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../lib/authClient';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await authClient.signIn.email({
          email,
          password
        });
        if (error) throw error;
        navigate('/');
      } else {
        const { error } = await authClient.signUp.email({
          email,
          password,
          name
        });
        if (error) throw error;
        // Auto login after signup might happen automatically in better-auth, if not we navigate
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans min-h-[max(700px,100dvh)] w-full flex items-center justify-center p-4 text-white relative overflow-hidden">
      {/* Background Decorators */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-sm relative z-10">
        <div className="glass-card rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col items-center mb-6">
            <img src="/logo.png" alt="Logo" className="w-14 h-14 rounded-2xl object-contain mb-4 shadow-lg" />
            <h1 className="text-2xl font-black text-white tracking-tight text-center">
              {isLogin ? 'Selamat Datang!' : 'Buat Akun'}
            </h1>
            <p className="text-slate-400 font-medium text-center mt-1 text-xs">
              {isLogin ? 'Masuk ke dashboard Raport TK Anda.' : 'Daftar untuk mengelola raport sekolah Anda.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest pl-1">Nama Lengkap</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 text-[18px]" data-icon="person">person</span>
                  </div>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary shadow-inner placeholder-slate-500 transition-all" 
                    placeholder="Nama Lengkap Anda" 
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest pl-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]" data-icon="mail">mail</span>
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary shadow-inner placeholder-slate-500 transition-all" 
                  placeholder="email@sekolah.com" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest pl-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]" data-icon="lock">lock</span>
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary shadow-inner placeholder-slate-500 transition-all" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary to-indigo-500 hover:from-indigo-500 hover:to-primary shadow-lg shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Memproses...
                </span>
              ) : isLogin ? 'Masuk Sekarang' : 'Daftar Sekarang'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
              <span className="text-secondary font-bold underline decoration-secondary/30 underline-offset-4">
                {isLogin ? 'Daftar di sini' : 'Masuk di sini'}
              </span>
            </button>
          </div>

          <div className="mt-3 text-center">
            <a href="/legal" className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
              Syarat & Ketentuan · Kebijakan Privasi
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
