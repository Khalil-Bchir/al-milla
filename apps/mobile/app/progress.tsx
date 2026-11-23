import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  MILLA_COPY,
  computeProgressMetrics,
  formatNum,
  getSurahById,
  getSurahDisplayName,
} from '@al-milla/core';
import { AppShell } from '../src/components/milla/AppShell';
import { useMilla } from '../src/context/MillaContext';
import { RADII, SPACING } from '../src/theme/tokens';

export default function ProgressScreen() {
  const router = useRouter();
  const { state, theme, setCursor } = useMilla();

  if (!state) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const language = state.language;
  const copy = MILLA_COPY[language];
  const isRtl = language === 'ar';
  const metrics = computeProgressMetrics(
    state.verseRecords,
    state.activityDates,
    state.currentSurahId,
  );
  const currentSurah = getSurahById(state.currentSurahId);

  return (
    <AppShell title={copy.progressTitle} subtitle={copy.progressSubtitle}>
      <View style={styles.stack}>
        {/* Hero Summary Banner */}
        <View style={[styles.banner, { backgroundColor: theme.heroBg }]}>
          <View
            style={[
              styles.bannerTop,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <Text style={styles.bannerLabel}>{copy.progressBannerLabel}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{copy.hafsBadge}</Text>
            </View>
          </View>

          <View
            style={[
              styles.bannerMiddle,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
              <Text style={styles.totalVal}>
                {formatNum(metrics.totalMemorizedVerses, language)} {copy.versesUnit}
              </Text>
              <Text style={styles.totalLbl}>{copy.progressTotalLabel}</Text>
            </View>
            <View style={{ alignItems: isRtl ? 'flex-start' : 'flex-end' }}>
              <Text style={styles.currentSurahText}>
                {getSurahDisplayName(currentSurah, language)}
              </Text>
              <Text style={styles.currentAyahText}>
                {copy.progressCurrentWird} • {copy.ayahLabel}{' '}
                {formatNum(state.currentAyah, language)}
              </Text>
            </View>
          </View>

          <View style={[styles.statsGrid, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            <View style={styles.statTile}>
              <Text style={styles.statLbl}>{copy.progressCompletedSurahs}</Text>
              <Text style={styles.statVal}>
                {formatNum(metrics.completedSurahsCount, language)}
              </Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statLbl}>{copy.progressActiveSurahs}</Text>
              <Text style={styles.statVal}>
                {formatNum(metrics.surahMasteryList.length, language)}
              </Text>
            </View>
          </View>
        </View>

        {/* Surah Mastery Map */}
        <View style={styles.mapSection}>
          <View
            style={[
              styles.mapHeader,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <Text style={[styles.mapTitle, { color: theme.foreground }]}>
              {copy.progressMapTitle}
            </Text>
            <Text style={[styles.mapSub, { color: theme.mutedForeground }]}>
              {formatNum(metrics.completedSurahsCount, language)} {copy.progressCompletedCount} •{' '}
              {formatNum(
                Math.max(0, metrics.surahMasteryList.length - metrics.completedSurahsCount),
                language,
              )}{' '}
              {copy.progressInProgressCount}
            </Text>
          </View>

          {metrics.surahMasteryList.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>
                {copy.progressEmpty}
              </Text>
            </View>
          ) : (
            metrics.surahMasteryList.map((item) => {
              const surah = getSurahById(item.surahId);
              return (
                <Pressable
                  key={item.surahId}
                  onPress={() => {
                    void setCursor(item.surahId, 1);
                    router.push('/mushaf');
                  }}
                  style={[
                    styles.surahCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                  accessibilityRole="button"
                >
                  <View
                    style={[
                      styles.surahTop,
                      { flexDirection: isRtl ? 'row-reverse' : 'row' },
                    ]}
                  >
                    <View
                      style={[
                        styles.surahLeft,
                        { flexDirection: isRtl ? 'row-reverse' : 'row' },
                      ]}
                    >
                      <View style={[styles.numBadge, { backgroundColor: theme.secondary }]}>
                        <Text style={[styles.numBadgeText, { color: theme.primary }]}>
                          {formatNum(item.surahId, language)}
                        </Text>
                      </View>
                      <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                        <Text style={[styles.surahTitle, { color: theme.foreground }]}>
                          {getSurahDisplayName(surah, language)}
                        </Text>
                        <Text style={[styles.surahMeta, { color: theme.mutedForeground }]}>
                          {formatNum(item.memorizedCount, language)} /{' '}
                          {formatNum(item.totalAyahs, language)} {copy.versesUnit} •{' '}
                          {copy.hizbLabel} {formatNum(item.hizb, language)}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.pctPill,
                        {
                          flexDirection: isRtl ? 'row-reverse' : 'row',
                          backgroundColor: item.needsCare
                            ? `${theme.accent}40`
                            : theme.secondary,
                        },
                      ]}
                    >
                      {!item.needsCare ? (
                        <Ionicons name="checkmark-circle" size={14} color={theme.primary} />
                      ) : null}
                      <Text
                        style={[
                          styles.pctText,
                          {
                            color: item.needsCare
                              ? theme.foreground
                              : theme.secondaryForeground,
                          },
                        ]}
                      >
                        {formatNum(item.percent, language)}%
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.track, { backgroundColor: theme.muted }]}>
                    <View
                      style={[
                        styles.fill,
                        {
                          backgroundColor: item.needsCare ? theme.accent : theme.primary,
                          width: `${item.percent}%`,
                        },
                      ]}
                    />
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        {/* CTAs */}
        <Pressable
          onPress={() => router.push('/settings')}
          style={[
            styles.primaryBtn,
            { flexDirection: isRtl ? 'row-reverse' : 'row', backgroundColor: theme.primary },
          ]}
          accessibilityRole="button"
        >
          <Ionicons name="settings-outline" size={20} color={theme.primaryForeground} />
          <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
            {copy.settingsLink}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/revision')}
          style={[
            styles.secondaryBtn,
            {
              flexDirection: isRtl ? 'row-reverse' : 'row',
              borderColor: theme.border,
              backgroundColor: theme.secondary,
            },
          ]}
          accessibilityRole="button"
        >
          <Ionicons name="book-outline" size={18} color={theme.primary} />
          <Text style={[styles.secondaryBtnText, { color: theme.primary }]}>
            {copy.revisionStartBtn}
          </Text>
        </Pressable>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stack: { gap: SPACING.xl },
  banner: {
    borderRadius: RADII.card,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  bannerTop: { alignItems: 'center', justifyContent: 'space-between' },
  bannerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  badge: {
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#ffffff' },
  bannerMiddle: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  totalVal: { fontSize: 28, fontWeight: '700', color: '#ffffff' },
  totalLbl: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  currentSurahText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  currentAyahText: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  statsGrid: { gap: 8, marginTop: 4 },
  statTile: {
    flex: 1,
    borderRadius: RADII.control,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    alignItems: 'center',
  },
  statLbl: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  statVal: { fontSize: 15, fontWeight: '700', color: '#ffffff', marginTop: 2 },
  mapSection: { gap: SPACING.md },
  mapHeader: { alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  mapTitle: { fontSize: 16, fontWeight: '700' },
  mapSub: { fontSize: 12 },
  emptyCard: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.xl,
  },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  surahCard: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  surahTop: { alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  surahLeft: { flex: 1, alignItems: 'center', gap: 10 },
  numBadge: {
    width: 36,
    height: 36,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numBadgeText: { fontSize: 12, fontWeight: '700' },
  surahTitle: { fontSize: 14, fontWeight: '700' },
  surahMeta: { fontSize: 12, marginTop: 2 },
  pctPill: {
    alignItems: 'center',
    gap: 4,
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pctText: { fontSize: 12, fontWeight: '600' },
  track: { height: 8, borderRadius: RADII.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: RADII.pill },
  primaryBtn: {
    minHeight: 52,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    minHeight: 48,
    borderRadius: RADII.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700' },
});
