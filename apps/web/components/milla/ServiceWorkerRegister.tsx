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
      void navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignore registration errors in unsupported environments
      });
    } catch {
      // Ignore unexpected SW errors
    }
  }, []);

  return null;
}
