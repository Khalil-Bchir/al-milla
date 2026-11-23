import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  SURAHS,
  formatCueText,
  formatVerseKey,
  getSurahById,
  maskVerseByLevel,
  toArabicDigits,
  type AyahEntry,
  type ProgressiveHideLevel,
  type SelfEvalRating,
} from '@al-milla/core';
import { useMilla } from '../../src/context/MillaContext';
import { createAyahAudioController } from '../../src/services/audio';
import { loadVerifiedSurahAyahs } from '../../src/services/quran';
import { COLORS, MIN_TOUCH_TARGET, RADII, SPACING } from '../../src/theme/tokens';

type SessionStageIndex = 0 | 1 | 2 | 3 | 4;

const STAGE_HEADERS: { title: string; guide: string }[] = [
  { title: '١. مراجعة الأمس', guide: 'اقرأ ورد الجلسة السابقة واستعد لربطه بالجديد.' },
  { title: '٢. المراجعة السابقة', guide: 'راجع بعض المحفوظات القديمة لتثبيت المسار.' },
  { title: '٣. الحفظ الجديد', guide: 'استمع لكل آية وكررها بتأنٍّ ضمن ورد اليوم.' },
  { title: '٤. التسميع', guide: 'استخدم الإخفاء التدريجي وقيّم حفظك (تقييم ذاتي وليس تصحيح تجويد).' },
  { title: '٥. ربط الآيات', guide: 'اقرأ آيات اليوم متصلةً ثم اعتمد إتمام الجلسة.' },
];

export default function MemorizeScreen() {
  const {
    state,
    setCursor,
    markVerseInProgress,
    evaluateVerse,
    toggleDailyStage,
    completeSession,
    toggleBookmark,
    setPlaybackSpeed,
  } = useMilla();

  const [stageIdx, setStageIdx] = useState<SessionStageIndex>(2);
  const [ayahs, setAyahs] = useState<AyahEntry[]>([]);
  const [loadingSurah, setLoadingSurah] = useState<boolean>(true);
  const [fromCache, setFromCache] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hideLevel, setHideLevel] = useState<ProgressiveHideLevel>(0);
  const [cueOnly, setCueOnly] = useState<boolean>(false);
  const [repeats, setRepeats] = useState<number>(3);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [surahModalOpen, setSurahModalOpen] = useState<boolean>(false);
  const [sessionSavedMsg, setSessionSavedMsg] = useState<string | null>(null);

  const audioCtrlRef = useRef(createAyahAudioController());

  useEffect(() => {
    const ctrl = audioCtrlRef.current;
    return () => {
      void ctrl.stop();
    };
  }, []);

  const currentSurahId = state?.currentSurahId ?? 18;
  const currentAyah = state?.currentAyah ?? 1;
  const dailyTarget = state?.dailyTarget ?? 4;

  useEffect(() => {
    let active = true;
    setLoadingSurah(true);
    setLoadError(null);
    void loadVerifiedSurahAyahs(currentSurahId).then((res) => {
      if (!active) return;
      setAyahs(res.ayahs);
      setFromCache(res.fromCache);
      setLoadError(res.error);
      setLoadingSurah(false);
    });
    return () => {
      active = false;
    };
  }, [currentSurahId]);

  const surahInfo = getSurahById(currentSurahId);

  const dailySlice = useMemo(() => {
    if (ayahs.length === 0) return [];
    const startIdx = ayahs.findIndex((a) => a.number >= currentAyah);
    const safeStart = startIdx >= 0 ? startIdx : 0;
    return ayahs.slice(safeStart, safeStart + dailyTarget);
  }, [ayahs, currentAyah, dailyTarget]);

  if (!state) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.forestGreen} />
      </View>
    );
  }

  const handlePlayAyah = async (ayahNum: number) => {
    setAudioError(null);
    if (playingAyah === ayahNum) {
      await audioCtrlRef.current.stop();
      setPlayingAyah(null);
      return;
    }
    setPlayingAyah(ayahNum);
    await audioCtrlRef.current.playAyah({
      reciter: state.reciter,
      surahId: currentSurahId,
      ayahNumber: ayahNum,
      speed: state.playbackSpeed,
      repeats,
      onFinish: () => setPlayingAyah(null),
      onError: (msg) => {
        setPlayingAyah(null);
        setAudioError(msg);
      },
    });
  };

  const handleRate = async (ayahNum: number, rating: SelfEvalRating) => {
    await evaluateVerse(currentSurahId, ayahNum, rating, stageIdx === 3);
  };

  const handleCompleteSession = async () => {
    const keys = dailySlice.map((a) => formatVerseKey(currentSurahId, a.number));
    await completeSession(keys);
    const lastInSlice = dailySlice[dailySlice.length - 1];
    if (lastInSlice && lastInSlice.number < surahInfo.totalAyahs) {
      await setCursor(currentSurahId, lastInSlice.number + 1);
    }
    setSessionSavedMsg('تم حفظ الجلسة محلياً وإرسال نسخة للمزامنة.');
  };

  const renderAyahText = (textAr: string): string => {
    if (stageIdx !== 3) return textAr;
    if (cueOnly) return formatCueText(textAr);
    return maskVerseByLevel(textAr, hideLevel);
  };

  const activeStage = STAGE_HEADERS[stageIdx] ?? STAGE_HEADERS[2]!;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.rowBetween}>
            <Pressable
              style={styles.surahPickerBtn}
              onPress={() => setSurahModalOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="اختيار السورة"
            >
              <Ionicons name="chevron-down" size={18} color={COLORS.forestGreen} />
              <Text style={styles.surahPickerText}>{surahInfo.nameAr}</Text>
            </Pressable>

            <View style={styles.cacheChip}>
              <Text style={styles.cacheChipText}>
                {fromCache ? 'محفوظة أوفلاين' : 'متصل'}
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stageTabsRow}
          >
            {STAGE_HEADERS.map((item, idx) => {
              const selected = stageIdx === idx;
              return (
                <Pressable
                  key={item.title}
                  style={[styles.stageTab, selected && styles.stageTabActive]}
                  onPress={() => setStageIdx(idx as SessionStageIndex)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.stageTabText, selected && styles.stageTabTextActive]}>
                    {item.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.stageGuide}>{activeStage.guide}</Text>

          <View style={styles.controlsRow}>
            <Pressable
              style={styles.controlChip}
              onPress={() => {
                const nextSpeed =
                  state.playbackSpeed === 1.0 ? 0.75 : state.playbackSpeed === 0.75 ? 1.25 : 1.0;
                void setPlaybackSpeed(nextSpeed);
              }}
              accessibilityRole="button"
              accessibilityLabel="تغيير سرعة التلاوة"
            >
              <Text style={styles.controlChipText}>السرعة {state.playbackSpeed}x</Text>
            </Pressable>

            <Pressable
              style={styles.controlChip}
              onPress={() => setRepeats((r) => (r === 1 ? 3 : r === 3 ? 5 : 1))}
              accessibilityRole="button"
              accessibilityLabel="عدد مرات التكرار"
            >
              <Text style={styles.controlChipText}>تكرار {toArabicDigits(repeats)}×</Text>
            </Pressable>

            {stageIdx === 3 ? (
              <Pressable
                style={[styles.controlChip, cueOnly && styles.controlChipActive]}
                onPress={() => setCueOnly((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel="تبديل وضع بداية الآية"
              >
                <Text style={[styles.controlChipText, cueOnly && styles.controlChipTextActive]}>
                  {cueOnly ? 'إظهار أول كلمتين' : 'إخفاء متدرج'}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {stageIdx === 3 && !cueOnly ? (
            <View style={styles.controlsRow}>
              {([0, 1, 2, 3] as ProgressiveHideLevel[]).map((lvl) => (
                <Pressable
                  key={lvl}
                  style={[styles.controlChip, hideLevel === lvl && styles.controlChipActive]}
                  onPress={() => setHideLevel(lvl)}
                  accessibilityRole="button"
                  accessibilityLabel={`مستوى الإخفاء ${lvl}`}
                >
                  <Text
                    style={[
                      styles.controlChipText,
                      hideLevel === lvl && styles.controlChipTextActive,
                    ]}
                  >
                    {lvl === 0 ? 'كامل' : `إخفاء ${toArabicDigits(lvl)}`}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        {audioError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>تعذّر تشغيل الصوت: {audioError}</Text>
          </View>
        ) : null}

        {loadError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {loadError} — يتم عرض الآيات المتوفرة محلياً.
            </Text>
          </View>
        ) : null}

        {loadingSurah ? (
          <View style={styles.centerCard}>
            <ActivityIndicator size="small" color={COLORS.forestGreen} />
            <Text style={styles.stageGuide}>جارٍ تحميل السورة وحفظها في SQLite...</Text>
          </View>
        ) : dailySlice.length === 0 ? (
          <View style={styles.centerCard}>
            <Text style={styles.stageGuide}>لا توجد آيات في هذا الموضع.</Text>
          </View>
        ) : (
          dailySlice.map((ayah) => {
            const key = formatVerseKey(currentSurahId, ayah.number);
            const record = state.verseRecords[key];
            const isBookmarked = state.bookmarks.includes(key);
            const isPlaying = playingAyah === ayah.number;

            return (
              <View key={key} style={styles.ayahCard}>
                <View style={styles.rowBetween}>
                  <View style={styles.ayahMetaRow}>
                    <View style={styles.ayahNumBadge}>
                      <Text style={styles.ayahNumText}>{toArabicDigits(ayah.number)}</Text>
                    </View>
                    {record ? (
                      <Text style={styles.statusText}>
                        {record.status === 'memorized'
                          ? 'محفوظة'
                          : record.status === 'weak'
                            ? 'تحتاج تثبيتاً'
                            : 'قيد الحفظ'}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.ayahActionsRow}>
                    <Pressable
                      style={styles.iconBtn}
                      onPress={() => void toggleBookmark(currentSurahId, ayah.number)}
                      accessibilityRole="button"
                      accessibilityLabel={`حفظ علامة للآية ${ayah.number}`}
                    >
                      <Ionicons
                        name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                        size={20}
                        color={isBookmarked ? COLORS.forestGreen : COLORS.secondary}
                      />
                    </Pressable>

                    <Pressable
                      style={[styles.iconBtn, isPlaying && styles.iconBtnActive]}
                      onPress={() => void handlePlayAyah(ayah.number)}
                      accessibilityRole="button"
                      accessibilityLabel={isPlaying ? 'إيقاف التلاوة' : `استماع للآية ${ayah.number}`}
                    >
                      <Ionicons
                        name={isPlaying ? 'stop-circle-outline' : 'volume-high-outline'}
                        size={20}
                        color={isPlaying ? COLORS.white : COLORS.forestGreen}
                      />
                    </Pressable>
                  </View>
                </View>

                <Text style={[styles.ayahText, { fontSize: state.quranFontSize }]}>
                  {renderAyahText(ayah.textAr)}
                </Text>

                {stageIdx === 2 ? (
                  <Pressable
                    style={styles.secondaryBtn}
                    onPress={() => void markVerseInProgress(currentSurahId, ayah.number)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.secondaryBtnText}>تعيين كقيد الحفظ اليوم</Text>
                  </Pressable>
                ) : null}

                {stageIdx === 3 || stageIdx === 0 || stageIdx === 1 ? (
                  <View style={styles.evalRow}>
                    <Pressable
                      style={[styles.evalBtn, styles.evalDifficult]}
                      onPress={() => void handleRate(ayah.number, 'difficult')}
                      accessibilityRole="button"
                    >
                      <Text style={styles.evalDifficultText}>صعب</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.evalBtn, styles.evalGood]}
                      onPress={() => void handleRate(ayah.number, 'good')}
                      accessibilityRole="button"
                    >
                      <Text style={styles.evalGoodText}>جيد</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.evalBtn, styles.evalEasy]}
                      onPress={() => void handleRate(ayah.number, 'easy')}
                      accessibilityRole="button"
                    >
                      <Text style={styles.evalEasyText}>سهل</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })
        )}

        <View style={styles.footerCard}>
          {stageIdx < 4 ? (
            <Pressable
              style={styles.primaryBtn}
              onPress={() => {
                if (stageIdx === 0) void toggleDailyStage('yesterdayReview');
                if (stageIdx === 1) void toggleDailyStage('olderReview');
                if (stageIdx === 2) void toggleDailyStage('newMemorization');
                if (stageIdx === 3) void toggleDailyStage('selfTest');
                setStageIdx((stageIdx + 1) as SessionStageIndex);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>الانتقال للمرحلة التالية</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.primaryBtn}
              onPress={() => void handleCompleteSession()}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>إتمام جلسة اليوم</Text>
            </Pressable>
          )}

          {sessionSavedMsg ? <Text style={styles.savedText}>{sessionSavedMsg}</Text> : null}
        </View>
      </ScrollView>

      <Modal visible={surahModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>اختر السورة</Text>
              <Pressable
                style={styles.iconBtn}
                onPress={() => setSurahModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="إغلاق قائمة السور"
              >
                <Ionicons name="close" size={22} color={COLORS.charcoal} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {SURAHS.map((s) => (
                <Pressable
                  key={s.id}
                  style={[
                    styles.modalRow,
                    s.id === currentSurahId && styles.modalRowActive,
                  ]}
                  onPress={() => {
                    void setCursor(s.id, 1);
                    setSurahModalOpen(false);
                  }}
                >
                  <Text style={styles.modalRowSub}>{toArabicDigits(s.totalAyahs)} آية</Text>
                  <Text style={styles.modalRowTitle}>
                    {toArabicDigits(s.id)}. {s.nameAr}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmIvory },
  content: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxxl },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warmIvory,
  },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADII.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  rowBetween: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  surahPickerBtn: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.lightGreenSurface,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.control,
  },
  surahPickerText: { fontSize: 16, fontWeight: '700', color: COLORS.forestGreen },
  cacheChip: {
    backgroundColor: COLORS.warmIvory,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  cacheChipText: { fontSize: 12, color: COLORS.secondary, fontWeight: '600' },
  stageTabsRow: { gap: SPACING.sm, flexDirection: 'row-reverse' },
  stageTab: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.warmIvory,
  },
  stageTabActive: {
    backgroundColor: COLORS.forestGreen,
    borderColor: COLORS.forestGreen,
  },
  stageTabText: { fontSize: 13, fontWeight: '600', color: COLORS.charcoal },
  stageTabTextActive: { color: COLORS.white },
  stageGuide: { fontSize: 13, color: COLORS.secondary, textAlign: 'right' },
  controlsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: SPACING.sm },
  controlChip: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.warmIvory,
  },
  controlChipActive: {
    backgroundColor: COLORS.forestGreen,
    borderColor: COLORS.forestGreen,
  },
  controlChipText: { fontSize: 13, fontWeight: '600', color: COLORS.charcoal },
  controlChipTextActive: { color: COLORS.white },
  errorBox: {
    backgroundColor: COLORS.dangerBg,
    borderRadius: RADII.control,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.coral,
  },
  errorText: { color: COLORS.dangerText, fontSize: 13, textAlign: 'right' },
  centerCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADII.card,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  ayahCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADII.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  ayahMetaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: SPACING.sm },
  ayahNumBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.lightGreenSurface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  ayahNumText: { color: COLORS.forestGreen, fontWeight: '700', fontSize: 14 },
  statusText: { fontSize: 12, color: COLORS.secondary, fontWeight: '600' },
  ayahActionsRow: { flexDirection: 'row-reverse', gap: SPACING.sm },
  iconBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.warmIvory,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: COLORS.forestGreen,
    borderColor: COLORS.forestGreen,
  },
  ayahText: {
    color: COLORS.charcoal,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 46,
    fontWeight: '500',
  },
  secondaryBtn: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    backgroundColor: COLORS.lightGreenSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: COLORS.forestGreen, fontWeight: '700', fontSize: 14 },
  evalRow: { flexDirection: 'row-reverse', gap: SPACING.sm },
  evalBtn: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  evalDifficult: { backgroundColor: COLORS.coralSoft, borderColor: COLORS.coral },
  evalDifficultText: { color: COLORS.coralAccessibleText, fontWeight: '700', fontSize: 14 },
  evalGood: { backgroundColor: COLORS.lightGreenSurface, borderColor: COLORS.forestGreen },
  evalGoodText: { color: COLORS.forestGreen, fontWeight: '700', fontSize: 14 },
  evalEasy: { backgroundColor: COLORS.forestGreen, borderColor: COLORS.forestGreen },
  evalEasyText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  footerCard: { gap: SPACING.sm },
  primaryBtn: {
    minHeight: MIN_TOUCH_TARGET + 4,
    backgroundColor: COLORS.forestGreen,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  savedText: { color: COLORS.forestGreen, fontSize: 13, textAlign: 'center', fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.warmIvory,
    borderTopLeftRadius: RADII.card,
    borderTopRightRadius: RADII.card,
    padding: SPACING.xl,
    maxHeight: '78%',
    gap: SPACING.md,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.charcoal },
  modalList: { maxHeight: 420 },
  modalRow: {
    minHeight: MIN_TOUCH_TARGET + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalRowActive: { backgroundColor: COLORS.lightGreenSurface, borderRadius: RADII.control },
  modalRowTitle: { fontSize: 16, fontWeight: '600', color: COLORS.charcoal },
  modalRowSub: { fontSize: 13, color: COLORS.secondary },
});
