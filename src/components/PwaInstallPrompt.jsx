import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * PWA Install Prompt — Universal mobile + desktop banner
 * Shows on ALL devices that haven't installed the PWA yet.
 *
 * Android Chrome: triggers native install via beforeinstallprompt
 * iOS Safari/Chrome: shows manual "Add to Home Screen" instruction
 * Samsung Internet, Firefox, etc: shows manual install guide
 * Already installed (standalone): banner never shows
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
    document.referrer.includes('android-app://') ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isSafari() {
  return /safari/i.test(navigator.userAgent) && !/chrome|crios|fxios|edgios/i.test(navigator.userAgent);
}

function isSamsungBrowser() {
  return /samsungbrowser/i.test(navigator.userAgent);
}

function isFirefoxMobile() {
  return /firefox/i.test(navigator.userAgent) && /mobile|android/i.test(navigator.userAgent);
}

export function PwaInstallPrompt() {
  const [show, setShow] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const iosDevice = isIOS();
  const safariOnIos = iosDevice && isSafari();
  const [showManual, setShowManual] = useState(false);
  const deferredPrompt = useRef(null);
  const hasNativePrompt = useRef(false);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    // Grab early-captured event
    if (window.__pwaInstallEvent) {
      deferredPrompt.current = window.__pwaInstallEvent;
      hasNativePrompt.current = true;
    }

    // Register callback for late events
    window.__pwaInstallCallbacks = window.__pwaInstallCallbacks || [];
    const callback = (e) => {
      deferredPrompt.current = e;
      hasNativePrompt.current = true;
    };
    window.__pwaInstallCallbacks.push(callback);

    // Direct listener
    const directHandler = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      hasNativePrompt.current = true;
    };
    window.addEventListener('beforeinstallprompt', directHandler);

    // ALWAYS show banner after delay — on ALL devices
    const timer = setTimeout(() => {
      if (!isStandalone() && !isDismissed()) {
        setShow(true);
        setTimeout(() => setAnimateIn(true), 50);
      }
    }, 2000);

    // Listen for successful install
    const installedHandler = () => {
      setAnimateIn(false);
      setTimeout(() => setShow(false), 400);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', directHandler);
      window.removeEventListener('appinstalled', installedHandler);
      const idx = window.__pwaInstallCallbacks?.indexOf(callback);
      if (idx >= 0) window.__pwaInstallCallbacks.splice(idx, 1);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    // iOS always gets manual instructions
    if (iosDevice) {
      setShowManual(true);
      return;
    }

    // Try native prompt first
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
      // No native prompt available — show manual instructions
      setShowManual(true);
    }
  }, [iosDevice]);

  const handleDismiss = useCallback(() => {
    try { localStorage.setItem(DISMISS_KEY, Date.now().toString()); } catch {}
    setAnimateIn(false);
    setTimeout(() => setShow(false), 400);
  }, []);

  // Get device-specific instructions
  const getManualSteps = () => {
    if (safariOnIos) {
      return [
        ['1', <>Ketuk ikon <strong style={{ color: '#60a5fa' }}>⬆ Bagikan</strong> di bagian bawah Safari</>],
        ['2', <>Gulir dan pilih <strong style={{ color: '#60a5fa' }}>"Add to Home Screen"</strong></>],
        ['3', <>Ketuk <strong style={{ color: 'white' }}>Tambah</strong> di pojok kanan atas</>],
      ];
    }
    if (iosDevice) {
      // iOS Chrome/Firefox — must use Safari
      return [
        ['1', <>Buka halaman ini di <strong style={{ color: '#60a5fa' }}>Safari</strong></>],
        ['2', <>Ketuk ikon <strong style={{ color: '#60a5fa' }}>⬆ Bagikan</strong> di bagian bawah</>],
        ['3', <>Pilih <strong style={{ color: '#60a5fa' }}>"Add to Home Screen"</strong></>],
      ];
    }
    if (isSamsungBrowser()) {
      return [
        ['1', <>Ketuk ikon <strong style={{ color: '#60a5fa' }}>☰</strong> (menu) di kanan bawah</>],
        ['2', <>Pilih <strong style={{ color: '#60a5fa' }}>"Add page to" → "Home screen"</strong></>],
        ['3', <>Ketuk <strong style={{ color: 'white' }}>Tambah</strong></>],
      ];
    }
    if (isFirefoxMobile()) {
      return [
        ['1', <>Ketuk ikon <strong style={{ color: '#60a5fa' }}>⋮</strong> (titik tiga) di kanan atas</>],
        ['2', <>Pilih <strong style={{ color: '#60a5fa' }}>"Install"</strong> atau <strong style={{ color: '#60a5fa' }}>"Add to Home Screen"</strong></>],
        ['3', <>Ketuk <strong style={{ color: 'white' }}>Install</strong></>],
      ];
    }
    // Default Chrome/Edge Android
    return [
      ['1', <>Ketuk ikon <strong style={{ color: 'white' }}>⋮</strong> (titik tiga) di pojok kanan atas</>],
      ['2', <>Pilih <strong style={{ color: '#60a5fa' }}>"Install app"</strong> atau <strong style={{ color: '#60a5fa' }}>"Add to Home screen"</strong></>],
      ['3', <>Ketuk <strong style={{ color: 'white' }}>Install</strong> pada dialog</>],
    ];
  };

  const getSubtitle = () => {
    if (safariOnIos) return <>Ketuk <strong style={{ color: '#60a5fa' }}>⬆</strong> lalu "Add to Home Screen"</>;
    if (iosDevice) return 'Buka di Safari untuk install';
    return 'Akses cepat dari layar utama';
  };

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
          background: 'linear-gradient(135deg, #1E40AF 0%, #1a1028 100%)',
          border: '1px solid rgba(96, 165, 250, 0.35)',
          borderRadius: 14,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 12px rgba(96,165,250,0.15)',
        }}>
          <img src="/logo.png" alt="Raport TK" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700, fontSize: 13, color: '#fff', lineHeight: 1.3 }}>
              Install Raport TK
            </div>
            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.3, marginTop: 1 }}>
              {getSubtitle()}
            </div>
          </div>
          <button
            onClick={handleInstall}
            style={{
              background: 'linear-gradient(135deg, #3B82F6, #1E40AF)',
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
              animation: 'pwa-pulse-blue 2s ease-in-out infinite',
            }}
          >
            {iosDevice ? 'Cara Install' : 'Install'}
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
            background: 'linear-gradient(135deg, #1E40AF, #1a1028)',
            border: '1px solid rgba(96,165,250,0.3)',
            borderRadius: 18,
            padding: '24px 20px',
            maxWidth: 320,
            width: '100%',
            textAlign: 'center',
            color: 'white',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, color: '#60a5fa' }}>📲 Install Raport TK</h3>
            {getManualSteps().map(([num, text]) => (
              <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', padding: '8px 0', borderBottom: num !== '3' ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(96,165,250,0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{num}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{text}</div>
              </div>
            ))}
            <button
              onClick={() => { setShowManual(false); handleDismiss(); }}
              style={{ marginTop: 16, background: 'linear-gradient(135deg, #3B82F6, #1E40AF)', color: 'white', border: 'none', borderRadius: 10, padding: '10px 28px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
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
        @keyframes pwa-pulse-blue { 0%, 100% { box-shadow: 0 2px 12px rgba(59,130,246,0.3); } 50% { box-shadow: 0 2px 20px rgba(59,130,246,0.55); } }
      `}</style>
    </>
  );
}
