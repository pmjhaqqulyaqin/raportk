import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * PWA Install Prompt — TOP position banner
 * Reads from window.__pwaInstallEvent captured in index.html
 *
 * Android Chrome: triggers native install via beforeinstallprompt
 * iOS Safari: shows manual "Add to Home Screen" instruction
 * Already installed: banner never shows
 * Dismissed: hidden for 7 days
 */

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DAYS = 7;

function isDismissed() {
  try {
    const val = localStorage.getItem(DISMISS_KEY);
    if (!val) return false;
    return (Date.now() - parseInt(val, 10)) / (1000 * 60 * 60 * 24) < DISMISS_DAYS;
  } catch { return false; }
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function isMobile() {
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isSafari() {
  return /safari/i.test(navigator.userAgent) && !/chrome|crios|fxios/i.test(navigator.userAgent);
}

export function PwaInstallPrompt() {
  const [show, setShow] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [isIosDevice] = useState(() => isIOS() || isSafari());
  const [showManual, setShowManual] = useState(false);
  const deferredPrompt = useRef(null);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    // Grab early-captured event
    if (window.__pwaInstallEvent) {
      deferredPrompt.current = window.__pwaInstallEvent;
    }

    // Register callback for late events
    window.__pwaInstallCallbacks = window.__pwaInstallCallbacks || [];
    const callback = (e) => { deferredPrompt.current = e; };
    window.__pwaInstallCallbacks.push(callback);

    // Direct listener
    const directHandler = (e) => { e.preventDefault(); deferredPrompt.current = e; };
    window.addEventListener('beforeinstallprompt', directHandler);

    // Show banner after delay
    const timer = setTimeout(() => {
      if (isMobile() || isIosDevice || deferredPrompt.current) {
        setShow(true);
        setTimeout(() => setAnimateIn(true), 50);
      }
    }, 2500);

    // Listen for successful install
    const installedHandler = () => { setAnimateIn(false); setTimeout(() => setShow(false), 400); };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', directHandler);
      window.removeEventListener('appinstalled', installedHandler);
      const idx = window.__pwaInstallCallbacks?.indexOf(callback);
      if (idx >= 0) window.__pwaInstallCallbacks.splice(idx, 1);
    };
  }, [isIosDevice]);

  const handleInstall = useCallback(async () => {
    if (isIosDevice) {
      handleDismiss();
      return;
    }
    const prompt = deferredPrompt.current || window.__pwaInstallEvent;
    if (prompt) {
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          setAnimateIn(false);
          setTimeout(() => setShow(false), 400);
        }
      } catch {
        setShowManual(true);
      }
      deferredPrompt.current = null;
      window.__pwaInstallEvent = null;
    } else {
      setShowManual(true);
    }
  }, [isIosDevice]);

  const handleDismiss = useCallback(() => {
    try { localStorage.setItem(DISMISS_KEY, Date.now().toString()); } catch {}
    setAnimateIn(false);
    setTimeout(() => setShow(false), 400);
  }, []);

  if (!show) return null;

  return (
    <>
      {/* Banner — TOP position */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          padding: '8px 10px',
          animation: animateIn
            ? 'pwa-slide-down 0.4s cubic-bezier(0.16,1,0.3,1) forwards'
            : 'pwa-slide-up-out 0.35s ease forwards',
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #1a1028 0%, #0f0a1a 100%)',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          borderRadius: 14,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 12px rgba(168,85,247,0.08)',
        }}>
          <img src="/pwa-icon-192x192.png" alt="CetakRaport" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700, fontSize: 13, color: '#fff', lineHeight: 1.3 }}>
              Install CetakRaport
            </div>
            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.3, marginTop: 1 }}>
              {isIosDevice ? (
                <>Ketuk <strong style={{ color: '#a855f7' }}>⬆</strong> lalu "Add to Home Screen"</>
              ) : (
                'Akses cepat dari layar utama'
              )}
            </div>
          </div>
          <button
            onClick={handleInstall}
            style={{
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              animation: isIosDevice ? 'none' : 'pwa-pulse-purple 2s ease-in-out infinite',
            }}
          >
            {isIosDevice ? 'OK' : 'Install'}
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Tutup"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.3)',
              cursor: 'pointer',
              padding: '2px 4px',
              fontSize: 16,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Manual install instructions overlay */}
      {showManual && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowManual(false); }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div style={{
            background: '#1a1028',
            border: '1px solid rgba(168,85,247,0.3)',
            borderRadius: 18,
            padding: '24px 20px',
            maxWidth: 320,
            width: '100%',
            textAlign: 'center',
            color: 'white',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, color: '#a855f7' }}>📲 Install Aplikasi</h3>
            {[
              ['1', <>Ketuk ikon <strong style={{ color: 'white' }}>⋮</strong> (titik tiga) di pojok kanan atas Chrome</>],
              ['2', <>Pilih <strong style={{ color: '#a855f7' }}>"Install app"</strong> atau <strong style={{ color: '#a855f7' }}>"Add to Home screen"</strong></>],
              ['3', <>Ketuk <strong style={{ color: 'white' }}>Install</strong> pada dialog</>],
            ].map(([num, text]) => (
              <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', padding: '8px 0', borderBottom: num !== '3' ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(168,85,247,0.15)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{num}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{text}</div>
              </div>
            ))}
            <button
              onClick={() => { setShowManual(false); handleDismiss(); }}
              style={{ marginTop: 16, background: 'linear-gradient(135deg, #a855f7, #7c3aed)', color: 'white', border: 'none', borderRadius: 10, padding: '10px 28px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes pwa-slide-down { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pwa-slide-up-out { from { transform: translateY(0); opacity: 1; } to { transform: translateY(-100%); opacity: 0; } }
        @keyframes pwa-pulse-purple { 0%, 100% { box-shadow: 0 2px 12px rgba(168,85,247,0.3); } 50% { box-shadow: 0 2px 20px rgba(168,85,247,0.55); } }
      `}</style>
    </>
  );
}
