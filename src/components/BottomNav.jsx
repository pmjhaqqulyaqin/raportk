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
  const isCetak = path.startsWith('/print');

  const tabs = [
    { to: '/', label: 'Dashboard', icon: 'space_dashboard', active: isHome },
    { to: '/setup', label: 'Pengaturan', icon: 'settings', active: isSetup },
    { to: '/editor', label: 'Input Nilai', icon: 'edit_document', active: isIsi, isCenter: true },
    { to: '/templates', label: 'Template', icon: 'description', active: isTemplate },
    { to: '/print', label: 'Cetak', icon: 'print', active: isCetak },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] no-print">
      <nav className="flex items-end justify-around glass-panel border-t border-white/10 px-1 pt-1 pb-safe"
           style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 6px), 6px)' }}>
        {tabs.map((tab) => {
          if (tab.isCenter) {
            return (
              <Link key={tab.to} to={tab.to}
                className="flex flex-col items-center justify-center relative -top-3 flex-1 min-w-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg text-white border-2 transition-all duration-200 ${
                  tab.active
                    ? 'bg-gradient-to-tr from-secondary to-primary border-white/20 scale-110 shadow-primary/40'
                    : 'bg-gradient-to-tr from-secondary/80 to-primary/80 border-[#1E40AF]'
                }`}>
                  <span className="material-symbols-outlined text-xl">{tab.icon}</span>
                </div>
                <span className={`text-[9px] font-bold mt-0.5 ${tab.active ? 'text-white' : 'text-slate-400'}`}>{tab.label}</span>
              </Link>
            );
          }
          return (
            <Link key={tab.to} to={tab.to}
              className={`flex flex-col items-center justify-center py-1.5 flex-1 min-w-0 transition-all duration-200 ${
                tab.active ? 'text-white' : 'text-slate-400'
              }`}>
              <div className={`flex items-center justify-center transition-all duration-200 ${
                tab.active ? 'w-9 h-9 bg-primary/30 rounded-full' : ''
              }`}>
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              </div>
              <span className={`text-[9px] font-bold mt-0.5 truncate max-w-full px-0.5 ${
                tab.active ? 'text-white' : ''
              }`}>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default BottomNav;
