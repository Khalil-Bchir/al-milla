export type LandingLang = 'ar' | 'en' | 'fr';

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const;

export function formatLandingNum(num: number, lang: LandingLang): string {
  if (lang !== 'ar') return num.toLocaleString('en-US');
  return String(num).replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)] ?? d);
}

export interface LandingCopy {
  brand: string;
  navMethod: string;
  navPrinciples: string;
  navStart: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroNoAccount: string;
  statsSurahs: string;
  statsVerses: string;
  statsPages: string;
  statsReciters: string;
  methodTitle: string;
  methodSubtitle: string;
  stages: {
    step: number;
    title: string;
    desc: string;
  }[];
  principlesTitle: string;
  principlesSubtitle: string;
  principles: {
    title: string;
    desc: string;
  }[];
  finalTitle: string;
  finalSubtitle: string;
  finalCta: string;
  footerTagline: string;
  footerOpenApp: string;
  previewHeader: string;
  previewHideText: string;
  previewShowText: string;
  previewHiddenHint: string;
  previewEvalLabel: string;
  previewRatings: { id: 'difficult' | 'good' | 'easy'; label: string; hint: string }[];
  previewEvalThanks: string;
}

export const LANDING_COPY: Record<LandingLang, LandingCopy> = {
  ar: {
    brand: 'المِلّة',
    navMethod: 'المنهجية',
    navPrinciples: 'المبادئ',
    navStart: 'افتح التطبيق',
    heroBadge: 'برواية حفص عن عاصم • مجاني بالكامل',
    heroTitle: 'احفظ القرآن الكريم بهدوء وثبات، بلا ضجيج ولا استعجال',
    heroSubtitle:
      'رفيق فردي يومي يجمع بين مراجعة الأمس والمراجعة السابقة والحفظ الجديد والتسميع وربط الآيات — دون حساب إلزامي، ودون إعلانات أو لوحات تنافس.',
    heroPrimaryCta: 'ابدأ رحلة الحفظ الآن',
    heroSecondaryCta: 'تعرّف على الخطوات الخمس',
    heroNoAccount: 'يعمل مباشرة من متصفحك • بدون تسجيل حساب',
    statsSurahs: 'سورة كاملة',
    statsVerses: 'آية بالرسم العثماني',
    statsPages: 'صفحة مصحف',
    statsReciters: 'قرّاء متقنين',
    methodTitle: 'جلسة واحدة منظّمة في خمس خطوات',
    methodSubtitle:
      'لا يبدأ الجديد قبل تثبيت القديم؛ هكذا يسير بك التطبيق تلقائياً في كل جلسة يومية.',
    stages: [
      {
        step: 1,
        title: 'مراجعة الأمس',
        desc: 'تسترجع آيات الأمس متصلةً قبل البدء بأي حفظ جديد لتثبيت الصلة القريبة.',
      },
      {
        step: 2,
        title: 'المراجعة السابقة',
        desc: 'تُعرض عليك الآيات المستحقة من أيامك الماضية ومواضع العناية بهدوء.',
      },
      {
        step: 3,
        title: 'الحفظ الجديد',
        desc: 'وردك اليومي آيةً بآية مع التكرار الصوتي وإخفاء الكلمات التدريجي.',
      },
      {
        step: 4,
        title: 'التسميع الذاتي',
        desc: 'تُخفي النص وتسمّع غيباً، ثم تتحقق وتقيّم حفظك بـ صعبة أو جيدة أو سهلة.',
      },
      {
        step: 5,
        title: 'ربط الآيات',
        desc: 'تقرأ المقطع كاملاً متصلاً مع الآية السابقة لترسيخ الانتقال بين الآيات.',
      },
    ],
    principlesTitle: 'صُمّم للسكينة والتركيز',
    principlesSubtitle: 'كل تفصيلة في المِلّة وُضعت لتخدم الخلوة مع كتاب الله.',
    principles: [
      {
        title: 'فردي وخصوصي بالكامل',
        desc: 'لا حلقات عامة ولا مقارنات ولا لوحات متصدرين. تقدّمك يبقى على جهازك وحدك.',
      },
      {
        title: 'مجاني بلا إعلانات ولا ذنب',
        desc: 'لا اشتراكات مدفوعة ولا عدّادات عقابية إذا فاتك يوم؛ تعود فتكمل من حيث وقفت.',
      },
      {
        title: 'واضح ومريح لكبار السن',
        desc: 'خط المصحف العثماني بوضوح عالٍ، مع وضع تكبير الواجهة وأزرار مريحة للمس.',
      },
    ],
    finalTitle: 'خطوة هادئة كل يوم تكفي',
    finalSubtitle: 'افتح المِلّة الآن واختر سورتك ووردك اليومي في أقل من دقيقة.',
    finalCta: 'دخول تطبيق المِلّة',
    footerTagline: 'المِلّة — رفيق هادئ لحفظ القرآن الكريم برواية حفص عن عاصم.',
    footerOpenApp: 'فتح التطبيق',
    previewHeader: 'معاينة حيّة من داخل الجلسة',
    previewHideText: 'إخفاء النص للتسميع',
    previewShowText: 'إظهار النص للتحقق',
    previewHiddenHint: 'سمّع الآيات غيباً ثم اضغط لإظهار النص والتحقق',
    previewEvalLabel: 'كيف كان تسميعك؟',
    previewRatings: [
      { id: 'difficult', label: 'صعبة', hint: 'إعادة غداً' },
      { id: 'good', label: 'جيدة', hint: 'بتأنٍّ' },
      { id: 'easy', label: 'سهلة', hint: 'ثابتة بيسر' },
    ],
    previewEvalThanks: 'تم التقييم بهدوء — يحدّث التطبيق موعد المراجعة تلقائياً.',
  },
  en: {
    brand: 'Al-Millah',
    navMethod: 'Method',
    navPrinciples: 'Principles',
    navStart: 'Open App',
    heroBadge: 'Hafs an Asim • 100% Free',
    heroTitle: 'Memorize the Quran with calm steadiness, never rushed',
    heroSubtitle:
      'A private daily companion guiding you through yesterday’s review, older retention, new memorization, self-testing, and verse connection — with no accounts, no ads, and no leaderboards.',
    heroPrimaryCta: 'Start Memorizing Now',
    heroSecondaryCta: 'See the 5-Stage Loop',
    heroNoAccount: 'Runs directly in your browser • No sign-up required',
    statsSurahs: 'Complete Surahs',
    statsVerses: 'Uthmani Verses',
    statsPages: 'Mushaf Pages',
    statsReciters: 'Renowned Reciters',
    methodTitle: 'One guided daily session in five calm steps',
    methodSubtitle:
      'Review always comes before new verses so nothing you memorized slips away.',
    stages: [
      {
        step: 1,
        title: "Yesterday's Review",
        desc: 'Revisit yesterday’s verses together before starting anything new.',
      },
      {
        step: 2,
        title: 'Older Revision',
        desc: 'Gently surface earlier memorized verses when they are due.',
      },
      {
        step: 3,
        title: 'New Memorization',
        desc: 'Learn today’s portion verse by verse with audio repeat and gradual word hiding.',
      },
      {
        step: 4,
        title: 'Self-Test',
        desc: 'Recite from memory with the text hidden, then verify and rate honestly.',
      },
      {
        step: 5,
        title: 'Connect Verses',
        desc: 'Read the full passage connected with the preceding verse to lock transitions.',
      },
    ],
    principlesTitle: 'Designed for quiet devotion',
    principlesSubtitle: 'Every detail exists to protect your focus with the Book of Allah.',
    principles: [
      {
        title: 'Strictly Private & Individual',
        desc: 'No public groups, no social feeds, no leaderboards. Everything stays on your device.',
      },
      {
        title: 'Free Forever, Zero Guilt',
        desc: 'No ads, no subscriptions, and no punishing streak counters if you miss a day.',
      },
      {
        title: 'Clear & Elder-Friendly',
        desc: 'Authentic Quranic script with adjustable sizing and a dedicated large-UI mode.',
      },
    ],
    finalTitle: 'One calm step a day is enough',
    finalSubtitle: 'Open Al-Millah, pick your starting Surah and daily goal in under a minute.',
    finalCta: 'Launch Al-Millah App',
    footerTagline: 'Al-Millah — A calm companion for Quran memorization (Hafs an Asim).',
    footerOpenApp: 'Open App',
    previewHeader: 'Live interactive session preview',
    previewHideText: 'Hide text to recite',
    previewShowText: 'Reveal text to verify',
    previewHiddenHint: 'Recite from memory, then reveal the verses to verify',
    previewEvalLabel: 'How did it go?',
    previewRatings: [
      { id: 'difficult', label: 'Difficult', hint: 'Revise tomorrow' },
      { id: 'good', label: 'Good', hint: 'With ease' },
      { id: 'easy', label: 'Easy', hint: 'Firmly retained' },
    ],
    previewEvalThanks: 'Saved calmly — your next review interval adapts automatically.',
  },
  fr: {
    brand: 'Al-Millah',
    navMethod: 'Méthode',
    navPrinciples: 'Principes',
    navStart: 'Ouvrir l’app',
    heroBadge: 'Hafs an Asim • 100% Gratuit',
    heroTitle: 'Mémorisez le Coran avec sérénité, sans hâte ni bruit',
    heroSubtitle:
      'Un compagnon personnel quotidien qui réunit révision d’hier, consolidation, nouvelle mémorisation, auto-test et liaison des versets — sans compte, sans publicité et sans classement.',
    heroPrimaryCta: 'Commencer maintenant',
    heroSecondaryCta: 'Découvrir les 5 étapes',
    heroNoAccount: 'Directement dans votre navigateur • Sans inscription',
    statsSurahs: 'Sourates complètes',
    statsVerses: 'Versets Uthmani',
    statsPages: 'Pages du Mushaf',
    statsReciters: 'Récitateurs reconnus',
    methodTitle: 'Une séance guidée en cinq étapes apaisées',
    methodSubtitle:
      'La révision précède toujours les nouveaux versets pour ne rien perdre en chemin.',
    stages: [
      {
        step: 1,
        title: 'Révision d’hier',
        desc: 'Relisez les versets d’hier ensemble avant d’aborder de nouveaux versets.',
      },
      {
        step: 2,
        title: 'Révision précédente',
        desc: 'Retrouvez les versets plus anciens au moment juste pour les ancrer.',
      },
      {
        step: 3,
        title: 'Nouvelle mémorisation',
        desc: 'Apprenez votre portion verset par verset avec répétition audio et masquage progressif.',
      },
      {
        step: 4,
        title: 'Auto-test',
        desc: 'Récitez de mémoire, vérifiez le texte puis évaluez sereinement votre maîtrise.',
      },
      {
        step: 5,
        title: 'Relier les versets',
        desc: 'Lisez le passage complet avec le verset précédent pour fixer les enchaînements.',
      },
    ],
    principlesTitle: 'Conçu pour le recueillement',
    principlesSubtitle: 'Chaque détail protège votre concentration avec le Livre d’Allah.',
    principles: [
      {
        title: 'Strictement privé et individuel',
        desc: 'Aucun groupe public ni classement. Vos progrès restent uniquement sur votre appareil.',
      },
      {
        title: 'Gratuit pour toujours, sans culpabilité',
        desc: 'Aucune publicité, aucun abonnement, aucune série punitive si vous manquez un jour.',
      },
      {
        title: 'Lisible et adapté aux aînés',
        desc: 'Calligraphie coranique nette, taille réglable et mode grands caractères.',
      },
    ],
    finalTitle: 'Un pas serein chaque jour suffit',
    finalSubtitle: 'Ouvrez Al-Millah et choisissez votre sourate de départ en moins d’une minute.',
    finalCta: 'Ouvrir l’application',
    footerTagline: 'Al-Millah — Compagnon serein de mémorisation du Coran (Hafs an Asim).',
    footerOpenApp: 'Ouvrir l’app',
    previewHeader: 'Aperçu interactif de la séance',
    previewHideText: 'Masquer pour réciter',
    previewShowText: 'Révéler pour vérifier',
    previewHiddenHint: 'Récitez de mémoire puis affichez les versets pour vérifier',
    previewEvalLabel: 'Votre ressenti ?',
    previewRatings: [
      { id: 'difficult', label: 'Difficile', hint: 'Revoir demain' },
      { id: 'good', label: 'Bien', hint: 'Posément' },
      { id: 'easy', label: 'Facile', hint: 'Bien retenu' },
    ],
    previewEvalThanks: 'Enregistré sereinement — le prochain rappel s’adapte automatiquement.',
  },
};
