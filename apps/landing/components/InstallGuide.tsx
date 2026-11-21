'use client';

import { useState } from 'react';
import { Download, Monitor, ShieldCheck, Smartphone } from 'lucide-react';
import { Magnet } from '@/components/reactbits/Magnet';
import { formatLandingNum, type LandingLang } from '@/lib/landing-copy';

type DeviceTab = 'android' | 'ios' | 'desktop';

interface InstallGuideProps {
  lang: LandingLang;
  appUrl: string;
}

const GUIDE_TEXT: Record<
  LandingLang,
  {
    title: string;
    subtitle: string;
    oneTapBtn: string;
    securityNote: string;
    trustTitle: string;
    trustBody: string;
    tabs: { id: DeviceTab; label: string; steps: string[] }[];
  }
> = {
  ar: {
    title: 'أضف المِلّة إلى شاشتك الرئيسية',
    subtitle:
      'يعمل التطبيق كتطبيق أصيل على هاتفك وحاسوبك بدون متجر تطبيقات. اضغط الزر أدناه لفتح التطبيق وتثبيته مباشرة.',
    oneTapBtn: 'فتح وتثبيت المِلّة على شاشتك',
    securityNote:
      'ملاحظة: لأمان المستخدمين، تطلب المتصفحات ضغطة تأكيد واحدة منك لإضافة الأيقونة إلى الشاشة الرئيسية.',
    trustTitle: 'اطمئن: تطبيق مجاني لوجه الله ولا يجمع أي بيانات',
    trustBody:
      'نحن لا نطلب اسمك أو بريدك أو رقم هاتفك، ولا نجمع أو نبيع أي بيانات عنك أبداً. إضافة المِلّة إلى شاشتك الرئيسية لا تثبّت برنامجاً غريباً ولا تصل إلى صورك أو ملفاتك؛ هي مجرد اختصار آمن وسريع من متصفحك لفتح المصحف والورد اليومي، ويمكنك حذفه بضغطة واحدة في أي وقت.',
    tabs: [
      {
        id: 'android',
        label: 'أندرويد (Chrome)',
        steps: [
          'اضغط على زر «فتح وتثبيت المِلّة على شاشتك» أعلاه.',
          'سيظهر لك شريط «تثبيت الآن» أسفل الشاشة، اضغط عليه.',
          'أكّد «تثبيت» لتظهر أيقونة المِلّة على شاشتك الرئيسية فوراً.',
        ],
      },
      {
        id: 'ios',
        label: 'آيفون (Safari)',
        steps: [
          'افتح التطبيق في متصفح Safari عبر الزر أعلاه.',
          'اضغط على أيقونة المشاركة (المربع بسهم للأعلى) في شريط المتصفح.',
          'اختر «إضافة إلى الشاشة الرئيسية» ثم اضغط «إضافة».',
        ],
      },
      {
        id: 'desktop',
        label: 'الحاسوب (Chrome / Edge)',
        steps: [
          'افتح التطبيق عبر الزر أعلاه.',
          'اضغط على أيقونة التثبيت في يمين شريط العنوان أو من شريط التطبيق.',
          'سيعمل المِلّة في نافذة مستقلة هادئة كأي برنامج على جهازك.',
        ],
      },
    ],
  },
  en: {
    title: 'Add Al-Millah to your Home Screen',
    subtitle:
      'Works like a native app on your phone or computer with no app store needed. Tap below to open and install.',
    oneTapBtn: 'Open & Install Al-Millah',
    securityNote:
      'Note: For your security, browsers always require one confirmation tap before adding an app icon to your home screen.',
    trustTitle: 'Safe, Free & Zero Data Collection',
    trustBody:
      'Al-Millah is offered purely as a free service with no ads and no hidden agenda. We never ask for your name, email, or phone number, and we never collect or track your personal data. Adding it to your home screen does not install an invasive program or access your photos, contacts, or files; it is simply a safe browser shortcut that you can remove anytime with one tap.',
    tabs: [
      {
        id: 'android',
        label: 'Android (Chrome)',
        steps: [
          'Tap "Open & Install Al-Millah" above.',
          'Tap the "Install App" prompt that appears at the bottom.',
          'Confirm "Install" to add the Al-Millah icon to your home screen.',
        ],
      },
      {
        id: 'ios',
        label: 'iPhone (Safari)',
        steps: [
          'Open the app in Safari using the button above.',
          'Tap the Share icon (square with upward arrow) at the bottom bar.',
          'Scroll down, tap "Add to Home Screen", then tap "Add".',
        ],
      },
      {
        id: 'desktop',
        label: 'Desktop (Chrome / Edge)',
        steps: [
          'Open the app using the button above.',
          'Click "Install App" in the banner or the install icon in the address bar.',
          'Al-Millah opens in its own calm, distraction-free window.',
        ],
      },
    ],
  },
  fr: {
    title: 'Ajouter Al-Millah à votre écran d’accueil',
    subtitle:
      'Fonctionne comme une véritable application sans passer par un store. Appuyez ci-dessous pour l’installer.',
    oneTapBtn: 'Ouvrir et installer Al-Millah',
    securityNote:
      'Note : Par sécurité, les navigateurs demandent toujours une confirmation en un clic pour ajouter l’icône.',
    trustTitle: 'Sûr, gratuit et sans aucune collecte de données',
    trustBody:
      'Al-Millah est entièrement gratuit, sans publicité ni contrepartie cachée. Nous ne demandons ni nom, ni e-mail, ni numéro de téléphone, et nous ne collectons aucune donnée personnelle. L’ajouter à votre écran d’accueil n’installe aucun logiciel intrusif et n’accède ni à vos photos ni à vos fichiers : c’est un simple raccourci sûr que vous pouvez supprimer à tout moment.',
    tabs: [
      {
        id: 'android',
        label: 'Android (Chrome)',
        steps: [
          'Appuyez sur « Ouvrir et installer Al-Millah » ci-dessus.',
          'Appuyez sur le bouton « Installer » qui s’affiche en bas.',
          'Confirmez pour placer l’icône sur votre écran d’accueil.',
        ],
      },
      {
        id: 'ios',
        label: 'iPhone (Safari)',
        steps: [
          'Ouvrez l’application dans Safari avec le bouton ci-dessus.',
          'Appuyez sur l’icône Partager en bas de l’écran.',
          'Choisissez « Sur l’écran d’accueil » puis « Ajouter ».',
        ],
      },
      {
        id: 'desktop',
        label: 'Ordinateur (Chrome / Edge)',
        steps: [
          'Ouvrez l’application avec le bouton ci-dessus.',
          'Cliquez sur « Installer » dans la bannière ou dans la barre d’adresse.',
          'Al-Millah s’ouvrira dans sa propre fenêtre épurée.',
        ],
      },
    ],
  },
};

export function InstallGuide({ lang, appUrl }: InstallGuideProps) {
  const [activeTab, setActiveTab] = useState<DeviceTab>('android');
  const content = GUIDE_TEXT[lang];
  const currentTab = content.tabs.find((t) => t.id === activeTab) ?? content.tabs[0];

  return (
    <section id="install" className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-xl space-y-2">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{content.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {content.subtitle}
            </p>
          </div>

          <Magnet>
            <a
              href={`${appUrl}?install=1`}
              className="inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-95"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>{content.oneTapBtn}</span>
            </a>
          </Magnet>
        </div>

        {/* Platform Switcher */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-border pb-4">
          {content.tabs.map((tab) => {
            const selected = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-4 text-xs font-bold transition-colors ${
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:bg-secondary'
                }`}
              >
                {tab.id === 'desktop' ? (
                  <Monitor className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Smartphone className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Numbered Steps */}
        <ol className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {currentTab.steps.map((stepText, idx) => (
            <li
              key={stepText}
              className="flex items-start gap-3 rounded-2xl border border-border/80 bg-background/70 p-4"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-primary">
                {formatLandingNum(idx + 1, lang)}
              </span>
              <p className="text-xs leading-relaxed text-foreground sm:text-sm">{stepText}</p>
            </li>
          ))}
        </ol>

        <p className="mt-5 text-xs text-muted-foreground">{content.securityNote}</p>

        {/* Simple, Polite Trust & Safety Reassurance */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-secondary/45 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-foreground">{content.trustTitle}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {content.trustBody}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
