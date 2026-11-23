import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  MILLA_COPY,
  formatNum,
  getSurahById,
  getSurahDisplayName,
  toArabicDigits,
  type AyahEntry,
  type SelfEvalRating,
} from '@al-milla/core';
import { AppShell } from '../src/components/milla/AppShell';
import { useMilla } from '../src/context/MillaContext';
import { createAyahAudioController } from '../src/services/audio';
import { loadVerifiedSurahAyahs } from '../src/services/quran';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '../src/theme/tokens';

export default function SelfTestScreen() {
  const { state, theme, setCursor, evaluateVerse } = useMilla();

  const language = state?.language ?? 'ar';
  const currentSurahId = state?.currentSurahId ?? 18;
  const currentAyah = state?.currentAyah ?? 1;
  const dailyTarget = state?.dailyTarget ?? 4;
  const reciter = state?.reciter ?? 'hudhaify';
  const playbackSpeed = state?.playbackSpeed ?? 1.0;

  const surah = getSurahById(currentSurahId);
  const [ayahs, setAyahs] = useState<AyahEntry[]>(surah.ayahs);
  const [portionOffset, setPortionOffset] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [rating, setRating] = useState<SelfEvalRating | null>(null);
  const [audioHintPlaying, setAudioHintPlaying] = useState(false);
  const audioCtrlRef = useRef(createAyahAudioController());

  useEffect(() => {
    const ctrl = audioCtrlRef.current;
    return () => {
      void ctrl.stop();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadVerifiedSurahAyahs(currentSurahId).then((res) => {
      if (!cancelled && res.ayahs.length > 0) {
        setAyahs(res.ayahs);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentSurahId]);

  if (!state) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const copy = MILLA_COPY[language];
  const isRtl = language === 'ar';
  const dirArrow = isRtl ? 'arrow-back' : 'arrow-forward';
  const ayahIdx = Math.max(
    0,
    ayahs.findIndex((a) => a.number === currentAyah),
  );
  const portionAyahs = ayahs.slice(ayahIdx, ayahIdx + dailyTarget);
  const ayah = portionAyahs[portionOffset] ?? ayahs[ayahIdx] ?? ayahs[0];

  const handleToggleAudioReference = async () => {
    if (!ayah) return;
    if (audioHintPlaying) {
      setAudioHintPlaying(false);
      await audioCtrlRef.current.stop();
      return;
    }
    setAudioHintPlaying(true);
    await audioCtrlRef.current.playAyah({
      reciter,
      surahId: surah.id,
      ayahNumber: ayah.number,
      speed: playbackSpeed,
      repeats: 1,
      onFinish: () => setAudioHintPlaying(false),
      onError: () => setAudioHintPlaying(false),
    });
  };

  const handleSubmitAndNext = async () => {
    if (rating && ayah) {
      await evaluateVerse(surah.id, ayah.number, rating, true);
    }
    await audioCtrlRef.current.stop();
    setRevealed(false);
    setRating(null);
    setAudioHintPlaying(false);

    if (portionOffset + 1 < portionAyahs.length) {
      setPortionOffset((o) => o + 1);
      return;
    }
    setPortionOffset(0);
    const nextIdx = (ayahIdx + portionAyahs.length) % Math.max(1, ayahs.length);
    const nextAyahObj = ayahs[nextIdx];
    if (nextAyahObj) {
      await setCursor(surah.id, nextAyahObj.number);
    }
  };

  const ratings: { id: SelfEvalRating; title: string; subtitle: string }[] = [
    { id: 'difficult', title: copy.evalDifficult, subtitle: copy.evalDifficultHint },
    { id: 'good', title: copy.evalGood, subtitle: copy.evalGoodHint },
    { id: 'easy', title: copy.evalEasy, subtitle: copy.evalEasyHint },
  ];

  return (
    <AppShell
      title={copy.selfTestTitle}
      subtitle={`${getSurahDisplayName(surah, language)} • ${copy.ayahLabel} ${formatNum(portionOffset + 1, language)} / ${formatNum(Math.max(1, portionAyahs.length), language)}`}
    >
      <View style={styles.stack}>
        {/* Progress Header */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View
            style={[
              styles.rowBetween,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <Text style={[styles.smallPrimary, { color: theme.primary }]}>
              {copy.selfTestTitle}
            </Text>
            <View style={[styles.pill, { backgroundColor: theme.secondary }]}>
              <Text style={[styles.pillText, { color: theme.secondaryForeground }]}>
                {copy.ayahLabel} {formatNum(portionOffset + 1, language)} /{' '}
                {formatNum(Math.max(1, portionAyahs.length), language)}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.surahName,
              { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
            ]}
          >
            {getSurahDisplayName(surah, language)}
          </Text>

          <View
            style={[
              styles.progressSegments,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            {(portionAyahs.length > 0 ? portionAyahs : [ayah]).map((item, idx) => (
              <View
                key={item ? item.number : idx}
                style={[
                  styles.segment,
                  {
                    backgroundColor: idx <= portionOffset ? theme.primary : theme.muted,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Hidden / Revealed Verse Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.promptText, { color: theme.mutedForeground }]}>
            {copy.selfTestPrompt}
          </Text>

          <View
            style={[
              styles.dashedBox,
              { borderColor: theme.border, backgroundColor: theme.secondary },
            ]}
          >
            {revealed && ayah ? (
              <Text
                style={[
                  styles.quranText,
                  { color: theme.foreground, fontSize: state.quranFontSize },
                ]}
              >
                {ayah.textAr} ﴿{toArabicDigits(ayah.number)}﴾
              </Text>
            ) : (
              <View style={styles.hiddenInner}>
                <Ionicons name="eye-off-outline" size={28} color={theme.mutedForeground} />
                <Text style={[styles.hiddenHint, { color: theme.mutedForeground }]}>
                  {copy.selfTestHiddenHint}
                </Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={() => setRevealed((v) => !v)}
            style={[
              styles.revealBtn,
              {
                flexDirection: isRtl ? 'row-reverse' : 'row',
                borderColor: theme.border,
                backgroundColor: theme.secondary,
              },
            ]}
            accessibilityRole="button"
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={theme.secondaryForeground}
            />
            <Text style={[styles.revealBtnText, { color: theme.secondaryForeground }]}>
              {revealed ? copy.selfTestHideBtn : copy.selfTestShowBtn}
            </Text>
          </Pressable>
        </View>

        {/* Audio Reference */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View
            style={[
              styles.rowBetween,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
              <Text style={[styles.audioTitle, { color: theme.foreground }]}>
                {copy.selfTestAudioTitle}
              </Text>
              <Text style={[styles.audioSub, { color: theme.mutedForeground }]}>
                {copy.selfTestAudioSub}
              </Text>
            </View>
            <Pressable
              onPress={() => void handleToggleAudioReference()}
              style={[
                styles.audioBtn,
                {
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                  backgroundColor: theme.primary,
                },
              ]}
              accessibilityRole="button"
            >
              <Ionicons
                name={audioHintPlaying ? 'stop-outline' : 'volume-high-outline'}
                size={16}
                color={theme.primaryForeground}
              />
              <Text style={[styles.audioBtnText, { color: theme.primaryForeground }]}>
                {audioHintPlaying ? copy.selfTestStopBtn : copy.selfTestPlayBtn}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Honest Tajweed Disclaimer */}
        <View
          style={[
            styles.disclaimerBox,
            {
              flexDirection: isRtl ? 'row-reverse' : 'row',
              borderColor: theme.border,
              backgroundColor: theme.secondary,
            },
          ]}
        >
          <Ionicons name="information-circle-outline" size={18} color={theme.primary} />
          <Text
            style={[
              styles.disclaimerText,
              { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
            ]}
          >
            {copy.selfEvalDisclaimer}
          </Text>
        </View>

        {/* Self-Evaluation Selector */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text
            style={[
              styles.evalHeading,
              { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
            ]}
          >
            {copy.revisionEvalPrompt}
          </Text>
          <View style={[styles.evalGrid, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            {ratings.map((item) => {
              const selected = rating === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setRating(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.evalTile,
                    {
                      borderColor: selected ? theme.primary : theme.border,
                      backgroundColor: selected ? theme.primary : theme.background,
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={16}
                    color={selected ? theme.primaryForeground : theme.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.evalTitle,
                      { color: selected ? theme.primaryForeground : theme.foreground },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.evalSub,
                      {
                        color: selected
                          ? theme.primaryForeground
                          : theme.mutedForeground,
                      },
                    ]}
                  >
                    {item.subtitle}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsWrap}>
          <Pressable
            onPress={() => void handleSubmitAndNext()}
            disabled={!rating}
            style={[
              styles.submitBtn,
              {
                flexDirection: isRtl ? 'row-reverse' : 'row',
                backgroundColor: theme.primary,
                opacity: rating ? 1 : 0.45,
              },
            ]}
            accessibilityRole="button"
          >
            <Text style={[styles.submitText, { color: theme.primaryForeground }]}>
              {copy.selfTestNextBtn}
            </Text>
            <Ionicons name={dirArrow} size={18} color={theme.primaryForeground} />
          </Pressable>

          <Pressable
            onPress={() => {
              setRevealed(false);
              setRating(null);
            }}
            style={[styles.resetBtn, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}
            accessibilityRole="button"
          >
            <Ionicons name="refresh-outline" size={14} color={theme.mutedForeground} />
            <Text style={[styles.resetText, { color: theme.mutedForeground }]}>
              إعادة التسميع لهذه الآية مرة أخرى
            </Text>
          </Pressable>
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stack: { gap: SPACING.xl },
  card: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  rowBetween: { alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  smallPrimary: { fontSize: 12, fontWeight: '700' },
  pill: { borderRadius: RADII.pill, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: '600' },
  surahName: { fontSize: 18, fontWeight: '700' },
  progressSegments: { gap: 6 },
  segment: { flex: 1, height: 8, borderRadius: RADII.pill },
  promptText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  dashedBox: {
    minHeight: 140,
    borderRadius: RADII.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  quranText: {
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 46,
  },
  hiddenInner: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  hiddenHint: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  revealBtn: {
    minHeight: 48,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  revealBtnText: { fontSize: 14, fontWeight: '700' },
  audioTitle: { fontSize: 14, fontWeight: '700' },
  audioSub: { fontSize: 12, marginTop: 2 },
  audioBtn: {
    minHeight: 48,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  audioBtnText: { fontSize: 12, fontWeight: '700' },
  disclaimerBox: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    alignItems: 'flex-start',
  },
  disclaimerText: { flex: 1, fontSize: 12, lineHeight: 20 },
  evalHeading: { fontSize: 16, fontWeight: '700' },
  evalGrid: { gap: 10 },
  evalTile: {
    flex: 1,
    minHeight: 82,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 3,
  },
  evalTitle: { fontSize: 14, fontWeight: '700' },
  evalSub: { fontSize: 11, textAlign: 'center' },
  actionsWrap: { gap: 8 },
  submitBtn: {
    minHeight: 52,
    borderRadius: RADII.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  submitText: { fontSize: 14, fontWeight: '700' },
  resetBtn: {
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  resetText: { fontSize: 12, fontWeight: '600' },
});
