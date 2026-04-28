import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  // Logic to determine active tab
  const isHome = path === '/';
  const isSetup = path === '/setup';
  const isIsi = path.startsWith('/editor');
  const isTemplate = path === '/templates';
  const isMaster = path === '/master';
  const isCetak = path.startsWith('/print');

  const getLinkClass = (isActive, isCenter = false) => {
    return `flex flex-col items-center justify-center transition-all duration-300 ${
      isCenter ? 'relative -top-5' : 'py-2 px-3'
    } ${
      isActive 
        ? (isCenter ? 'text-white scale-110' : 'text-white scale-110 -translate-y-2')
        : 'text-slate-400 hover:text-slate-200 active:scale-95'
    }`;
  };

  return (
    <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-[60] no-print pb-safe">
      <nav className="flex justify-between items-center px-4 py-2 glass-panel rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] border border-white/10 relative">
        <Link className={getLinkClass(isHome)} to="/">
          <div className={isHome ? "w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/40 text-white" : ""}>
            <span className="material-symbols-outlined text-[22px]">space_dashboard</span>
          </div>
          {!isHome && <span className="text-[10px] font-bold mt-1">Dashboard</span>}
        </Link>
        <Link className={getLinkClass(isSetup)} to="/setup">
          <div className={isSetup ? "w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/40 text-white" : ""}>
            <span className="material-symbols-outlined text-[22px]">settings</span>
          </div>
          {!isSetup && <span className="text-[10px] font-bold mt-1">Pengaturan</span>}
        </Link>
        
        {/* Center Main Tab: Input Nilai */}
        <Link className={getLinkClass(isIsi, true)} to="/editor">
          <div className="w-16 h-16 bg-gradient-to-tr from-secondary to-primary rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(79,70,229,0.5)] text-white border-4 border-[#1E40AF]">
            <span className="material-symbols-outlined text-[28px]">edit_document</span>
          </div>
          <span className="text-[10px] font-bold mt-1 text-white absolute -bottom-4 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-md whitespace-nowrap">Input Nilai</span>
        </Link>

        <Link className={getLinkClass(isTemplate)} to="/templates">
          <div className={isTemplate ? "w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/40 text-white" : ""}>
            <span className="material-symbols-outlined text-[22px]">description</span>
          </div>
          {!isTemplate && <span className="text-[10px] font-bold mt-1">Template</span>}
        </Link>
        <Link className={getLinkClass(isCetak)} to="/print">
          <div className={isCetak ? "w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/40 text-white" : ""}>
            <span className="material-symbols-outlined text-[22px]">print</span>
          </div>
          {!isCetak && <span className="text-[10px] font-bold mt-1">Cetak</span>}
        </Link>
      </nav>
    </div>
  );
}

export default BottomNav;
