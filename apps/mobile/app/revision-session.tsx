import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  MILLA_COPY,
  buildCareRevisionQueue,
  buildSmartRevisionQueue,
  buildSurahRevisionItems,
  formatCueText,
  formatNum,
  getSurahById,
  getSurahDisplayName,
  maskVerseForStrengthening,
  type AyahEntry,
  type RevisionCardItem,
  type RevisionSessionMode,
  type RevisionTimePreset,
  type SelfEvalRating,
} from '@al-milla/core';
import { AppShell } from '../src/components/milla/AppShell';
import { AudioPlayerBar } from '../src/components/milla/AudioPlayerBar';
import { QuranText } from '../src/components/milla/QuranText';
import { SegmentedControl } from '../src/components/milla/SegmentedControl';
import { useMilla } from '../src/context/MillaContext';
import { loadVerifiedSurahAyahs } from '../src/services/quran';
import { animateLayout } from '../src/theme/motion';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '../src/theme/tokens';

type ReviseViewMode = 'partial' | 'hidden' | 'revealed';

function parseModeParam(raw: string | string[] | undefined): RevisionSessionMode {
  const val = Array.isArray(raw) ? raw[0] : raw;
  if (
    val === 'smart' ||
    val === 'care' ||
    val === 'surah_flow' ||
    val === 'surah_connections' ||
    val === 'surah_random'
  ) {
    return val;
  }
  return 'smart';
}

function parseIntParam(raw: string | string[] | undefined, fallback: number): number {
  const val = Array.isArray(raw) ? raw[0] : raw;
  const parsed = val ? Number.parseInt(val, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function RevisionSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: string;
    surahId?: string;
    minutes?: string;
  }>();
  const { state, theme, evaluateLessonReview } = useMilla();

  const mode = parseModeParam(params.mode);
  const requestedSurahId = parseIntParam(params.surahId, state?.currentSurahId ?? 18);
  const rawMinutes = parseIntParam(params.minutes, 10);
  const timePreset: RevisionTimePreset = rawMinutes === 5 ? 5 : rawMinutes === 20 ? 20 : 10;

  const language = state?.language ?? 'ar';
  const copy = MILLA_COPY[language];
  const isRtl = language === 'ar';
  const backArrow = isRtl ? 'arrow-forward' : 'arrow-back';
  const dirArrow = isRtl ? 'arrow-back' : 'arrow-forward';

  const [queue, setQueue] = useState<RevisionCardItem[]>([]);
  const [queueInitialized, setQueueInitialized] = useState(false);
  const [itemIndex, setItemIndex] = useState(0);
  const [audioAyahOffset, setAudioAyahOffset] = useState(0);
  const [viewMode, setViewMode] = useState<ReviseViewMode>('hidden');
  const [showHint, setShowHint] = useState(false);
  const [rating, setRating] = useState<SelfEvalRating | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [reviewedVersesCount, setReviewedVersesCount] = useState(0);
  const [ayahTextMap, setAyahTextMap] = useState<Record<string, string>>({});
  const [loadingSurahId, setLoadingSurahId] = useState<number | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const doneCardScale = useRef(new Animated.Value(1.1)).current;
  const doneCardY = useRef(new Animated.Value(90)).current;
  const doneIconScale = useRef(new Animated.Value(0.3)).current;
  const doneActionsOpacity = useRef(new Animated.Value(0)).current;
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        reduceMotionRef.current = enabled;
      })
      .catch(() => {
        reduceMotionRef.current = false;
      });
  }, []);

  useEffect(() => {
    if (!completed) return undefined;

    if (reduceMotionRef.current) {
      doneCardScale.setValue(1);
      doneCardY.setValue(0);
      doneIconScale.setValue(1);
      doneActionsOpacity.setValue(1);
      return undefined;
    }

    doneCardScale.setValue(1.1);
    doneCardY.setValue(90);
    doneIconScale.setValue(0.3);
    doneActionsOpacity.setValue(0);

    const anim = Animated.sequence([
      Animated.spring(doneIconScale, {
        toValue: 1,
        friction: 6,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(doneCardScale, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(doneCardY, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(doneActionsOpacity, {
          toValue: 1,
          duration: 240,
          delay: 40,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]);
    anim.start();

    return () => {
      anim.stop();
    };
  }, [completed, doneCardScale, doneCardY, doneIconScale, doneActionsOpacity]);

  useEffect(() => {
    if (completed || queue.length === 0) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'مغادرة المراجعة؟',
        'هل تريد الخروج من درس المراجعة الحالي؟',
        [
          { text: 'متابعة المراجعة', style: 'cancel' },
          { text: 'مغادرة', style: 'destructive', onPress: () => router.back() },
        ],
      );
      return true;
    });
    return () => sub.remove();
  }, [completed, queue.length, router]);

  useEffect(() => {
    if (!state || queueInitialized) return;
    let built: RevisionCardItem[] = [];
    if (mode === 'smart') {
      built = buildSmartRevisionQueue(state.lessons, {
        surahSessions: state.surahSessions,
        currentSurahId: state.currentSurahId,
        timePreset,
        verseRecords: state.verseRecords,
      });
    } else if (mode === 'care') {
      built = buildCareRevisionQueue(state.lessons, state.surahSessions, state.verseRecords);
    } else {
      built = buildSurahRevisionItems(state.lessons, state.verseRecords, {
        surahId: requestedSurahId,
        mode,
        seed: Date.now() % 10_000,
      });
    }
    setQueue(built);
    setViewMode(built[0]?.recommendedView ?? 'hidden');
    setQueueInitialized(true);
  }, [state, queueInitialized, mode, requestedSurahId, timePreset]);

  const activeItem = queue[itemIndex] ?? null;

  useEffect(() => {
    if (!activeItem) return;
    const firstKey = `${activeItem.surahId}:${activeItem.startVerse}`;
    if (ayahTextMap[firstKey]) return;

    let cancelled = false;
    setLoadingSurahId(activeItem.surahId);
    void loadVerifiedSurahAyahs(activeItem.surahId).then((res) => {
      if (cancelled) return;
      if (res.ayahs.length > 0) {
        setAyahTextMap((prev) => {
          const next = { ...prev };
          for (const a of res.ayahs as AyahEntry[]) {
            next[`${activeItem.surahId}:${a.number}`] = a.textAr;
          }
          return next;
        });
      }
      setLoadingSurahId(null);
    });
    return () => {
      cancelled = true;
    };
  }, [activeItem, ayahTextMap]);

  const activeVerseNumbers = useMemo(() => {
    if (!activeItem) return [];
    const count = Math.max(1, activeItem.endVerse - activeItem.startVerse + 1);
    return Array.from({ length: count }, (_, idx) => activeItem.startVerse + idx);
  }, [activeItem]);

  if (!state || !queueInitialized) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const handleModeChange = (nextMode: ReviseViewMode) => {
    fadeAnim.setValue(0.6);
    setViewMode(nextMode);
    if (nextMode === 'revealed') {
      setShowHint(false);
    }
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleSubmitAndAdvance = async () => {
    if (!activeItem || !rating || submitting) return;
    setSubmitting(true);
    try {
      if (activeItem.lessonId) {
        await evaluateLessonReview({
          lessonId: activeItem.lessonId,
          rating,
          hardAyahNumbers: [],
        });
      }
      const verseSpan = Math.max(1, activeItem.endVerse - activeItem.startVerse + 1);
      setReviewedVersesCount((c) => c + verseSpan);

      if (itemIndex + 1 < queue.length) {
        const nextItem = queue[itemIndex + 1];
        setItemIndex((i) => i + 1);
        setAudioAyahOffset(0);
        setRating(null);
        setShowHint(false);
        setViewMode(nextItem?.recommendedView ?? 'hidden');
      } else {
        setCompleted(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getDisplayModeTitle = (): string => {
    if (mode === 'care') return 'عناية خاصة';
    if (mode === 'surah_flow') return 'تسميع متصل';
    if (mode === 'surah_connections') return 'اختبار الروابط';
    if (mode === 'surah_random') return 'تسميع عشوائي';
    return 'المراجعة الذكية';
  };

  const evalOptions: { id: SelfEvalRating; label: string; hint: string }[] = [
    { id: 'difficult', label: copy.evalDifficult, hint: copy.evalDifficultHint },
    { id: 'good', label: copy.evalGood, hint: copy.evalGoodHint },
    { id: 'easy', label: copy.evalEasy, hint: copy.evalEasyHint },
  ];

  const activeSurah = activeItem ? getSurahById(activeItem.surahId) : getSurahById(requestedSurahId);
  const firstRawText =
    activeItem ? (ayahTextMap[`${activeItem.surahId}:${activeItem.startVerse}`] ?? '') : '';
  const hintPreview = firstRawText ? formatCueText(firstRawText) : '';

  return (
    <AppShell hideBottomNav>
      <View style={styles.stack}>
        {/* Back Header */}
        <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.backPill,
              {
                flexDirection: isRtl ? 'row-reverse' : 'row',
                borderColor: theme.border,
                backgroundColor: theme.card,
              },
            ]}
            accessibilityRole="button"
          >
            <Ionicons name={backArrow} size={16} color={theme.foreground} />
            <Text style={[styles.backPillText, { color: theme.foreground }]}>
              العودة إلى المراجعة
            </Text>
          </Pressable>

          <View style={[styles.badge, { backgroundColor: `${theme.accent}24` }]}>
            <Text style={[styles.badgeText, { color: theme.isDark ? theme.accent : theme.foreground }]}>
              {getDisplayModeTitle()}
            </Text>
          </View>
        </View>

        {queue.length === 0 ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.stepHeading, { color: theme.foreground, textAlign: 'center' }]}>
              لا توجد دروس متاحة في هذا الوضع حالياً
            </Text>
            <Text style={[styles.stepSub, { color: theme.mutedForeground, textAlign: 'center' }]}>
              أكمل حفظ درس أو درسين متجاورين ليتم تجهيز مراجعتها هنا.
            </Text>
            <Pressable
              onPress={() => router.back()}
              style={[
                styles.primaryBtn,
                { flexDirection: isRtl ? 'row-reverse' : 'row', backgroundColor: theme.primary },
              ]}
            >
              <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                العودة إلى المراجعة
              </Text>
            </Pressable>
          </View>
        ) : completed ? (
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                transform: [{ translateY: doneCardY }, { scale: doneCardScale }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.doneIconWrap,
                { backgroundColor: `${theme.accent}24`, transform: [{ scale: doneIconScale }] },
              ]}
            >
              <Ionicons name="checkmark-circle" size={34} color={theme.accent} />
            </Animated.View>
            <Text style={[styles.stepHeading, { color: theme.foreground, textAlign: 'center' }]}>
              تمّت المراجعة بحمد الله
            </Text>
            <Text style={[styles.stepSub, { color: theme.mutedForeground, textAlign: 'center' }]}>
              راجعت {formatNum(queue.length, language)} دروس ({formatNum(reviewedVersesCount, language)}{' '}
              آية) وتم تحديث جدول مراجعتك تلقائياً دون تعديل ورد الحفظ الجديد.
            </Text>
            <Animated.View style={{ opacity: doneActionsOpacity, width: '100%' }}>
              <Pressable
                onPress={() => router.back()}
                style={[
                  styles.primaryBtn,
                  { flexDirection: isRtl ? 'row-reverse' : 'row', backgroundColor: theme.primary },
                ]}
              >
                <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                  العودة إلى المراجعة
                </Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        ) : activeItem ? (
          <>
            {/* Session Progress Card */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.progressTitle, { color: theme.foreground }]}>
                  {getSurahDisplayName(activeSurah, language)} • الآيات{' '}
                  {formatNum(activeItem.startVerse, language)} -{' '}
                  {formatNum(activeItem.endVerse, language)}
                </Text>
                <Text style={[styles.progressCount, { color: theme.mutedForeground }]}>
                  {formatNum(itemIndex + 1, language)} / {formatNum(queue.length, language)}
                </Text>
              </View>

              <View style={[styles.track, { backgroundColor: theme.muted }]}>
                <View
                  style={[
                    styles.trackFill,
                    {
                      backgroundColor: theme.accent,
                      width: `${Math.round(((itemIndex + 1) / queue.length) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Recall Card */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.stepSubBold, { color: theme.foreground }]}>
                  {activeItem.cueLabelAr}
                </Text>
                {viewMode === 'hidden' && hintPreview ? (
                  <Pressable
                    onPress={() => {
                      animateLayout();
                      setShowHint((v) => !v);
                    }}
                    style={[
                      styles.hintChip,
                      {
                        flexDirection: isRtl ? 'row-reverse' : 'row',
                        borderColor: showHint ? theme.accent : theme.border,
                        backgroundColor: showHint ? `${theme.accent}20` : theme.background,
                      },
                    ]}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name="bulb-outline"
                      size={14}
                      color={showHint ? theme.accent : theme.foreground}
                    />
                    <Text
                      style={[
                        styles.hintChipText,
                        { color: showHint ? theme.accent : theme.foreground },
                      ]}
                    >
                      تلميح
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              <Animated.View
                style={[
                  styles.verseSurface,
                  {
                    backgroundColor: theme.secondary,
                    position: 'relative',
                    opacity: fadeAnim,
                  },
                ]}
              >
                {loadingSurahId === activeItem.surahId && !firstRawText ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  activeVerseNumbers.map((ayahNum, idx) => {
                    const raw = ayahTextMap[`${activeItem.surahId}:${ayahNum}`] ?? '';
                    const isFullHidden = viewMode === 'hidden';
                    const displayText = !raw
                      ? 'جاري التحميل...'
                      : viewMode === 'partial'
                        ? maskVerseForStrengthening(raw, activeItem.hidingLevel)
                        : raw;

                    return (
                      <Pressable
                        key={`${activeItem.surahId}:${ayahNum}`}
                        disabled={isFullHidden}
                        onPress={() => setAudioAyahOffset(idx)}
                        style={[
                          styles.clickableVerse,
                          !isFullHidden && idx === audioAyahOffset
                            ? { backgroundColor: `${theme.primary}1A` }
                            : null,
                        ]}
                      >
                        <View style={isFullHidden ? styles.hiddenTextMask : undefined}>
                          <QuranText ayahNumber={ayahNum}>{displayText}</QuranText>
                        </View>
                      </Pressable>
                    );
                  })
                )}

                {viewMode === 'hidden' ? (
                  <View style={styles.hiddenOverlay} pointerEvents="none">
                    <View style={styles.hiddenPill}>
                      <Ionicons name="eye-off-outline" size={24} color={theme.mutedForeground} />
                      <Text style={[styles.hiddenPillText, { color: theme.mutedForeground }]}>
                        سمّع الدرس غيباً
                      </Text>
                      {showHint && hintPreview ? (
                        <QuranText align="center" color={theme.accent}>
                          {hintPreview}
                        </QuranText>
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </Animated.View>

              <SegmentedControl
                options={
                  [
                    { id: 'partial', label: 'إخفاء جزئي', icon: 'sparkles-outline' },
                    { id: 'hidden', label: 'إخفاء كامل', icon: 'eye-off-outline' },
                    { id: 'revealed', label: 'إظهار', icon: 'eye-outline' },
                  ] as const
                }
                value={viewMode}
                onChange={handleModeChange}
              />
            </View>

            {/* Reference Audio Check */}
            <AudioPlayerBar
              mode="reference"
              surahId={activeItem.surahId}
              surahName={getSurahDisplayName(activeSurah, language)}
              ayahNumber={
                activeVerseNumbers[
                  Math.min(audioAyahOffset, Math.max(0, activeVerseNumbers.length - 1))
                ] ?? activeItem.startVerse
              }
              onPrevAyah={
                audioAyahOffset > 0 ? () => setAudioAyahOffset((i) => Math.max(0, i - 1)) : undefined
              }
              onNextAyah={
                audioAyahOffset + 1 < activeVerseNumbers.length
                  ? () => setAudioAyahOffset((i) => i + 1)
                  : undefined
              }
            />

            {/* Self Evaluation */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text
                style={[
                  styles.stepSubBold,
                  { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
                ]}
              >
                كيف كان حفظك لهذا الدرس؟
              </Text>
              <View style={[styles.evalGrid, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                {evalOptions.map((opt) => {
                  const selected = rating === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => setRating(opt.id)}
                      style={[
                        styles.evalTile,
                        {
                          borderColor: selected ? theme.primary : theme.border,
                          backgroundColor: selected ? theme.primary : theme.background,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                    >
                      <Text
                        style={[
                          styles.evalTitle,
                          { color: selected ? theme.primaryForeground : theme.foreground },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text
                        style={[
                          styles.evalHint,
                          { color: selected ? theme.primaryForeground : theme.mutedForeground },
                        ]}
                        numberOfLines={2}
                      >
                        {opt.hint}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              disabled={!rating || submitting}
              onPress={() => void handleSubmitAndAdvance()}
              style={[
                styles.primaryBtn,
                {
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                  backgroundColor: theme.primary,
                  opacity: rating && !submitting ? 1 : 0.45,
                },
              ]}
              accessibilityRole="button"
            >
              <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                {itemIndex + 1 < queue.length ? 'الدرس التالي' : 'إنهاء المراجعة'}
              </Text>
              <Ionicons name={dirArrow} size={18} color={theme.primaryForeground} />
            </Pressable>
          </>
        ) : null}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stack: { gap: SPACING.md },
  rowBetween: { alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  backPill: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  backPillText: { fontSize: 12, fontWeight: '700' },
  badge: { borderRadius: RADII.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  card: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: 12,
  },
  progressTitle: { fontSize: 13, fontWeight: '700', flex: 1 },
  progressCount: { fontSize: 12, fontWeight: '600' },
  track: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 3 },
  stepHeading: { fontSize: 18, fontWeight: '700' },
  stepSub: { fontSize: 13, lineHeight: 20 },
  stepSubBold: { fontSize: 13, fontWeight: '700', flex: 1 },
  hintChip: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
  },
  hintChipText: { fontSize: 12, fontWeight: '700' },
  verseSurface: { borderRadius: RADII.control, padding: SPACING.lg, gap: 10 },
  clickableVerse: { borderRadius: RADII.control, padding: 8 },
  hiddenTextMask: { opacity: 0 },
  hiddenOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  hiddenPill: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  hiddenPillText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  evalGrid: { flexWrap: 'wrap', gap: 8 },
  evalTile: {
    flex: 1,
    minWidth: 86,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  evalTitle: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  evalHint: { fontSize: 10, textAlign: 'center' },
  primaryBtn: {
    minHeight: 50,
    borderRadius: RADII.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700' },
  doneIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
