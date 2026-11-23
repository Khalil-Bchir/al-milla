import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { computeRevisionQueues, getSurahById, toArabicDigits } from '@al-milla/core';
import { useMilla } from '../../src/context/MillaContext';
import type { DailyStageKey } from '../../src/db/database';
import { COLORS, MIN_TOUCH_TARGET, RADII, SPACING } from '../../src/theme/tokens';

interface StageItem {
  key: DailyStageKey;
  order: number;
  title: string;
  subtitle: string;
}

const DAILY_STAGES: StageItem[] = [
  { key: 'yesterdayReview', order: 1, title: 'مراجعة الأمس', subtitle: 'تثبيت ورد الجلسة السابقة' },
  { key: 'olderReview', order: 2, title: 'المراجعة السابقة', subtitle: 'مراجعة المحفوظات المستحقة' },
  { key: 'newMemorization', order: 3, title: 'الحفظ الجديد', subtitle: 'تلقّي وتكرار آيات اليوم' },
  { key: 'selfTest', order: 4, title: 'التسميع', subtitle: 'اختبار الاستظهار بالإخفاء التدريجي' },
  { key: 'verseConnection', order: 5, title: 'ربط الآيات', subtitle: 'وصل الآيات وإتمام الورد اليومي' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { state, isLoading, toggleDailyStage } = useMilla();

  const queues = useMemo(() => {
    if (!state) {
      return { yesterdayItems: [], olderDueItems: [], weakItems: [], totalDueCount: 0 };
    }
    return computeRevisionQueues(state.verseRecords, {
      lastSessionKeys: state.lastSessionKeys,
      lastSessionCompletedAt: state.lastSessionCompletedAt,
    });
  }, [state]);

  if (isLoading || !state) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.forestGreen} />
        <Text style={styles.loadingText}>جارٍ فتح المصحف المحلي...</Text>
      </View>
    );
  }

  const currentSurah = getSurahById(state.currentSurahId);
  const completedStages = DAILY_STAGES.filter((s) => state.dailyStages[s.key]).length;
  const memorizedCount = Object.values(state.verseRecords).filter(
    (v) => v.status === 'memorized',
  ).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <View style={styles.rowBetween}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>الورد اليومي • محلي بدون إنترنت</Text>
          </View>
          <Ionicons name="leaf-outline" size={20} color={COLORS.forestGreen} />
        </View>

        <Text style={styles.heroTitle}>{currentSurah.nameAr}</Text>
        <Text style={styles.heroSubtitle}>
          الموضع الحالي: الآية {toArabicDigits(state.currentAyah)} • الهدف اليومي{' '}
          {toArabicDigits(state.dailyTarget)} آيات
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{toArabicDigits(memorizedCount)}</Text>
            <Text style={styles.statLabel}>آية محفوظة</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{toArabicDigits(queues.totalDueCount)}</Text>
            <Text style={styles.statLabel}>مستحقة للمراجعة</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          onPress={() => router.push('/(tabs)/memorize')}
          accessibilityRole="button"
          accessibilityLabel="ابدأ جلسة الحفظ اليومية"
        >
          <Ionicons name="book-outline" size={20} color={COLORS.white} />
          <Text style={styles.primaryButtonText}>ابدأ جلسة اليوم</Text>
        </Pressable>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>مراحل الملّة الخمس</Text>
          <Text style={styles.progressCount}>
            {toArabicDigits(completedStages)} / {toArabicDigits(DAILY_STAGES.length)}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round((completedStages / DAILY_STAGES.length) * 100)}%` },
            ]}
          />
        </View>

        {DAILY_STAGES.map((stage) => {
          const done = state.dailyStages[stage.key];
          return (
            <Pressable
              key={stage.key}
              style={({ pressed }) => [
                styles.stageRow,
                done && styles.stageRowDone,
                pressed && styles.stageRowPressed,
              ]}
              onPress={() => void toggleDailyStage(stage.key)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
              accessibilityLabel={`${stage.title}: ${stage.subtitle}`}
            >
              <Ionicons
                name={done ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={done ? COLORS.forestGreen : COLORS.secondary}
              />
              <View style={styles.stageTextWrap}>
                <Text style={[styles.stageTitle, done && styles.stageTitleDone]}>
                  {toArabicDigits(stage.order)}. {stage.title}
                </Text>
                <Text style={styles.stageSubtitle}>{stage.subtitle}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {queues.totalDueCount > 0 ? (
        <Pressable
          style={({ pressed }) => [styles.revisionBanner, pressed && styles.stageRowPressed]}
          onPress={() => router.push('/(tabs)/revision')}
          accessibilityRole="button"
          accessibilityLabel="الانتقال إلى المراجعة المستحقة"
        >
          <Ionicons name="repeat-outline" size={22} color={COLORS.forestGreen} />
          <View style={styles.stageTextWrap}>
            <Text style={styles.revisionBannerTitle}>
              لديك {toArabicDigits(queues.totalDueCount)} آيات جاهزة للمراجعة
            </Text>
            <Text style={styles.stageSubtitle}>
              اضغط لبدء المراجعة والتسميع بهدوء حسب وقتك
            </Text>
          </View>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.warmIvory,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warmIvory,
    gap: SPACING.md,
  },
  loadingText: {
    color: COLORS.secondary,
    fontSize: 15,
  },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADII.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  rowBetween: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: COLORS.lightGreenSurface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.pill,
  },
  badgeText: {
    color: COLORS.forestGreen,
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.charcoal,
    textAlign: 'right',
  },
  heroSubtitle: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row-reverse',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.warmIvory,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.forestGreen,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
  },
  primaryButton: {
    minHeight: MIN_TOUCH_TARGET + 4,
    backgroundColor: COLORS.forestGreen,
    borderRadius: RADII.control,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
  },
  primaryButtonPressed: {
    backgroundColor: COLORS.forestGreenPressed,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADII.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.charcoal,
  },
  progressCount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.forestGreen,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.lightGreenSurface,
    borderRadius: RADII.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.forestGreen,
  },
  stageRow: {
    minHeight: MIN_TOUCH_TARGET + 8,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.warmIvory,
  },
  stageRowDone: {
    backgroundColor: COLORS.lightGreenSurface,
    borderColor: COLORS.forestGreen,
  },
  stageRowPressed: {
    opacity: 0.85,
  },
  stageTextWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  stageTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.charcoal,
    textAlign: 'right',
  },
  stageTitleDone: {
    color: COLORS.forestGreen,
  },
  stageSubtitle: {
    fontSize: 12,
    color: COLORS.secondary,
    textAlign: 'right',
    marginTop: 2,
  },
  revisionBanner: {
    minHeight: MIN_TOUCH_TARGET + 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.lightGreenSurface,
    borderRadius: RADII.card,
    borderWidth: 1,
    borderColor: COLORS.forestGreen,
    padding: SPACING.lg,
  },
  revisionBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.forestGreen,
    textAlign: 'right',
  },
});
