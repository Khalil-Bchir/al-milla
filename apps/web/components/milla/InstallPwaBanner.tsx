'use client';

import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { useMillaStore } from '@/store/milla-store';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const INSTALL_INTENT_KEY = 'milla-wants-install';

export function InstallPwaBanner() {
  const language = useMillaStore((s) => s.language);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [wantsInstall, setWantsInstall] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('install') === '1') {
      try {
        window.sessionStorage.setItem(INSTALL_INTENT_KEY, '1');
      } catch {
        // Ignore storage errors
      }
      setWantsInstall(true);
    } else {
      try {
        if (window.sessionStorage.getItem(INSTALL_INTENT_KEY) === '1') {
          setWantsInstall(true);
        }
      } catch {
        // Ignore storage errors
      }
    }

    const ua = window.navigator.userAgent;
    setIsIos(/iPad|iPhone|iPod/.test(ua) && !('MSStream' in window));

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
      setWantsInstall(false);
      try {
        window.sessionStorage.removeItem(INSTALL_INTENT_KEY);
      } catch {
        // Ignore
      }
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      window.sessionStorage.removeItem(INSTALL_INTENT_KEY);
    } catch {
      // Ignore
    }
  };

  if (dismissed || (!deferredPrompt && !wantsInstall)) return null;

  const copy =
    language === 'en'
      ? {
          title: 'Install Al-Millah on Your Home Screen',
          iosSub: 'Tap Share (⎙) below, then "Add to Home Screen".',
          fallbackSub: 'Open browser menu (⋮ or address bar icon) → "Install app" or "Add to Home screen".',
          btn: 'Install Now',
          close: 'Close',
        }
      : language === 'fr'
        ? {
            title: 'Installer Al-Millah sur votre écran d’accueil',
            iosSub: 'Appuyez sur Partager puis « Sur l’écran d’accueil ».',
            fallbackSub: 'Ouvrez le menu du navigateur (⋮) → « Installer l’application ».',
            btn: 'Installer',
            close: 'Fermer',
          }
        : {
            title: 'تثبيت المِلّة على شاشتك الرئيسية',
            iosSub: 'اضغط على زر المشاركة ثم اختر «إضافة إلى الشاشة الرئيسية».',
            fallbackSub: 'من قائمة المتصفح (⋮ أو أيقونة التثبيت في شريط العنوان) اختر «تثبيت التطبيق».',
            btn: 'تثبيت الآن',
            close: 'إغلاق',
          };

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-md rounded-2xl border border-primary/35 bg-card p-4 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {isIos ? (
            <Share className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          ) : (
            <Download className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          )}
          <div>
            <p className="text-xs font-bold text-foreground">{copy.title}</p>
            {!deferredPrompt && (
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {isIos ? copy.iosSub : copy.fallbackSub}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
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
            onClick={handleDismiss}
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
