import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  MILLA_COPY,
  MUTASHABIHAT_DRILLS,
  formatNum,
} from '@al-milla/core';
import { AppShell } from '../src/components/milla/AppShell';
import { useMilla } from '../src/context/MillaContext';
import { createAyahAudioController } from '../src/services/audio';
import { RADII, SPACING } from '../src/theme/tokens';

export default function MutashabihatScreen() {
  const router = useRouter();
  const { state, theme, setMutashabihatMastered } = useMilla();

  const drill = MUTASHABIHAT_DRILLS[0]!;
  const language = state?.language ?? 'ar';
  const copy = MILLA_COPY[language];
  const isRtl = language === 'ar';

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [playingSide, setPlayingSide] = useState<'primary' | 'secondary' | null>(null);
  const audioCtrlRef = useRef(createAyahAudioController());

  useEffect(() => {
    const ctrl = audioCtrlRef.current;
    return () => {
      void ctrl.stop();
    };
  }, []);

  const isMastered = Boolean(state?.mutashabihatMastered[drill.id]);

  const handleAudioToggle = async (side: 'primary' | 'secondary') => {
    if (playingSide === side) {
      setPlayingSide(null);
      await audioCtrlRef.current.stop();
      return;
    }
    setPlayingSide(side);
    await audioCtrlRef.current.playAyah({
      reciter: state?.reciter ?? 'hudhaify',
      surahId: side === 'primary' ? drill.primarySurahId : drill.secondarySurahId,
      ayahNumber: side === 'primary' ? 75 : 38,
      speed: state?.playbackSpeed ?? 1.0,
      repeats: 1,
      onFinish: () => setPlayingSide(null),
      onError: () => setPlayingSide(null),
    });
  };

  return (
    <AppShell title={copy.mutashabihatTitle} subtitle={copy.mutashabihatSubtitle}>
      <View style={styles.stack}>
        {/* Comparison Header */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.compareRow}>
            <Text style={[styles.compareSurah, { color: theme.foreground }]}>
              {drill.primarySurahName}
            </Text>
            <Text style={[styles.compareArrow, { color: theme.mutedForeground }]}>⇄</Text>
            <Text style={[styles.compareSurah, { color: theme.foreground }]}>
              {drill.secondarySurahName}
            </Text>
          </View>
          <View style={[styles.noteBanner, { backgroundColor: `${theme.accent}33` }]}>
            <Text style={[styles.noteBannerText, { color: theme.foreground }]}>
              موضع متشابه شائع بين السورتين، يحتاج تمييزاً ذهنياً
            </Text>
          </View>
        </View>

        {/* Primary Verse */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.primary, borderWidth: 2 },
          ]}
        >
          <View
            style={[
              styles.rowBetween,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={[styles.badge, { backgroundColor: theme.secondary }]}>
              <Text style={[styles.badgeText, { color: theme.primary }]}>
                {copy.mutashabihatPrimaryBadge} • {drill.primarySurahName}
              </Text>
            </View>
            <Text style={[styles.hizbText, { color: theme.mutedForeground }]}>
              {copy.hizbLabel} {formatNum(drill.primaryHizb, language)}
            </Text>
          </View>
          <Text
            style={[
              styles.quranText,
              { color: theme.foreground, fontSize: state?.quranFontSize ?? 24 },
            ]}
          >
            {drill.primaryText}
          </Text>
          <View style={[styles.infoBox, { backgroundColor: theme.secondary }]}>
            <Text style={[styles.infoText, { color: theme.foreground }]}>
              {drill.primaryNote}
            </Text>
          </View>
        </View>

        {/* Secondary Verse */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.accent },
          ]}
        >
          <View
            style={[
              styles.rowBetween,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={[styles.badge, { backgroundColor: `${theme.accent}40` }]}>
              <Text style={[styles.badgeText, { color: theme.foreground }]}>
                {copy.mutashabihatSecondaryBadge} • {drill.secondarySurahName}
              </Text>
            </View>
            <Text style={[styles.hizbText, { color: theme.mutedForeground }]}>
              {copy.hizbLabel} {formatNum(drill.secondaryHizb, language)}
            </Text>
          </View>
          <Text
            style={[
              styles.quranText,
              { color: theme.foreground, fontSize: state?.quranFontSize ?? 24 },
            ]}
          >
            {drill.secondaryText}
          </Text>
          <Text style={[styles.divergenceText, { color: theme.mutedForeground }]}>
            {drill.divergenceNote}
          </Text>
        </View>

        {/* Mnemonic Rule */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View
            style={[
              styles.sectionHeader,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <Ionicons name="bulb-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
              ضابط التمييز الذهني
            </Text>
          </View>
          <Text style={[styles.mnemonicTitle, { color: theme.primary }]}>
            {drill.mnemonicTitle}
          </Text>
          <Text style={[styles.mnemonicBody, { color: theme.foreground }]}>
            {drill.mnemonicBody}
          </Text>
        </View>

        {/* Audio Comparison */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.audioTitle, { color: theme.foreground }]}>المقارنة الصوتية</Text>
          <View style={styles.audioGrid}>
            <Pressable
              onPress={() => void handleAudioToggle('primary')}
              style={[
                styles.audioBtn,
                {
                  borderColor: playingSide === 'primary' ? theme.primary : theme.border,
                  backgroundColor: playingSide === 'primary' ? theme.primary : theme.background,
                },
              ]}
            >
              <Ionicons
                name="volume-high-outline"
                size={16}
                color={playingSide === 'primary' ? theme.primaryForeground : theme.foreground}
              />
              <Text
                style={[
                  styles.audioBtnText,
                  {
                    color:
                      playingSide === 'primary' ? theme.primaryForeground : theme.foreground,
                  },
                ]}
              >
                موضع الواقعة
              </Text>
            </Pressable>

            <Pressable
              onPress={() => void handleAudioToggle('secondary')}
              style={[
                styles.audioBtn,
                {
                  borderColor: playingSide === 'secondary' ? theme.primary : theme.border,
                  backgroundColor: playingSide === 'secondary' ? theme.primary : theme.background,
                },
              ]}
            >
              <Ionicons
                name="volume-high-outline"
                size={16}
                color={playingSide === 'secondary' ? theme.primaryForeground : theme.foreground}
              />
              <Text
                style={[
                  styles.audioBtnText,
                  {
                    color:
                      playingSide === 'secondary' ? theme.primaryForeground : theme.foreground,
                  },
                ]}
              >
                موضع الحاقة
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Quick Recall Quiz */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View
            style={[
              styles.sectionHeader,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <Ionicons name="help-circle-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
              اختبار الاستحضار السريع
            </Text>
          </View>
          <Text style={[styles.quizPrompt, { color: theme.foreground }]}>
            {drill.quizPrompt}
          </Text>

          <View style={styles.quizOptions}>
            {drill.quizOptions.map((opt) => {
              const isChosen = selectedOption === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setSelectedOption(opt.id)}
                  style={[
                    styles.quizBtn,
                    {
                      borderColor: isChosen
                        ? opt.isCorrect
                          ? theme.primary
                          : theme.destructive
                        : theme.border,
                      backgroundColor: isChosen
                        ? opt.isCorrect
                          ? theme.primary
                          : `${theme.destructive}1A`
                        : theme.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.quizOptionLabel,
                      {
                        color: isChosen
                          ? opt.isCorrect
                            ? theme.primaryForeground
                            : theme.destructive
                          : theme.foreground,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {isChosen && opt.isCorrect ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.primaryForeground}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {selectedOption ? (
            <View style={[styles.infoBox, { backgroundColor: theme.secondary }]}>
              <Text style={[styles.infoText, { color: theme.foreground }]}>
                {drill.quizExplanation}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Mastered Toggle */}
        <View style={styles.actionsWrap}>
          <Pressable
            onPress={() => void setMutashabihatMastered(drill.id, !isMastered)}
            style={[
              styles.masterBtn,
              {
                borderColor: isMastered ? theme.primary : 'transparent',
                backgroundColor: isMastered ? theme.secondary : theme.primary,
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={isMastered ? theme.primary : theme.primaryForeground}
            />
            <Text
              style={[
                styles.masterBtnText,
                { color: isMastered ? theme.primary : theme.primaryForeground },
              ]}
            >
              {isMastered
                ? 'تمّ تثبيت الموضع كـ «مُتقَن ومضبوط» ✓'
                : 'تثبيت الموضع كـ «مُتقَن ومضبوط»'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/revision')}
            style={[
              styles.backBtn,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.backBtnText, { color: theme.foreground }]}>
              العودة لجدول المراجعة اليومية
            </Text>
          </Pressable>
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  stack: { gap: SPACING.xl },
  card: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  compareRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compareSurah: { fontSize: 14, fontWeight: '700' },
  compareArrow: { fontSize: 16 },
  noteBanner: { borderRadius: RADII.control, padding: 10 },
  noteBannerText: { fontSize: 12, fontWeight: '600', textAlign: 'right' },
  rowBetween: { alignItems: 'center', justifyContent: 'space-between' },
  badge: { borderRadius: RADII.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  hizbText: { fontSize: 12 },
  quranText: {
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 46,
    paddingVertical: 8,
  },
  infoBox: { borderRadius: RADII.control, padding: 12 },
  infoText: { fontSize: 12, lineHeight: 20, textAlign: 'right' },
  divergenceText: { fontSize: 12, textAlign: 'right' },
  sectionHeader: { alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  mnemonicTitle: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
  mnemonicBody: { fontSize: 12, lineHeight: 20, textAlign: 'right' },
  audioTitle: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
  audioGrid: { flexDirection: 'row-reverse', gap: 10 },
  audioBtn: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  audioBtnText: { fontSize: 12, fontWeight: '700' },
  quizPrompt: { fontSize: 14, textAlign: 'right' },
  quizOptions: { gap: 8 },
  quizBtn: {
    minHeight: 48,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  quizOptionLabel: { fontSize: 18 },
  actionsWrap: { gap: 10 },
  masterBtn: {
    minHeight: 52,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADII.card,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  masterBtnText: { fontSize: 14, fontWeight: '700' },
  backBtn: {
    minHeight: 48,
    borderRadius: RADII.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  backBtnText: { fontSize: 14, fontWeight: '600' },
});
