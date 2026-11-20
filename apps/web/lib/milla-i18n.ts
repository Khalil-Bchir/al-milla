import { toArabicDigits, type SurahEntry } from '@/lib/quran-data';

export type AppLanguage = 'ar' | 'en' | 'fr';

export function formatNum(num: number, language: AppLanguage): string {
  return language === 'ar' ? toArabicDigits(num) : String(num);
}

const ARABIC_DIGIT_CHARS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const;

export function formatDigitsInText(text: string, language: AppLanguage): string {
  if (language !== 'ar') return text;
  return text.replace(/[0-9]/g, (d) => ARABIC_DIGIT_CHARS[Number(d)] ?? d);
}

export function getSurahDisplayName(surah: SurahEntry, language: AppLanguage): string {
  if (language === 'en') return `${surah.nameEn} (${surah.nameAr})`;
  if (language === 'fr') return `${surah.nameFr} (${surah.nameAr})`;
  return surah.nameAr;
}

export interface MillaCopy {
  brandName: string;
  tagline: string;
  hafsBadge: string;
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
  loadingLabel: string;
  versesUnit: string;
  verseSingular: string;
  ayahLabel: string;
  surahLabel: string;
  hizbLabel: string;
  juzLabel: string;
  // Home
  homeGreeting: string;
  homeSubgreeting: string;
  homeSubtitle: string;
  homeTodayWird: string;
  homeContinueCta: string;
  homeContinueSessionCta: string;
  homeRevisionTitle: string;
  homeRevisionEmpty: string;
  homeNewMemTitle: string;
  homeOpenMushaf: string;
  homeDueSummary: string;
  homeYesterdayShort: string;
  homeOlderShort: string;
  homeWeakShort: string;
  // Onboarding
  onboardingTitle: string;
  onboardingIntro: string;
  onboardingLargeText: string;
  onboardingReciterTitle: string;
  onboardingReciterPickerTitle: string;
  onboardingSurahTitle: string;
  onboardingSurahPickerTitle: string;
  onboardingGoalTitle: string;
  onboardingGoalLater: string;
  onboardingCustomGoalLabel: string;
  onboardingRecommended: string;
  onboardingPrivacyNote: string;
  onboardingStartCta: string;
  // Revision
  revisionTitle: string;
  revisionSubtitle: string;
  revisionHeaderLabel: string;
  revisionThreePillars: string;
  revisionDueToday: string;
  revisionNoneDue: string;
  revisionPillar1Title: string;
  revisionPillar1Sub: string;
  revisionPillar2Title: string;
  revisionPillar2Sub: string;
  revisionPillar3Title: string;
  revisionPillar3Sub: string;
  revisionStartBtn: string;
  revisionEmptyBtn: string;
  revisionEmptyTitle: string;
  revisionEmptyBody: string;
  revisionGoToSession: string;
  revisionBackBtn: string;
  revisionModeFull: string;
  revisionModeCue: string;
  revisionModeHidden: string;
  revisionTapAyahHint: string;
  revisionHiddenTitle: string;
  revisionHiddenBody: string;
  revisionEvalPrompt: string;
  revisionCompleteBtn: string;
  revisionCompletedBanner: string;
  revisionCompletedSub: string;
  // Progress
  progressTitle: string;
  progressSubtitle: string;
  progressBannerLabel: string;
  progressTotalLabel: string;
  progressCurrentWird: string;
  progressCompletedSurahs: string;
  progressActiveSurahs: string;
  progressEmpty: string;
  progressMapTitle: string;
  progressCompletedCount: string;
  progressInProgressCount: string;
  // Self-test & Ratings
  evalDifficult: string;
  evalDifficultHint: string;
  evalGood: string;
  evalGoodHint: string;
  evalEasy: string;
  evalEasyHint: string;
  selfTestTitle: string;
  selfTestPrompt: string;
  selfTestHiddenHint: string;
  selfTestShowBtn: string;
  selfTestHideBtn: string;
  selfTestAudioTitle: string;
  selfTestAudioSub: string;
  selfTestPlayBtn: string;
  selfTestStopBtn: string;
  selfTestNextBtn: string;
  // AudioPlayerBar
  audioReferenceLabel: string;
  audioRepeatLabel: string;
  audioLiveStatus: string;
  audioOfflineStatus: string;
  audioRepeatOn: string;
  audioRepeatOff: string;
  // Settings
  settingsTitle: string;
  settingsSubtitle: string;
  settingsLanguageTitle: string;
  settingsWirdTitle: string;
  settingsDailyGoalLabel: string;
  settingsReciterLabel: string;
  settingsSpeedLabel: string;
  settingsRepeatsLabel: string;
  settingsDisplayTitle: string;
  settingsFontSizeLabel: string;
  settingsMushafModeLabel: string;
  settingsMushafModeSub: string;
  settingsModeVerses: string;
  settingsModePages: string;
  settingsNightMode: string;
  settingsNightModeSub: string;
  settingsLargeUi: string;
  settingsLargeUiSub: string;
  settingsTranslation: string;
  settingsTranslationSub: string;
  settingsTranslit: string;
  settingsTranslitSub: string;
  settingsOfflineNote: string;
  settingsRemindersTitle: string;
  settingsFajrReminder: string;
  settingsEnabled: string;
  settingsDisabled: string;
  settingsBackupTitle: string;
  settingsBackupDesc: string;
  settingsBackupCardTitle: string;
  settingsBackupCardSub: string;
  settingsExportBtn: string;
  settingsImportBtn: string;
  settingsResetBtn: string;
  settingsResetDone: string;
  settingsExportDone: string;
  settingsImportDone: string;
  // Mushaf
  mushafTitle: string;
  mushafSubtitle: string;
  mushafCachedText: string;
  mushafTapHint: string;
  mushafPrevPage: string;
  mushafNextPage: string;
  mushafPlayVerse: string;
  mushafToggleBookmark: string;
  mushafShowTranslation: string;
  mushafHideTranslation: string;
  mushafClose: string;
  // Tafsir & Mutashabihat
  tafsirTitle: string;
  tafsirSubtitle: string;
  tafsirDisclaimer: string;
  tafsirWordsTitle: string;
  tafsirSummaryTitle: string;
  tafsirMentalAnchorTitle: string;
  tafsirGoSelfTest: string;
  mutashabihatTitle: string;
  mutashabihatSubtitle: string;
  mutashabihatPrimaryBadge: string;
  mutashabihatSecondaryBadge: string;
  mutashabihatRuleTitle: string;
  mutashabihatQuizTitle: string;
}

export const MILLA_COPY: Record<AppLanguage, MillaCopy> = {
  ar: {
    brandName: 'المِلّة',
    tagline: 'رحلتك مع حفظ القرآن الكريم',
    hafsBadge: 'حفص عن عاصم',
    navHome: 'الرئيسية',
    navMemorize: 'الحفظ',
    navRevision: 'المراجعة',
    navProgress: 'حسابي',
    mushafLink: 'المصحف',
    settingsLink: 'الإعدادات',
    onboardingLink: 'البداية',
    offlineLabel: 'محفوظ محلياً',
    onlineLabel: 'حفظ محلي',
    freeIndividualNote: 'تطبيق مجاني فردي بالكامل بدون اشتراكات أو إعلانات.',
    noAccountNote: 'يُحفظ تقدّمك محلياً على جهازك دون الحاجة لتسجيل حساب.',
    selfEvalDisclaimer:
      'التقييم الذاتي معين على التثبيت ولا يغني عن التلقّي والمشافهة لدى معلم مجاز في التجويد.',
    loadingLabel: 'جاري التحميل...',
    versesUnit: 'آيات',
    verseSingular: 'آية',
    ayahLabel: 'الآية',
    surahLabel: 'السورة',
    hizbLabel: 'الحزب',
    juzLabel: 'الجزء',
    homeGreeting: 'السلام عليكم ورحمة الله',
    homeSubgreeting: 'خطوة هادئة كل يوم تثبّت حفظك دون عجلة.',
    homeSubtitle: 'منهج المِلّة • المصحف العثماني (حفص عن عاصم)',
    homeTodayWird: 'ورد اليوم',
    homeContinueCta: 'متابعة التعلّم الآن',
    homeContinueSessionCta: 'بدء جلسة اليوم (المراجعة + الحفظ)',
    homeRevisionTitle: 'مراجعة اليوم',
    homeRevisionEmpty: 'لا توجد مراجعات مستحقة بعد — ابدأ وردك الأول اليوم',
    homeNewMemTitle: 'الحفظ الجديد',
    homeOpenMushaf: 'فتح المصحف الشريف',
    homeDueSummary: 'مستحقة',
    homeYesterdayShort: 'أمس',
    homeOlderShort: 'سابقة',
    homeWeakShort: 'عناية',
    onboardingTitle: 'البداية والتهيئة',
    onboardingIntro: 'رفيقك الهادئ لحفظ القرآن الكريم برواية حفص عن عاصم.',
    onboardingLargeText: 'الخط الواضح',
    onboardingReciterTitle: 'القارئ المفضّل',
    onboardingReciterPickerTitle: 'اختر الشيخ القارئ المفضّل',
    onboardingSurahTitle: 'سورة البداية',
    onboardingSurahPickerTitle: 'اختر أي سورة أخرى',
    onboardingGoalTitle: 'الورد اليومي للجديد',
    onboardingGoalLater: 'يمكن تغييره لاحقاً',
    onboardingCustomGoalLabel: 'عدد مخصص للآيات يومياً:',
    onboardingRecommended: 'مستحسن',
    onboardingPrivacyNote: 'تُحفظ آياتك على هذا الجهاز بكل خصوصية دون الحاجة لحساب.',
    onboardingStartCta: 'ابدأ الآن',
    revisionTitle: 'المراجعة اليومية',
    revisionSubtitle: 'الأقسام الثلاثة لتثبيت المحفوظ',
    revisionHeaderLabel: 'ورد المراجعة والتثبيت',
    revisionThreePillars: '٣ أقسام للمراجعة',
    revisionDueToday: 'مستحق للمراجعة اليوم:',
    revisionNoneDue: 'لا توجد مراجعات مستحقة بعد',
    revisionPillar1Title: '١. مراجعة الأمس',
    revisionPillar1Sub: 'تثبيت ما حفظته مؤخراً قبل البدء بالآيات الجديدة.',
    revisionPillar2Title: '٢. المراجعة السابقة',
    revisionPillar2Sub: 'تعاهد المحفوظ القديم في مواعيده المتباعدة.',
    revisionPillar3Title: '٣. مواضع العناية',
    revisionPillar3Sub: 'الآيات التي احتاجت تكراراً إضافياً لتثبت بيسر.',
    revisionStartBtn: 'بدء المراجعة',
    revisionEmptyBtn: 'لا توجد آيات مستحقة في هذا القسم',
    revisionEmptyTitle: 'ابدأ بحفظ وردك الأول اليوم',
    revisionEmptyBody:
      'بمجرد حفظ آياتك الأولى، ستظهر هنا تلقائياً ضمن مراجعة الأمس والمراجعة السابقة ومواضع العناية.',
    revisionGoToSession: 'الانتقال إلى جلسة اليوم',
    revisionBackBtn: 'العودة إلى المراجعة',
    revisionModeFull: 'النص الكامل',
    revisionModeCue: 'كلمات البداية',
    revisionModeHidden: 'إخفاء للتسميع',
    revisionTapAyahHint: 'اضغط على أي آية للاستماع إليها',
    revisionHiddenTitle: 'النص مخفي للتسميع',
    revisionHiddenBody: 'سمّع الآيات غيباً ثم اختر «كلمات البداية» أو «النص الكامل» للتحقق.',
    revisionEvalPrompt: 'تقييم التسميع:',
    revisionCompleteBtn: 'أتممت المراجعة وحفظت التقييم',
    revisionCompletedBanner: 'أتممت المراجعة',
    revisionCompletedSub: 'تم تحديث موعد المراجعة القادمة لآياتك تلقائياً.',
    progressTitle: 'محفظة الحافظ',
    progressSubtitle: 'متابعة السور والآيات المحفوظة',
    progressBannerLabel: 'ملخص الحفظ',
    progressTotalLabel: 'إجمالي الآيات المحفوظة',
    progressCurrentWird: 'الورد الحالي',
    progressCompletedSurahs: 'السور المكتملة',
    progressActiveSurahs: 'السور الجارية',
    progressEmpty:
      'لم تسجّل أي آيات محفوظة بعد. ابدأ جلستك الأولى من قسم «الحفظ» وستظهر خريطة السور هنا.',
    progressMapTitle: 'خريطة السور',
    progressCompletedCount: 'مكتملة',
    progressInProgressCount: 'جارية',
    evalDifficult: 'صعبة',
    evalDifficultHint: 'إعادة غداً',
    evalGood: 'جيدة',
    evalGoodHint: 'بتأنٍّ',
    evalEasy: 'سهلة',
    evalEasyHint: 'ثابتة بيسر',
    selfTestTitle: 'التسميع الذاتي',
    selfTestPrompt: 'اقرأ بصوتك غيباً بتؤدة ورتّل، ثم اكشف النص للمطابقة...',
    selfTestHiddenHint: 'النص مخفي للتسميع الغيبي',
    selfTestShowBtn: 'كشف النص للتحقق والمطابقة',
    selfTestHideBtn: 'إخفاء النص مجدداً',
    selfTestAudioTitle: 'التدقيق الصوتي المرجعي',
    selfTestAudioSub: 'استمع للتحقق من مخارج الحروف والضبط',
    selfTestPlayBtn: 'استماع',
    selfTestStopBtn: 'إيقاف',
    selfTestNextBtn: 'تثبيت والانتقال للتالي',
    audioReferenceLabel: 'استماع مرجعي للتحقق',
    audioRepeatLabel: 'التكرار:',
    audioLiveStatus: 'تلاوة صوتية',
    audioOfflineStatus: 'مؤقّت القراءة',
    audioRepeatOn: 'تكرار مُفعّل',
    audioRepeatOff: 'استماع مفرد',
    settingsTitle: 'الإعدادات',
    settingsSubtitle: 'تخصيص القراءة والورد اليومي',
    settingsLanguageTitle: 'لغة الواجهة',
    settingsWirdTitle: 'الورد والتلاوة',
    settingsDailyGoalLabel: 'عدد الآيات يومياً',
    settingsReciterLabel: 'الشيخ القارئ المفضّل',
    settingsSpeedLabel: 'سرعة التلاوة',
    settingsRepeatsLabel: 'عدد التكرارات الإلزامية',
    settingsDisplayTitle: 'العرض والقراءة',
    settingsFontSizeLabel: 'حجم الخط القرآني',
    settingsMushafModeLabel: 'طريقة عرض المصحف',
    settingsMushafModeSub: 'بطاقات آيات أو صفحات المصحف',
    settingsModeVerses: 'آيات',
    settingsModePages: 'صفحات المصحف',
    settingsNightMode: 'الوضع الليلي الهادئ',
    settingsNightModeSub: 'مريح للعين أثناء القراءة الليلية',
    settingsLargeUi: 'تكبير خط الواجهة (لكبار السن)',
    settingsLargeUiSub: 'عناصر وأزرار أكبر وضوحاً',
    settingsTranslation: 'عرض ترجمة المعاني',
    settingsTranslationSub: 'إظهار الترجمة مع الآيات عند الحاجة',
    settingsTranslit: 'النطق بالحروف اللاتينية',
    settingsTranslitSub: 'مفيد لغير الناطقين بالعربية',
    settingsOfflineNote: 'تُحفظ السور التي تفتحها للقراءة لاحقاً دون اتصال.',
    settingsRemindersTitle: 'مواقيت التذكير الهادئة',
    settingsFajrReminder: 'ورد الفجر والتبكير',
    settingsEnabled: 'مُفعّل',
    settingsDisabled: 'متوقف',
    settingsBackupTitle: 'النسخ الاحتياطي',
    settingsBackupDesc: 'احتفظ بنسخة من تقدّمك على جهازك لاستعادتها عند الحاجة.',
    settingsBackupCardTitle: 'ملف النسخة الاحتياطية',
    settingsBackupCardSub: 'احفظ ملفاً على جهازك أو أعد تحميله في أي وقت.',
    settingsExportBtn: 'حفظ نسخة على جهازي',
    settingsImportBtn: 'استرجاع نسخة من جهازي',
    settingsResetBtn: 'مسح الحفظ والبدء من جديد',
    settingsResetDone: 'تم مسح التقدّم والبدء من جديد.',
    settingsExportDone: 'تم تنزيل نسخة احتياطية على جهازك.',
    settingsImportDone: 'تم استرجاع النسخة الاحتياطية بنجاح.',
    mushafTitle: 'المصحف الشريف',
    mushafSubtitle: 'قراءة وتلاوة بالرسم العثماني (حفص عن عاصم)',
    mushafCachedText: 'جاهز دون اتصال',
    mushafTapHint: 'اضغط على أي آية لعرض خيارات التلاوة والترجمة والعلامة المرجعية',
    mushafPrevPage: 'الصفحة السابقة',
    mushafNextPage: 'الصفحة التالية',
    mushafPlayVerse: 'استماع للآية',
    mushafToggleBookmark: 'علامة مرجعية',
    mushafShowTranslation: 'إظهار الترجمة',
    mushafHideTranslation: 'إخفاء الترجمة',
    mushafClose: 'إغلاق',
    tafsirTitle: 'التفسير ومعاني الكلمات',
    tafsirSubtitle: 'سورة الكهف • الآيات ١ - ٢ • حفص عن عاصم',
    tafsirDisclaimer:
      'هذا القسم مخصص لتيسير فهم معاني الكلمات أثناء الحفظ؛ أما أحكام الأداء والتجويد والوقف والابتداء فتُتلقّى بالمشافهة على يد معلم مجاز.',
    tafsirWordsTitle: 'معاني الكلمات',
    tafsirSummaryTitle: 'المعنى الإجمالي لاستحضاره أثناء التسميع:',
    tafsirMentalAnchorTitle: 'الروابط الذهنية للتثبيت',
    tafsirGoSelfTest: 'الانتقال إلى التسميع الذاتي',
    mutashabihatTitle: 'ضبط المتشابهات',
    mutashabihatSubtitle: 'تمييز المواضع المتشابهة • حفص عن عاصم',
    mutashabihatPrimaryBadge: 'الموضع الأصلي',
    mutashabihatSecondaryBadge: 'الموضع المقابل',
    mutashabihatRuleTitle: 'ضابط التمييز الذهني',
    mutashabihatQuizTitle: 'اختبار الاستحضار السريع',
  },
  en: {
    brandName: 'Al-Millah',
    tagline: 'Your calm Quran memorization companion',
    hafsBadge: 'Hafs an Asim',
    navHome: 'Home',
    navMemorize: 'Memorize',
    navRevision: 'Revision',
    navProgress: 'Progress',
    mushafLink: 'Mushaf',
    settingsLink: 'Settings',
    onboardingLink: 'Setup',
    offlineLabel: 'Saved locally',
    onlineLabel: 'Local-first storage',
    freeIndividualNote: 'Completely free, individual-only companion with no ads or subscriptions.',
    noAccountNote: 'Your progress is saved locally on your device with no account required.',
    selfEvalDisclaimer:
      'Self-evaluation supports retention and does not replace qualified Tajweed teacher feedback.',
    loadingLabel: 'Loading...',
    versesUnit: 'verses',
    verseSingular: 'verse',
    ayahLabel: 'Verse',
    surahLabel: 'Surah',
    hizbLabel: 'Hizb',
    juzLabel: 'Juz',
    homeGreeting: 'Peace and blessings be upon you',
    homeSubgreeting: 'A calm daily step strengthens your memorization without rush.',
    homeSubtitle: 'Al-Millah • Uthmani Mushaf (Hafs an Asim)',
    homeTodayWird: "Today's Portion",
    homeContinueCta: 'Continue Learning Now',
    homeContinueSessionCta: "Start Today's Session (Revision + New)",
    homeRevisionTitle: "Today's Revision",
    homeRevisionEmpty: 'No revisions due yet — start your first portion today',
    homeNewMemTitle: 'New Memorization',
    homeOpenMushaf: 'Open Noble Mushaf',
    homeDueSummary: 'due',
    homeYesterdayShort: 'yesterday',
    homeOlderShort: 'older',
    homeWeakShort: 'care',
    onboardingTitle: 'Welcome & Setup',
    onboardingIntro: 'Your calm companion for memorizing the Quran (Hafs an Asim).',
    onboardingLargeText: 'Larger Text',
    onboardingReciterTitle: 'Preferred Reciter',
    onboardingReciterPickerTitle: 'Choose your preferred reciter',
    onboardingSurahTitle: 'Starting Surah',
    onboardingSurahPickerTitle: 'Choose another Surah',
    onboardingGoalTitle: 'Daily New Verses Goal',
    onboardingGoalLater: 'Can be changed later',
    onboardingCustomGoalLabel: 'Custom daily verses:',
    onboardingRecommended: 'Recommended',
    onboardingPrivacyNote: 'Your progress stays private on this device with no account needed.',
    onboardingStartCta: 'Start Now',
    revisionTitle: 'Daily Revision',
    revisionSubtitle: 'Three simple sections to retain what you memorized',
    revisionHeaderLabel: 'Revision & Retention',
    revisionThreePillars: '3 revision sections',
    revisionDueToday: 'Due for revision today:',
    revisionNoneDue: 'No revisions due yet',
    revisionPillar1Title: "1. Yesterday's Revision",
    revisionPillar1Sub: 'Consolidate recently memorized verses before starting new ones.',
    revisionPillar2Title: '2. Older Revision',
    revisionPillar2Sub: 'Revisit earlier memorized verses at spaced intervals.',
    revisionPillar3Title: '3. Verses Needing Care',
    revisionPillar3Sub: 'Verses marked difficult that benefit from extra repetition.',
    revisionStartBtn: 'Start Revision',
    revisionEmptyBtn: 'No verses due in this section',
    revisionEmptyTitle: 'Start memorizing your first portion today',
    revisionEmptyBody:
      'Once you memorize your first verses, they will appear here automatically under Yesterday, Older, and Care.',
    revisionGoToSession: "Go to Today's Session",
    revisionBackBtn: 'Back to Revision',
    revisionModeFull: 'Full Text',
    revisionModeCue: 'First Words',
    revisionModeHidden: 'Hide to Recite',
    revisionTapAyahHint: 'Tap any verse to listen to it',
    revisionHiddenTitle: 'Text hidden for active recall',
    revisionHiddenBody: 'Recite from memory, then switch to First Words or Full Text to verify.',
    revisionEvalPrompt: 'How did your recitation go?',
    revisionCompleteBtn: 'Finish Revision & Save Rating',
    revisionCompletedBanner: 'Revision completed',
    revisionCompletedSub: 'Next review dates have been updated automatically.',
    progressTitle: 'Memorization Log',
    progressSubtitle: 'Your Surahs and memorized verses',
    progressBannerLabel: 'Summary',
    progressTotalLabel: 'Total memorized verses',
    progressCurrentWird: 'Current Portion',
    progressCompletedSurahs: 'Completed Surahs',
    progressActiveSurahs: 'Surahs in Progress',
    progressEmpty:
      'No memorized verses recorded yet. Start your first session in Memorize to see your Surah map here.',
    progressMapTitle: 'Surah Map',
    progressCompletedCount: 'completed',
    progressInProgressCount: 'in progress',
    evalDifficult: 'Difficult',
    evalDifficultHint: 'Revise tomorrow',
    evalGood: 'Good',
    evalGoodHint: 'With ease',
    evalEasy: 'Easy',
    evalEasyHint: 'Firmly retained',
    selfTestTitle: 'Self-Test',
    selfTestPrompt: 'Recite aloud calmly from memory, then reveal the text to verify...',
    selfTestHiddenHint: 'Verse hidden for memory recall',
    selfTestShowBtn: 'Reveal Verse to Verify',
    selfTestHideBtn: 'Hide Verse Again',
    selfTestAudioTitle: 'Reference Recitation',
    selfTestAudioSub: 'Listen to verify pronunciation and articulation',
    selfTestPlayBtn: 'Listen',
    selfTestStopBtn: 'Stop',
    selfTestNextBtn: 'Save & Next Verse',
    audioReferenceLabel: 'Reference audio check',
    audioRepeatLabel: 'Repeat:',
    audioLiveStatus: 'Audio recitation',
    audioOfflineStatus: 'Reading timer',
    audioRepeatOn: 'Repeat ON',
    audioRepeatOff: 'Single play',
    settingsTitle: 'Settings',
    settingsSubtitle: 'Reading & daily goal preferences',
    settingsLanguageTitle: 'Interface Language',
    settingsWirdTitle: 'Portion & Recitation',
    settingsDailyGoalLabel: 'Daily verses goal',
    settingsReciterLabel: 'Preferred Reciter',
    settingsSpeedLabel: 'Playback Speed',
    settingsRepeatsLabel: 'Mandatory Repeats',
    settingsDisplayTitle: 'Display & Reading',
    settingsFontSizeLabel: 'Quran Font Size',
    settingsMushafModeLabel: 'Mushaf View Mode',
    settingsMushafModeSub: 'Verse cards or classic Mushaf pages',
    settingsModeVerses: 'Verses',
    settingsModePages: 'Mushaf Pages',
    settingsNightMode: 'Calm Night Mode',
    settingsNightModeSub: 'Gentle contrast for evening reading',
    settingsLargeUi: 'Larger UI Text',
    settingsLargeUiSub: 'Bigger buttons and labels for easier reading',
    settingsTranslation: 'Show Meaning Translation',
    settingsTranslationSub: 'Display verse meanings alongside Arabic text',
    settingsTranslit: 'Show Transliteration',
    settingsTranslitSub: 'Helpful for non-Arabic readers',
    settingsOfflineNote: 'Opened Surahs remain available for offline reading.',
    settingsRemindersTitle: 'Quiet Reminder Times',
    settingsFajrReminder: 'Fajr / Morning Portion',
    settingsEnabled: 'On',
    settingsDisabled: 'Off',
    settingsBackupTitle: 'Backup & Restore',
    settingsBackupDesc: 'Keep a copy of your progress on your device and restore it anytime.',
    settingsBackupCardTitle: 'Device Backup',
    settingsBackupCardSub: 'Save a backup file on your device or restore from one.',
    settingsExportBtn: 'Save Backup to Device',
    settingsImportBtn: 'Restore Backup from Device',
    settingsResetBtn: 'Clear Progress & Start Fresh',
    settingsResetDone: 'Local progress has been reset.',
    settingsExportDone: 'Backup file downloaded to your device.',
    settingsImportDone: 'Backup restored successfully.',
    mushafTitle: 'Noble Mushaf',
    mushafSubtitle: 'Uthmani Script (Hafs an Asim)',
    mushafCachedText: 'Available offline',
    mushafTapHint: 'Tap any verse for audio, translation, and bookmark options',
    mushafPrevPage: 'Previous Page',
    mushafNextPage: 'Next Page',
    mushafPlayVerse: 'Listen to Verse',
    mushafToggleBookmark: 'Bookmark',
    mushafShowTranslation: 'Show Translation',
    mushafHideTranslation: 'Hide Translation',
    mushafClose: 'Close',
    tafsirTitle: 'Tafsir & Word Meanings',
    tafsirSubtitle: 'Surah Al-Kahf • Verses 1–2 • Hafs an Asim',
    tafsirDisclaimer:
      'This section helps with word meanings during memorization; Tajweed and pausing rulings should be learned directly from a qualified teacher.',
    tafsirWordsTitle: 'Word Meanings',
    tafsirSummaryTitle: 'Overall meaning to keep in mind while reciting:',
    tafsirMentalAnchorTitle: 'Memory Anchors',
    tafsirGoSelfTest: 'Go to Self-Test',
    mutashabihatTitle: 'Similar Verses',
    mutashabihatSubtitle: 'Distinguishing similar passages • Hafs an Asim',
    mutashabihatPrimaryBadge: 'Primary Passage',
    mutashabihatSecondaryBadge: 'Parallel Passage',
    mutashabihatRuleTitle: 'Memory Distinction Cue',
    mutashabihatQuizTitle: 'Quick Recall Check',
  },
  fr: {
    brandName: 'Al-Millah',
    tagline: 'Votre compagnon serein pour mémoriser le Coran',
    hafsBadge: 'Hafs an Asim',
    navHome: 'Accueil',
    navMemorize: 'Mémoriser',
    navRevision: 'Révision',
    navProgress: 'Progrès',
    mushafLink: 'Mushaf',
    settingsLink: 'Paramètres',
    onboardingLink: 'Début',
    offlineLabel: 'Hors ligne (local)',
    onlineLabel: 'Stockage local',
    freeIndividualNote: 'Compagnon gratuit et individuel, sans publicités ni abonnements.',
    noAccountNote: 'Votre progression est enregistrée localement sur votre appareil sans compte requis.',
    selfEvalDisclaimer:
      'L’auto-évaluation aide à la révision et ne remplace pas un enseignant qualifié de Tajwid.',
    loadingLabel: 'Chargement...',
    versesUnit: 'versets',
    verseSingular: 'verset',
    ayahLabel: 'Verset',
    surahLabel: 'Sourate',
    hizbLabel: 'Hizb',
    juzLabel: 'Juz',
    homeGreeting: 'Que la paix et la bénédiction soient sur vous',
    homeSubgreeting: 'Un pas serein chaque jour consolide votre mémorisation sans hâte.',
    homeSubtitle: 'Al-Millah • Mushaf Uthmani (Hafs an Asim)',
    homeTodayWird: 'Portion du jour',
    homeContinueCta: 'Continuer la séance',
    homeContinueSessionCta: 'Démarrer la séance du jour (Révision + Nouveau)',
    homeRevisionTitle: 'Révision du jour',
    homeRevisionEmpty: 'Aucune révision prévue — commencez votre première portion aujourd’hui',
    homeNewMemTitle: 'Nouvelle mémorisation',
    homeOpenMushaf: 'Ouvrir le Noble Mushaf',
    homeDueSummary: 'à réviser',
    homeYesterdayShort: 'hier',
    homeOlderShort: 'ancien',
    homeWeakShort: 'soin',
    onboardingTitle: 'Bienvenue et configuration',
    onboardingIntro: 'Votre compagnon serein pour mémoriser le Coran (Hafs an Asim).',
    onboardingLargeText: 'Texte agrandi',
    onboardingReciterTitle: 'Récitateur préféré',
    onboardingReciterPickerTitle: 'Choisir votre récitateur préféré',
    onboardingSurahTitle: 'Sourate de départ',
    onboardingSurahPickerTitle: 'Choisir une autre sourate',
    onboardingGoalTitle: 'Objectif quotidien',
    onboardingGoalLater: 'Modifiable plus tard',
    onboardingCustomGoalLabel: 'Nombre personnalisé de versets :',
    onboardingRecommended: 'Recommandé',
    onboardingPrivacyNote: 'Votre progression reste privée sur cet appareil, sans compte requis.',
    onboardingStartCta: 'Commencer',
    revisionTitle: 'Révision quotidienne',
    revisionSubtitle: 'Trois sections simples pour consolider votre mémorisation',
    revisionHeaderLabel: 'Révision et consolidation',
    revisionThreePillars: '3 sections de révision',
    revisionDueToday: 'À réviser aujourd’hui :',
    revisionNoneDue: 'Aucune révision prévue pour le moment',
    revisionPillar1Title: '1. Révision d’hier',
    revisionPillar1Sub: 'Consolider les versets récents avant d’en apprendre de nouveaux.',
    revisionPillar2Title: '2. Révision précédente',
    revisionPillar2Sub: 'Revoir les versets plus anciens à intervalles espacés.',
    revisionPillar3Title: '3. Versets à soigner',
    revisionPillar3Sub: 'Les versets difficiles nécessitant un peu plus de répétition.',
    revisionStartBtn: 'Commencer la révision',
    revisionEmptyBtn: 'Aucun verset dû dans cette section',
    revisionEmptyTitle: 'Commencez votre première portion aujourd’hui',
    revisionEmptyBody:
      'Dès que vous mémorisez vos premiers versets, ils apparaîtront ici automatiquement.',
    revisionGoToSession: 'Aller à la séance du jour',
    revisionBackBtn: 'Retour à la révision',
    revisionModeFull: 'Texte complet',
    revisionModeCue: 'Premiers mots',
    revisionModeHidden: 'Masquer pour réciter',
    revisionTapAyahHint: 'Appuyez sur un verset pour l’écouter',
    revisionHiddenTitle: 'Texte masqué pour rappel actif',
    revisionHiddenBody: 'Récitez de mémoire, puis vérifiez avec Premiers mots ou Texte complet.',
    revisionEvalPrompt: 'Comment s’est passée votre récitation ?',
    revisionCompleteBtn: 'Terminer et enregistrer l’évaluation',
    revisionCompletedBanner: 'Révision terminée',
    revisionCompletedSub: 'Les prochaines dates de révision ont été mises à jour.',
    progressTitle: 'Carnet de mémorisation',
    progressSubtitle: 'Suivi de vos sourates et versets',
    progressBannerLabel: 'Résumé',
    progressTotalLabel: 'Total des versets mémorisés',
    progressCurrentWird: 'Portion actuelle',
    progressCompletedSurahs: 'Sourates terminées',
    progressActiveSurahs: 'Sourates en cours',
    progressEmpty:
      'Aucun verset enregistré pour le moment. Commencez votre première séance dans Mémoriser.',
    progressMapTitle: 'Carte des sourates',
    progressCompletedCount: 'terminées',
    progressInProgressCount: 'en cours',
    evalDifficult: 'Difficile',
    evalDifficultHint: 'Revoir demain',
    evalGood: 'Bien',
    evalGoodHint: 'Posément',
    evalEasy: 'Facile',
    evalEasyHint: 'Bien retenu',
    selfTestTitle: 'Auto-test',
    selfTestPrompt: 'Récitez de mémoire à voix haute, puis révélez le texte pour vérifier...',
    selfTestHiddenHint: 'Verset masqué pour test de mémoire',
    selfTestShowBtn: 'Révéler le verset',
    selfTestHideBtn: 'Masquer à nouveau',
    selfTestAudioTitle: 'Récitation de référence',
    selfTestAudioSub: 'Écoutez pour vérifier la prononciation',
    selfTestPlayBtn: 'Écouter',
    selfTestStopBtn: 'Arrêter',
    selfTestNextBtn: 'Enregistrer et suivant',
    audioReferenceLabel: 'Écoute de référence',
    audioRepeatLabel: 'Répétition :',
    audioLiveStatus: 'Récitation audio',
    audioOfflineStatus: 'Minuteur de lecture',
    audioRepeatOn: 'Répétition activée',
    audioRepeatOff: 'Lecture simple',
    settingsTitle: 'Paramètres',
    settingsSubtitle: 'Préférences de lecture et objectif quotidien',
    settingsLanguageTitle: 'Langue de l’interface',
    settingsWirdTitle: 'Portion et récitation',
    settingsDailyGoalLabel: 'Versets par jour',
    settingsReciterLabel: 'Récitateur préféré',
    settingsSpeedLabel: 'Vitesse de lecture',
    settingsRepeatsLabel: 'Répétitions obligatoires',
    settingsDisplayTitle: 'Affichage et lecture',
    settingsFontSizeLabel: 'Taille du texte coranique',
    settingsMushafModeLabel: 'Mode d’affichage du Mushaf',
    settingsMushafModeSub: 'Cartes de versets ou pages du Mushaf',
    settingsModeVerses: 'Versets',
    settingsModePages: 'Pages du Mushaf',
    settingsNightMode: 'Mode nuit apaisant',
    settingsNightModeSub: 'Confort visuel pour la lecture nocturne',
    settingsLargeUi: 'Texte d’interface agrandi',
    settingsLargeUiSub: 'Boutons et textes plus grands',
    settingsTranslation: 'Afficher la traduction',
    settingsTranslationSub: 'Afficher le sens des versets',
    settingsTranslit: 'Afficher la translittération',
    settingsTranslitSub: 'Utile pour les lecteurs non arabophones',
    settingsOfflineNote: 'Les sourates ouvertes restent accessibles hors ligne.',
    settingsRemindersTitle: 'Rappels discrets',
    settingsFajrReminder: 'Portion du Fajr / matin',
    settingsEnabled: 'Activé',
    settingsDisabled: 'Désactivé',
    settingsBackupTitle: 'Sauvegarde',
    settingsBackupDesc: 'Gardez une copie de votre progression sur cet appareil.',
    settingsBackupCardTitle: 'Fichier de sauvegarde',
    settingsBackupCardSub: 'Enregistrez ou restaurez votre fichier à tout moment.',
    settingsExportBtn: 'Enregistrer une sauvegarde',
    settingsImportBtn: 'Restaurer une sauvegarde',
    settingsResetBtn: 'Effacer et recommencer',
    settingsResetDone: 'Progression locale réinitialisée.',
    settingsExportDone: 'Sauvegarde téléchargée sur votre appareil.',
    settingsImportDone: 'Sauvegarde restaurée avec succès.',
    mushafTitle: 'Noble Mushaf',
    mushafSubtitle: 'Écriture Uthmani (Hafs an Asim)',
    mushafCachedText: 'Disponible hors ligne',
    mushafTapHint: 'Appuyez sur un verset pour l’audio, la traduction et le signet',
    mushafPrevPage: 'Page précédente',
    mushafNextPage: 'Page suivante',
    mushafPlayVerse: 'Écouter le verset',
    mushafToggleBookmark: 'Signet',
    mushafShowTranslation: 'Afficher la traduction',
    mushafHideTranslation: 'Masquer la traduction',
    mushafClose: 'Fermer',
    tafsirTitle: 'Tafsir et sens des mots',
    tafsirSubtitle: 'Sourate Al-Kahf • Versets 1–2 • Hafs an Asim',
    tafsirDisclaimer:
      'Cette section aide à comprendre les mots pendant la mémorisation ; les règles de Tajwid et d’arrêt s’apprennent auprès d’un enseignant qualifié.',
    tafsirWordsTitle: 'Sens des mots',
    tafsirSummaryTitle: 'Sens global à garder à l’esprit :',
    tafsirMentalAnchorTitle: 'Repères de mémorisation',
    tafsirGoSelfTest: 'Aller à l’auto-test',
    mutashabihatTitle: 'Versets similaires',
    mutashabihatSubtitle: 'Distinguer les passages proches • Hafs an Asim',
    mutashabihatPrimaryBadge: 'Passage principal',
    mutashabihatSecondaryBadge: 'Passage parallèle',
    mutashabihatRuleTitle: 'Repère de distinction',
    mutashabihatQuizTitle: 'Vérification rapide',
  },
};
