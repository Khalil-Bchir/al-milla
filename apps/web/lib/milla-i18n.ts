export type AppLanguage = 'ar' | 'en' | 'fr';

export interface MillaCopy {
  brandName: string;
  tagline: string;
  navHome: string;
  navMemorize: string;
  navRevision: string;
  navProgress: string;
  mushafLink: string;
  settingsLink: string;
  onboardingLink: string;
  offlineLabel: string;
  onlineLabel: string;
  freeIndividualNote: string;
  noAccountNote: string;
  selfEvalDisclaimer: string;
  homeGreeting: string;
  homeSubgreeting: string;
  homeTodayWird: string;
  homeContinueCta: string;
  homeRevisionTitle: string;
  homeNewMemTitle: string;
  homeOpenMushaf: string;
}

export const MILLA_COPY: Record<AppLanguage, MillaCopy> = {
  ar: {
    brandName: 'المِلّة',
    tagline: 'رحلتك مع حفظ القرآن الكريم',
    navHome: 'الرئيسية',
    navMemorize: 'الحفظ',
    navRevision: 'المراجعة',
    navProgress: 'حسابي',
    mushafLink: 'المصحف',
    settingsLink: 'الإعدادات',
    onboardingLink: 'البداية',
    offlineLabel: 'محفوظ محلياً (أوفلاين)',
    onlineLabel: 'متصل • حفظ محلي',
    freeIndividualNote: 'تطبيق مجاني فردي بالكامل بدون اشتراكات أو إعلانات.',
    noAccountNote: 'يُحفظ تقدّمك محلياً على جهازك دون الحاجة لتسجيل حساب.',
    selfEvalDisclaimer:
      'التقييم الذاتي معين على التثبيت ولا يغني عن التلقّي والمشافهة لدى معلم مجاز في التجويد.',
    homeGreeting: 'السلام عليكم ورحمة الله',
    homeSubgreeting: 'خطوة هادئة كل يوم تثبّت حفظك دون عجلة.',
    homeTodayWird: 'ورد اليوم',
    homeContinueCta: 'متابعة التعلّم الآن',
    homeRevisionTitle: 'مراجعة اليوم',
    homeNewMemTitle: 'الحفظ الجديد',
    homeOpenMushaf: 'فتح المصحف الشريف',
  },
  en: {
    brandName: 'Al-Millah',
    tagline: 'Your calm Quran memorization companion',
    navHome: 'Home',
    navMemorize: 'Memorize',
    navRevision: 'Revision',
    navProgress: 'Progress',
    mushafLink: 'Mushaf',
    settingsLink: 'Settings',
    onboardingLink: 'Setup',
    offlineLabel: 'Offline ready (local)',
    onlineLabel: 'Local-first storage',
    freeIndividualNote: 'Completely free, individual-only companion with no ads or subscriptions.',
    noAccountNote: 'Your progress is saved locally on your device with no account required.',
    selfEvalDisclaimer:
      'Self-evaluation supports retention and does not replace qualified Tajweed teacher feedback.',
    homeGreeting: 'Peace and blessings be upon you',
    homeSubgreeting: 'A calm daily step strengthens your memorization without rush.',
    homeTodayWird: "Today's Portion",
    homeContinueCta: 'Continue Learning Now',
    homeRevisionTitle: "Today's Revision",
    homeNewMemTitle: 'New Memorization',
    homeOpenMushaf: 'Open Noble Mushaf',
  },
  fr: {
    brandName: 'Al-Millah',
    tagline: 'Votre compagnon serein pour mémoriser le Coran',
    navHome: 'Accueil',
    navMemorize: 'Mémoriser',
    navRevision: 'Révision',
    navProgress: 'Progrès',
    mushafLink: 'Mushaf',
    settingsLink: 'Paramètres',
    onboardingLink: 'Début',
    offlineLabel: 'Prêt hors ligne (local)',
    onlineLabel: 'Stockage local',
    freeIndividualNote: 'Compagnon gratuit et individuel, sans publicités ni abonnements.',
    noAccountNote: 'Votre progression est enregistrée localement sur votre appareil sans compte requis.',
    selfEvalDisclaimer:
      'L’auto-évaluation aide à la révision et ne remplace pas un enseignant qualifié de Tajwid.',
    homeGreeting: 'Que la paix et la bénédiction soient sur vous',
    homeSubgreeting: 'Un pas serein chaque jour consolide votre mémorisation sans hâte.',
    homeTodayWird: 'Portion du jour',
    homeContinueCta: 'Continuer la séance',
    homeRevisionTitle: 'Révision du jour',
    homeNewMemTitle: 'Nouvelle mémorisation',
    homeOpenMushaf: 'Ouvrir le Noble Mushaf',
  },
};
