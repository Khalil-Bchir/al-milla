import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  computeRevisionQueues,
  getSurahById,
  toArabicDigits,
  type MemorizedVerseRecord,
  type SelfEvalRating,
} from '@al-milla/core';
import { useMilla } from '../../src/context/MillaContext';
import { COLORS, MIN_TOUCH_TARGET, RADII, SPACING } from '../../src/theme/tokens';

type RevisionTab = 'yesterday' | 'older' | 'weak';

export default function RevisionScreen() {
  const { state, evaluateVerse } = useMilla();
  const [activeTab, setActiveTab] = useState<RevisionTab>('yesterday');

  const queues = useMemo(() => {
    if (!state) {
      return { yesterdayItems: [], olderDueItems: [], weakItems: [], totalDueCount: 0 };
    }
    return computeRevisionQueues(state.verseRecords, {
      lastSessionKeys: state.lastSessionKeys,
      lastSessionCompletedAt: state.lastSessionCompletedAt,
    });
  }, [state]);

  if (!state) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.forestGreen} />
      </View>
    );
  }

  const activeItems: MemorizedVerseRecord[] =
    activeTab === 'yesterday'
      ? queues.yesterdayItems
      : activeTab === 'older'
        ? queues.olderDueItems
        : queues.weakItems;

  const handleRate = async (item: MemorizedVerseRecord, rating: SelfEvalRating) => {
    await evaluateVerse(item.surahId, item.ayahNumber, rating, false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.tabsRow}>
        <Pressable
          style={[styles.tabBtn, activeTab === 'yesterday' && styles.tabBtnActive]}
          onPress={() => setActiveTab('yesterday')}
          accessibilityRole="tab"
        >
          <Text style={[styles.tabText, activeTab === 'yesterday' && styles.tabTextActive]}>
            الأمس ({toArabicDigits(queues.yesterdayItems.length)})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, activeTab === 'older' && styles.tabBtnActive]}
          onPress={() => setActiveTab('older')}
          accessibilityRole="tab"
        >
          <Text style={[styles.tabText, activeTab === 'older' && styles.tabTextActive]}>
            السابقة ({toArabicDigits(queues.olderDueItems.length)})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, activeTab === 'weak' && styles.tabBtnActive]}
          onPress={() => setActiveTab('weak')}
          accessibilityRole="tab"
        >
          <Text style={[styles.tabText, activeTab === 'weak' && styles.tabTextActive]}>
            الضعيفة ({toArabicDigits(queues.weakItems.length)})
          </Text>
        </Pressable>
      </View>

      {activeItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>لا توجد آيات مستحقة في هذا القسم حالياً</Text>
          <Text style={styles.emptyBody}>
            عند حفظ أو تقييم آيات جديدة ستظهر هنا تلقائياً حسب جدول التثبيت.
          </Text>
        </View>
      ) : (
        activeItems.map((item) => {
          const surah = getSurahById(item.surahId);
          return (
            <View key={item.key} style={styles.itemCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.intervalBadge}>
                  كل {toArabicDigits(item.intervalDays)} يوم
                </Text>
                <Text style={styles.itemTitle}>
                  {surah.nameAr} — الآية {toArabicDigits(item.ayahNumber)}
                </Text>
              </View>
              <Text style={styles.itemMeta}>
                عدد المراجعات: {toArabicDigits(item.reviewCount)}
              </Text>
              <View style={styles.evalRow}>
                <Pressable
                  style={[styles.evalBtn, styles.evalDifficult]}
                  onPress={() => void handleRate(item, 'difficult')}
                >
                  <Text style={styles.evalDifficultText}>صعب</Text>
                </Pressable>
                <Pressable
                  style={[styles.evalBtn, styles.evalGood]}
                  onPress={() => void handleRate(item, 'good')}
                >
                  <Text style={styles.evalGoodText}>جيد</Text>
                </Pressable>
                <Pressable
                  style={[styles.evalBtn, styles.evalEasy]}
                  onPress={() => void handleRate(item, 'easy')}
                >
                  <Text style={styles.evalEasyText}>سهل</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmIvory },
  content: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxxl },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warmIvory,
  },
  tabsRow: { flexDirection: 'row-reverse', gap: SPACING.sm },
  tabBtn: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: COLORS.forestGreen,
    borderColor: COLORS.forestGreen,
  },
  tabText: { fontSize: 13, fontWeight: '700', color: COLORS.charcoal },
  tabTextActive: { color: COLORS.white },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADII.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xxl,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.charcoal, textAlign: 'center' },
  emptyBody: { fontSize: 14, color: COLORS.secondary, textAlign: 'center' },
  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADII.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: { fontSize: 16, fontWeight: '700', color: COLORS.charcoal },
  intervalBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.forestGreen,
    backgroundColor: COLORS.lightGreenSurface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.pill,
  },
  itemMeta: { fontSize: 13, color: COLORS.secondary, textAlign: 'right' },
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
});
