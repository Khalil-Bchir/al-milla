'use client';

import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { useMillaStore } from '@/store/milla-store';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPwaBanner() {
  const language = useMillaStore((s) => s.language);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIosHint, setIsIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    const params = new URLSearchParams(window.location.search);
    const wantsInstall = params.get('install') === '1';

    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);
    if (isIos && wantsInstall) {
      setIsIosHint(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (dismissed || (!deferredPrompt && !isIosHint)) return null;

  const copy =
    language === 'en'
      ? {
          title: 'Add Al-Millah to Home Screen',
          iosSub: 'Tap Share, then "Add to Home Screen"',
          btn: 'Install App',
          close: 'Close',
        }
      : language === 'fr'
        ? {
            title: 'Ajouter Al-Millah à l’écran d’accueil',
            iosSub: 'Appuyez sur Partager puis « Sur l’écran d’accueil »',
            btn: 'Installer',
            close: 'Fermer',
          }
        : {
            title: 'أضف المِلّة إلى شاشتك الرئيسية',
            iosSub: 'اضغط على زر المشاركة ثم «إضافة إلى الشاشة الرئيسية»',
            btn: 'تثبيت الآن',
            close: 'إغلاق',
          };

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-md rounded-2xl border border-primary/30 bg-card p-3.5 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {isIosHint ? (
            <Share className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          ) : (
            <Download className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          )}
          <div>
            <p className="text-xs font-bold text-foreground">{copy.title}</p>
            {isIosHint && <p className="text-[11px] text-muted-foreground">{copy.iosSub}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {deferredPrompt && (
            <button
              type="button"
              onClick={() => void handleInstallClick()}
              className="min-h-[38px] rounded-xl bg-primary px-3.5 text-xs font-bold text-primary-foreground hover:opacity-95"
            >
              {copy.btn}
            </button>
          )}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label={copy.close}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
