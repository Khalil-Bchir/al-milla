'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    try {
      void navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignore registration errors in dev/unsupported environments
      });
    } catch {
      // Ignore unexpected SW errors
    }
  }, []);

  return null;
}
