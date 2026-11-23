import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  MILLA_COPY,
  RECITERS,
  formatDigitsInText,
  formatNum,
  toArabicDigits,
  type ReciterId,
} from '@al-milla/core';
import { AppShell } from '../src/components/milla/AppShell';
import { LanguageSwitcher } from '../src/components/milla/LanguageSwitcher';
import { MillaPicker } from '../src/components/milla/MillaPicker';
import { useMilla } from '../src/context/MillaContext';
import type { PlaybackSpeed } from '../src/db/database';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '../src/theme/tokens';

const SPEEDS: PlaybackSpeed[] = [0.75, 1.0, 1.25];

export default function SettingsScreen() {
  const {
    state,
    theme,
    isSyncing,
    syncError,
    setReciter,
    setPlaybackSpeed,
    setDailyTarget,
    setMandatoryRepeats,
    setQuranFontSize,
    setMushafViewMode,
    setNightMode,
    setLargeUiMode,
    setShowTranslation,
    setShowTransliteration,
    syncNow,
    restoreBySyncKey,
    resetLocalProgress,
  } = useMilla();

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState('');

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

  const handleSync = async () => {
    setStatusMessage(null);
    const res = await syncNow();
    if (res.ok) {
      setStatusMessage(
        `تمت المزامنة والدمج بنجاح (الإصدار ${toArabicDigits(res.mergedState?.version ?? 1)})`,
      );
    }
  };

  const handleRestore = async () => {
    setStatusMessage(null);
    const targetKey = keyInput.trim() || state.syncKey;
    const res = await restoreBySyncKey(targetKey);
    if (res.ok) {
      setKeyInput('');
      setStatusMessage('تم استرجاع ودمج المحفظة السحابية بنجاح');
    }
  };

  const handleReset = () => {
    Alert.alert(copy.settingsResetBtn, copy.settingsBackupDesc, [
      { text: copy.mushafClose, style: 'cancel' },
      {
        text: copy.settingsResetBtn,
        style: 'destructive',
        onPress: () => {
          void resetLocalProgress().then(() => {
            setStatusMessage(copy.settingsResetDone);
          });
        },
      },
    ]);
  };

  return (
    <AppShell title={copy.settingsTitle} subtitle={copy.settingsSubtitle}>
      <View style={styles.stack}>
        {statusMessage ? (
          <View
            style={[
              styles.statusBox,
              { borderColor: theme.primary, backgroundColor: theme.secondary },
            ]}
          >
            <Text style={[styles.statusText, { color: theme.primary }]}>{statusMessage}</Text>
          </View>
        ) : null}

        {/* Language */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text
            style={[
              styles.cardHeadingSmall,
              { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
            ]}
          >
            {copy.settingsLanguageTitle}
          </Text>
          <LanguageSwitcher />
        </View>

        {/* Narration & Audio */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View
            style={[
              styles.rowBetween,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <View
              style={[
                styles.titleGroup,
                { flexDirection: isRtl ? 'row-reverse' : 'row' },
              ]}
            >
              <Ionicons name="book-outline" size={20} color={theme.primary} />
              <Text style={[styles.cardHeading, { color: theme.foreground }]}>
                {copy.settingsWirdTitle}
              </Text>
            </View>
            <View style={styles.badgesRow}>
              <View style={[styles.pill, { backgroundColor: theme.secondary }]}>
                <Text style={[styles.pillText, { color: theme.secondaryForeground }]}>
                  {copy.hafsBadge}
                </Text>
              </View>
              <View style={[styles.pill, { backgroundColor: theme.secondary }]}>
                <Text style={[styles.pillText, { color: theme.secondaryForeground }]}>
                  {copy.scriptBadge}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.fieldGap}>
            <Text
              style={[
                styles.fieldLabel,
                { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
              ]}
            >
              {copy.settingsReciterLabel}
            </Text>
            <MillaPicker
              fullWidth
              value={state.reciter}
              onChange={(val) => void setReciter(val as ReciterId)}
              title={copy.settingsReciterLabel}
              ariaLabel={copy.settingsReciterLabel}
              options={RECITERS.map((r) => ({
                value: r.id,
                label: language === 'ar' ? r.nameAr : r.nameEn,
                description: language === 'ar' ? r.styleAr : r.nameAr,
                keywords: `${r.nameAr} ${r.nameEn}`,
              }))}
            />
          </View>

          <View
            style={[
              styles.rowBetween,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <Text style={[styles.fieldLabel, { color: theme.foreground }]}>
              {copy.settingsSpeedLabel}
            </Text>
            <View style={styles.chipsRow}>
              {SPEEDS.map((sp) => {
                const active = state.playbackSpeed === sp;
                return (
                  <Pressable
                    key={sp}
                    onPress={() => void setPlaybackSpeed(sp)}
                    style={[
                      styles.chipBtn,
                      {
                        borderColor: active ? theme.primary : theme.border,
                        backgroundColor: active ? theme.primary : theme.background,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? theme.primaryForeground : theme.foreground },
                      ]}
                    >
                      {formatDigitsInText(`${sp}×`, language)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Memorization Plan */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View
            style={[
              styles.titleGroup,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <Ionicons name="options-outline" size={20} color={theme.primary} />
            <Text style={[styles.cardHeading, { color: theme.foreground }]}>
              {copy.settingsWirdTitle}
            </Text>
          </View>

          <View
            style={[
              styles.rowBetween,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
              <Text style={[styles.settingTitle, { color: theme.foreground }]}>
                {copy.settingsDailyGoalLabel}
              </Text>
              <Text style={[styles.settingSub, { color: theme.mutedForeground }]}>
                {formatNum(state.dailyTarget, language)} {copy.versesUnit}
              </Text>
            </View>
            <View style={styles.stepperRow}>
              <Pressable
                onPress={() => void setDailyTarget(state.dailyTarget - 1)}
                style={[
                  styles.stepBtn,
                  { borderColor: theme.border, backgroundColor: theme.background },
                ]}
              >
                <Text style={[styles.stepSign, { color: theme.foreground }]}>-</Text>
              </Pressable>
              <Text style={[styles.stepVal, { color: theme.foreground }]}>
                {formatNum(state.dailyTarget, language)}
              </Text>
              <Pressable
                onPress={() => void setDailyTarget(state.dailyTarget + 1)}
                style={[
                  styles.stepBtn,
                  { borderColor: theme.border, backgroundColor: theme.background },
                ]}
              >
                <Text style={[styles.stepSign, { color: theme.foreground }]}>+</Text>
              </Pressable>
            </View>
          </View>

          <View
            style={[
              styles.rowBetween,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
              <Text style={[styles.settingTitle, { color: theme.foreground }]}>
                {copy.settingsRepeatsLabel}
              </Text>
              <Text style={[styles.settingSub, { color: theme.mutedForeground }]}>
                {formatNum(state.mandatoryRepeats, language)}
              </Text>
            </View>
            <View style={styles.chipsRow}>
              {[3, 5, 7, 10].map((num) => {
                const active = state.mandatoryRepeats === num;
                return (
                  <Pressable
                    key={num}
                    onPress={() => void setMandatoryRepeats(num)}
                    style={[
                      styles.chipBtn,
                      {
                        borderColor: active ? theme.primary : theme.border,
                        backgroundColor: active ? theme.primary : theme.background,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? theme.primaryForeground : theme.foreground },
                      ]}
                    >
                      {formatNum(num, language)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Display & Accessibility */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View
            style={[
              styles.titleGroup,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <Ionicons name="moon-outline" size={20} color={theme.primary} />
            <Text style={[styles.cardHeading, { color: theme.foreground }]}>
              {copy.settingsDisplayTitle}
            </Text>
          </View>

          <View
            style={[
              styles.rowBetween,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <Text style={[styles.fieldLabel, { color: theme.foreground }]}>
              {copy.settingsFontSizeLabel}
            </Text>
            <View style={styles.stepperRow}>
              <Pressable
                onPress={() => void setQuranFontSize(state.quranFontSize - 2)}
                style={[
                  styles.stepBtn,
                  { borderColor: theme.border, backgroundColor: theme.background },
                ]}
              >
                <Text style={[styles.stepSign, { color: theme.foreground }]}>-</Text>
              </Pressable>
              <Text style={[styles.stepVal, { color: theme.primary }]}>
                {formatNum(state.quranFontSize, language)}
              </Text>
              <Pressable
                onPress={() => void setQuranFontSize(state.quranFontSize + 2)}
                style={[
                  styles.stepBtn,
                  { borderColor: theme.border, backgroundColor: theme.background },
                ]}
              >
                <Text style={[styles.stepSign, { color: theme.foreground }]}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.previewBox, { backgroundColor: theme.secondary }]}>
            <Text
              style={[
                styles.previewText,
                { color: theme.foreground, fontSize: state.quranFontSize },
              ]}
            >
              بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
            </Text>
          </View>

          <View
            style={[
              styles.rowBetween,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
              <Text style={[styles.settingTitle, { color: theme.foreground }]}>
                {copy.settingsMushafModeLabel}
              </Text>
              <Text style={[styles.settingSub, { color: theme.mutedForeground }]}>
                {copy.settingsMushafModeSub}
              </Text>
            </View>
            <View style={styles.chipsRow}>
              <Pressable
                onPress={() => void setMushafViewMode('verses')}
                style={[
                  styles.chipBtn,
                  {
                    borderColor: state.mushafViewMode === 'verses' ? theme.primary : theme.border,
                    backgroundColor:
                      state.mushafViewMode === 'verses' ? theme.primary : theme.background,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color:
                        state.mushafViewMode === 'verses'
                          ? theme.primaryForeground
                          : theme.foreground,
                    },
                  ]}
                >
                  {copy.settingsModeVerses}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void setMushafViewMode('page')}
                style={[
                  styles.chipBtn,
                  {
                    borderColor: state.mushafViewMode === 'page' ? theme.primary : theme.border,
                    backgroundColor:
                      state.mushafViewMode === 'page' ? theme.primary : theme.background,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color:
                        state.mushafViewMode === 'page'
                          ? theme.primaryForeground
                          : theme.foreground,
                    },
                  ]}
                >
                  {copy.settingsModePages}
                </Text>
              </Pressable>
            </View>
          </View>

          {(
            [
              {
                title: copy.settingsNightMode,
                sub: copy.settingsNightModeSub,
                active: state.nightMode,
                onToggle: () => void setNightMode(!state.nightMode),
              },
              {
                title: copy.settingsLargeUi,
                sub: copy.settingsLargeUiSub,
                active: state.largeUiMode,
                onToggle: () => void setLargeUiMode(!state.largeUiMode),
              },
              {
                title: copy.settingsTranslation,
                sub: copy.settingsTranslationSub,
                active: state.showTranslation,
                onToggle: () => void setShowTranslation(!state.showTranslation),
              },
              {
                title: copy.settingsTranslit,
                sub: copy.settingsTranslitSub,
                active: state.showTransliteration,
                onToggle: () => void setShowTransliteration(!state.showTransliteration),
              },
            ] as const
          ).map((toggle) => (
            <View
              key={toggle.title}
              style={[
                styles.rowBetween,
                { flexDirection: isRtl ? 'row-reverse' : 'row' },
              ]}
            >
              <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                <Text style={[styles.settingTitle, { color: theme.foreground }]}>
                  {toggle.title}
                </Text>
                <Text style={[styles.settingSub, { color: theme.mutedForeground }]}>
                  {toggle.sub}
                </Text>
              </View>
              <Pressable
                onPress={toggle.onToggle}
                style={[
                  styles.toggleBtn,
                  {
                    borderColor: toggle.active ? theme.primary : theme.border,
                    backgroundColor: toggle.active ? theme.primary : theme.background,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: toggle.active ? theme.primaryForeground : theme.foreground },
                  ]}
                >
                  {toggle.active ? copy.settingsEnabled : copy.settingsDisabled}
                </Text>
              </Pressable>
            </View>
          ))}

          <View style={[styles.noteBox, { backgroundColor: theme.secondary }]}>
            <Text
              style={[
                styles.noteText,
                { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left' },
              ]}
            >
              {copy.settingsOfflineNote}
            </Text>
          </View>
        </View>

        {/* Cloud Sync (Hono + Supabase) & Reset */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View
            style={[
              styles.titleGroup,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
            <Text style={[styles.cardHeading, { color: theme.foreground }]}>
              {copy.settingsBackupTitle}
            </Text>
          </View>
          <Text
            style={[
              styles.settingSub,
              { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left' },
            ]}
          >
            {copy.settingsBackupDesc}
          </Text>

          <View
            style={[
              styles.keyBox,
              { borderColor: theme.border, backgroundColor: theme.background },
            ]}
          >
            <Text style={[styles.keyLbl, { color: theme.mutedForeground }]}>
              مفتاح المزامنة (Hono + Supabase):
            </Text>
            <Text selectable style={[styles.keyVal, { color: theme.primary }]}>
              {state.syncKey}
            </Text>
            <Text style={[styles.keyLbl, { color: theme.mutedForeground }]}>
              الإصدار: {toArabicDigits(state.syncVersion)} • آخر مزامنة:{' '}
              {state.lastSyncedAt ? state.lastSyncedAt.slice(0, 16).replace('T', ' ') : 'محلي فقط'}
            </Text>
          </View>

          <Pressable
            onPress={() => void handleSync()}
            disabled={isSyncing}
            style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
              {isSyncing ? 'جارٍ المزامنة...' : 'مزامنة وحفظ نسخة سحابية الآن'}
            </Text>
          </Pressable>

          <TextInput
            value={keyInput}
            onChangeText={setKeyInput}
            placeholder="أدخل مفتاح جهاز آخر للاسترجاع والدمج"
            placeholderTextColor={theme.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.input,
              {
                borderColor: theme.border,
                backgroundColor: theme.background,
                color: theme.foreground,
                textAlign: isRtl ? 'right' : 'left',
              },
            ]}
          />

          <Pressable
            onPress={() => void handleRestore()}
            disabled={isSyncing}
            style={[
              styles.secondaryBtn,
              { borderColor: theme.border, backgroundColor: theme.secondary },
            ]}
          >
            <Text style={[styles.secondaryBtnText, { color: theme.primary }]}>
              {copy.settingsImportBtn}
            </Text>
          </Pressable>

          {syncError ? (
            <Text style={[styles.errorText, { color: theme.destructive }]}>{syncError}</Text>
          ) : null}

          <Pressable
            onPress={handleReset}
            style={[
              styles.resetBtn,
              { borderColor: theme.destructive, backgroundColor: theme.background },
            ]}
          >
            <Ionicons name="refresh-outline" size={16} color={theme.destructive} />
            <Text style={[styles.resetBtnText, { color: theme.destructive }]}>
              {copy.settingsResetBtn}
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
  statusBox: {
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statusText: { fontSize: 12, fontWeight: '600', textAlign: 'right' },
  card: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  cardHeadingSmall: { fontSize: 14, fontWeight: '700' },
  cardHeading: { fontSize: 16, fontWeight: '700' },
  titleGroup: { alignItems: 'center', gap: 8 },
  rowBetween: { alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  badgesRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  pill: { borderRadius: RADII.pill, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 11, fontWeight: '600' },
  fieldGap: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600' },
  chipsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  chipBtn: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  settingTitle: { fontSize: 14, fontWeight: '700' },
  settingSub: { fontSize: 12, marginTop: 2 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepSign: { fontSize: 18, fontWeight: '700' },
  stepVal: { minWidth: 28, textAlign: 'center', fontSize: 14, fontWeight: '700' },
  previewBox: { borderRadius: RADII.control, padding: 12, alignItems: 'center' },
  previewText: { textAlign: 'center', writingDirection: 'rtl' },
  toggleBtn: {
    minHeight: 48,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  noteBox: { borderRadius: RADII.control, padding: 12 },
  noteText: { fontSize: 12, lineHeight: 18 },
  keyBox: {
    borderRadius: RADII.control,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  keyLbl: { fontSize: 12, textAlign: 'right' },
  keyVal: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
  input: {
    minHeight: 48,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  primaryBtn: {
    minHeight: 48,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryBtnText: { fontSize: 13, fontWeight: '700' },
  secondaryBtn: {
    minHeight: 48,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '700' },
  errorText: { fontSize: 12, textAlign: 'right' },
  resetBtn: {
    minHeight: 48,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  resetBtnText: { fontSize: 12, fontWeight: '700' },
});
