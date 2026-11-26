import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import {
  MILLA_COPY,
  RECITERS,
  computeProgressMetrics,
  formatDigitsInText,
  formatNum,
  toArabicDigits,
  type ReciterId,
} from '@al-milla/core';
import { AppShell } from '../src/components/milla/AppShell';
import { ArabesqueBackdrop } from '../src/components/milla/ArabesqueBackdrop';
import { MillaPicker } from '../src/components/milla/MillaPicker';
import { MillaSwitch } from '../src/components/milla/MillaSwitch';
import { QuranText } from '../src/components/milla/QuranText';
import { useMilla } from '../src/context/MillaContext';
import type { PlaybackSpeed } from '../src/db/database';
import { createAyahAudioController } from '../src/services/audio';
import { submitFeedbackToApi, type MobileFeedbackType } from '../src/services/feedback';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '../src/theme/tokens';

const HERO_SPACE_IMG = require('../assets/images/hero-space.jpg');
const TOTAL_QURAN_AYAHS = 6236;
const SPEEDS: PlaybackSpeed[] = [0.75, 1.0, 1.25];
const DAILY_TARGET_PRESETS = [3, 4, 5] as const;
const FEEDBACK_AREAS = ['الحفظ', 'المراجعة', 'الصوت', 'التصميم', 'أخرى'] as const;
const DIFFICULTY_PRESETS = [
  { value: 3, labelAr: 'سريع', labelEn: 'Fast', labelFr: 'Rapide' },
  { value: 5, labelAr: 'متوازن', labelEn: 'Balanced', labelFr: 'Équilibré' },
  { value: 7, labelAr: 'تدريجي', labelEn: 'Gradual', labelFr: 'Progressif' },
] as const;

type SettingsSheetKind = 'memorize' | 'display' | 'backup' | 'feedback';

export default function MySpaceScreen() {
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

  const [activeSheet, setActiveSheet] = useState<SettingsSheetKind | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [feedbackType, setFeedbackType] = useState<MobileFeedbackType>('feedback');
  const [feedbackArea, setFeedbackArea] = useState<string>('الحفظ');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackContact, setFeedbackContact] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const [draftReciter, setDraftReciter] = useState<ReciterId>(state?.reciter ?? 'hudhaify');
  const [draftSpeed, setDraftSpeed] = useState<PlaybackSpeed>(state?.playbackSpeed ?? 1.0);
  const [draftTarget, setDraftTarget] = useState<number>(state?.dailyTarget ?? 3);
  const [draftRepeats, setDraftRepeats] = useState<number>(state?.mandatoryRepeats ?? 5);
  const [previewingReciter, setPreviewingReciter] = useState<ReciterId | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewCtrlRef = useRef(createAyahAudioController());

  useEffect(() => {
    if (activeSheet === 'memorize' && state) {
      setDraftReciter(state.reciter);
      setDraftSpeed(state.playbackSpeed);
      setDraftTarget(state.dailyTarget);
      setDraftRepeats(state.mandatoryRepeats);
      setPreviewError(null);
    } else {
      setPreviewingReciter(null);
      void previewCtrlRef.current.stop();
    }
  }, [activeSheet, state]);

  useEffect(() => {
    const ctrl = previewCtrlRef.current;
    return () => {
      void ctrl.stop();
    };
  }, []);

  const analytics = useMemo(() => {
    if (!state) {
      return {
        totalMemorizedVerses: 0,
        completedSurahsCount: 0,
        startedSurahsCount: 0,
        totalSessions: 0,
        doneLessonsCount: 0,
        quranPercent: 0,
      };
    }
    const metrics = computeProgressMetrics(
      state.verseRecords,
      state.activityDates,
      state.currentSurahId,
    );
    const startedSurahs = new Set<number>();
    for (const rec of Object.values(state.verseRecords)) {
      if (rec.status === 'memorized' || rec.status === 'weak' || rec.status === 'in_progress') {
        startedSurahs.add(rec.surahId);
      }
    }
    for (const lesson of state.lessons) {
      startedSurahs.add(lesson.surahId);
    }
    const totalSessions = Object.values(state.surahSessions).reduce((sum, n) => sum + n, 0);
    const doneLessonsCount = state.lessons.filter((l) => l.state === 'done').length;
    const rawPct = (metrics.totalMemorizedVerses / TOTAL_QURAN_AYAHS) * 100;
    const quranPercent =
      metrics.totalMemorizedVerses === 0 ? 0 : Math.min(100, Math.max(1, Math.round(rawPct)));

    return {
      totalMemorizedVerses: metrics.totalMemorizedVerses,
      completedSurahsCount: metrics.completedSurahsCount,
      startedSurahsCount: startedSurahs.size,
      totalSessions,
      doneLessonsCount,
      quranPercent,
    };
  }, [state]);

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
  const dirChevron = isRtl ? 'chevron-back' : 'chevron-forward';

  const activeReciterObj = RECITERS.find((r) => r.id === state.reciter) ?? RECITERS[0]!;
  const activeReciterLabel = language === 'ar' ? activeReciterObj.nameAr : activeReciterObj.nameEn;

  const activeDifficulty =
    DIFFICULTY_PRESETS.find((p) => p.value === state.mandatoryRepeats) ?? DIFFICULTY_PRESETS[1];
  const activeDifficultyLabel =
    language === 'en'
      ? activeDifficulty.labelEn
      : language === 'fr'
        ? activeDifficulty.labelFr
        : activeDifficulty.labelAr;

  const handleToggleReciterPreview = async (reciterId: ReciterId) => {
    setPreviewError(null);
    try {
      if (previewingReciter === reciterId) {
        setPreviewingReciter(null);
        await previewCtrlRef.current.stop();
        return;
      }

      setPreviewingReciter(reciterId);
      await previewCtrlRef.current.playAyah({
        reciter: reciterId,
        surahId: 1,
        ayahNumber: 2,
        speed: draftSpeed,
        repeats: 1,
        onFinish: () => setPreviewingReciter(null),
        onError: () => {
          setPreviewingReciter(null);
          setPreviewError('تعذّر تشغيل المعاينة الصوتية حالياً');
        },
      });
    } catch {
      setPreviewingReciter(null);
      setPreviewError('تعذّر تشغيل المعاينة الصوتية حالياً');
    }
  };

  const handleConfirmMemorizeSheet = async () => {
    try {
      await previewCtrlRef.current.stop();
      setPreviewingReciter(null);
      await setReciter(draftReciter);
      await setPlaybackSpeed(draftSpeed);
      await setDailyTarget(draftTarget);
      await setMandatoryRepeats(draftRepeats);
    } finally {
      setActiveSheet(null);
    }
  };

  const handleCloseMemorizeSheet = async () => {
    try {
      await previewCtrlRef.current.stop();
      setPreviewingReciter(null);
    } finally {
      setActiveSheet(null);
    }
  };

  const handleSync = async () => {
    setStatusMessage(null);
    const res = await syncNow();
    if (res.ok) {
      setStatusMessage('تم حفظ النسخة الاحتياطية على السحابة بنجاح');
    }
  };

  const handleRestore = async () => {
    setStatusMessage(null);
    const targetKey = keyInput.trim() || state.syncKey;
    const res = await restoreBySyncKey(targetKey);
    if (res.ok) {
      setKeyInput('');
      setStatusMessage('تم استرجاع تقدمك بنجاح');
    }
  };

  const handleShareSyncKey = async () => {
    try {
      await Share.share({ message: state.syncKey });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'تعذر مشاركة المفتاح';
      setStatusMessage(msg);
    }
  };

  const handleSubmitFeedback = async () => {
    if (feedbackSubmitting) return;
    setFeedbackError(null);
    setFeedbackSubmitting(true);
    try {
      const res = await submitFeedbackToApi({
        type: feedbackType,
        area: feedbackArea,
        message: feedbackMessage,
        contact: feedbackContact,
        syncKey: state.syncKey,
      });
      if (!res.ok) {
        setFeedbackError(res.error ?? 'تعذر إرسال الرسالة.');
        return;
      }
      setFeedbackSent(true);
      setFeedbackMessage('');
      setFeedbackContact('');
      setStatusMessage('شكراً لك! تم استلام رسالتك بنجاح.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleOpenFeedbackSheet = () => {
    setFeedbackError(null);
    setFeedbackSent(false);
    setActiveSheet('feedback');
  };

  const handleCheckUpdates = async () => {
    if (checkingUpdate) return;
    if (!Updates.isEnabled) {
      setStatusMessage('التحديثات التلقائية غير مفعّلة في هذا البناء.');
      return;
    }
    setCheckingUpdate(true);
    setStatusMessage(null);
    try {
      const check = await Updates.checkForUpdateAsync();
      if (!check.isAvailable) {
        setStatusMessage('التطبيق محدث لآخر إصدار.');
        return;
      }
      setStatusMessage('جارٍ تحميل التحديث الجديد...');
      const fetched = await Updates.fetchUpdateAsync();
      if (fetched.isNew) {
        await Updates.reloadAsync();
      } else {
        setStatusMessage('التطبيق محدث لآخر إصدار.');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'تعذر التحقق من التحديثات';
      setStatusMessage(`تعذر التحقق من التحديثات: ${msg}`);
    } finally {
      setCheckingUpdate(false);
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

  const titleText =
    language === 'en'
      ? 'Your Quiet Space with the Quran'
      : language === 'fr'
        ? 'Votre espace serein avec le Coran'
        : 'مساحتك الهادئة مع القرآن';
  const subtitleText =
    language === 'en'
      ? 'Follow the fruit of your journey and shape the app to your comfort.'
      : language === 'fr'
        ? 'Suivez le fruit de votre parcours et adaptez l’application à votre confort.'
        : 'تابع ثمرة رحلتك وهيّئ تجربتك بما يريح قلبك وعينيك.';

  return (
    <AppShell title={titleText} subtitle={subtitleText}>
      <View style={styles.stack}>
        {/* Welcoming Header */}
        <View style={styles.headerBlock}>
          <Text
            style={[
              styles.pageTitle,
              { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
            ]}
          >
            {titleText}
          </Text>
          <Text
            style={[
              styles.pageSubtitle,
              { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left' },
            ]}
          >
            {subtitleText}
          </Text>
        </View>

        {statusMessage ? (
          <View
            style={[
              styles.statusBox,
              { borderColor: theme.primary, backgroundColor: theme.secondary },
            ]}
          >
            <Text style={[styles.statusText, { color: theme.isDark ? theme.foreground : theme.primary }]}>
              {statusMessage}
            </Text>
          </View>
        ) : null}

        {/* Quran Journey Overview Card */}
        <View
          style={[
            styles.heroWrap,
            {
              borderWidth: theme.isDark ? 1 : 0,
              borderColor: theme.isDark ? theme.border : 'transparent',
            },
          ]}
        >
          <View style={styles.heroBg}>
            <Image
              source={HERO_SPACE_IMG}
              style={[styles.heroOverlay, { width: '100%', height: '100%' }]}
              resizeMode="cover"
            />
            <View
              style={[
                styles.heroOverlay,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(18, 20, 18, 0.80)'
                    : 'rgba(7, 61, 53, 0.82)',
                },
              ]}
            />
            <View style={styles.heroCard}>
          <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            <View style={[styles.heroPill, { backgroundColor: theme.accent }]}>
              <Text
                style={[
                  styles.heroPillText,
                  { color: theme.isDark ? theme.accentForeground : '#073d35' },
                ]}
              >
                رحلتي في القرآن
              </Text>
            </View>
            <View style={styles.heroGlassPill}>
              <Text style={[styles.heroGlassText, { color: theme.accent }]}>
                {formatNum(analytics.quranPercent, language)}%
              </Text>
            </View>
          </View>

          <View style={{ gap: 4 }}>
            <Text style={[styles.heroTitle, { textAlign: isRtl ? 'right' : 'left' }]}>
              {formatNum(analytics.totalMemorizedVerses, language)} آية محفوظة
            </Text>
            <Text style={[styles.heroSub, { textAlign: isRtl ? 'right' : 'left' }]}>
              من أصل {formatNum(TOTAL_QURAN_AYAHS, language)} آية •{' '}
              {formatNum(analytics.startedSurahsCount, language)} سور مبدوءة
            </Text>
          </View>

          <View style={styles.heroProgressTrack}>
            <View
              style={[
                styles.heroProgressFill,
                {
                  width: `${analytics.quranPercent}%`,
                  backgroundColor: theme.accent,
                },
              ]}
            />
          </View>

          <View style={[styles.heroStatsGrid, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            <View style={styles.heroStatTile}>
              <Text style={styles.heroStatVal}>
                {formatNum(analytics.completedSurahsCount, language)}
              </Text>
              <Text style={styles.heroStatLbl}>سورة مكتملة</Text>
            </View>
            <View style={styles.heroStatTile}>
              <Text style={styles.heroStatVal}>
                {formatNum(analytics.totalSessions, language)}
              </Text>
              <Text style={styles.heroStatLbl}>جلسة مكتملة</Text>
            </View>
            <View style={styles.heroStatTile}>
              <Text style={styles.heroStatVal}>
                {formatNum(analytics.doneLessonsCount, language)}
              </Text>
              <Text style={styles.heroStatLbl}>دروس متقنة</Text>
            </View>
          </View>
            </View>
          </View>
        </View>

        {/* Quick Appearance & Language Controls */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ArabesqueBackdrop variant="subtle" pattern="arch" />

          <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            <View
              style={[
                styles.titleGroup,
                { flexDirection: isRtl ? 'row-reverse' : 'row', flex: 1 },
              ]}
            >
              <Ionicons
                name={state.nightMode ? 'moon' : 'sunny-outline'}
                size={20}
                color={theme.isDark ? theme.foreground : theme.primary}
              />
              <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                <Text style={[styles.settingTitle, { color: theme.foreground }]}>
                  {copy.settingsNightMode}
                </Text>
                <Text style={[styles.settingSub, { color: theme.mutedForeground }]}>
                  {copy.settingsNightModeSub}
                </Text>
              </View>
            </View>
            <MillaSwitch
              value={state.nightMode}
              onValueChange={(next) => void setNightMode(next)}
              accessibilityLabel={copy.settingsNightMode}
            />
          </View>
        </View>

        {/* Grouped App Settings Menu */}
        <View style={[styles.menuCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ArabesqueBackdrop variant="corner" pattern="lattice" />

          <Pressable
            onPress={() => setActiveSheet('memorize')}
            style={[
              styles.menuRow,
              {
                flexDirection: isRtl ? 'row-reverse' : 'row',
                borderBottomColor: theme.border,
                borderBottomWidth: 1,
              },
            ]}
            accessibilityRole="button"
          >
            <View style={[styles.menuIconBox, { backgroundColor: theme.secondary }]}>
              <Ionicons
                name="book-outline"
                size={18}
                color={theme.isDark ? theme.foreground : theme.primary}
              />
            </View>
            <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start', gap: 2 }}>
              <Text style={[styles.settingTitle, { color: theme.foreground }]}>
                تفضيلات الحفظ والصوت
              </Text>
              <Text style={[styles.settingSub, { color: theme.mutedForeground }]} numberOfLines={1}>
                {activeReciterLabel} • {formatNum(state.dailyTarget, language)} {copy.versesUnit} •{' '}
                {activeDifficultyLabel}
              </Text>
            </View>
            <Ionicons name={dirChevron} size={18} color={theme.mutedForeground} />
          </Pressable>

          <Pressable
            onPress={() => setActiveSheet('display')}
            style={[
              styles.menuRow,
              {
                flexDirection: isRtl ? 'row-reverse' : 'row',
                borderBottomColor: theme.border,
                borderBottomWidth: 1,
              },
            ]}
            accessibilityRole="button"
          >
            <View style={[styles.menuIconBox, { backgroundColor: theme.secondary }]}>
              <Ionicons
                name="text-outline"
                size={18}
                color={theme.isDark ? theme.foreground : theme.primary}
              />
            </View>
            <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start', gap: 2 }}>
              <Text style={[styles.settingTitle, { color: theme.foreground }]}>
                القراءة والعرض
              </Text>
              <Text style={[styles.settingSub, { color: theme.mutedForeground }]} numberOfLines={1}>
                حجم الخط {formatNum(state.quranFontSize, language)} •{' '}
                {state.mushafViewMode === 'page' ? copy.settingsModePages : copy.settingsModeVerses}
              </Text>
            </View>
            <Ionicons name={dirChevron} size={18} color={theme.mutedForeground} />
          </Pressable>

          <Pressable
            onPress={() => setActiveSheet('backup')}
            style={[
              styles.menuRow,
              {
                flexDirection: isRtl ? 'row-reverse' : 'row',
                borderBottomColor: theme.border,
                borderBottomWidth: 1,
              },
            ]}
            accessibilityRole="button"
          >
            <View style={[styles.menuIconBox, { backgroundColor: theme.secondary }]}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={theme.isDark ? theme.foreground : theme.primary}
              />
            </View>
            <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start', gap: 2 }}>
              <Text style={[styles.settingTitle, { color: theme.foreground }]}>
                النسخ الاحتياطي والمزامنة
              </Text>
              <Text style={[styles.settingSub, { color: theme.mutedForeground }]} numberOfLines={1}>
                {state.lastSyncedAt
                  ? `آخر مزامنة: ${state.lastSyncedAt.slice(0, 10)}`
                  : 'حفظ محلي فقط'}
              </Text>
            </View>
            <Ionicons name={dirChevron} size={18} color={theme.mutedForeground} />
          </Pressable>

          <Pressable
            onPress={() => void handleCheckUpdates()}
            disabled={checkingUpdate}
            style={[
              styles.menuRow,
              {
                flexDirection: isRtl ? 'row-reverse' : 'row',
                borderBottomColor: theme.border,
                borderBottomWidth: 1,
              },
            ]}
            accessibilityRole="button"
          >
            <View style={[styles.menuIconBox, { backgroundColor: theme.secondary }]}>
              <Ionicons
                name="cloud-download-outline"
                size={18}
                color={theme.isDark ? theme.foreground : theme.primary}
              />
            </View>
            <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start', gap: 2 }}>
              <Text style={[styles.settingTitle, { color: theme.foreground }]}>
                التحقق من التحديثات
              </Text>
              <Text style={[styles.settingSub, { color: theme.mutedForeground }]} numberOfLines={1}>
                {checkingUpdate
                  ? 'جارٍ البحث عن تحديث...'
                  : `الإصدار ${formatDigitsInText(Constants.expoConfig?.version ?? '1.0.0', 'ar')}`}
              </Text>
            </View>
            {checkingUpdate ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Ionicons name={dirChevron} size={18} color={theme.mutedForeground} />
            )}
          </Pressable>

          <Pressable
            onPress={handleOpenFeedbackSheet}
            style={[
              styles.menuRow,
              {
                flexDirection: isRtl ? 'row-reverse' : 'row',
                borderBottomColor: theme.border,
                borderBottomWidth: 1,
              },
            ]}
            accessibilityRole="button"
          >
            <View style={[styles.menuIconBox, { backgroundColor: theme.secondary }]}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={18}
                color={theme.isDark ? theme.foreground : theme.primary}
              />
            </View>
            <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start', gap: 2 }}>
              <Text style={[styles.settingTitle, { color: theme.foreground }]}>
                ملاحظاتك والإبلاغ عن خطأ
              </Text>
              <Text style={[styles.settingSub, { color: theme.mutedForeground }]}>
                شاركنا رأيك أو أبلغ عن أي مشكلة واجهتك
              </Text>
            </View>
            <Ionicons name={dirChevron} size={18} color={theme.mutedForeground} />
          </Pressable>

          <Pressable
            onPress={handleReset}
            style={[styles.menuRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}
            accessibilityRole="button"
          >
            <View style={[styles.menuIconBox, { backgroundColor: `${theme.destructive}1A` }]}>
              <Ionicons name="refresh-outline" size={18} color={theme.destructive} />
            </View>
            <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start', gap: 2 }}>
              <Text style={[styles.settingTitle, { color: theme.destructive }]}>
                {copy.settingsResetBtn}
              </Text>
              <Text style={[styles.settingSub, { color: theme.mutedForeground }]}>
                مسح السجل المحلي والبدء من جديد
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Sheet: Memorization & Audio Settings */}
      <Modal
        visible={activeSheet === 'memorize'}
        animationType="slide"
        transparent
        onRequestClose={() => void handleCloseMemorizeSheet()}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.modalTitle, { color: theme.foreground }]}>
                تفضيلات الحفظ والصوت
              </Text>
              <Pressable
                onPress={() => void handleCloseMemorizeSheet()}
                style={styles.modalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="إغلاق"
              >
                <Ionicons name="close" size={22} color={theme.foreground} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetScroll}
            >
              <View style={styles.fieldGap}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
                  ]}
                >
                  {copy.settingsReciterLabel}
                </Text>
                {previewError ? (
                  <Text
                    style={[
                      styles.errorText,
                      { color: theme.destructive, textAlign: isRtl ? 'right' : 'left' },
                    ]}
                  >
                    {previewError}
                  </Text>
                ) : null}
                <MillaPicker
                  searchable
                  fullWidth
                  value={draftReciter}
                  onChange={(val) => setDraftReciter(val as ReciterId)}
                  previewingValue={previewingReciter}
                  onPreviewOption={(val) => void handleToggleReciterPreview(val as ReciterId)}
                  onClosePicker={() => {
                    setPreviewingReciter(null);
                    void previewCtrlRef.current.stop();
                  }}
                  title={copy.settingsReciterLabel}
                  ariaLabel={copy.settingsReciterLabel}
                  iconName="volume-high-outline"
                  options={RECITERS.map((r) => ({
                    value: r.id,
                    label: language === 'ar' ? r.nameAr : r.nameEn,
                    description: language === 'ar' ? r.styleAr : r.nameAr,
                    keywords: `${r.nameAr} ${r.nameEn}`,
                  }))}
                />
              </View>

              <View
                style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}
              >
                <Text style={[styles.fieldLabel, { color: theme.foreground }]}>
                  {copy.settingsSpeedLabel}
                </Text>
                <View style={styles.chipsRow}>
                  {SPEEDS.map((sp) => {
                    const active = draftSpeed === sp;
                    return (
                      <Pressable
                        key={sp}
                        onPress={() => setDraftSpeed(sp)}
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

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View
                style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}
              >
                <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                  <Text style={[styles.settingTitle, { color: theme.foreground }]}>
                    {copy.settingsDailyGoalLabel}
                  </Text>
                  <Text style={[styles.settingSub, { color: theme.mutedForeground }]}>
                    {formatNum(draftTarget, language)} {copy.versesUnit}
                  </Text>
                </View>
                <View style={styles.chipsRow}>
                  {DAILY_TARGET_PRESETS.map((target) => {
                    const active = draftTarget === target;
                    return (
                      <Pressable
                        key={target}
                        onPress={() => setDraftTarget(target)}
                        style={[
                          styles.chipBtn,
                          {
                            borderColor: active ? theme.primary : theme.border,
                            backgroundColor: active ? theme.primary : theme.background,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: active ? theme.primaryForeground : theme.foreground },
                          ]}
                        >
                          {formatNum(target, language)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View
                style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}
              >
                <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                  <Text style={[styles.settingTitle, { color: theme.foreground }]}>
                    مستوى صعوبة الحفظ
                  </Text>
                  <Text style={[styles.settingSub, { color: theme.mutedForeground }]}>
                    {(DIFFICULTY_PRESETS.find((d) => d.value === draftRepeats) ??
                      DIFFICULTY_PRESETS[1])[
                      language === 'en' ? 'labelEn' : language === 'fr' ? 'labelFr' : 'labelAr'
                    ]}
                  </Text>
                </View>
                <View style={styles.chipsRow}>
                  {DIFFICULTY_PRESETS.map((preset) => {
                    const active = draftRepeats === preset.value;
                    const label =
                      language === 'en'
                        ? preset.labelEn
                        : language === 'fr'
                          ? preset.labelFr
                          : preset.labelAr;
                    return (
                      <Pressable
                        key={preset.value}
                        onPress={() => setDraftRepeats(preset.value)}
                        style={[
                          styles.chipBtn,
                          {
                            borderColor: active ? theme.primary : theme.border,
                            backgroundColor: active ? theme.primary : theme.background,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: active ? theme.primaryForeground : theme.foreground },
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View
              style={[
                styles.sheetFooter,
                {
                  borderTopColor: theme.border,
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                },
              ]}
            >
              <Pressable
                onPress={() => void handleConfirmMemorizeSheet()}
                style={[
                  styles.primaryBtn,
                  styles.footerBtn,
                  { backgroundColor: theme.primary },
                ]}
                accessibilityRole="button"
              >
                <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                  {language === 'en'
                    ? 'Save Changes'
                    : language === 'fr'
                      ? 'Enregistrer'
                      : 'حفظ التغييرات'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void handleCloseMemorizeSheet()}
                style={[
                  styles.secondaryBtn,
                  styles.footerBtn,
                  { backgroundColor: theme.background, borderColor: theme.border },
                ]}
                accessibilityRole="button"
              >
                <Text style={[styles.secondaryBtnText, { color: theme.foreground }]}>
                  {language === 'en' ? 'Cancel' : language === 'fr' ? 'Annuler' : 'إلغاء'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sheet: Reading & Display Settings */}
      <Modal
        visible={activeSheet === 'display'}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveSheet(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.modalTitle, { color: theme.foreground }]}>
                القراءة والعرض
              </Text>
              <Pressable
                onPress={() => setActiveSheet(null)}
                style={styles.modalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="إغلاق"
              >
                <Ionicons name="close" size={22} color={theme.foreground} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetScroll}
            >
              <View
                style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}
              >
                <Text style={[styles.settingTitle, { color: theme.foreground }]}>
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
                  <Text style={[styles.stepVal, { color: theme.foreground }]}>
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
                <QuranText align="center">
                  بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
                </QuranText>
              </View>

              <View
                style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}
              >
                <Text style={[styles.settingTitle, { color: theme.foreground }]}>
                  {copy.settingsMushafModeLabel}
                </Text>
                <View style={styles.chipsRow}>
                  <Pressable
                    onPress={() => void setMushafViewMode('verses')}
                    style={[
                      styles.chipBtn,
                      {
                        borderColor:
                          state.mushafViewMode === 'verses' ? theme.primary : theme.border,
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
                        borderColor:
                          state.mushafViewMode === 'page' ? theme.primary : theme.border,
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
                    title: copy.settingsLargeUi,
                    sub: copy.settingsLargeUiSub,
                    active: state.largeUiMode,
                    onToggle: () => void setLargeUiMode(!state.largeUiMode),
                  },
                  {
                    title: 'عرض التفسير الميسّر',
                    sub: 'إظهار شرح الآية بالعربية أثناء الحفظ',
                    active: state.showTranslation,
                    onToggle: () => void setShowTranslation(!state.showTranslation),
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
                  <MillaSwitch
                    value={toggle.active}
                    onValueChange={toggle.onToggle}
                    accessibilityLabel={toggle.title}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sheet: Backup & Cloud Sync */}
      <Modal
        visible={activeSheet === 'backup'}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveSheet(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.modalTitle, { color: theme.foreground }]}>
                {copy.settingsBackupTitle}
              </Text>
              <Pressable
                onPress={() => setActiveSheet(null)}
                style={styles.modalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="إغلاق"
              >
                <Ionicons name="close" size={22} color={theme.foreground} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetScroll}
            >
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
                <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.keyLbl, { color: theme.mutedForeground }]}>
                    مفتاح النسخ الاحتياطي الخاص بك
                  </Text>
                  <Pressable
                    onPress={() => void handleShareSyncKey()}
                    style={[
                      styles.chipBtn,
                      { borderColor: theme.border, backgroundColor: theme.secondary },
                    ]}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.chipText, { color: theme.foreground }]}>حفظ / مشاركة</Text>
                  </Pressable>
                </View>
                <Text
                  selectable
                  style={[
                    styles.keyVal,
                    {
                      color: theme.isDark ? theme.foreground : theme.primary,
                      textAlign: isRtl ? 'right' : 'left',
                    },
                  ]}
                >
                  {state.syncKey}
                </Text>
                <Text
                  style={[
                    styles.keyLbl,
                    { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left' },
                  ]}
                >
                  {state.lastSyncedAt
                    ? `آخر نسخة محفوظة: ${state.lastSyncedAt.slice(0, 10)}`
                    : 'محلي فقط — لم تُحفظ نسخة سحابية بعد'}
                </Text>
              </View>

              <Pressable
                onPress={() => void handleSync()}
                disabled={isSyncing}
                style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                  {isSyncing ? 'جارٍ الحفظ...' : 'حفظ نسخة احتياطية الآن'}
                </Text>
              </Pressable>

              <View
                style={[
                  styles.keyBox,
                  { borderColor: theme.border, backgroundColor: theme.background, gap: 10 },
                ]}
              >
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
                  ]}
                >
                  استرجاع من جهاز آخر
                </Text>
                <TextInput
                  value={keyInput}
                  onChangeText={setKeyInput}
                  placeholder="أدخل مفتاح النسخ الاحتياطي"
                  placeholderTextColor={theme.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.input,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.card,
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
                  <Text style={[styles.secondaryBtnText, { color: theme.foreground }]}>
                    استرجاع التقدم
                  </Text>
                </Pressable>
              </View>

              {syncError ? (
                <Text style={[styles.errorText, { color: theme.destructive }]}>{syncError}</Text>
              ) : null}

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
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sheet: Feedback & Bug Report */}
      <Modal
        visible={activeSheet === 'feedback'}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveSheet(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.modalTitle, { color: theme.foreground }]}>
                ملاحظاتك والإبلاغ عن خطأ
              </Text>
              <Pressable
                onPress={() => setActiveSheet(null)}
                style={styles.modalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="إغلاق"
              >
                <Ionicons name="close" size={22} color={theme.foreground} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetScroll}
              keyboardShouldPersistTaps="handled"
            >
              {feedbackSent ? (
                <View style={[styles.keyBox, { borderColor: theme.border, backgroundColor: theme.background, gap: 10, alignItems: 'center' }]}>
                  <Ionicons name="checkmark-circle" size={38} color={theme.primary} />
                  <Text style={[styles.modalTitle, { color: theme.foreground, textAlign: 'center' }]}>
                    تم إرسال رسالتك بنجاح
                  </Text>
                  <Text style={[styles.settingSub, { color: theme.mutedForeground, textAlign: 'center' }]}>
                    شكراً لمساهمتك في تحسين المِلّة، سنراجع رسالتك بعناية.
                  </Text>
                  <Pressable
                    onPress={() => setActiveSheet(null)}
                    style={[styles.primaryBtn, { backgroundColor: theme.primary, width: '100%', marginTop: 4 }]}
                  >
                    <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                      حسناً
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.fieldGap}>
                    <Text style={[styles.fieldLabel, { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' }]}>
                      نوع الرسالة
                    </Text>
                    <View style={[styles.chipsRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                      {(
                        [
                          { id: 'bug', label: 'الإبلاغ عن خطأ', icon: 'bug-outline' },
                          { id: 'feedback', label: 'ملاحظة أو اقتراح', icon: 'sparkles-outline' },
                        ] as const
                      ).map((opt) => {
                        const active = feedbackType === opt.id;
                        return (
                          <Pressable
                            key={opt.id}
                            onPress={() => setFeedbackType(opt.id)}
                            style={[
                              styles.chipBtn,
                              {
                                flex: 1,
                                flexDirection: isRtl ? 'row-reverse' : 'row',
                                gap: 6,
                                borderColor: active ? theme.primary : theme.border,
                                backgroundColor: active ? theme.primary : theme.background,
                              },
                            ]}
                          >
                            <Ionicons
                              name={opt.icon}
                              size={15}
                              color={active ? theme.primaryForeground : theme.foreground}
                            />
                            <Text
                              style={[
                                styles.chipText,
                                { color: active ? theme.primaryForeground : theme.foreground },
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.fieldGap}>
                    <Text style={[styles.fieldLabel, { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' }]}>
                      القسم المتعلق (اختياري)
                    </Text>
                    <View style={[styles.chipsRow, { flexDirection: isRtl ? 'row-reverse' : 'row', flexWrap: 'wrap' }]}>
                      {FEEDBACK_AREAS.map((area) => {
                        const active = feedbackArea === area;
                        return (
                          <Pressable
                            key={area}
                            onPress={() => setFeedbackArea(area)}
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
                              {area}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.fieldGap}>
                    <Text style={[styles.fieldLabel, { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' }]}>
                      التفاصيل
                    </Text>
                    <TextInput
                      value={feedbackMessage}
                      onChangeText={setFeedbackMessage}
                      placeholder={
                        feedbackType === 'bug'
                          ? 'صف المشكلة التي واجهتك باختصار...'
                          : 'اكتب ملاحظتك أو اقتراحك هنا...'
                      }
                      placeholderTextColor={theme.mutedForeground}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      style={[
                        styles.input,
                        {
                          minHeight: 100,
                          paddingTop: 10,
                          paddingBottom: 10,
                          borderColor: theme.border,
                          backgroundColor: theme.background,
                          color: theme.foreground,
                          textAlign: isRtl ? 'right' : 'left',
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.fieldGap}>
                    <Text style={[styles.fieldLabel, { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' }]}>
                      وسيلة تواصل (اختياري)
                    </Text>
                    <TextInput
                      value={feedbackContact}
                      onChangeText={setFeedbackContact}
                      placeholder="بريد إلكتروني أو رقم هاتف للرد عليك"
                      placeholderTextColor={theme.mutedForeground}
                      autoCapitalize="none"
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
                  </View>

                  {feedbackError ? (
                    <Text style={[styles.errorText, { color: theme.destructive }]}>{feedbackError}</Text>
                  ) : null}

                  <Pressable
                    onPress={() => void handleSubmitFeedback()}
                    disabled={feedbackSubmitting}
                    style={[
                      styles.primaryBtn,
                      {
                        backgroundColor: theme.primary,
                        opacity: feedbackSubmitting ? 0.7 : 1,
                        flexDirection: isRtl ? 'row-reverse' : 'row',
                        gap: 8,
                      },
                    ]}
                    accessibilityRole="button"
                  >
                    {feedbackSubmitting ? (
                      <ActivityIndicator size="small" color={theme.primaryForeground} />
                    ) : (
                      <Ionicons name="send-outline" size={16} color={theme.primaryForeground} />
                    )}
                    <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                      {feedbackSubmitting ? 'جارٍ الإرسال...' : 'إرسال'}
                    </Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stack: { gap: SPACING.lg },
  headerBlock: { gap: 4 },
  pageTitle: { fontSize: 24, fontWeight: '700' },
  pageSubtitle: { fontSize: 13, lineHeight: 20 },
  statusBox: { borderRadius: RADII.control, borderWidth: 1, padding: 12 },
  statusText: { fontSize: 12, textAlign: 'center', fontWeight: '600' },
  heroWrap: {
    borderRadius: RADII.hero,
    overflow: 'hidden',
  },
  heroBg: {
    width: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  heroCard: {
    padding: SPACING.xl,
    gap: 14,
  },
  heroPill: {
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroPillText: { fontSize: 11, fontWeight: '700' },
  heroGlassPill: {
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroGlassText: { fontSize: 12, fontWeight: '700' },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#ffffff' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.88)' },
  heroProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  heroStatsGrid: { gap: 8, marginTop: 2 },
  heroStatTile: {
    flex: 1,
    borderRadius: RADII.control,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  heroStatVal: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  heroStatLbl: { fontSize: 10, color: 'rgba(255,255,255,0.82)', textAlign: 'center' },
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  divider: { height: 1 },
  rowBetween: { alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  titleGroup: { alignItems: 'center', gap: 8 },
  settingTitle: { fontSize: 14, fontWeight: '700' },
  settingSub: { fontSize: 11, lineHeight: 16 },
  menuCard: {
    position: 'relative',
    borderRadius: RADII.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    minHeight: 62,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 12,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '85%',
    borderTopLeftRadius: RADII.hero,
    borderTopRightRadius: RADII.hero,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalCloseBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: { gap: SPACING.lg, paddingBottom: 24 },
  sheetFooter: {
    borderTopWidth: 1,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  footerBtn: {
    flex: 1,
  },
  fieldGap: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  chipsRow: { flexDirection: 'row', gap: 6 },
  chipBtn: {
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepSign: { fontSize: 18, fontWeight: '700' },
  stepVal: { minWidth: 32, textAlign: 'center', fontSize: 15, fontWeight: '700' },
  previewBox: { borderRadius: RADII.control, padding: SPACING.md },
  keyBox: { borderRadius: RADII.control, borderWidth: 1, padding: 12, gap: 4 },
  keyLbl: { fontSize: 11 },
  keyVal: { fontSize: 13, fontWeight: '700' },
  primaryBtn: {
    minHeight: 46,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '700' },
  input: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  secondaryBtn: {
    minHeight: 44,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '700' },
  errorText: { fontSize: 12, textAlign: 'center' },
  noteBox: { borderRadius: RADII.control, padding: 12 },
  noteText: { fontSize: 11, lineHeight: 17 },
});
