import React, { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';

function PushNotificationToggle() {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already subscribed
    if ('serviceWorker' in navigator && permission === 'granted') {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setSubscribed(!!sub);
        });
      });
    }
  }, [permission]);

  const subscribe = async () => {
    setLoading(true);
    try {
      // 1. Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setLoading(false);
        return;
      }

      // 2. Get VAPID key
      const { data: keyData } = await apiClient.get('/push/vapid-key');

      // 3. Subscribe
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
      });

      // 4. Send to backend
      const subJson = sub.toJSON();
      await apiClient.post('/push/subscribe', {
        endpoint: subJson.endpoint,
        keys: subJson.keys,
      });

      setSubscribed(true);
    } catch (err) {
      console.error('Push subscribe failed:', err);
    }
    setLoading(false);
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await apiClient.delete('/push/unsubscribe', { data: { endpoint: sub.endpoint } });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error('Push unsubscribe failed:', err);
    }
    setLoading(false);
  };

  // Not supported
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
        <span className="material-symbols-outlined text-red-400 text-lg">notifications_off</span>
        <div>
          <p className="text-xs font-bold text-red-400">Notifikasi Diblokir</p>
          <p className="text-[10px] text-slate-500">Aktifkan di pengaturan browser Anda</p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={subscribed ? unsubscribe : subscribe}
      disabled={loading}
      className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
        subscribed
          ? 'bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20'
          : 'bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20'
      }`}
    >
      <span className={`material-symbols-outlined text-lg ${subscribed ? 'text-emerald-400' : 'text-blue-400'}`}>
        {subscribed ? 'notifications_active' : 'notifications'}
      </span>
      <div className="text-left flex-1">
        <p className={`text-xs font-bold ${subscribed ? 'text-emerald-400' : 'text-blue-400'}`}>
          {loading ? 'Memproses...' : subscribed ? 'Notifikasi Aktif' : 'Aktifkan Notifikasi'}
        </p>
        <p className="text-[10px] text-slate-500">
          {subscribed ? 'Anda akan menerima notifikasi pesan baru' : 'Terima pesan layaknya WhatsApp'}
        </p>
      </div>
      <span className="material-symbols-outlined text-sm text-slate-500">
        {subscribed ? 'toggle_on' : 'toggle_off'}
      </span>
    </button>
  );
}

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default PushNotificationToggle;
