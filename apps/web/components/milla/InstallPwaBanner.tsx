'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CheckCircle2, Download, MoreVertical, PlusSquare, Share, X } from 'lucide-react';
import { useMillaStore } from '@/store/milla-store';
import type { AppLanguage } from '@/lib/milla-i18n';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const INSTALL_INTENT_KEY = 'milla-wants-install';

type DevicePlatform = 'ios' | 'android' | 'desktop';

function getInstallCopy(language: AppLanguage, platform: DevicePlatform) {
  if (language === 'en') {
    return {
      title: 'Add Al-Millah to Home Screen',
      subReady: 'One tap to install on your device',
      subGuide: 'Tap to see easy visual steps',
      btnReady: 'Install Now',
      btnGuide: 'How to Install',
      homeBtnReady: 'Install App on Home Screen',
      homeBtnGuide: 'Add to Home Screen (Install Guide)',
      modalTitle: 'Add Al-Millah in 3 Easy Steps',
      close: 'Close',
      doneBtn: 'Got it',
      steps:
        platform === 'ios'
          ? [
              'Tap the Share button at the bottom of Safari.',
              'Scroll down and tap "Add to Home Screen".',
              'Tap "Add" at the top corner.',
            ]
          : platform === 'android'
            ? [
                'Tap the 3-dot menu (⋮) at the top corner of Chrome.',
                'Tap "Install app" or "Add to Home screen".',
                'Tap "Install" to confirm.',
              ]
            : [
                'Click the Install icon on the right side of the address bar (or open ⋮ menu).',
                'Choose "Install Al-Millah".',
                'Click "Install" to add it to your desktop.',
              ],
    };
  }
  if (language === 'fr') {
    return {
      title: 'Ajouter Al-Millah à l’écran d’accueil',
      subReady: 'Un seul geste pour l’installer',
      subGuide: 'Appuyez pour voir les étapes simples',
      btnReady: 'Installer',
      btnGuide: 'Comment installer',
      homeBtnReady: 'Installer sur l’écran d’accueil',
      homeBtnGuide: 'Ajouter à l’écran d’accueil (Guide)',
      modalTitle: 'Installer Al-Millah en 3 étapes simples',
      close: 'Fermer',
      doneBtn: 'Compris',
      steps:
        platform === 'ios'
          ? [
              'Appuyez sur Partager en bas de Safari.',
              'Choisissez « Sur l’écran d’accueil ».',
              'Appuyez sur « Ajouter » en haut.',
            ]
          : platform === 'android'
            ? [
                'Appuyez sur le menu (⋮) en haut de Chrome.',
                'Appuyez sur « Installer l’application ».',
                'Confirmez en appuyant sur « Installer ».',
              ]
            : [
                'Cliquez sur l’icône d’installation dans la barre d’adresse (ou le menu ⋮).',
                'Choisissez « Installer Al-Millah ».',
                'Cliquez sur « Installer ».',
              ],
    };
  }
  return {
    title: 'أضف المِلّة إلى شاشتك الرئيسية',
    subReady: 'ضغطة واحدة لتثبيت التطبيق على جهازك',
    subGuide: 'اضغط هنا لخطوات التثبيت السهلة',
    btnReady: 'تثبيت الآن',
    btnGuide: 'طريقة التثبيت',
    homeBtnReady: 'تثبيت التطبيق على الشاشة الرئيسية',
    homeBtnGuide: 'تثبيت التطبيق على الشاشة الرئيسية (دليل التثبيت)',
    modalTitle: 'تثبيت المِلّة في ٣ خطوات بسيطة',
    close: 'إغلاق',
    doneBtn: 'فهمت، حسناً',
    steps:
      platform === 'ios'
        ? [
            'اضغط على زر المشاركة (المربع بسهم للأعلى) أسفل الشاشة.',
            'اختر «إضافة إلى الشاشة الرئيسية».',
            'اضغط «إضافة» ليظهر التطبيق مع برامجك.',
          ]
        : platform === 'android'
          ? [
              'اضغط على النقاط الثلاث (⋮) أعلى زاوية المتصفح.',
              'اختر «تثبيت التطبيق» أو «الإضافة إلى الشاشة الرئيسية».',
              'اضغط «تثبيت» للتأكيد.',
            ]
          : [
              'اضغط على أيقونة التثبيت يمين شريط العنوان (أو قائمة ⋮).',
              'اختر «تثبيت المِلّة».',
              'اضغط «تثبيت» ليفتح كتطبيق مستقل.',
            ],
  };
}

function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [wantsInstall, setWantsInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState<DevicePlatform>('android');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      return;
    }

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
    if (/iPad|iPhone|iPod/.test(ua) && !('MSStream' in window)) {
      setPlatform('ios');
    } else if (/Android/i.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setWantsInstall(false);
      setIsStandalone(true);
      try {
        window.sessionStorage.removeItem(INSTALL_INTENT_KEY);
      } catch {
        // Ignore
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null);
      setWantsInstall(false);
    }
    return true;
  };

  return { deferredPrompt, wantsInstall, setWantsInstall, isStandalone, platform, triggerInstall };
}

function InstallGuideModal({
  open,
  onClose,
  platform,
  copy,
}: {
  open: boolean;
  onClose: () => void;
  platform: DevicePlatform;
  copy: ReturnType<typeof getInstallCopy>;
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-guide-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
    >
      <div className="w-full max-w-md space-y-4 rounded-3xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between gap-2">
          <h2 id="install-guide-title" className="text-lg font-bold text-foreground">
            {copy.modalTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="rounded-xl p-2 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ol className="space-y-3">
          {copy.steps.map((stepText, idx) => {
            const StepIcon =
              idx === 0
                ? platform === 'ios'
                  ? Share
                  : MoreVertical
                : idx === 1
                  ? PlusSquare
                  : CheckCircle2;
            return (
              <li
                key={stepText}
                className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3.5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <StepIcon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="text-sm font-medium leading-relaxed text-foreground">{stepText}</p>
              </li>
            );
          })}
        </ol>

        <button
          type="button"
          onClick={onClose}
          className="flex min-h-[50px] w-full items-center justify-center rounded-2xl bg-primary text-base font-bold text-primary-foreground hover:opacity-95"
        >
          {copy.doneBtn}
        </button>
      </div>
    </div>
  );
}

export function HomeInstallButton() {
  const language = useMillaStore((s) => s.language);
  const { deferredPrompt, isStandalone, platform, triggerInstall } = usePwaInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isStandalone) return null;

  const copy = getInstallCopy(language, platform);

  const handleClick = async () => {
    const prompted = await triggerInstall();
    if (!prompted) {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 text-sm font-bold text-foreground transition-colors hover:bg-secondary/60"
      >
        <Download className="h-4 w-4 text-primary" aria-hidden="true" />
        <span>{deferredPrompt ? copy.homeBtnReady : copy.homeBtnGuide}</span>
      </button>

      <InstallGuideModal
        open={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        platform={platform}
        copy={copy}
      />
    </>
  );
}

export function InstallPwaBanner() {
  const pathname = usePathname();
  const language = useMillaStore((s) => s.language);
  const { deferredPrompt, wantsInstall, setWantsInstall, isStandalone, platform, triggerInstall } =
    usePwaInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || isStandalone || (!deferredPrompt && !wantsInstall)) return null;

  const isOnboarding = pathname?.startsWith('/onboarding');
  const copy = getInstallCopy(language, platform);

  const handleActionClick = async () => {
    const prompted = await triggerInstall();
    if (!prompted) {
      setShowGuideModal(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setWantsInstall(false);
    setShowGuideModal(false);
    try {
      window.sessionStorage.removeItem(INSTALL_INTENT_KEY);
    } catch {
      // Ignore
    }
  };

  return (
    <>
      <div
        className={`fixed inset-x-4 z-50 mx-auto max-w-md rounded-2xl border border-primary/35 bg-card p-3.5 shadow-lg ${
          isOnboarding ? 'top-16' : 'bottom-20'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
              <Download className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">{copy.title}</p>
              <p className="text-xs text-muted-foreground">
                {deferredPrompt ? copy.subReady : copy.subGuide}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => void handleActionClick()}
              className="min-h-[42px] rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground hover:opacity-95"
            >
              {deferredPrompt ? copy.btnReady : copy.btnGuide}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label={copy.close}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <InstallGuideModal
        open={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        platform={platform}
        copy={copy}
      />
    </>
  );
}
