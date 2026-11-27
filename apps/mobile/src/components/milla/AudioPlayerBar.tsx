import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  MILLA_COPY,
  RECITERS,
  formatDigitsInText,
  formatNum,
} from '@al-milla/core';
import { useMilla } from '../../context/MillaContext';
import type { PlaybackSpeed } from '../../db/database';
import { createAyahAudioController } from '../../services/audio';
import { useResponsiveLayout } from '../../theme/responsive';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '../../theme/tokens';

interface AudioPlayerBarProps {
  surahId?: number;
  surahName: string;
  ayahNumber: number;
  mode?: 'memorize' | 'reference';
  externalRepeatCount?: number;
  onPrevAyah?: () => void;
  onNextAyah?: () => void;
  onRepeatProgress?: (currentRepeat: number, totalRepeats: number) => void;
  onRepeatCycleComplete?: () => void;
}

const SPEED_OPTIONS: PlaybackSpeed[] = [0.75, 1.0, 1.25];

export function AudioPlayerBar({
  surahId = 18,
  surahName,
  ayahNumber,
  mode = 'memorize',
  externalRepeatCount,
  onPrevAyah,
  onNextAyah,
  onRepeatProgress,
  onRepeatCycleComplete,
}: AudioPlayerBarProps) {
  const { state, theme, setPlaybackSpeed } = useMilla();
  const { width, isCompact } = useResponsiveLayout();
  const stackControls = width < 410;

  const language = state?.language ?? 'ar';
  const copy = MILLA_COPY[language];
  const isRtl = language === 'ar';
  const reciter = state?.reciter ?? 'hudhaify';
  const playbackSpeed = state?.playbackSpeed ?? 1.0;
  const mandatoryRepeats = state?.mandatoryRepeats ?? 5;
  const difficultyLabel =
    mandatoryRepeats <= 3
      ? language === 'en'
        ? 'Fast'
        : language === 'fr'
          ? 'Rapide'
          : 'سريع'
      : mandatoryRepeats <= 5
        ? language === 'en'
          ? 'Balanced'
          : language === 'fr'
            ? 'Équilibré'
            : 'متوازن'
        : language === 'en'
          ? 'Gradual'
          : language === 'fr'
            ? 'Progressif'
            : 'تدريجي';
  const isReferenceMode = mode === 'reference';

  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatLoopActive, setRepeatLoopActive] = useState(!isReferenceMode);
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const lastRatioRef = useRef(0);
  const audioCtrlRef = useRef(createAyahAudioController());

  const startContinuousProgress = (currentRatio: number, remainingMs: number) => {
    if (remainingMs <= 0) {
      progressAnim.stopAnimation();
      progressAnim.setValue(currentRatio);
      lastRatioRef.current = currentRatio;
      return;
    }
    if (Math.abs(currentRatio - lastRatioRef.current) > 0.04 || currentRatio === 0) {
      progressAnim.setValue(currentRatio);
    }
    lastRatioRef.current = currentRatio;
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: remainingMs,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  };

  const resetProgress = () => {
    progressAnim.stopAnimation();
    lastRatioRef.current = 0;
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 120,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    setIsPlaying(false);
    setRepeatLoopActive(!isReferenceMode);
    setCurrentRepeat(1);
    setAudioUnavailable(false);
    progressAnim.stopAnimation();
    progressAnim.setValue(0);
    lastRatioRef.current = 0;
    void audioCtrlRef.current.stop();
  }, [surahId, ayahNumber, reciter, isReferenceMode, mandatoryRepeats, progressAnim]);

  useEffect(() => {
    const ctrl = audioCtrlRef.current;
    return () => {
      void ctrl.stop();
    };
  }, []);

  const togglePlayPause = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      resetProgress();
      await audioCtrlRef.current.stop();
      return;
    }

    setAudioUnavailable(false);
    setIsPlaying(true);
    setCurrentRepeat(1);
    progressAnim.stopAnimation();
    progressAnim.setValue(0);
    lastRatioRef.current = 0;

    const remainingFromExternal =
      typeof externalRepeatCount === 'number' && externalRepeatCount < mandatoryRepeats
        ? mandatoryRepeats - externalRepeatCount
        : mandatoryRepeats;
    const totalRepeats = repeatLoopActive ? remainingFromExternal : 1;
    await audioCtrlRef.current.playAyah({
      reciter,
      surahId,
      ayahNumber,
      speed: playbackSpeed,
      repeats: totalRepeats,
      onRepeatAdvance: (current, total) => {
        setCurrentRepeat(current);
        if (onRepeatProgress) onRepeatProgress(current, total);
      },
      onPlaybackProgress: (ratio, remainingMs, playing) => {
        if (!playing) {
          if (ratio === 0) resetProgress();
          return;
        }
        startContinuousProgress(ratio, remainingMs);
      },
      onFinish: () => {
        setIsPlaying(false);
        setCurrentRepeat(totalRepeats);
        resetProgress();
        if (onRepeatCycleComplete) onRepeatCycleComplete();
      },
      onError: () => {
        setIsPlaying(false);
        resetProgress();
        setAudioUnavailable(true);
      },
    });
  };

  const cycleSpeed = () => {
    const idx = SPEED_OPTIONS.indexOf(playbackSpeed);
    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length] ?? 1.0;
    audioCtrlRef.current.setSpeed(next);
    void setPlaybackSpeed(next);
  };

  const toggleRepeatLoop = () => {
    const next = !repeatLoopActive;
    setRepeatLoopActive(next);
    const remainingFromExternal =
      typeof externalRepeatCount === 'number' && externalRepeatCount < mandatoryRepeats
        ? mandatoryRepeats - externalRepeatCount
        : mandatoryRepeats;
    audioCtrlRef.current.setRepeats(next ? remainingFromExternal : 1);
  };

  const displayedRepeat =
    typeof externalRepeatCount === 'number' ? externalRepeatCount : currentRepeat;

  const reciterName = (() => {
    const found = RECITERS.find((r) => r.id === reciter);
    return found ? (language === 'ar' ? found.nameAr : found.nameEn) : reciter;
  })();

  const transportControls = (
    <View style={[styles.transportRow, stackControls ? styles.transportRowCentered : null]}>
      <Pressable
        onPress={onPrevAyah}
        disabled={!onPrevAyah}
        accessibilityRole="button"
        accessibilityLabel="الآية السابقة"
        style={[
          styles.stepBtn,
          isCompact ? styles.stepBtnCompact : null,
          {
            borderColor: theme.border,
            backgroundColor: theme.background,
            opacity: onPrevAyah ? 1 : 0.35,
          },
        ]}
      >
        <Ionicons name="play-skip-back-outline" size={20} color={theme.foreground} />
      </Pressable>

      <Pressable
        onPress={() => void togglePlayPause()}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'إيقاف التلاوة مؤقتاً' : 'تشغيل التلاوة'}
        style={[
          styles.playBtn,
          isCompact ? styles.playBtnCompact : null,
          { backgroundColor: theme.primary },
        ]}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={isCompact ? 22 : 24}
          color={theme.primaryForeground}
        />
      </Pressable>

      <Pressable
        onPress={onNextAyah}
        disabled={!onNextAyah}
        accessibilityRole="button"
        accessibilityLabel="الآية التالية"
        style={[
          styles.stepBtn,
          isCompact ? styles.stepBtnCompact : null,
          {
            borderColor: theme.border,
            backgroundColor: theme.background,
            opacity: onNextAyah ? 1 : 0.35,
          },
        ]}
      >
        <Ionicons name="play-skip-forward-outline" size={20} color={theme.foreground} />
      </Pressable>
    </View>
  );

  const repeatButton = (
    <Pressable
      onPress={toggleRepeatLoop}
      accessibilityRole="button"
      accessibilityState={{ selected: repeatLoopActive }}
      accessibilityLabel={repeatLoopActive ? copy.audioRepeatOn : copy.audioRepeatOff}
      style={[
        styles.repeatBtn,
        stackControls ? styles.repeatBtnFlex : null,
        {
          flexDirection: isRtl ? 'row-reverse' : 'row',
          borderColor: repeatLoopActive ? theme.primary : theme.border,
          backgroundColor: repeatLoopActive ? theme.secondary : theme.background,
        },
      ]}
    >
      <Ionicons
        name="repeat-outline"
        size={16}
        color={repeatLoopActive ? (theme.isDark ? theme.foreground : theme.primary) : theme.mutedForeground}
      />
      <Text
        style={[
          styles.repeatBtnText,
          {
            color: repeatLoopActive
              ? theme.isDark
                ? theme.foreground
                : theme.primary
              : theme.mutedForeground,
          },
        ]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}
      >
        {repeatLoopActive ? copy.audioRepeatOn : copy.audioRepeatOff}
      </Text>
    </Pressable>
  );

  const speedButton = (
    <Pressable
      onPress={cycleSpeed}
      accessibilityRole="button"
      accessibilityLabel="تغيير سرعة التلاوة"
      style={[
        styles.speedBtn,
        { borderColor: theme.border, backgroundColor: theme.background },
      ]}
    >
      <Text
        style={[styles.speedText, { color: theme.foreground }]}
        maxFontSizeMultiplier={1.2}
      >
        {formatDigitsInText(`${playbackSpeed}×`, language)}
      </Text>
    </Pressable>
  );

  return (
    <View
      style={[
        styles.container,
        isCompact ? styles.containerCompact : null,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      {/* Top Info + Repeat Dots */}
      <View
        style={[
          styles.headerRow,
          { flexDirection: isRtl ? 'row-reverse' : 'row' },
        ]}
      >
        <View
          style={[
            styles.infoWrap,
            { flexDirection: isRtl ? 'row-reverse' : 'row' },
          ]}
        >
          <View style={[styles.iconBox, { backgroundColor: theme.secondary }]}>
            <Ionicons
              name={isReferenceMode ? 'volume-medium-outline' : 'musical-notes-outline'}
              size={19}
              color={theme.isDark ? theme.foreground : theme.primary}
            />
          </View>
          <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
            <Text
              style={[styles.metaSub, { color: theme.mutedForeground }]}
              numberOfLines={1}
            >
              {surahName} • {copy.ayahLabel} {formatNum(ayahNumber, language)}
            </Text>
            <Text
              style={[styles.metaTitle, { color: theme.foreground }]}
              numberOfLines={1}
            >
              {isReferenceMode
                ? copy.audioReferenceLabel
                : `${difficultyLabel} • ${formatNum(displayedRepeat, language)} / ${formatNum(mandatoryRepeats, language)}`}
            </Text>
          </View>
        </View>

        {!isReferenceMode ? (
          <View style={styles.dotsRow}>
            {Array.from({ length: Math.min(mandatoryRepeats, 10) }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: i < displayedRepeat ? theme.accent : theme.muted },
                ]}
              />
            ))}
          </View>
        ) : null}
      </View>

      {/* Reciter Label + Status */}
      <View
        style={[
          styles.pickerRow,
          { flexDirection: isRtl ? 'row-reverse' : 'row' },
        ]}
      >
        <View
          style={[
            styles.pickerWrap,
            { flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 },
          ]}
        >
          <Ionicons
            name="volume-high-outline"
            size={15}
            color={theme.isDark ? theme.foreground : theme.primary}
          />
          <Text
            style={[styles.statusText, { color: theme.foreground, fontWeight: '600', flexShrink: 1 }]}
            numberOfLines={1}
          >
            {reciterName}
          </Text>
        </View>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: audioUnavailable ? `${theme.destructive}18` : theme.secondary,
            },
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              {
                color: audioUnavailable
                  ? theme.destructive
                  : theme.isDark
                    ? theme.foreground
                    : theme.primary,
              },
            ]}
            numberOfLines={1}
          >
            {audioUnavailable ? 'غير متاح دون اتصال' : copy.audioLiveStatus}
          </Text>
        </View>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: theme.muted }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: theme.primary,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {audioUnavailable ? (
        <Text
          style={[
            styles.unavailableHint,
            { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left' },
          ]}
        >
          تعذّر تشغيل الصوت حالياً — يمكنك القراءة والتكرار يدوياً.
        </Text>
      ) : null}

      {/* Responsive Controls */}
      {stackControls ? (
        <View style={styles.controlsStacked}>
          {transportControls}
          <View
            style={[
              styles.secondaryControlsRow,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            {repeatButton}
            {speedButton}
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.controlsRow,
            { flexDirection: isRtl ? 'row-reverse' : 'row' },
          ]}
        >
          {repeatButton}
          {transportControls}
          {speedButton}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  containerCompact: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  infoWrap: { flex: 1, flexShrink: 1, alignItems: 'center', gap: 10 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaSub: { fontSize: 12 },
  metaTitle: { fontSize: 14, fontWeight: '700' },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 999 },
  pickerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  pickerWrap: { flex: 1, minWidth: 120 },
  statusText: { fontSize: 12 },
  statusPill: {
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: { fontSize: 11, fontWeight: '600' },
  unavailableHint: { fontSize: 12, lineHeight: 18 },
  progressTrack: {
    height: 6,
    borderRadius: RADII.pill,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: RADII.pill },
  controlsStacked: {
    gap: SPACING.sm,
  },
  secondaryControlsRow: {
    gap: SPACING.sm,
    alignItems: 'center',
  },
  repeatBtnFlex: {
    flex: 1,
    justifyContent: 'center',
  },
  controlsRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  repeatBtn: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  repeatBtnText: { fontSize: 12, fontWeight: '600' },
  transportRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  transportRowCentered: { justifyContent: 'center' },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnCompact: {
    width: 48,
    height: 48,
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnCompact: {
    width: 50,
    height: 50,
  },
  speedBtn: {
    minHeight: 48,
    minWidth: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  speedText: { fontSize: 12, fontWeight: '700' },
});
