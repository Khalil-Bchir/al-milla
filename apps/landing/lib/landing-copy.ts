export type LandingLang = 'ar' | 'en' | 'fr';
export type LandingFeatureIcon = 'flow' | 'revision' | 'audio' | 'pace' | 'dhikr' | 'comfort';
export type LandingFaqCategory = 'all' | 'memorization' | 'revision' | 'app';

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const;

export function formatLandingNum(num: number, lang: LandingLang): string {
  if (lang !== 'ar') return num.toLocaleString('en-US');
  return String(num).replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)] ?? d);
}

export interface LandingCopy {
  brand: string;
  navMethod: string;
  navFeatures: string;
  navPrinciples: string;
  navFaq: string;
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
  featuresBadge: string;
  featuresTitle: string;
  featuresSubtitle: string;
  features: {
    icon: LandingFeatureIcon;
    title: string;
    desc: string;
  }[];
  principlesTitle: string;
  principlesSubtitle: string;
  principles: {
    title: string;
    desc: string;
  }[];
  faqBadge: string;
  faqTitle: string;
  faqSubtitle: string;
  faqCategories: { id: LandingFaqCategory; label: string }[];
  faqs: { category: Exclude<LandingFaqCategory, 'all'>; q: string; a: string }[];
  finalTitle: string;
  finalSubtitle: string;
  finalCta: string;
  footerTagline: string;
  footerOpenApp: string;
  footerExploreTitle: string;
  footerLanguageTitle: string;
  footerPillFree: string;
  footerPillNoAccount: string;
  footerPillLocal: string;
  footerVerseRef: string;
  footerPrivacyNote: string;
  footerBackToTop: string;
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
    navFeatures: 'المميزات',
    navPrinciples: 'المبادئ',
    navFaq: 'الأسئلة',
    navStart: 'افتح التطبيق',
    heroBadge: 'برواية حفص عن عاصم • مجاني بالكامل',
    heroTitle: 'احفظ القرآن الكريم بهدوء وثبات، بلا ضجيج ولا استعجال',
    heroSubtitle:
      'تطبيق هادئ للحفظ والمراجعة يرافقك يومياً في أربع خطوات واضحة: المراجعة السابقة، الحفظ بالتدرّج الصوتي، التسميع غيباً، وربط الآيات مع تقييم واحد يكيّف مراجعتك تلقائياً.',
    heroPrimaryCta: 'ابدأ رحلة الحفظ الآن',
    heroSecondaryCta: 'تعرّف على الخطوات الأربع',
    heroNoAccount: 'يعمل محلياً على جهازك • بدون حساب أو إعلانات',
    statsSurahs: 'سورة كاملة',
    statsVerses: 'آية بالرسم العثماني',
    statsPages: 'صفحة مصحف',
    statsReciters: 'قرّاء متقنين',
    methodTitle: 'جلسة واحدة منظّمة في أربع خطوات',
    methodSubtitle:
      'لا يبدأ الجديد قبل تثبيت القديم، وفي الخطوة الأخيرة تقيّم الدرس بتقييم واحد يوجّه الحفظ والمراجعة معاً.',
    stages: [
      {
        step: 1,
        title: 'مراجعة الدروس السابقة',
        desc: 'تسترجع دروسك السابقة في السورة الجارية بالإخفاء التدريجي قبل حفظ أي آيات جديدة.',
      },
      {
        step: 2,
        title: 'الحفظ الجديد',
        desc: 'تحفظ وردك اليومي (٣، ٤ أو ٥ آيات) آيةً بآية مع التكرار الصوتي وإخفاء الكلمات الذكي.',
      },
      {
        step: 3,
        title: 'التسميع غيباً',
        desc: 'تُخفي النص وتسمّع الآيات كاملة من حفظك، مع إمكانية الإظهار السريع للتحقق.',
      },
      {
        step: 4,
        title: 'ربط الآيات والتقييم',
        desc: 'تصل حفظك الجديد بالآيات السابقة، ثم تضع تقييماً واحداً للجلسة (صعب / جيد / سهل).',
      },
    ],
    featuresBadge: 'كل ما تحتاجه في تطبيق واحد',
    featuresTitle: 'مصمّم لخدمة الحفظ والمراجعة بهدوء',
    featuresSubtitle:
      'أدوات عملية واضحة تمنحك الثبات في الحفظ، وتساعدك على تعاهد ما حفظته دون تشتيت.',
    features: [
      {
        icon: 'flow',
        title: 'جلسة رباعية وتقييم واحد',
        desc: 'مراجعة السابق ثم الحفظ مع التفسير الميسّر للآية، ثم التسميع غيباً والربط بتقييم واحد في نهاية الجلسة.',
      },
      {
        icon: 'revision',
        title: 'مراجعة ذكية وعناية خاصة',
        desc: 'جلسات مراجعة مخصّصة (٥، ١٠ أو ٢٠ دقيقة) بالإضافة لتلاوة متصلة، وربط الآيات، واختبار عشوائي، وعناية خاصة للآيات الصعبة.',
      },
      {
        icon: 'audio',
        title: '٨ قرّاء ومعاينة صوتية حية',
        desc: 'استمع لأي قارئ قبل اعتماد اختيارك، مع تحكم بسرعة التلاوة وتكرار الآيات أثناء الحفظ.',
      },
      {
        icon: 'pace',
        title: 'ورد يومي ووتيرة مرنة',
        desc: 'اختر ٣ أو ٤ أو ٥ آيات يومياً مع ثلاثة مستويات لتدرّج الإخفاء (سريع، متوازن، تدريجي).',
      },
      {
        icon: 'dhikr',
        title: 'إشراقة يومية وذكر هادئ',
        desc: 'بطاقة إشراقة يومية من الأحاديث الصحيحة في فضل القرآن وبطاقة تسبيح هادئة في الصفحة الرئيسية.',
      },
      {
        icon: 'comfort',
        title: 'وضع ليلي وتكبير مريح',
        desc: 'تصميم ليلي هادئ مريح للعين، وخط مصحف عثماني قابل للتكبير، ومفتاح مزامنة اختياري بين أجهزتك.',
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
    faqBadge: 'إجابات واضحة',
    faqTitle: 'الأسئلة الشائعة',
    faqSubtitle: 'تفاصيل التقييم الموحّد، والمراجعة الذكية، وخصوصية بياناتك.',
    faqCategories: [
      { id: 'all', label: 'الكل' },
      { id: 'memorization', label: 'الحفظ والتقييم' },
      { id: 'revision', label: 'المراجعة الذكية' },
      { id: 'app', label: 'التطبيق والخصوصية' },
    ],
    faqs: [
      {
        category: 'memorization',
        q: 'كيف يعمل التقييم الواحد في نهاية الدرس؟',
        a: 'في الخطوة الأخيرة من الجلسة تختار تقييماً واحداً للدرس كاملاً: «صعب» يُبقي نفس الآيات للجلسة القادمة لتثبيتها قبل أي حفظ جديد ويدرجها في «عناية خاصة»؛ «جيد» ينقلك للآيات التالية مع دخول الدرس مرحلة التثبيت؛ و«سهل» يعتمده متقناً ويباعد مراجعاته تلقائياً.',
      },
      {
        category: 'memorization',
        q: 'ماذا يحدث إذا حدّدت آيات صعبة أثناء التقييم؟',
        a: 'عند اختيار «صعب» يمكنك تحديد الآيات التي احتاجت تثبيتاً. يرفع التطبيق أولوية هذا الدرس فوراً في المراجعة الذكية ويضعه في قائمة «عناية خاصة» دون أن تفقد موضعك.',
      },
      {
        category: 'memorization',
        q: 'ما هو الورد اليومي ومستوى الصعوبة والتفسير المتاح؟',
        a: 'يمكنك ضبط وردك اليومي بين ٣ أو ٤ أو ٥ آيات، واختيار سرعة الإخفاء التدريجي (سريع، متوازن، أو تدريجي)، كما يتيح لك التطبيق عرض التفسير الميسّر لكل آية بالعربية أثناء الحفظ.',
      },
      {
        category: 'revision',
        q: 'كيف ترتّب المراجعة الذكية الدروس؟',
        a: 'تعتمد على تقييمك السابق (صعب ثم جيد ثم سهل)، ومستوى الإخفاء، وعدد الجلسات منذ آخر مراجعة (١، ٣، ٧، ١٤، ٣٠ جلسة) دون خلط بين السور في بطاقة واحدة.',
      },
      {
        category: 'revision',
        q: 'ما هي أساليب المراجعة المتوفرة لكل سورة؟',
        a: 'إلى جانب المراجعة الذكية (٥ أو ١٠ أو ٢٠ دقيقة) و«عناية خاصة»، يمكنك مراجعة أي سورة بثلاث طرق: التلاوة المتصلة، ربط الآيات عند حدود الدروس، أو الاختبار العشوائي.',
      },
      {
        category: 'app',
        q: 'هل يمكنني سماع صوت القارئ قبل اختياره؟',
        a: 'نعم، في قائمة اختيار القارئ سواء في البداية أو في الإعدادات يمكنك الضغط على زر التشغيل لمعاينة تلاوة القارئ مباشرة قبل حفظ التغييرات.',
      },
      {
        category: 'app',
        q: 'هل المِلّة مجاني ويعمل بدون حساب؟',
        a: 'نعم، مجاني بالكامل وخالٍ من الإعلانات. محفوظاتك تبقى على جهازك، مع مفتاح مزامنة اختياري إذا أردت نقل تقدّمك إلى جهاز آخر.',
      },
    ],
    finalTitle: 'خطوة هادئة كل يوم تكفي',
    finalSubtitle: 'افتح المِلّة الآن واختر سورتك وعدد آياتك اليومية في أقل من دقيقة.',
    finalCta: 'دخول تطبيق المِلّة',
    footerTagline: 'المِلّة: رفيق هادئ لحفظ القرآن الكريم برواية حفص عن عاصم.',
    footerOpenApp: 'فتح التطبيق',
    footerExploreTitle: 'التصفّح',
    footerLanguageTitle: 'المظهر والتفضيل',
    footerPillFree: 'مجاني بالكامل',
    footerPillNoAccount: 'بدون حساب',
    footerPillLocal: 'محفوظ على جهازك',
    footerVerseRef: 'سورة القمر • الآية ١٧',
    footerPrivacyNote: 'تطبيق فردي خالٍ من الإعلانات والتتبّع.',
    footerBackToTop: 'العودة للأعلى',
    previewHeader: 'معاينة حيّة من داخل الجلسة',
    previewHideText: 'إخفاء النص للتسميع',
    previewShowText: 'إظهار النص للتحقق',
    previewHiddenHint: 'سمّع الآيات غيباً ثم اضغط لإظهار النص والتحقق',
    previewEvalLabel: 'التقييم النهائي للدرس:',
    previewRatings: [
      { id: 'difficult', label: 'صعب', hint: 'يُعاد غداً + عناية خاصة' },
      { id: 'good', label: 'جيد', hint: 'تثبيت ومراجعة قريبة' },
      { id: 'easy', label: 'سهل', hint: 'متقن • فترات أطول' },
    ],
    previewEvalThanks: 'تقييم واحد يوجّه جلستك القادمة وأولوية المراجعة تلقائياً.',
  },
  en: {
    brand: 'Al-Millah',
    navMethod: 'Method',
    navFeatures: 'Features',
    navPrinciples: 'Principles',
    navFaq: 'FAQ',
    navStart: 'Open App',
    heroBadge: 'Hafs an Asim • 100% Free',
    heroTitle: 'Memorize the Quran with calm steadiness, never rushed',
    heroSubtitle:
      'A calm, dedicated Quran companion guiding you through four clear steps: reviewing earlier lessons, verse-by-verse audio memorization, reciting from memory, and connecting verses with one honest rating at the end.',
    heroPrimaryCta: 'Start Memorizing Now',
    heroSecondaryCta: 'See the 4-Step Flow',
    heroNoAccount: 'Stored locally on your device • No account or ads',
    statsSurahs: 'Complete Surahs',
    statsVerses: 'Uthmani Verses',
    statsPages: 'Mushaf Pages',
    statsReciters: 'Renowned Reciters',
    methodTitle: 'One guided session in four calm steps',
    methodSubtitle:
      'Review always comes first, and a single final-step rating shapes both tomorrow’s portion and your revision queue.',
    stages: [
      {
        step: 1,
        title: 'Review Earlier Lessons',
        desc: 'Revisit prior passages in your active Surah with progressive hiding before adding new verses.',
      },
      {
        step: 2,
        title: 'New Memorization',
        desc: 'Learn your daily portion (3, 4, or 5 verses) verse by verse with audio repeat and smart hiding.',
      },
      {
        step: 3,
        title: 'Recite from Memory',
        desc: 'Hide the text and recite the full passage from memory, revealing anytime to verify.',
      },
      {
        step: 4,
        title: 'Connect & Final Rating',
        desc: 'Link today’s verses with preceding ones, then choose one rating (Difficult, Good, or Easy).',
      },
    ],
    featuresBadge: 'Built for Real Daily Devotion',
    featuresTitle: 'Everything you need, nothing that distracts',
    featuresSubtitle:
      'Thoughtful tools for memorization, smart revision, audio comfort, and peaceful focus.',
    features: [
      {
        icon: 'flow',
        title: '4-Step Session, Single Rating',
        desc: 'Review, memorize, recite, and link in one calm flow, ending with a single rating for the whole lesson.',
      },
      {
        icon: 'revision',
        title: 'Smart Revision & Gentle Care',
        desc: 'Timed smart queues (5, 10, or 20 min) plus Connected Flow, Verse Linking, Random Recall, and Gentle Care.',
      },
      {
        icon: 'audio',
        title: '8 Reciters with Voice Preview',
        desc: 'Audition any reciter directly inside the picker before confirming, with adjustable playback speed.',
      },
      {
        icon: 'pace',
        title: 'Flexible Portions & Pace',
        desc: 'Pick 3, 4, or 5 verses a day and choose Fast, Balanced, or Gradual word-hiding progression.',
      },
      {
        icon: 'dhikr',
        title: 'Daily Reflection & Quiet Dhikr',
        desc: 'Start on Home with rotating Sahih reflections on the Quran and a calm interactive tasbih card.',
      },
      {
        icon: 'comfort',
        title: 'Night Mode & Elder Comfort',
        desc: 'Warm obsidian dark mode, adjustable Uthmani Quran font size, large-UI mode, and optional sync key.',
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
    faqBadge: 'Questions & Answers',
    faqTitle: 'Frequently Asked Questions',
    faqSubtitle: 'How the single lesson rating, Smart Revision, and local-first privacy work.',
    faqCategories: [
      { id: 'all', label: 'All' },
      { id: 'memorization', label: 'Memorization' },
      { id: 'revision', label: 'Revision' },
      { id: 'app', label: 'App & Privacy' },
    ],
    faqs: [
      {
        category: 'memorization',
        q: 'How does the single end-of-lesson rating work?',
        a: 'At the final step, one rating guides both memorization and revision: "Difficult" repeats these verses next session before advancing and flags them for Gentle Care; "Good" advances and moves the lesson into gradual-hiding Strengthening; "Easy" marks it Mastered and spaces reviews further apart.',
      },
      {
        category: 'memorization',
        q: 'What happens when I flag specific hard verses?',
        a: 'When rating a lesson Difficult, you can tap the exact verses that felt shaky. The Revision engine prioritizes that passage immediately and surfaces it in Gentle Care.',
      },
      {
        category: 'memorization',
        q: 'Can I adjust my daily verses and word-hiding pace?',
        a: 'Yes—choose 3, 4, or 5 daily verses and Fast, Balanced, or Gradual word hiding before starting or from My Space.',
      },
      {
        category: 'revision',
        q: 'How does Smart Revision choose what to review?',
        a: 'It scores lessons by your last rating, consecutive difficulty, hiding level, and session spacing (1, 3, 7, 14, 30 sessions)—never mixing different Surahs in one card.',
      },
      {
        category: 'revision',
        q: 'What Surah revision modes are included?',
        a: 'Alongside 5/10/20-minute Smart Revision and Gentle Care, each Surah supports Connected Flow, Verse Linking at lesson seams, and Random Recall.',
      },
      {
        category: 'app',
        q: 'Can I hear a reciter before saving?',
        a: 'Yes. Both in the session preferences and in My Space settings, you can preview each reciter’s voice right inside the picker before confirming.',
      },
      {
        category: 'app',
        q: 'Is Al-Millah free and account-free?',
        a: 'Yes—100% free, ad-free, and local-first on your device, with an optional sync key to carry your progress between devices.',
      },
    ],
    finalTitle: 'One calm step a day is enough',
    finalSubtitle: 'Open Al-Millah, pick your starting Surah and daily goal in under a minute.',
    finalCta: 'Launch Al-Millah App',
    footerTagline: 'Al-Millah: A calm companion for Quran memorization (Hafs an Asim).',
    footerOpenApp: 'Open App',
    footerExploreTitle: 'Explore',
    footerLanguageTitle: 'Language & Direction',
    footerPillFree: '100% Free',
    footerPillNoAccount: 'No Account',
    footerPillLocal: 'Local-First',
    footerVerseRef: 'Surah Al-Qamar • 54:17',
    footerPrivacyNote: 'Private, ad-free, and zero tracking.',
    footerBackToTop: 'Back to top',
    previewHeader: 'Live interactive session preview',
    previewHideText: 'Hide text to recite',
    previewShowText: 'Reveal text to verify',
    previewHiddenHint: 'Recite from memory, then reveal the verses to verify',
    previewEvalLabel: 'Final lesson rating:',
    previewRatings: [
      { id: 'difficult', label: 'Difficult', hint: 'Repeat next + Care' },
      { id: 'good', label: 'Good', hint: 'Strengthen soon' },
      { id: 'easy', label: 'Easy', hint: 'Mastered • longer gap' },
    ],
    previewEvalThanks: 'One rating updates both your next session and Revision priority.',
  },
  fr: {
    brand: 'Al-Millah',
    navMethod: 'Méthode',
    navFeatures: 'Fonctionnalités',
    navPrinciples: 'Principes',
    navFaq: 'FAQ',
    navStart: 'Ouvrir l’app',
    heroBadge: 'Hafs an Asim • 100% Gratuit',
    heroTitle: 'Mémorisez le Coran avec sérénité, sans hâte ni bruit',
    heroSubtitle:
      'Une application dédiée qui vous guide en quatre étapes apaisées : révision précédente, apprentissage progressif avec audio, récitation de mémoire et liaison finale avec une seule évaluation.',
    heroPrimaryCta: 'Commencer maintenant',
    heroSecondaryCta: 'Voir les 4 étapes',
    heroNoAccount: 'Enregistré sur votre appareil • Sans compte ni publicité',
    statsSurahs: 'Sourates complètes',
    statsVerses: 'Versets Uthmani',
    statsPages: 'Pages du Mushaf',
    statsReciters: 'Récitateurs reconnus',
    methodTitle: 'Une séance guidée en quatre étapes apaisées',
    methodSubtitle:
      'La révision précède toujours le nouveau, et une seule évaluation finale adapte la suite automatiquement.',
    stages: [
      {
        step: 1,
        title: 'Révision précédente',
        desc: 'Relisez les leçons antérieures de votre sourate avec masquage progressif avant d’avancer.',
      },
      {
        step: 2,
        title: 'Nouvelle mémorisation',
        desc: 'Apprenez 3, 4 ou 5 versets par jour avec répétition audio et masquage intelligent.',
      },
      {
        step: 3,
        title: 'Récitation de mémoire',
        desc: 'Masquez le texte et récitez l’ensemble du passage, puis vérifiez d’un geste.',
      },
      {
        step: 4,
        title: 'Liaison & évaluation unique',
        desc: 'Reliez le passage aux versets précédents puis évaluez la séance (Difficile, Bien, Facile).',
      },
    ],
    featuresBadge: 'Pensé pour la régularité',
    featuresTitle: 'L’essentiel pour mémoriser et réviser en paix',
    featuresSubtitle:
      'Des outils sobres et précis pour ancrer vos acquis sans surcharge ni distraction.',
    features: [
      {
        icon: 'flow',
        title: 'Séance en 4 étapes, 1 évaluation',
        desc: 'Révision, apprentissage, test et liaison s’enchaînent jusqu’à une unique évaluation finale.',
      },
      {
        icon: 'revision',
        title: 'Révision intelligente & Soin',
        desc: 'Files de 5, 10 ou 20 min, plus Flux continu, Liaison des versets, Rappel aléatoire et Soin particulier.',
      },
      {
        icon: 'audio',
        title: '8 récitateurs avec aperçu vocal',
        desc: 'Écoutez chaque récitateur directement dans le sélecteur avant de confirmer, avec vitesse réglable.',
      },
      {
        icon: 'pace',
        title: 'Portion et rythme adaptables',
        desc: 'Choisissez 3, 4 ou 5 versets par jour et un rythme Rapide, Équilibré ou Progressif.',
      },
      {
        icon: 'dhikr',
        title: 'Rappel du jour & Dhikr apaisant',
        desc: 'Des hadiths authentiques quotidiens et un compteur de tasbih sobre sur l’accueil.',
      },
      {
        icon: 'comfort',
        title: 'Mode nuit & confort visuel',
        desc: 'Thème sombre apaisant, taille de police coranique réglable, mode grands caractères et clé de sync.',
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
    faqBadge: 'Questions fréquentes',
    faqTitle: 'Questions fréquentes',
    faqSubtitle: 'Comprendre l’évaluation unique, la révision intelligente et la confidentialité.',
    faqCategories: [
      { id: 'all', label: 'Tout' },
      { id: 'memorization', label: 'Mémorisation' },
      { id: 'revision', label: 'Révision' },
      { id: 'app', label: 'App & Confidentialité' },
    ],
    faqs: [
      {
        category: 'memorization',
        q: 'Comment fonctionne l’évaluation unique en fin de séance ?',
        a: 'À la dernière étape, une seule évaluation guide la suite : « Difficile » reprend ces versets à la prochaine séance et les place en Soin particulier ; « Bien » avance tout en consolidant la leçon ; « Facile » la marque maîtrisée et espace les révisions.',
      },
      {
        category: 'memorization',
        q: 'Que se passe-t-il si je signale des versets difficiles ?',
        a: 'En choisissant « Difficile », vous pouvez indiquer les versets précis à consolider ; ils sont immédiatement priorisés en révision.',
      },
      {
        category: 'memorization',
        q: 'Puis-je régler mon objectif quotidien et le rythme ?',
        a: 'Oui : 3, 4 ou 5 versets par jour et un masquage Rapide, Équilibré ou Progressif.',
      },
      {
        category: 'revision',
        q: 'Comment la révision intelligente trie-t-elle les passages ?',
        a: 'Elle tient compte de votre dernière évaluation, des difficultés répétées, du masquage et de l’intervalle en séances (1, 3, 7, 14, 30), sans mélanger les sourates.',
      },
      {
        category: 'revision',
        q: 'Quels modes par sourate sont proposés ?',
        a: 'En plus de la Révision intelligente (5/10/20 min) et du Soin particulier : Flux continu, Liaison des versets et Rappel aléatoire.',
      },
      {
        category: 'app',
        q: 'Puis-je écouter un récitateur avant de valider ?',
        a: 'Oui, un bouton d’aperçu vocal est intégré directement dans la liste des récitateurs.',
      },
      {
        category: 'app',
        q: 'Al-Millah est-il vraiment gratuit et sans compte ?',
        a: 'Oui, 100 % gratuit, sans publicité et local sur votre appareil, avec une clé de synchronisation optionnelle.',
      },
    ],
    finalTitle: 'Un pas serein chaque jour suffit',
    finalSubtitle: 'Ouvrez Al-Millah et choisissez votre sourate de départ en moins d’une minute.',
    finalCta: 'Ouvrir l’application',
    footerTagline: 'Al-Millah : Compagnon serein de mémorisation du Coran (Hafs an Asim).',
    footerOpenApp: 'Ouvrir l’app',
    footerExploreTitle: 'Navigation',
    footerLanguageTitle: 'Langue et lecture',
    footerPillFree: '100 % Gratuit',
    footerPillNoAccount: 'Sans compte',
    footerPillLocal: 'Sur votre appareil',
    footerVerseRef: 'Sourate Al-Qamar • 54:17',
    footerPrivacyNote: 'Application individuelle sans publicité ni pistage.',
    footerBackToTop: 'Haut de page',
    previewHeader: 'Aperçu interactif de la séance',
    previewHideText: 'Masquer pour réciter',
    previewShowText: 'Révéler pour vérifier',
    previewHiddenHint: 'Récitez de mémoire puis affichez les versets pour vérifier',
    previewEvalLabel: 'Évaluation finale de la leçon :',
    previewRatings: [
      { id: 'difficult', label: 'Difficile', hint: 'À revoir + Soin' },
      { id: 'good', label: 'Bien', hint: 'Consolider bientôt' },
      { id: 'easy', label: 'Facile', hint: 'Maîtrisée • espacé' },
    ],
    previewEvalThanks: 'Une seule évaluation adapte votre prochaine séance et la révision.',
  },
};
