import React, { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  MILLA_COPY,
  RECITERS,
  SURAHS,
  formatNum,
  getSurahDisplayName,
  type ReciterId,
} from '@al-milla/core';
import { AppShell } from '../src/components/milla/AppShell';
import { MillaPicker } from '../src/components/milla/MillaPicker';
import { useMilla } from '../src/context/MillaContext';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '../src/theme/tokens';

const LOGO_ASSET = require('../assets/images/al-milla-logo.png');

export default function OnboardingScreen() {
  const router = useRouter();
  const {
    state,
    theme,
    setReciter,
    setCursor,
    setDailyTarget,
    setLargeUiMode,
    completeOnboarding,
  } = useMilla();

  const language = state?.language ?? 'ar';
  const reciter = state?.reciter ?? 'hudhaify';
  const currentSurahId = state?.currentSurahId ?? 18;
  const dailyTarget = state?.dailyTarget ?? 4;
  const largeUiMode = state?.largeUiMode ?? false;

  const [customGoalInput, setCustomGoalInput] = useState<string>(String(dailyTarget));
  const copy = MILLA_COPY[language];
  const isRtl = language === 'ar';
  const dirArrow = isRtl ? 'arrow-back' : 'arrow-forward';

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

  const dailyGoals: { value: number; title: string; subtitle: string; recommended?: boolean }[] = [
    {
      value: 1,
      title: `${formatNum(1, language)} ${copy.verseSingular}`,
      subtitle:
        language === 'ar'
          ? 'للمبتدئين أو مع ضيق الوقت'
          : language === 'fr'
            ? 'Pour débuter en douceur'
            : 'For beginners or busy days',
    },
    {
      value: 2,
      title: `${formatNum(2, language)} ${copy.versesUnit}`,
      subtitle:
        language === 'ar'
          ? 'خطوة هادئة ومستقرة'
          : language === 'fr'
            ? 'Un rythme calme et régulier'
            : 'A calm, steady pace',
    },
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

  const handleStart = async () => {
    await completeOnboarding();
    router.replace('/');
  };

  return (
    <AppShell title={copy.onboardingTitle} hideBottomNav hideTopActions>
      <View style={styles.stack}>
        {/* Top Large Text Toggle */}
        <View style={{ alignItems: isRtl ? 'flex-start' : 'flex-end' }}>
          <Pressable
            onPress={() => void setLargeUiMode(!largeUiMode)}
            accessibilityRole="button"
            accessibilityState={{ selected: largeUiMode }}
            style={[
              styles.largeTextBtn,
              {
                flexDirection: isRtl ? 'row-reverse' : 'row',
                borderColor: largeUiMode ? theme.primary : theme.border,
                backgroundColor: largeUiMode ? theme.primary : theme.card,
              },
            ]}
          >
            <Ionicons
              name="text-outline"
              size={16}
              color={largeUiMode ? theme.primaryForeground : theme.foreground}
            />
            <Text
              style={[
                styles.largeTextBtnLbl,
                { color: largeUiMode ? theme.primaryForeground : theme.foreground },
              ]}
            >
              {copy.onboardingLargeText}
            </Text>
          </Pressable>
        </View>

        {/* Brand Identity */}
        <View style={styles.brandSection}>
          <Image
            source={LOGO_ASSET}
            style={[styles.logo, { borderColor: theme.border }]}
            accessibilityLabel={copy.brandName}
          />
          <Text style={[styles.brandName, { color: theme.primary }]}>{copy.brandName}</Text>
          <Text style={[styles.intro, { color: theme.mutedForeground }]}>
            {copy.onboardingIntro}
          </Text>
        </View>

        {/* 1. Preferred Sheikh */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View
            style={[
              styles.cardHeader,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <View
              style={[
                styles.cardTitleGroup,
                { flexDirection: isRtl ? 'row-reverse' : 'row' },
              ]}
            >
              <Ionicons name="volume-high-outline" size={20} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.foreground }]}>
                {copy.onboardingReciterTitle}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.secondary }]}>
              <Text style={[styles.badgeText, { color: theme.secondaryForeground }]}>
                {copy.hafsBadge}
              </Text>
            </View>
          </View>

          <MillaPicker
            fullWidth
            value={reciter}
            onChange={(val) => void setReciter(val as ReciterId)}
            title={copy.onboardingReciterPickerTitle}
            ariaLabel={copy.onboardingReciterPickerTitle}
            options={RECITERS.map((r) => ({
              value: r.id,
              label: language === 'ar' ? r.nameAr : r.nameEn,
              description: language === 'ar' ? r.styleAr : r.nameAr,
              keywords: `${r.nameAr} ${r.nameEn}`,
            }))}
          />
        </View>

        {/* 2. Starting Surah */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View
            style={[
              styles.cardHeader,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <View
              style={[
                styles.cardTitleGroup,
                { flexDirection: isRtl ? 'row-reverse' : 'row' },
              ]}
            >
              <Ionicons name="book-outline" size={20} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.foreground }]}>
                {copy.onboardingSurahTitle}
              </Text>
            </View>
            <MillaPicker
              compact
              searchable
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

          <View style={styles.grid2}>
            {startingSurahPresets.map((preset) => {
              const selected = currentSurahId === preset.id;
              return (
                <Pressable
                  key={preset.id}
                  onPress={() => void setCursor(preset.id, 1)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.presetTile,
                    {
                      alignItems: isRtl ? 'flex-end' : 'flex-start',
                      borderColor: selected ? theme.primary : theme.border,
                      backgroundColor: selected ? theme.secondary : theme.background,
                    },
                  ]}
                >
                  <Text style={[styles.presetLabel, { color: theme.foreground }]}>
                    {preset.label}
                  </Text>
                  <Text style={[styles.presetHint, { color: theme.mutedForeground }]}>
                    {preset.hint}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 3. Daily Goal */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View
            style={[
              styles.cardHeader,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <View
              style={[
                styles.cardTitleGroup,
                { flexDirection: isRtl ? 'row-reverse' : 'row' },
              ]}
            >
              <Ionicons name="sparkles-outline" size={20} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.foreground }]}>
                {copy.onboardingGoalTitle}
              </Text>
            </View>
            <Text style={[styles.laterHint, { color: theme.mutedForeground }]}>
              {copy.onboardingGoalLater}
            </Text>
          </View>

          <View style={styles.grid2}>
            {dailyGoals.map((goal) => {
              const selected = dailyTarget === goal.value;
              return (
                <Pressable
                  key={goal.value}
                  onPress={() => {
                    void setDailyTarget(goal.value);
                    setCustomGoalInput(String(goal.value));
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.presetTile,
                    {
                      alignItems: isRtl ? 'flex-end' : 'flex-start',
                      borderColor: selected ? theme.primary : theme.border,
                      backgroundColor: selected ? theme.secondary : theme.background,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.goalTopRow,
                      { flexDirection: isRtl ? 'row-reverse' : 'row' },
                    ]}
                  >
                    <Text style={[styles.presetLabel, { color: theme.foreground }]}>
                      {goal.title}
                    </Text>
                    {goal.recommended ? (
                      <View style={[styles.recBadge, { backgroundColor: `${theme.primary}1A` }]}>
                        <Text style={[styles.recBadgeText, { color: theme.primary }]}>
                          {copy.onboardingRecommended}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.presetHint, { color: theme.mutedForeground }]}>
                    {goal.subtitle}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View
            style={[
              styles.customGoalRow,
              {
                flexDirection: isRtl ? 'row-reverse' : 'row',
                borderColor: theme.border,
                backgroundColor: theme.background,
              },
            ]}
          >
            <Text style={[styles.customGoalLbl, { color: theme.foreground }]}>
              {copy.onboardingCustomGoalLabel}
            </Text>
            <TextInput
              value={customGoalInput}
              onChangeText={(val) => {
                setCustomGoalInput(val);
                const num = Number(val);
                if (Number.isInteger(num) && num >= 1 && num <= 20) {
                  void setDailyTarget(num);
                }
              }}
              keyboardType="number-pad"
              maxLength={2}
              style={[
                styles.customGoalInput,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.card,
                  color: theme.foreground,
                },
              ]}
            />
          </View>
        </View>

        {/* Privacy & Start CTA */}
        <View style={styles.footer}>
          <View
            style={[
              styles.privacyBox,
              {
                flexDirection: isRtl ? 'row-reverse' : 'row',
                backgroundColor: theme.secondary,
              },
            ]}
          >
            <Ionicons name="lock-closed-outline" size={16} color={theme.primary} />
            <Text
              style={[
                styles.privacyText,
                { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left' },
              ]}
            >
              {copy.onboardingPrivacyNote}
            </Text>
          </View>

          <Pressable
            onPress={() => void handleStart()}
            style={[
              styles.startBtn,
              {
                flexDirection: isRtl ? 'row-reverse' : 'row',
                backgroundColor: theme.primary,
              },
            ]}
            accessibilityRole="button"
          >
            <Text style={[styles.startBtnText, { color: theme.primaryForeground }]}>
              {copy.onboardingStartCta}
            </Text>
            <Ionicons name={dirArrow} size={20} color={theme.primaryForeground} />
          </Pressable>
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  stack: { gap: SPACING.xl },
  largeTextBtn: {
    minHeight: 44,
    alignItems: 'center',
    gap: 8,
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  largeTextBtnLbl: { fontSize: 12, fontWeight: '600' },
  brandSection: { alignItems: 'center', gap: 6 },
  logo: { width: 80, height: 80, borderRadius: 16, borderWidth: 1 },
  brandName: { fontSize: 28, fontWeight: '700', marginTop: 4 },
  intro: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  card: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  cardHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTitleGroup: { alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  badge: { borderRadius: RADII.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '500' },
  laterHint: { fontSize: 12 },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetTile: {
    width: '48%',
    minHeight: 68,
    borderRadius: RADII.control,
    borderWidth: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  presetLabel: { fontSize: 14, fontWeight: '700' },
  presetHint: { fontSize: 11, marginTop: 4 },
  goalTopRow: { alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  recBadge: { borderRadius: RADII.pill, paddingHorizontal: 8, paddingVertical: 2 },
  recBadgeText: { fontSize: 10, fontWeight: '700' },
  customGoalRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADII.control,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  customGoalLbl: { fontSize: 12, fontWeight: '700' },
  customGoalInput: {
    width: 76,
    height: MIN_TOUCH_TARGET,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: { gap: 12 },
  privacyBox: {
    alignItems: 'center',
    gap: 8,
    borderRadius: RADII.control,
    padding: 12,
  },
  privacyText: { flex: 1, fontSize: 12, lineHeight: 18 },
  startBtn: {
    minHeight: 56,
    borderRadius: RADII.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  startBtnText: { fontSize: 16, fontWeight: '700' },
});
