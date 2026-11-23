import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RECITERS, toArabicDigits } from '@al-milla/core';
import { useMilla } from '../../src/context/MillaContext';
import { COLORS, MIN_TOUCH_TARGET, RADII, SPACING } from '../../src/theme/tokens';

export default function AccountScreen() {
  const {
    state,
    isSyncing,
    syncError,
    setDailyTarget,
    setQuranFontSize,
    setReciter,
    syncNow,
    restoreBySyncKey,
  } = useMilla();

  const [keyInput, setKeyInput] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!state) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.forestGreen} />
      </View>
    );
  }

  const allRecords = Object.values(state.verseRecords);
  const memorizedCount = allRecords.filter((v) => v.status === 'memorized').length;
  const weakCount = allRecords.filter((v) => v.status === 'weak').length;

  const handleSync = async () => {
    setFeedback(null);
    const res = await syncNow();
    if (res.ok) {
      setFeedback(`تمت المزامنة والدمج بنجاح (الإصدار ${toArabicDigits(res.mergedState?.version ?? 1)})`);
    }
  };

  const handleRestore = async () => {
    setFeedback(null);
    const targetKey = keyInput.trim() || state.syncKey;
    const res = await restoreBySyncKey(targetKey);
    if (res.ok) {
      setKeyInput('');
      setFeedback('تم استرجاع ودمج المحفظة السحابية بنجاح');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>تقدّم الحفظ المحلي (SQLite)</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{toArabicDigits(memorizedCount)}</Text>
            <Text style={styles.statLbl}>آيات محفوظة</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{toArabicDigits(weakCount)}</Text>
            <Text style={styles.statLbl}>تحتاج تثبيتاً</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{toArabicDigits(state.bookmarks.length)}</Text>
            <Text style={styles.statLbl}>علامات مرجعية</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>تفضيلات التعلّم</Text>

        <View style={styles.rowBetween}>
          <View style={styles.stepperRow}>
            <Pressable
              style={styles.stepBtn}
              onPress={() => void setDailyTarget(state.dailyTarget - 1)}
              accessibilityRole="button"
              accessibilityLabel="تقليل الهدف اليومي"
            >
              <Text style={styles.stepBtnText}>-</Text>
            </Pressable>
            <Text style={styles.stepVal}>{toArabicDigits(state.dailyTarget)}</Text>
            <Pressable
              style={styles.stepBtn}
              onPress={() => void setDailyTarget(state.dailyTarget + 1)}
              accessibilityRole="button"
              accessibilityLabel="زيادة الهدف اليومي"
            >
              <Text style={styles.stepBtnText}>+</Text>
            </Pressable>
          </View>
          <Text style={styles.label}>الهدف اليومي (آيات)</Text>
        </View>

        <View style={styles.rowBetween}>
          <View style={styles.stepperRow}>
            <Pressable
              style={styles.stepBtn}
              onPress={() => void setQuranFontSize(state.quranFontSize - 2)}
              accessibilityRole="button"
              accessibilityLabel="تصغير خط المصحف"
            >
              <Text style={styles.stepBtnText}>-</Text>
            </Pressable>
            <Text style={styles.stepVal}>{toArabicDigits(state.quranFontSize)}</Text>
            <Pressable
              style={styles.stepBtn}
              onPress={() => void setQuranFontSize(state.quranFontSize + 2)}
              accessibilityRole="button"
              accessibilityLabel="تكبير خط المصحف"
            >
              <Text style={styles.stepBtnText}>+</Text>
            </Pressable>
          </View>
          <Text style={styles.label}>حجم خط المصحف</Text>
        </View>

        <Text style={styles.label}>القارئ</Text>
        <View style={styles.recitersWrap}>
          {RECITERS.map((r) => {
            const active = state.reciter === r.id;
            return (
              <Pressable
                key={r.id}
                style={[styles.reciterChip, active && styles.reciterChipActive]}
                onPress={() => void setReciter(r.id)}
              >
                <Text style={[styles.reciterChipText, active && styles.reciterChipTextActive]}>
                  {r.nameAr}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>المزامنة السحابية (Hono + Supabase)</Text>
        <Text style={styles.helperText}>
          تعمل بياناتك محلياً دائماً بدون تسجيل. استخدم مفتاح المزامنة للنسخ الاحتياطي أو
          الربط بين iPhone و Android بدون فقدان أي آية.
        </Text>

        <View style={styles.keyBox}>
          <Text style={styles.keyLabel}>مفتاحك الحالي:</Text>
          <Text selectable style={styles.keyValue}>
            {state.syncKey}
          </Text>
          <Text style={styles.keyMeta}>
            الإصدار المحلي: {toArabicDigits(state.syncVersion)} • آخر مزامنة:{' '}
            {state.lastSyncedAt ? state.lastSyncedAt.slice(0, 16).replace('T', ' ') : 'لم تتم بعد'}
          </Text>
        </View>

        <Pressable
          style={styles.primaryBtn}
          onPress={() => void handleSync()}
          disabled={isSyncing}
          accessibilityRole="button"
        >
          <Text style={styles.primaryBtnText}>
            {isSyncing ? 'جارٍ المزامنة...' : 'مزامنة الآن'}
          </Text>
        </Pressable>

        <TextInput
          style={styles.input}
          value={keyInput}
          onChangeText={setKeyInput}
          placeholder="أدخل مفتاح جهاز آخر للربط والاسترجاع"
          placeholderTextColor={COLORS.secondary}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Pressable
          style={styles.secondaryBtn}
          onPress={() => void handleRestore()}
          disabled={isSyncing}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryBtnText}>استرجاع ودمج من السحابة</Text>
        </Pressable>

        {feedback ? <Text style={styles.successText}>{feedback}</Text> : null}
        {syncError ? <Text style={styles.errorText}>{syncError}</Text> : null}
      </View>
    </ScrollView>
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
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADII.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.charcoal, textAlign: 'right' },
  statsRow: { flexDirection: 'row-reverse', gap: SPACING.sm },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.warmIvory,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statVal: { fontSize: 20, fontWeight: '700', color: COLORS.forestGreen },
  statLbl: { fontSize: 12, color: COLORS.secondary, marginTop: 2, textAlign: 'center' },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.charcoal, textAlign: 'right' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  stepBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.warmIvory,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 20, fontWeight: '700', color: COLORS.forestGreen },
  stepVal: { minWidth: 32, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  recitersWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: SPACING.sm },
  reciterChip: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.warmIvory,
  },
  reciterChipActive: { backgroundColor: COLORS.forestGreen, borderColor: COLORS.forestGreen },
  reciterChipText: { fontSize: 13, fontWeight: '600', color: COLORS.charcoal },
  reciterChipTextActive: { color: COLORS.white },
  helperText: { fontSize: 13, color: COLORS.secondary, textAlign: 'right', lineHeight: 20 },
  keyBox: {
    backgroundColor: COLORS.warmIvory,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  keyLabel: { fontSize: 12, color: COLORS.secondary, textAlign: 'right' },
  keyValue: { fontSize: 15, fontWeight: '700', color: COLORS.forestGreen, textAlign: 'right' },
  keyMeta: { fontSize: 12, color: COLORS.secondary, textAlign: 'right' },
  input: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.warmIvory,
    paddingHorizontal: SPACING.md,
    color: COLORS.charcoal,
    textAlign: 'right',
  },
  primaryBtn: {
    minHeight: MIN_TOUCH_TARGET + 4,
    backgroundColor: COLORS.forestGreen,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  secondaryBtn: {
    minHeight: MIN_TOUCH_TARGET + 4,
    backgroundColor: COLORS.lightGreenSurface,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: COLORS.forestGreen, fontSize: 15, fontWeight: '700' },
  successText: { color: COLORS.forestGreen, fontSize: 13, textAlign: 'right', fontWeight: '600' },
  errorText: { color: COLORS.dangerText, fontSize: 13, textAlign: 'right' },
});
