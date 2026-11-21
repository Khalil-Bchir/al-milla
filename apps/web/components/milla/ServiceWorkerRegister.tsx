'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    try {
      if (process.env.NODE_ENV !== 'production') {
        void navigator.serviceWorker
          .getRegistrations()
          .then((regs) => Promise.all(regs.map((r) => r.unregister())))
          .catch(() => undefined);
        return;
      }
      const hadController = Boolean(navigator.serviceWorker.controller);
      let reloading = false;
      const handleControllerChange = () => {
        if (!hadController || reloading) return;
        reloading = true;
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      void navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((reg) => reg.update().catch(() => undefined))
        .catch(() => {
          // Ignore registration errors in unsupported environments
        });

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    } catch {
      // Ignore unexpected SW errors
    }
  }, []);

  return null;
}
