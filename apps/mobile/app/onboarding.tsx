import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  MILLA_COPY,
  RECITERS,
  SURAHS,
  formatNum,
  getSurahById,
  getSurahDisplayName,
  type AppLanguage,
  type ReciterId,
} from '@al-milla/core';
import { AnimatedPressable } from '../src/components/milla/AnimatedPressable';
import { MillaPicker } from '../src/components/milla/MillaPicker';
import { QuranText } from '../src/components/milla/QuranText';
import { useMilla } from '../src/context/MillaContext';
import { createAyahAudioController, type AyahAudioController } from '../src/services/audio';
import { useResponsiveLayout } from '../src/theme/responsive';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '../src/theme/tokens';

const LOGO_ASSET = require('../assets/images/al-milla-logo.png');
const LOGO_DARK_ASSET = require('../assets/images/al-milla-logo-dark.jpg');
const MUSHAF_MORNING_IMG = require('../assets/images/mushaf-morning.jpg');

type StepIndex = 0 | 1 | 2 | 3;

const TOTAL_STEPS = 4;

const DIFFICULTY_PRESETS = [
  { value: 3, labelAr: 'سريع', labelEn: 'Fast', labelFr: 'Rapide' },
  { value: 5, labelAr: 'متوازن', labelEn: 'Balanced', labelFr: 'Équilibré' },
  { value: 7, labelAr: 'تدريجي', labelEn: 'Gradual', labelFr: 'Progressif' },
] as const;

const STEP_LABELS: Record<AppLanguage, readonly [string, string, string, string]> = {
  ar: ['اللغة والراحة', 'القارئ المفضّل', 'سورة البداية', 'الهدف اليومي'],
  en: ['Language & Comfort', 'Preferred Reciter', 'Starting Surah', 'Daily Pace'],
  fr: ['Langue & Confort', 'Récitateur', 'Sourate de départ', 'Rythme quotidien'],
};

const NEXT_CTA_LABELS: Record<AppLanguage, string> = {
  ar: 'التالي',
  en: 'Continue',
  fr: 'Continuer',
};

const SKIP_CTA_LABELS: Record<AppLanguage, string> = {
  ar: 'تخطي والبدء الآن',
  en: 'Skip & start now',
  fr: 'Passer et commencer',
};

const TRUST_BADGES: Record<
  AppLanguage,
  readonly [
    { icon: 'heart-outline'; label: string },
    { icon: 'cloud-offline-outline'; label: string },
    { icon: 'shield-checkmark-outline'; label: string },
  ]
> = {
  ar: [
    { icon: 'heart-outline', label: 'مجاني وفردي' },
    { icon: 'cloud-offline-outline', label: 'يعمل دون إنترنت' },
    { icon: 'shield-checkmark-outline', label: 'دون تسجيل إجباري' },
  ],
  en: [
    { icon: 'heart-outline', label: 'Free & Individual' },
    { icon: 'cloud-offline-outline', label: 'Offline First' },
    { icon: 'shield-checkmark-outline', label: 'No Account Wall' },
  ],
  fr: [
    { icon: 'heart-outline', label: 'Gratuit & Individuel' },
    { icon: 'cloud-offline-outline', label: 'Hors ligne' },
    { icon: 'shield-checkmark-outline', label: 'Sans inscription' },
  ],
};

export default function OnboardingScreen() {
  const router = useRouter();
  const {
    state,
    theme,
    setReciter,
    setCursor,
    setDailyTarget,
    setMandatoryRepeats,
    setLargeUiMode,
    setNightMode,
    setQuranFontSize,
    completeOnboarding,
  } = useMilla();
  const { contentMaxWidth, horizontalPadding } = useResponsiveLayout();

  const language = state?.language ?? 'ar';
  const reciter = state?.reciter ?? 'hudhaify';
  const currentSurahId = state?.currentSurahId ?? 18;
  const dailyTarget = state?.dailyTarget ?? 3;
  const mandatoryRepeats = state?.mandatoryRepeats ?? 5;
  const largeUiMode = state?.largeUiMode ?? false;
  const nightMode = state?.nightMode ?? false;
  const quranFontSize = state?.quranFontSize ?? 24;

  const copy = MILLA_COPY[language];
  const isRtl = language === 'ar';
  const dirArrow = isRtl ? 'arrow-back' : 'arrow-forward';
  const backChevron = isRtl ? 'chevron-forward' : 'chevron-back';
  const fs = (base: number): number => Math.round(base * (largeUiMode ? 1.12 : 1));

  const [step, setStep] = useState<StepIndex>(0);
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const [previewingReciter, setPreviewingReciter] = useState<ReciterId | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const scrollRef = useRef<React.ComponentRef<typeof ScrollView> | null>(null);
  const audioControllerRef = useRef<AyahAudioController | null>(null);

  const stepOpacity = useRef<Animated.Value>(new Animated.Value(1)).current;
  const stepTranslateX = useRef<Animated.Value>(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    const loadMotionPref = async () => {
      try {
        const enabled = await AccessibilityInfo.isReduceMotionEnabled();
        if (active) setReduceMotion(enabled);
      } catch {
        // Ignore accessibility lookup error
      }
    };
    void loadMotionPref();
    return () => {
      active = false;
    };
  }, []);

  const stopPreviewAudio = async () => {
    if (audioControllerRef.current) {
      await audioControllerRef.current.stop();
    }
    setPreviewingReciter(null);
  };

  useEffect(() => {
    return () => {
      if (audioControllerRef.current) {
        void audioControllerRef.current.stop();
      }
    };
  }, []);

  const goToStep = (nextStep: StepIndex, direction: 1 | -1) => {
    void stopPreviewAudio();
    setAudioError(null);
    setStep(nextStep);
    scrollRef.current?.scrollTo({ y: 0, animated: false });

    if (reduceMotion) {
      stepTranslateX.setValue(0);
      stepOpacity.setValue(0.75);
      Animated.timing(stepOpacity, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }).start();
      return;
    }

    const offset = (isRtl ? -26 : 26) * direction;
    stepOpacity.setValue(0);
    stepTranslateX.setValue(offset);
    Animated.parallel([
      Animated.timing(stepOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(stepTranslateX, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePreviewReciter = async (reciterId: ReciterId) => {
    setAudioError(null);
    if (!audioControllerRef.current) {
      audioControllerRef.current = createAyahAudioController();
    }

    if (previewingReciter === reciterId) {
      await stopPreviewAudio();
      return;
    }

    setPreviewingReciter(reciterId);
    await audioControllerRef.current.playAyah({
      reciter: reciterId,
      surahId: 1,
      ayahNumber: 1,
      speed: 1.0,
      repeats: 1,
      onFinish: () => {
        setPreviewingReciter((curr) => (curr === reciterId ? null : curr));
      },
      onError: () => {
        setPreviewingReciter(null);
        setAudioError(
          language === 'ar'
            ? 'تعذّر تحميل التلاوة التجريبية حالياً — يمكنك المتابعة والاختيار دون صوت.'
            : language === 'fr'
              ? 'Aperçu audio indisponible pour le moment — vous pouvez continuer hors ligne.'
              : 'Audio preview is currently unavailable — you can still pick a reciter offline.',
        );
      },
    });
  };

  const handleFinish = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await stopPreviewAudio();
      await completeOnboarding();
      router.replace('/');
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetNotes: Record<number, { ar: string; en: string; fr: string }> = {
    1: { ar: 'فاتحة الكتاب', en: 'Opening Surah', fr: 'Ouverture du Coran' },
    78: { ar: 'بداية جزء عمّ', en: "Start of Juz 'Amma", fr: "Début du Juz 'Amma" },
    67: { ar: 'ورد كل ليلة', en: 'Nightly Surah', fr: 'Sourate du soir' },
    18: { ar: 'ورد يوم الجمعة', en: 'Friday Surah', fr: 'Sourate du vendredi' },
  };

  const startingSurahPresets = [1, 78, 67, 18].map((id) => {
    const s = SURAHS.find((item) => item.id === id) ?? SURAHS[0]!;
    const note = presetNotes[s.id]?.[language];
    return {
      id: s.id,
      label: getSurahDisplayName(s, language),
      hint: note
        ? `${formatNum(s.totalAyahs, language)} ${copy.versesUnit} • ${note}`
        : `${formatNum(s.totalAyahs, language)} ${copy.versesUnit}`,
    };
  });

  const surahRows: [typeof startingSurahPresets, typeof startingSurahPresets] = [
    startingSurahPresets.slice(0, 2),
    startingSurahPresets.slice(2, 4),
  ];

  const dailyGoals: { value: number; title: string; subtitle: string; recommended?: boolean }[] = [
    {
      value: 3,
      title: `${formatNum(3, language)} ${copy.versesUnit}`,
      subtitle:
        language === 'ar'
          ? 'توازن مناسب بين الحفظ والمراجعة'
          : language === 'fr'
            ? 'Bon équilibre mémorisation / révision'
            : 'Balanced pace for memorization & review',
      recommended: true,
    },
    {
      value: 4,
      title: `${formatNum(4, language)} ${copy.versesUnit}`,
      subtitle:
        language === 'ar'
          ? 'خطوة ثابتة ومتوسطة'
          : language === 'fr'
            ? 'Un rythme régulier et modéré'
            : 'A steady, moderate pace',
    },
    {
      value: 5,
      title: `${formatNum(5, language)} ${copy.versesUnit}`,
      subtitle:
        language === 'ar'
          ? 'للمعتادين على الحفظ اليومي'
          : language === 'fr'
            ? 'Pour les habitués'
            : 'For experienced daily learners',
    },
  ];

  const selectedSurah = getSurahById(currentSurahId);
  const selectedReciterObj = RECITERS.find((r) => r.id === reciter) ?? RECITERS[0]!;
  const activeDifficulty =
    DIFFICULTY_PRESETS.find((p) => p.value === mandatoryRepeats) ?? DIFFICULTY_PRESETS[1];
  const activeDifficultyLabel =
    language === 'en'
      ? activeDifficulty.labelEn
      : language === 'fr'
        ? activeDifficulty.labelFr
        : activeDifficulty.labelAr;
  const stepTitleText = STEP_LABELS[language][step];
  const segmentIndices: readonly StepIndex[] = [0, 1, 2, 3];

  return (
    <SafeAreaView
      style={[styles.safeRoot, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      {/* Top Progress Header */}
      <View
        style={[
          styles.topHeader,
          {
            flexDirection: isRtl ? 'row-reverse' : 'row',
            borderBottomColor: theme.border,
            backgroundColor: theme.background,
          },
        ]}
      >
        {step > 0 ? (
          <AnimatedPressable
            reduceMotion={reduceMotion}
            hitSlop={6}
            onPress={() => goToStep((step - 1) as StepIndex, -1)}
            accessibilityRole="button"
            accessibilityLabel={copy.revisionBackBtn}
            style={[
              styles.headerIconBtn,
              { borderColor: theme.border, backgroundColor: theme.card },
            ]}
          >
            <Ionicons name={backChevron} size={18} color={theme.foreground} />
          </AnimatedPressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}

        <View style={styles.progressCenter}>
          <View
            style={[
              styles.stepMetaRow,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <Text style={[styles.stepCounterText, { color: theme.primary, fontSize: fs(12) }]}>
              {formatNum(step + 1, language)} / {formatNum(TOTAL_STEPS, language)}
            </Text>
            <Text
              style={[styles.stepNameText, { color: theme.mutedForeground, fontSize: fs(12) }]}
              numberOfLines={1}
            >
              {stepTitleText}
            </Text>
          </View>
          <View
            style={[
              styles.segmentsRow,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            {segmentIndices.map((idx) => {
              const isDone = idx < step;
              const isActive = idx === step;
              return (
                <View
                  key={idx}
                  style={[
                    styles.segmentPill,
                    {
                      backgroundColor: isDone
                        ? theme.primary
                        : isActive
                          ? theme.accent
                          : theme.border,
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>

        <AnimatedPressable
          reduceMotion={reduceMotion}
          hitSlop={6}
          onPress={() => void setLargeUiMode(!largeUiMode)}
          accessibilityRole="button"
          accessibilityState={{ selected: largeUiMode }}
          accessibilityLabel={copy.onboardingLargeText}
          style={[
            styles.largeAaBtn,
            {
              borderColor: largeUiMode ? theme.primary : theme.border,
              backgroundColor: largeUiMode ? theme.primary : theme.card,
            },
          ]}
        >
          <Text
            style={[
              styles.largeAaText,
              { color: largeUiMode ? theme.primaryForeground : theme.foreground },
            ]}
          >
            Aa
          </Text>
        </AnimatedPressable>
      </View>

      {/* Scrollable Animated Step Body */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.animatedStepWrap,
            {
              maxWidth: contentMaxWidth,
              alignSelf: 'center',
              opacity: stepOpacity,
              transform: [{ translateX: stepTranslateX }],
            },
          ]}
        >
          {/* STEP 0: Welcome, Language & Comfort */}
          {step === 0 ? (
            <View style={styles.stepStack}>
              <View style={[styles.heroCard, { borderColor: theme.border }]}>
                <View style={styles.heroBg}>
                  <Image
                    source={MUSHAF_MORNING_IMG}
                    style={[styles.heroOverlay, { width: '100%', height: '100%' }]}
                    resizeMode="cover"
                  />
                  <View
                    style={[
                      styles.heroOverlay,
                      {
                        backgroundColor: theme.isDark
                          ? 'rgba(11, 11, 10, 0.84)'
                          : 'rgba(7, 61, 53, 0.82)',
                      },
                    ]}
                  />
                  <View style={styles.heroInner}>
                    <View style={[styles.heroLogoWrap, { backgroundColor: theme.card }]}>
                      <Image
                        source={theme.isDark ? LOGO_DARK_ASSET : LOGO_ASSET}
                        style={styles.heroLogo}
                        accessibilityLabel={copy.brandName}
                      />
                    </View>
                    <Text style={[styles.heroTitle, { fontSize: fs(28) }]}>
                      {copy.brandName}
                    </Text>
                    <Text style={[styles.heroSubtitle, { fontSize: fs(14) }]}>
                      {copy.tagline}
                    </Text>
                    <Text style={[styles.heroIntro, { fontSize: fs(13) }]}>
                      {copy.onboardingIntro}
                    </Text>
                    <View
                      style={[
                        styles.trustRow,
                        { flexDirection: isRtl ? 'row-reverse' : 'row' },
                      ]}
                    >
                      {TRUST_BADGES[language].map((badge) => (
                        <View
                          key={badge.label}
                          style={[
                            styles.trustChip,
                            { flexDirection: isRtl ? 'row-reverse' : 'row' },
                          ]}
                        >
                          <Ionicons name={badge.icon} size={13} color="#ffffff" />
                          <Text style={[styles.trustText, { fontSize: fs(11) }]}>
                            {badge.label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>

              {/* Comfort & Accessibility */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View
                  style={[
                    styles.cardHeader,
                    { flexDirection: isRtl ? 'row-reverse' : 'row' },
                  ]}
                >
                  <Ionicons name="eye-outline" size={20} color={theme.primary} />
                  <Text style={[styles.cardTitle, { color: theme.foreground, fontSize: fs(16) }]}>
                    {language === 'ar'
                      ? 'الراحة البصرية وحجم الخط'
                      : language === 'fr'
                        ? 'Confort visuel & taille du texte'
                        : 'Reading Comfort & Display'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.twoColRow,
                    { flexDirection: isRtl ? 'row-reverse' : 'row' },
                  ]}
                >
                  <AnimatedPressable
                    reduceMotion={reduceMotion}
                    containerStyle={styles.flexTile}
                    onPress={() => void setNightMode(!nightMode)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: nightMode }}
                    style={[
                      styles.comfortTile,
                      {
                        borderColor: nightMode ? theme.primary : theme.border,
                        backgroundColor: nightMode ? theme.secondary : theme.background,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.comfortTop,
                        { flexDirection: isRtl ? 'row-reverse' : 'row' },
                      ]}
                    >
                      <Ionicons
                        name={nightMode ? 'moon' : 'sunny-outline'}
                        size={18}
                        color={nightMode ? theme.primary : theme.mutedForeground}
                      />
                      {nightMode ? (
                        <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.comfortLabel,
                        {
                          color: theme.foreground,
                          fontSize: fs(13),
                          textAlign: isRtl ? 'right' : 'left',
                        },
                      ]}
                    >
                      {copy.settingsNightMode}
                    </Text>
                    <Text
                      style={[
                        styles.comfortState,
                        {
                          color: nightMode ? theme.primary : theme.mutedForeground,
                          fontSize: fs(11),
                          textAlign: isRtl ? 'right' : 'left',
                        },
                      ]}
                    >
                      {nightMode ? copy.settingsEnabled : copy.settingsDisabled}
                    </Text>
                  </AnimatedPressable>

                  <AnimatedPressable
                    reduceMotion={reduceMotion}
                    containerStyle={styles.flexTile}
                    onPress={() => void setLargeUiMode(!largeUiMode)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: largeUiMode }}
                    style={[
                      styles.comfortTile,
                      {
                        borderColor: largeUiMode ? theme.primary : theme.border,
                        backgroundColor: largeUiMode ? theme.secondary : theme.background,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.comfortTop,
                        { flexDirection: isRtl ? 'row-reverse' : 'row' },
                      ]}
                    >
                      <Ionicons
                        name="text-outline"
                        size={18}
                        color={largeUiMode ? theme.primary : theme.mutedForeground}
                      />
                      {largeUiMode ? (
                        <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.comfortLabel,
                        {
                          color: theme.foreground,
                          fontSize: fs(13),
                          textAlign: isRtl ? 'right' : 'left',
                        },
                      ]}
                    >
                      {copy.onboardingLargeText}
                    </Text>
                    <Text
                      style={[
                        styles.comfortState,
                        {
                          color: largeUiMode ? theme.primary : theme.mutedForeground,
                          fontSize: fs(11),
                          textAlign: isRtl ? 'right' : 'left',
                        },
                      ]}
                    >
                      {largeUiMode ? copy.settingsEnabled : copy.settingsDisabled}
                    </Text>
                  </AnimatedPressable>
                </View>

                {/* Quran Font Size Stepper + Live Verified Preview */}
                <View
                  style={[
                    styles.stepperBar,
                    { flexDirection: isRtl ? 'row-reverse' : 'row' },
                  ]}
                >
                  <Text style={[styles.stepperLbl, { color: theme.foreground, fontSize: fs(13) }]}>
                    {copy.settingsFontSizeLabel}
                  </Text>
                  <View style={styles.stepperBtns}>
                    <AnimatedPressable
                      reduceMotion={reduceMotion}
                      onPress={() => void setQuranFontSize(quranFontSize - 2)}
                      accessibilityRole="button"
                      accessibilityLabel="-"
                      style={[
                        styles.stepCircleBtn,
                        { borderColor: theme.border, backgroundColor: theme.background },
                      ]}
                    >
                      <Text style={[styles.stepSign, { color: theme.foreground }]}>-</Text>
                    </AnimatedPressable>
                    <Text style={[styles.stepValueText, { color: theme.primary, fontSize: fs(14) }]}>
                      {formatNum(quranFontSize, language)}
                    </Text>
                    <AnimatedPressable
                      reduceMotion={reduceMotion}
                      onPress={() => void setQuranFontSize(quranFontSize + 2)}
                      accessibilityRole="button"
                      accessibilityLabel="+"
                      style={[
                        styles.stepCircleBtn,
                        { borderColor: theme.border, backgroundColor: theme.background },
                      ]}
                    >
                      <Text style={[styles.stepSign, { color: theme.foreground }]}>+</Text>
                    </AnimatedPressable>
                  </View>
                </View>

                <View
                  style={[
                    styles.quranPreviewBox,
                    { backgroundColor: theme.secondary, borderColor: theme.border },
                  ]}
                >
                  <QuranText align="center" fontSize={quranFontSize}>
                    بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
                  </QuranText>
                </View>
              </View>
            </View>
          ) : null}

          {/* STEP 1: Preferred Reciter with Live Preview */}
          {step === 1 ? (
            <View style={styles.stepStack}>
              <View style={styles.stepIntroWrap}>
                <View
                  style={[
                    styles.stepTitleRow,
                    { flexDirection: isRtl ? 'row-reverse' : 'row' },
                  ]}
                >
                  <View style={[styles.stepIconBadge, { backgroundColor: theme.secondary }]}>
                    <Ionicons name="volume-high-outline" size={20} color={theme.primary} />
                  </View>
                  <View style={[styles.stepTitleTextWrap, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                    <Text style={[styles.stepHeading, { color: theme.foreground, fontSize: fs(20) }]}>
                      {copy.onboardingReciterTitle}
                    </Text>
                    <Text
                      style={[
                        styles.stepSub,
                        {
                          color: theme.mutedForeground,
                          fontSize: fs(13),
                          textAlign: isRtl ? 'right' : 'left',
                        },
                      ]}
                    >
                      {language === 'ar'
                        ? 'استمع لنموذج من التلاوة واختر الصوت الأقرب لقلبك.'
                        : language === 'fr'
                          ? 'Écoutez un extrait et choisissez le récitateur qui vous apaise.'
                          : 'Tap preview on any reciter to hear Surah Al-Fatihah, changeable anytime.'}
                    </Text>
                  </View>
                </View>

                <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                  <View style={[styles.badgePill, { backgroundColor: theme.secondary }]}>
                    <Text style={[styles.badgePillText, { color: theme.secondaryForeground, fontSize: fs(12) }]}>
                      {copy.hafsBadge}
                    </Text>
                  </View>
                </View>
              </View>

              {audioError ? (
                <View
                  style={[
                    styles.errorBanner,
                    {
                      flexDirection: isRtl ? 'row-reverse' : 'row',
                      backgroundColor: theme.secondary,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Ionicons name="cloud-offline-outline" size={18} color={theme.primary} />
                  <Text
                    style={[
                      styles.errorBannerText,
                      {
                        color: theme.foreground,
                        fontSize: fs(12),
                        textAlign: isRtl ? 'right' : 'left',
                      },
                    ]}
                  >
                    {audioError}
                  </Text>
                </View>
              ) : null}

              <View style={styles.reciterList}>
                {RECITERS.map((item) => {
                  const selected = reciter === item.id;
                  const isPreviewing = previewingReciter === item.id;
                  return (
                    <AnimatedPressable
                      key={item.id}
                      reduceMotion={reduceMotion}
                      onPress={() => void setReciter(item.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      style={[
                        styles.reciterCard,
                        {
                          flexDirection: isRtl ? 'row-reverse' : 'row',
                          borderWidth: selected ? 2 : 1,
                          borderColor: selected ? theme.primary : theme.border,
                          backgroundColor: selected ? theme.secondary : theme.card,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.reciterMain,
                          { flexDirection: isRtl ? 'row-reverse' : 'row' },
                        ]}
                      >
                        <Ionicons
                          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={22}
                          color={selected ? theme.primary : theme.mutedForeground}
                        />
                        <View
                          style={[
                            styles.reciterInfo,
                            { alignItems: isRtl ? 'flex-end' : 'flex-start' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.reciterName,
                              {
                                color: theme.foreground,
                                fontSize: fs(15),
                                textAlign: isRtl ? 'right' : 'left',
                              },
                            ]}
                          >
                            {language === 'ar' ? item.nameAr : item.nameEn}
                          </Text>
                          <Text
                            style={[
                              styles.reciterStyle,
                              {
                                color: theme.mutedForeground,
                                fontSize: fs(12),
                                textAlign: isRtl ? 'right' : 'left',
                              },
                            ]}
                          >
                            {language === 'ar' ? item.styleAr : item.nameAr}
                          </Text>
                        </View>
                      </View>

                      <AnimatedPressable
                        reduceMotion={reduceMotion}
                        onPress={() => void handlePreviewReciter(item.id)}
                        accessibilityRole="button"
                        accessibilityLabel={
                          isPreviewing
                            ? copy.selfTestStopBtn
                            : `${copy.selfTestPlayBtn} ${language === 'ar' ? item.nameAr : item.nameEn}`
                        }
                        style={[
                          styles.previewBtn,
                          {
                            flexDirection: isRtl ? 'row-reverse' : 'row',
                            borderColor: isPreviewing ? theme.primary : theme.border,
                            backgroundColor: isPreviewing ? theme.primary : theme.background,
                          },
                        ]}
                      >
                        <Ionicons
                          name={isPreviewing ? 'stop-circle-outline' : 'play-circle-outline'}
                          size={18}
                          color={isPreviewing ? theme.primaryForeground : theme.primary}
                        />
                        <Text
                          style={[
                            styles.previewBtnText,
                            {
                              color: isPreviewing ? theme.primaryForeground : theme.foreground,
                              fontSize: fs(12),
                            },
                          ]}
                        >
                          {isPreviewing
                            ? language === 'ar'
                              ? 'إيقاف'
                              : language === 'fr'
                                ? 'Arrêter'
                                : 'Stop'
                            : language === 'ar'
                              ? 'استماع'
                              : language === 'fr'
                                ? 'Écouter'
                                : 'Preview'}
                        </Text>
                      </AnimatedPressable>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* STEP 2: Starting Surah */}
          {step === 2 ? (
            <View style={styles.stepStack}>
              <View style={styles.stepIntroWrap}>
                <View
                  style={[
                    styles.stepTitleRow,
                    { flexDirection: isRtl ? 'row-reverse' : 'row' },
                  ]}
                >
                  <View style={[styles.stepIconBadge, { backgroundColor: theme.secondary }]}>
                    <Ionicons name="book-outline" size={20} color={theme.primary} />
                  </View>
                  <View style={[styles.stepTitleTextWrap, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                    <Text style={[styles.stepHeading, { color: theme.foreground, fontSize: fs(20) }]}>
                      {copy.onboardingSurahTitle}
                    </Text>
                    <Text
                      style={[
                        styles.stepSub,
                        {
                          color: theme.mutedForeground,
                          fontSize: fs(13),
                          textAlign: isRtl ? 'right' : 'left',
                        },
                      ]}
                    >
                      {language === 'ar'
                        ? 'ابدأ من أحد المسارات المقترحة أو اختر أي سورة من المصحف.'
                        : language === 'fr'
                          ? 'Commencez par une sourate suggérée ou parcourez les 114 sourates.'
                          : 'Pick a curated starting surah or choose any of the 114 surahs.'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Selected Surah Hero Confirmation Strip */}
              <View
                style={[
                  styles.selectedSurahStrip,
                  {
                    flexDirection: isRtl ? 'row-reverse' : 'row',
                    backgroundColor: theme.secondary,
                    borderColor: theme.primary,
                  },
                ]}
              >
                <View
                  style={[
                    styles.selectedSurahLeft,
                    { flexDirection: isRtl ? 'row-reverse' : 'row' },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                  <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start', flexShrink: 1 }}>
                    <Text style={[styles.selectedKicker, { color: theme.primary, fontSize: fs(11) }]}>
                      {language === 'ar'
                        ? 'السورة المختارة للبداية'
                        : language === 'fr'
                          ? 'Sourate sélectionnée'
                          : 'Selected starting surah'}
                    </Text>
                    <Text style={[styles.selectedSurahName, { color: theme.foreground, fontSize: fs(17) }]}>
                      {formatNum(selectedSurah.id, language)}. {getSurahDisplayName(selectedSurah, language)}
                    </Text>
                    <Text style={[styles.selectedSurahMeta, { color: theme.mutedForeground, fontSize: fs(12) }]}>
                      {formatNum(selectedSurah.totalAyahs, language)} {copy.versesUnit} • {copy.mushafLink}{' '}
                      {formatNum(selectedSurah.pageStart, language)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 2x2 Curated Preset Rows */}
              <View style={styles.rowsContainer}>
                {surahRows.map((row, rowIdx) => (
                  <View
                    key={rowIdx}
                    style={[
                      styles.twoColRow,
                      { flexDirection: isRtl ? 'row-reverse' : 'row' },
                    ]}
                  >
                    {row.map((preset) => {
                      const selected = currentSurahId === preset.id;
                      return (
                        <AnimatedPressable
                          key={preset.id}
                          reduceMotion={reduceMotion}
                          containerStyle={styles.flexTile}
                          onPress={() => void setCursor(preset.id, 1)}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          style={[
                            styles.gridTile,
                            {
                              alignItems: isRtl ? 'flex-end' : 'flex-start',
                              borderWidth: selected ? 2 : 1,
                              borderColor: selected ? theme.primary : theme.border,
                              backgroundColor: selected ? theme.secondary : theme.card,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.tileHeaderRow,
                              { flexDirection: isRtl ? 'row-reverse' : 'row' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.presetLabel,
                                {
                                  color: theme.foreground,
                                  fontSize: fs(14),
                                  textAlign: isRtl ? 'right' : 'left',
                                },
                              ]}
                            >
                              {preset.label}
                            </Text>
                            {selected ? (
                              <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                            ) : null}
                          </View>
                          <Text
                            style={[
                              styles.presetHint,
                              {
                                color: theme.mutedForeground,
                                fontSize: fs(12),
                                textAlign: isRtl ? 'right' : 'left',
                              },
                            ]}
                          >
                            {preset.hint}
                          </Text>
                        </AnimatedPressable>
                      );
                    })}
                  </View>
                ))}
              </View>

              {/* Full 114-Surah Searchable Picker */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text
                  style={[
                    styles.cardTitle,
                    {
                      color: theme.foreground,
                      fontSize: fs(15),
                      textAlign: isRtl ? 'right' : 'left',
                    },
                  ]}
                >
                  {copy.onboardingSurahPickerTitle}
                </Text>
                <MillaPicker
                  fullWidth
                  searchable
                  iconName="search-outline"
                  value={String(currentSurahId)}
                  onChange={(val) => void setCursor(Number(val), 1)}
                  title={copy.onboardingSurahPickerTitle}
                  ariaLabel={copy.onboardingSurahPickerTitle}
                  options={SURAHS.map((s) => ({
                    value: String(s.id),
                    label: `${formatNum(s.id, language)}. ${getSurahDisplayName(s, language)}`,
                    description: `${formatNum(s.totalAyahs, language)} ${copy.versesUnit}`,
                    keywords: `${s.nameAr} ${s.nameEn} ${s.nameFr}`,
                  }))}
                />
              </View>
            </View>
          ) : null}

          {/* STEP 3: Daily Goal & Plan Recap */}
          {step === 3 ? (
            <View style={styles.stepStack}>
              <View style={styles.stepIntroWrap}>
                <View
                  style={[
                    styles.stepTitleRow,
                    { flexDirection: isRtl ? 'row-reverse' : 'row' },
                  ]}
                >
                  <View style={[styles.stepIconBadge, { backgroundColor: theme.secondary }]}>
                    <Ionicons name="sparkles-outline" size={20} color={theme.primary} />
                  </View>
                  <View style={[styles.stepTitleTextWrap, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                    <Text style={[styles.stepHeading, { color: theme.foreground, fontSize: fs(20) }]}>
                      {copy.onboardingGoalTitle}
                    </Text>
                    <Text
                      style={[
                        styles.stepSub,
                        {
                          color: theme.mutedForeground,
                          fontSize: fs(13),
                          textAlign: isRtl ? 'right' : 'left',
                        },
                      ]}
                    >
                      {copy.onboardingGoalLater}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 3, 4, or 5 Daily Goal Presets */}
              <View style={styles.rowsContainer}>
                {dailyGoals.map((goal) => {
                  const selected = dailyTarget === goal.value;
                  return (
                    <AnimatedPressable
                      key={goal.value}
                      reduceMotion={reduceMotion}
                      onPress={() => {
                        void setDailyTarget(goal.value);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      style={[
                        styles.gridTile,
                        {
                          alignItems: isRtl ? 'flex-end' : 'flex-start',
                          borderWidth: selected ? 2 : 1,
                          borderColor: selected ? theme.primary : theme.border,
                          backgroundColor: selected ? theme.secondary : theme.card,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.tileHeaderRow,
                          { flexDirection: isRtl ? 'row-reverse' : 'row' },
                        ]}
                      >
                        <View
                          style={[
                            styles.goalLabelWrap,
                            { flexDirection: isRtl ? 'row-reverse' : 'row' },
                          ]}
                        >
                          <Text style={[styles.presetLabel, { color: theme.foreground, fontSize: fs(15) }]}>
                            {goal.title}
                          </Text>
                          {goal.recommended ? (
                            <View
                              style={[
                                styles.recBadge,
                                { backgroundColor: `${theme.accent}2B` },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.recBadgeText,
                                  { color: theme.isDark ? theme.accent : theme.foreground, fontSize: fs(10) },
                                ]}
                              >
                                {copy.onboardingRecommended}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        {selected ? (
                          <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.presetHint,
                          {
                            color: theme.mutedForeground,
                            fontSize: fs(12),
                            textAlign: isRtl ? 'right' : 'left',
                          },
                        ]}
                      >
                        {goal.subtitle}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </View>

              {/* Memorization Difficulty / Pace */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start', gap: 2 }}>
                  <Text style={[styles.cardTitle, { color: theme.foreground, fontSize: fs(15) }]}>
                    {language === 'en'
                      ? 'Memorization Difficulty'
                      : language === 'fr'
                        ? 'Niveau de mémorisation'
                        : 'مستوى صعوبة الحفظ'}
                  </Text>
                  <Text style={[styles.presetHint, { color: theme.mutedForeground, fontSize: fs(12) }]}>
                    {language === 'en'
                      ? 'Controls how gradually words hide while learning'
                      : language === 'fr'
                        ? 'Contrôle le rythme de masquage progressif'
                        : 'يتحكم في سرعة تدرّج الإخفاء حسب سهولة الحفظ لديك'}
                  </Text>
                </View>
                <View style={[styles.diffChipsRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                  {DIFFICULTY_PRESETS.map((preset) => {
                    const selected = mandatoryRepeats === preset.value;
                    const label =
                      language === 'en'
                        ? preset.labelEn
                        : language === 'fr'
                          ? preset.labelFr
                          : preset.labelAr;
                    return (
                      <AnimatedPressable
                        key={preset.value}
                        reduceMotion={reduceMotion}
                        containerStyle={styles.flexTile}
                        onPress={() => void setMandatoryRepeats(preset.value)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        style={[
                          styles.diffChipBtn,
                          {
                            borderColor: selected ? theme.primary : theme.border,
                            backgroundColor: selected ? theme.primary : theme.background,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.presetLabel,
                            {
                              color: selected ? theme.primaryForeground : theme.foreground,
                              fontSize: fs(13),
                            },
                          ]}
                        >
                          {label}
                        </Text>
                      </AnimatedPressable>
                    );
                  })}
                </View>
              </View>

              {/* Editable Plan Recap Card */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text
                  style={[
                    styles.cardTitle,
                    {
                      color: theme.foreground,
                      fontSize: fs(15),
                      textAlign: isRtl ? 'right' : 'left',
                    },
                  ]}
                >
                  {language === 'ar'
                    ? 'ملخص خطتك اليومية'
                    : language === 'fr'
                      ? 'Résumé de votre programme'
                      : 'Your Daily Plan Summary'}
                </Text>

                {[
                  {
                    label: copy.onboardingReciterTitle,
                    value: language === 'ar' ? selectedReciterObj.nameAr : selectedReciterObj.nameEn,
                    targetStep: 1 as StepIndex,
                  },
                  {
                    label: copy.onboardingSurahTitle,
                    value: getSurahDisplayName(selectedSurah, language),
                    targetStep: 2 as StepIndex,
                  },
                  {
                    label: copy.onboardingGoalTitle,
                    value: `${formatNum(dailyTarget, language)} ${copy.versesUnit}`,
                    targetStep: null,
                  },
                  {
                    label:
                      language === 'en'
                        ? 'Difficulty'
                        : language === 'fr'
                          ? 'Niveau'
                          : 'مستوى الحفظ',
                    value: activeDifficultyLabel,
                    targetStep: null,
                  },
                ].map((row, idx) => (
                  <AnimatedPressable
                    key={row.label}
                    reduceMotion={reduceMotion}
                    disabled={row.targetStep === null}
                    onPress={() => {
                      if (row.targetStep !== null) {
                        goToStep(row.targetStep, -1);
                      }
                    }}
                    style={[
                      styles.summaryRow,
                      {
                        flexDirection: isRtl ? 'row-reverse' : 'row',
                        borderTopWidth: idx === 0 ? 0 : 1,
                        borderTopColor: theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.summaryLbl, { color: theme.mutedForeground, fontSize: fs(13) }]}>
                      {row.label}
                    </Text>
                    <View
                      style={[
                        styles.summaryValWrap,
                        { flexDirection: isRtl ? 'row-reverse' : 'row' },
                      ]}
                    >
                      <Text
                        style={[styles.summaryVal, { color: theme.foreground, fontSize: fs(13) }]}
                        numberOfLines={1}
                      >
                        {row.value}
                      </Text>
                      {row.targetStep !== null ? (
                        <Ionicons name="create-outline" size={16} color={theme.primary} />
                      ) : (
                        <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                      )}
                    </View>
                  </AnimatedPressable>
                ))}
              </View>

              {/* Privacy Assurance */}
              <View
                style={[
                  styles.privacyBox,
                  {
                    flexDirection: isRtl ? 'row-reverse' : 'row',
                    backgroundColor: theme.secondary,
                  },
                ]}
              >
                <Ionicons name="lock-closed-outline" size={18} color={theme.primary} />
                <Text
                  style={[
                    styles.privacyText,
                    {
                      color: theme.mutedForeground,
                      fontSize: fs(12),
                      textAlign: isRtl ? 'right' : 'left',
                    },
                  ]}
                >
                  {copy.onboardingPrivacyNote}
                </Text>
              </View>
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      {/* Pinned Bottom Action Dock */}
      <View
        style={[
          styles.bottomDock,
          { borderTopColor: theme.border, backgroundColor: theme.card },
        ]}
      >
        {step < 3 ? (
          <>
            <AnimatedPressable
              reduceMotion={reduceMotion}
              onPress={() => goToStep((step + 1) as StepIndex, 1)}
              accessibilityRole="button"
              style={[
                styles.primaryCta,
                {
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                  backgroundColor: theme.primary,
                },
              ]}
            >
              <Text style={[styles.primaryCtaText, { color: theme.primaryForeground, fontSize: fs(16) }]}>
                {NEXT_CTA_LABELS[language]}
              </Text>
              <Ionicons name={dirArrow} size={20} color={theme.primaryForeground} />
            </AnimatedPressable>

            {step > 0 ? (
              <AnimatedPressable
                reduceMotion={reduceMotion}
                disabled={isSubmitting}
                onPress={() => void handleFinish()}
                accessibilityRole="button"
                style={styles.skipBtn}
              >
                <Text style={[styles.skipBtnText, { color: theme.mutedForeground, fontSize: fs(13) }]}>
                  {SKIP_CTA_LABELS[language]}
                </Text>
              </AnimatedPressable>
            ) : null}
          </>
        ) : (
          <AnimatedPressable
            reduceMotion={reduceMotion}
            disabled={isSubmitting}
            onPress={() => void handleFinish()}
            accessibilityRole="button"
            style={[
              styles.primaryCta,
              {
                flexDirection: isRtl ? 'row-reverse' : 'row',
                backgroundColor: theme.primary,
                opacity: isSubmitting ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.primaryCtaText, { color: theme.primaryForeground, fontSize: fs(16) }]}>
              {copy.onboardingStartCta}
            </Text>
            <Ionicons name={dirArrow} size={20} color={theme.primaryForeground} />
          </AnimatedPressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeRoot: { flex: 1 },
  topHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  progressCenter: {
    flex: 1,
    gap: 4,
  },
  stepMetaRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepCounterText: { fontWeight: '700' },
  stepNameText: { fontWeight: '600', flexShrink: 1 },
  segmentsRow: {
    gap: 6,
  },
  segmentPill: {
    flex: 1,
    height: 4,
    borderRadius: RADII.pill,
  },
  largeAaBtn: {
    minWidth: 36,
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
  },
  largeAaText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  animatedStepWrap: { width: '100%' },
  stepStack: { gap: SPACING.lg },
  heroCard: {
    borderRadius: RADII.hero,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroBg: { width: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 61, 53, 0.80)',
  },
  heroInner: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
    gap: 8,
  },
  heroLogoWrap: {
    width: 68,
    height: 68,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroLogo: { width: 52, height: 52, borderRadius: 12 },
  heroTitle: { color: '#ffffff', fontWeight: '700' },
  heroSubtitle: { color: 'rgba(255,255,255,0.92)', fontWeight: '600', textAlign: 'center' },
  heroIntro: {
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 2,
  },
  trustRow: {
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  trustChip: {
    alignItems: 'center',
    gap: 5,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  trustText: { color: '#ffffff', fontWeight: '600' },
  card: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  cardHeader: { alignItems: 'center', gap: 8 },
  cardTitle: { fontWeight: '700' },
  twoColRow: { gap: 10 },
  flexTile: { flex: 1 },
  comfortTile: {
    minHeight: 84,
    borderRadius: RADII.control,
    borderWidth: 1,
    padding: 12,
    justifyContent: 'space-between',
    gap: 4,
  },
  comfortTop: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comfortLabel: { fontWeight: '700', marginTop: 4 },
  comfortState: { fontWeight: '600' },
  stepperBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 4,
  },
  stepperLbl: { fontWeight: '600', flexShrink: 1 },
  stepperBtns: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepCircleBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepSign: { fontSize: 18, fontWeight: '700' },
  stepValueText: { minWidth: 28, textAlign: 'center', fontWeight: '700' },
  quranPreviewBox: {
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  quranPreviewText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  stepIntroWrap: { gap: SPACING.sm },
  stepTitleRow: { alignItems: 'center', gap: 12 },
  stepIconBadge: {
    width: 44,
    height: 44,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitleTextWrap: { flex: 1, gap: 2 },
  stepHeading: { fontWeight: '700' },
  stepSub: { lineHeight: 20 },
  badgePill: {
    borderRadius: RADII.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgePillText: { fontWeight: '600' },
  errorBanner: {
    alignItems: 'center',
    gap: 10,
    borderRadius: RADII.control,
    borderWidth: 1,
    padding: 12,
  },
  errorBannerText: { flex: 1, lineHeight: 18 },
  reciterList: { gap: 10 },
  reciterCard: {
    minHeight: 74,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: RADII.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  reciterMain: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
  },
  reciterInfo: { flex: 1, gap: 2 },
  reciterName: { fontWeight: '700' },
  reciterStyle: { fontWeight: '500' },
  previewBtn: {
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    gap: 5,
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  previewBtnText: { fontWeight: '700' },
  selectedSurahStrip: {
    borderRadius: RADII.card,
    borderWidth: 1.5,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedSurahLeft: {
    flex: 1,
    alignItems: 'center',
    gap: 12,
  },
  selectedKicker: { fontWeight: '700' },
  selectedSurahName: { fontWeight: '700', marginTop: 2 },
  selectedSurahMeta: { marginTop: 2 },
  rowsContainer: { gap: 10 },
  gridTile: {
    minHeight: 84,
    borderRadius: RADII.card,
    padding: 14,
    justifyContent: 'space-between',
    gap: 6,
  },
  tileHeaderRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  goalLabelWrap: {
    flex: 1,
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetLabel: { fontWeight: '700', flexShrink: 1 },
  presetHint: { lineHeight: 17 },
  recBadge: {
    borderRadius: RADII.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  recBadgeText: { fontWeight: '700' },
  customGoalCard: {
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  customGoalLbl: { flex: 1, fontWeight: '700' },
  customGoalInput: {
    width: 60,
    height: MIN_TOUCH_TARGET,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: 'center',
    fontWeight: '700',
  },
  summaryRow: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
  },
  summaryLbl: { fontWeight: '600' },
  summaryValWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  summaryVal: { fontWeight: '700', flexShrink: 1 },
  privacyBox: {
    alignItems: 'center',
    gap: 10,
    borderRadius: RADII.control,
    padding: 14,
  },
  privacyText: { flex: 1, lineHeight: 19 },
  bottomDock: {
    borderTopWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 6,
  },
  primaryCta: {
    minHeight: 54,
    borderRadius: RADII.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  primaryCtaText: { fontWeight: '700' },
  skipBtn: {
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: { fontWeight: '600' },
  diffChipsRow: { gap: 8 },
  diffChipBtn: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
});
