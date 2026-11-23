import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  MILLA_COPY,
  computeProgressMetrics,
  computeRevisionQueues,
  formatNum,
  getSurahById,
  getSurahDisplayName,
} from '@al-milla/core';
import { AppShell } from '../src/components/milla/AppShell';
import { QuietDhikrCard } from '../src/components/milla/QuietDhikrCard';
import { useMilla } from '../src/context/MillaContext';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '../src/theme/tokens';

const MUSHAF_MORNING_IMG = require('../assets/images/mushaf-morning.jpg');

type ShortcutHref = '/self-test' | '/tafsir' | '/mutashabihat' | '/progress';

export default function HomeScreen() {
  const router = useRouter();
  const { state, theme, isLoading } = useMilla();

  useEffect(() => {
    if (!isLoading && state && !state.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [isLoading, state, router]);

  if (isLoading || !state) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!state.onboardingCompleted) {
    return null;
  }

  const language = state.language;
  const copy = MILLA_COPY[language];
  const isRtl = language === 'ar';
  const dirArrow = isRtl ? 'arrow-back' : 'arrow-forward';
  const surah = getSurahById(state.currentSurahId);
  const rangeEnd = Math.min(surah.totalAyahs, state.currentAyah + state.dailyTarget - 1);

  const memorizedInCurrentSurah = Object.values(state.verseRecords).filter(
    (r) => r.surahId === surah.id && (r.status === 'memorized' || r.status === 'weak'),
  ).length;
  const surahPct = Math.min(
    100,
    Math.round((memorizedInCurrentSurah / Math.max(1, surah.totalAyahs)) * 100),
  );

  const queues = computeRevisionQueues(state.verseRecords, {
    lastSessionKeys: state.lastSessionKeys,
    lastSessionCompletedAt: state.lastSessionCompletedAt,
  });
  const metrics = computeProgressMetrics(
    state.verseRecords,
    state.activityDates,
    state.currentSurahId,
  );

  const shortcutItems: {
    href: ShortcutHref;
    label: string;
    icon: 'checkmark-circle-outline' | 'bulb-outline' | 'git-compare-outline' | 'bar-chart-outline';
  }[] = [
    { href: '/self-test', label: copy.selfTestTitle, icon: 'checkmark-circle-outline' },
    { href: '/tafsir', label: copy.tafsirTitle, icon: 'bulb-outline' },
    { href: '/mutashabihat', label: copy.mutashabihatTitle, icon: 'git-compare-outline' },
    { href: '/progress', label: copy.progressTitle, icon: 'bar-chart-outline' },
  ];

  const shortcutsHeading =
    language === 'en' ? 'Quick Shortcuts' : language === 'fr' ? 'Accès rapides' : 'اختصارات سريعة';

  const revisionSubtitle =
    queues.totalDueCount > 0
      ? `${formatNum(queues.totalDueCount, language)} ${copy.homeDueSummary} (${formatNum(queues.yesterdayItems.length, language)} ${copy.homeYesterdayShort} • ${formatNum(queues.olderDueItems.length, language)} ${copy.homeOlderShort} • ${formatNum(queues.weakItems.length, language)} ${copy.homeWeakShort})`
      : metrics.totalMemorizedVerses > 0
        ? language === 'en'
          ? 'All due revisions are caught up for now'
          : language === 'fr'
            ? 'Toutes vos révisions dues sont à jour'
            : 'أتممت مراجعاتك المستحقة حالياً • محفوظك ثابت بإذن الله'
        : copy.homeRevisionEmpty;

  return (
    <AppShell title={copy.navHome} subtitle={copy.homeSubtitle}>
      <View style={styles.stack}>
        {/* Greeting */}
        <View>
          <Text
            style={[
              styles.greeting,
              { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
            ]}
          >
            {copy.homeGreeting}
          </Text>
          <Text
            style={[
              styles.subgreeting,
              { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left' },
            ]}
          >
            {copy.homeSubgreeting}
          </Text>
        </View>

        {/* 1. Editorial Photo Hero for Today's Session */}
        <View style={styles.heroWrap}>
          <ImageBackground source={MUSHAF_MORNING_IMG} style={styles.heroBg} resizeMode="cover">
            <View style={styles.heroOverlay} />
            <View style={styles.heroInner}>
              <View
                style={[
                  styles.heroBadgesRow,
                  { flexDirection: isRtl ? 'row-reverse' : 'row' },
                ]}
              >
                <View style={[styles.coralBadge, { backgroundColor: theme.accent }]}>
                  <Text style={styles.coralBadgeText}>{copy.homeTodayWird}</Text>
                </View>
                <View style={styles.glassBadge}>
                  <Text style={styles.glassBadgeText}>
                    {formatNum(Math.min(memorizedInCurrentSurah, state.dailyTarget), language)} /{' '}
                    {formatNum(state.dailyTarget, language)} {copy.versesUnit}
                  </Text>
                </View>
              </View>

              <Text style={[styles.heroTitle, { textAlign: isRtl ? 'right' : 'left' }]}>
                {getSurahDisplayName(surah, language)}
              </Text>
              <Text style={[styles.heroSub, { textAlign: isRtl ? 'right' : 'left' }]}>
                {copy.ayahLabel} {formatNum(state.currentAyah, language)} -{' '}
                {formatNum(rangeEnd, language)} • {copy.hizbLabel}{' '}
                {formatNum(surah.hizb, language)}
              </Text>

              {/* Progress Bar */}
              <View style={styles.heroProgressWrap}>
                <View
                  style={[
                    styles.heroProgressLabels,
                    { flexDirection: isRtl ? 'row-reverse' : 'row' },
                  ]}
                >
                  <Text style={styles.heroProgressText}>
                    {formatNum(memorizedInCurrentSurah, language)} /{' '}
                    {formatNum(surah.totalAyahs, language)} {copy.versesUnit}
                  </Text>
                  <Text style={[styles.heroPctText, { color: theme.accent }]}>
                    {formatNum(surahPct, language)}%
                  </Text>
                </View>
                <View style={styles.heroTrack}>
                  <View
                    style={[
                      styles.heroFill,
                      { backgroundColor: theme.accent, width: `${surahPct}%` },
                    ]}
                  />
                </View>
              </View>

              <Pressable
                onPress={() => router.push('/memorize')}
                style={[
                  styles.heroCta,
                  { flexDirection: isRtl ? 'row-reverse' : 'row' },
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.heroCtaText}>
                  {queues.totalDueCount > 0 ? copy.homeContinueSessionCta : copy.homeContinueCta}
                </Text>
                <Ionicons name={dirArrow} size={20} color="#073d35" />
              </Pressable>
            </View>
          </ImageBackground>
        </View>

        {/* 2. Clean Typographic Tracking Strip */}
        <Pressable
          onPress={() => router.push('/progress')}
          style={[
            styles.strip,
            {
              flexDirection: isRtl ? 'row-reverse' : 'row',
              borderColor: theme.border,
            },
          ]}
          accessibilityRole="button"
        >
          <View style={styles.stripCol}>
            <Text style={[styles.stripNum, { color: theme.primary }]}>
              {formatNum(metrics.totalMemorizedVerses, language)}
            </Text>
            <Text style={[styles.stripLbl, { color: theme.mutedForeground }]}>
              {copy.progressTotalLabel}
            </Text>
          </View>
          <View style={[styles.stripDivider, { backgroundColor: theme.border }]} />
          <View style={styles.stripCol}>
            <Text style={[styles.stripNum, { color: theme.foreground }]}>
              {formatNum(metrics.surahMasteryList.length, language)}
            </Text>
            <Text style={[styles.stripLbl, { color: theme.mutedForeground }]}>
              {copy.progressActiveSurahs}
            </Text>
          </View>
          <View style={[styles.stripDivider, { backgroundColor: theme.border }]} />
          <View style={styles.stripCol}>
            <Text style={[styles.stripNum, { color: theme.foreground }]}>
              {formatNum(metrics.completedSurahsCount, language)}
            </Text>
            <Text style={[styles.stripLbl, { color: theme.mutedForeground }]}>
              {copy.progressCompletedSurahs}
            </Text>
          </View>
        </Pressable>

        {/* 3. Unified Today's Path (Revision + Memorize) */}
        <View
          style={[
            styles.pathCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Pressable
            onPress={() => router.push('/revision')}
            style={[
              styles.pathRow,
              {
                flexDirection: isRtl ? 'row-reverse' : 'row',
                borderBottomColor: theme.border,
                borderBottomWidth: 1,
              },
            ]}
            accessibilityRole="button"
          >
            <View
              style={[
                styles.pathLeft,
                { flexDirection: isRtl ? 'row-reverse' : 'row' },
              ]}
            >
              <View style={[styles.pathIconBox, { backgroundColor: theme.secondary }]}>
                <Ionicons name="refresh-outline" size={20} color={theme.primary} />
                {queues.totalDueCount > 0 ? (
                  <View
                    style={[
                      styles.notifDot,
                      { backgroundColor: theme.accent, borderColor: theme.card },
                    ]}
                  />
                ) : null}
              </View>
              <View style={[styles.pathTextWrap, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                <Text style={[styles.pathTitle, { color: theme.foreground }]}>
                  {copy.homeRevisionTitle}
                </Text>
                <Text
                  style={[
                    styles.pathSub,
                    { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left' },
                  ]}
                >
                  {revisionSubtitle}
                </Text>
              </View>
            </View>
            <Ionicons name={dirArrow} size={20} color={theme.primary} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/memorize')}
            style={[
              styles.pathRow,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
            accessibilityRole="button"
          >
            <View
              style={[
                styles.pathLeft,
                { flexDirection: isRtl ? 'row-reverse' : 'row' },
              ]}
            >
              <View style={[styles.pathIconBox, { backgroundColor: theme.secondary }]}>
                <Ionicons name="book-outline" size={20} color={theme.primary} />
              </View>
              <View style={[styles.pathTextWrap, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                <Text style={[styles.pathTitle, { color: theme.foreground }]}>
                  {copy.homeNewMemTitle}
                </Text>
                <Text
                  style={[
                    styles.pathSub,
                    { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left' },
                  ]}
                >
                  {getSurahDisplayName(surah, language)} • {copy.ayahLabel}{' '}
                  {formatNum(state.currentAyah, language)} - {formatNum(rangeEnd, language)}
                </Text>
              </View>
            </View>
            <Ionicons name={dirArrow} size={20} color={theme.primary} />
          </Pressable>
        </View>

        {/* 4. Quick Shortcuts Pills */}
        <View style={styles.shortcutsSection}>
          <Text
            style={[
              styles.shortcutsHeading,
              { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left' },
            ]}
          >
            {shortcutsHeading}
          </Text>
          <View
            style={[
              styles.shortcutsWrap,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            {shortcutItems.map((item) => (
              <Pressable
                key={item.href}
                onPress={() => router.push(item.href)}
                style={[
                  styles.shortcutPill,
                  {
                    flexDirection: isRtl ? 'row-reverse' : 'row',
                    borderColor: theme.border,
                    backgroundColor: theme.card,
                  },
                ]}
                accessibilityRole="button"
              >
                <Ionicons name={item.icon} size={16} color={theme.primary} />
                <Text style={[styles.shortcutText, { color: theme.foreground }]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 5. Quiet Interactive Dhikr */}
        <QuietDhikrCard />

        {/* 6. Open Mushaf CTA */}
        <Pressable
          onPress={() => router.push('/mushaf')}
          style={[
            styles.openMushafBtn,
            {
              flexDirection: isRtl ? 'row-reverse' : 'row',
              borderColor: theme.border,
              backgroundColor: theme.secondary,
            },
          ]}
          accessibilityRole="button"
        >
          <Ionicons name="library-outline" size={20} color={theme.primary} />
          <Text style={[styles.openMushafText, { color: theme.primary }]}>
            {copy.homeOpenMushaf}
          </Text>
        </Pressable>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stack: { gap: SPACING.xxl },
  greeting: { fontSize: 24, fontWeight: '700' },
  subgreeting: { fontSize: 15, marginTop: 4 },
  heroWrap: {
    borderRadius: RADII.hero,
    overflow: 'hidden',
    backgroundColor: '#073d35',
  },
  heroBg: { width: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 61, 53, 0.78)',
  },
  heroInner: { padding: SPACING.xxl },
  heroBadgesRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  coralBadge: {
    borderRadius: RADII.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  coralBadgeText: { fontSize: 12, fontWeight: '700', color: '#242a25' },
  glassBadge: {
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  glassBadgeText: { fontSize: 12, fontWeight: '600', color: '#ffffff' },
  heroTitle: { fontSize: 24, fontWeight: '700', color: '#ffffff' },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  heroProgressWrap: { marginTop: 16 },
  heroProgressLabels: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  heroProgressText: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  heroPctText: { fontSize: 12, fontWeight: '700' },
  heroTrack: {
    height: 8,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  heroFill: { height: '100%', borderRadius: RADII.pill },
  heroCta: {
    marginTop: 20,
    minHeight: 52,
    borderRadius: RADII.card,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  heroCtaText: { fontSize: 15, fontWeight: '700', color: '#073d35' },
  strip: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  stripCol: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  stripDivider: { width: 1, height: 34 },
  stripNum: { fontSize: 24, fontWeight: '700' },
  stripLbl: { fontSize: 11, marginTop: 2, textAlign: 'center' },
  pathCard: {
    borderRadius: RADII.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pathRow: {
    minHeight: 78,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
  },
  pathLeft: { flex: 1, alignItems: 'center', gap: 14 },
  pathIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 2,
  },
  pathTextWrap: { flex: 1 },
  pathTitle: { fontSize: 16, fontWeight: '700' },
  pathSub: { fontSize: 12, marginTop: 2 },
  shortcutsSection: { gap: 10 },
  shortcutsHeading: { fontSize: 12, fontWeight: '700' },
  shortcutsWrap: { flexWrap: 'wrap', gap: 8 },
  shortcutPill: {
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    gap: 8,
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  shortcutText: { fontSize: 12, fontWeight: '700' },
  openMushafBtn: {
    minHeight: 52,
    borderRadius: RADII.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  openMushafText: { fontSize: 16, fontWeight: '700' },
});
