import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  MILLA_COPY,
  SURAHS,
  formatNum,
  getSurahById,
  toArabicDigits,
  type AyahEntry,
  type MushafPageAyah,
} from '@al-milla/core';
import { AppShell } from '../src/components/milla/AppShell';
import { AudioPlayerBar } from '../src/components/milla/AudioPlayerBar';
import { MillaPicker } from '../src/components/milla/MillaPicker';
import { useMilla } from '../src/context/MillaContext';
import { loadMushafPage, loadVerifiedSurahAyahs } from '../src/services/quran';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '../src/theme/tokens';

interface ActiveVerseTarget {
  surahId: number;
  surahNameAr: string;
  ayahNumber: number;
  textAr: string;
  translationEn?: string;
  translationFr?: string;
}

export default function MushafScreen() {
  const router = useRouter();
  const {
    state,
    theme,
    setCursor,
    setMushafViewMode,
    setCurrentMushafPage,
    setQuranFontSize,
    toggleBookmark,
  } = useMilla();

  const language = state?.language ?? 'ar';
  const copy = MILLA_COPY[language];
  const isRtl = language === 'ar';
  const currentSurahId = state?.currentSurahId ?? 18;
  const mushafViewMode = state?.mushafViewMode ?? 'verses';
  const currentMushafPage = state?.currentMushafPage ?? 1;
  const quranFontSize = state?.quranFontSize ?? 26;
  const bookmarks = state?.bookmarks ?? [];

  const surah = getSurahById(currentSurahId);
  const [ayahs, setAyahs] = useState<AyahEntry[]>(surah.ayahs);
  const [pageAyahs, setPageAyahs] = useState<MushafPageAyah[]>([]);
  const [loading, setLoading] = useState(false);
  const [cachedOffline, setCachedOffline] = useState(surah.ayahs.length === surah.totalAyahs);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pageInput, setPageInput] = useState(String(currentMushafPage));
  const [verseMenuTarget, setVerseMenuTarget] = useState<ActiveVerseTarget | null>(null);
  const [showVerseTranslation, setShowVerseTranslation] = useState(false);
  const [loadingTranslation, setLoadingTranslation] = useState(false);

  useEffect(() => {
    setPageInput(String(currentMushafPage));
  }, [currentMushafPage]);

  useEffect(() => {
    if (mushafViewMode !== 'verses') return;
    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);
    void loadVerifiedSurahAyahs(currentSurahId).then((res) => {
      if (cancelled) return;
      if (res.ayahs.length > 0) {
        setAyahs(res.ayahs);
        setCachedOffline(true);
      }
      setErrorMsg(res.error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [currentSurahId, mushafViewMode]);

  useEffect(() => {
    if (mushafViewMode !== 'page') return;
    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);
    void loadMushafPage(currentMushafPage).then((res) => {
      if (cancelled) return;
      if (res.ayahs.length > 0) {
        setPageAyahs(res.ayahs);
        setCachedOffline(true);
      }
      setErrorMsg(res.error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [currentMushafPage, mushafViewMode]);

  if (!state) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const openVerseMenu = (target: ActiveVerseTarget) => {
    setShowVerseTranslation(false);
    setVerseMenuTarget(target);
  };

  const handleToggleTranslationInModal = async () => {
    if (!verseMenuTarget) return;
    if (showVerseTranslation) {
      setShowVerseTranslation(false);
      return;
    }
    if (verseMenuTarget.translationEn || verseMenuTarget.translationFr) {
      setShowVerseTranslation(true);
      return;
    }
    setLoadingTranslation(true);
    const res = await loadVerifiedSurahAyahs(verseMenuTarget.surahId);
    const matched = res.ayahs.find((a) => a.number === verseMenuTarget.ayahNumber);
    setVerseMenuTarget((prev) =>
      prev
        ? {
            ...prev,
            translationEn: matched?.translationEn ?? 'Translation unavailable offline.',
            translationFr: matched?.translationFr ?? 'Traduction indisponible hors ligne.',
          }
        : null,
    );
    setLoadingTranslation(false);
    setShowVerseTranslation(true);
  };

  const pageJuz = pageAyahs[0]?.juz ?? surah.juz;
  const pageHeaderSurah = pageAyahs[0]?.surahNameAr ?? surah.nameAr;
  const isTargetBookmarked = verseMenuTarget
    ? bookmarks.includes(`${verseMenuTarget.surahId}:${verseMenuTarget.ayahNumber}`)
    : false;

  return (
    <AppShell
      title="المصحف الشريف"
      subtitle={
        mushafViewMode === 'page'
          ? `صفحة ${toArabicDigits(currentMushafPage)} من ٦٠٤ • الجزء ${toArabicDigits(pageJuz)}`
          : `صفحة ${surah.pageStart} • الحزب ${surah.hizb}`
      }
    >
      <View style={styles.stack}>
        {/* Toolbar */}
        <View
          style={[
            styles.toolbar,
            {
              flexDirection: isRtl ? 'row-reverse' : 'row',
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.pickerWrap}>
            <MillaPicker
              searchable
              value={String(surah.id)}
              onChange={(val) => void setCursor(Number(val), 1)}
              title="اختر السورة من المصحف"
              ariaLabel="اختر السورة"
              iconName="book-outline"
              options={SURAHS.map((s) => ({
                value: String(s.id),
                label: `${toArabicDigits(s.id)}. ${s.nameAr}`,
                description: `${toArabicDigits(s.totalAyahs)} آية • ${s.revelationTypeAr} • صفحة ${toArabicDigits(s.pageStart)}`,
                keywords: `${s.nameEn} ${s.nameFr}`,
              }))}
            />
          </View>

          <Pressable
            onPress={() => setSettingsOpen(true)}
            style={[
              styles.displayBtn,
              {
                flexDirection: isRtl ? 'row-reverse' : 'row',
                borderColor: settingsOpen ? theme.primary : theme.border,
                backgroundColor: settingsOpen ? theme.secondary : theme.background,
              },
            ]}
            accessibilityRole="button"
          >
            <Ionicons name="options-outline" size={16} color={theme.primary} />
            <Text style={[styles.displayBtnText, { color: theme.foreground }]}>
              {language === 'en' ? 'Display' : language === 'fr' ? 'Affichage' : 'العرض'}
            </Text>
          </Pressable>
        </View>

        {/* Reading Surface */}
        {mushafViewMode === 'page' ? (
          <View
            style={[
              styles.surfaceCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View
              style={[
                styles.pageHeader,
                {
                  borderBottomColor: theme.border,
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                },
              ]}
            >
              <Text style={[styles.pageHeaderTitle, { color: theme.mutedForeground }]}>
                {pageHeaderSurah}
              </Text>
              <View style={[styles.juzPill, { backgroundColor: theme.secondary }]}>
                <Text style={[styles.juzText, { color: theme.primary }]}>
                  الجزء {toArabicDigits(pageJuz)}
                </Text>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.mutedForeground }]}>
                  جاري تحميل صفحة {toArabicDigits(currentMushafPage)} من المصحف الشريف...
                </Text>
              </View>
            ) : pageAyahs.length > 0 ? (
              <View style={styles.pageContent}>
                {pageAyahs.map((item, index) => {
                  const prev = index > 0 ? pageAyahs[index - 1] : undefined;
                  const isNewSurahOnPage =
                    item.ayahNumber === 1 && (!prev || prev.surahId !== item.surahId);
                  const bookmarked = bookmarks.includes(`${item.surahId}:${item.ayahNumber}`);
                  const target: ActiveVerseTarget = {
                    surahId: item.surahId,
                    surahNameAr: item.surahNameAr,
                    ayahNumber: item.ayahNumber,
                    textAr: item.textAr,
                  };

                  return (
                    <View key={`${item.surahId}:${item.ayahNumber}`}>
                      {isNewSurahOnPage ? (
                        <View
                          style={[
                            styles.surahBanner,
                            { borderColor: theme.border, backgroundColor: theme.secondary },
                          ]}
                        >
                          <Text style={[styles.surahBannerTitle, { color: theme.primary }]}>
                            {item.surahNameAr}
                          </Text>
                          {item.surahId !== 1 && item.surahId !== 9 ? (
                            <Text style={[styles.basmalahText, { color: theme.foreground }]}>
                              بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
                            </Text>
                          ) : null}
                        </View>
                      ) : null}

                      <Pressable
                        onPress={() => openVerseMenu(target)}
                        style={[
                          styles.verseRow,
                          bookmarked
                            ? { backgroundColor: `${theme.accent}25`, borderColor: theme.accent }
                            : { borderColor: 'transparent' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.quranText,
                            {
                              color: theme.foreground,
                              fontSize: quranFontSize,
                              lineHeight: Math.round(quranFontSize * 1.9),
                            },
                          ]}
                        >
                          {item.textAr}{' '}
                          <Text style={{ color: theme.primary }}>
                            ﴿{toArabicDigits(item.ayahNumber)}﴾
                          </Text>
                          {bookmarked ? ' 🔖' : ''}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}

                <View
                  style={[
                    styles.pageFooter,
                    { borderTopColor: theme.border, flexDirection: 'row-reverse' },
                  ]}
                >
                  <Pressable
                    disabled={currentMushafPage <= 1}
                    onPress={() => void setCurrentMushafPage(currentMushafPage - 1)}
                    style={[
                      styles.pageNavBtn,
                      {
                        borderColor: theme.border,
                        backgroundColor: theme.background,
                        opacity: currentMushafPage <= 1 ? 0.4 : 1,
                      },
                    ]}
                  >
                    <Ionicons name="arrow-forward" size={16} color={theme.foreground} />
                    <Text style={[styles.pageNavText, { color: theme.foreground }]}>
                      الصفحة السابقة
                    </Text>
                  </Pressable>

                  <Text style={[styles.pageCounter, { color: theme.primary }]}>
                    {toArabicDigits(currentMushafPage)} / ٦٠٤
                  </Text>

                  <Pressable
                    disabled={currentMushafPage >= 604}
                    onPress={() => void setCurrentMushafPage(currentMushafPage + 1)}
                    style={[
                      styles.pageNavBtn,
                      {
                        borderColor: theme.border,
                        backgroundColor: theme.background,
                        opacity: currentMushafPage >= 604 ? 0.4 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.pageNavText, { color: theme.foreground }]}>
                      الصفحة التالية
                    </Text>
                    <Ionicons name="arrow-back" size={16} color={theme.foreground} />
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={[styles.errorBox, { backgroundColor: theme.muted }]}>
                <Text style={[styles.loadingText, { color: theme.mutedForeground }]}>
                  {errorMsg ?? 'تعذّر تحميل صفحة المصحف حالياً. يرجى التحقق من الاتصال بالإنترنت.'}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View
            style={[
              styles.surfaceCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View
              style={[
                styles.surahBanner,
                { borderColor: theme.border, backgroundColor: theme.secondary },
              ]}
            >
              <Text style={[styles.surahBannerTitle, { color: theme.primary }]}>
                {surah.nameAr}
              </Text>
              <Text style={[styles.surahBannerMeta, { color: theme.mutedForeground }]}>
                آياتها {toArabicDigits(surah.totalAyahs)} • {surah.revelationTypeAr} • الجزء{' '}
                {toArabicDigits(surah.juz)}
              </Text>
            </View>

            {surah.id !== 1 && surah.id !== 9 ? (
              <Text style={[styles.basmalahText, { color: theme.foreground }]}>
                بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
              </Text>
            ) : null}

            {loading && ayahs.length === 0 ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.mutedForeground }]}>
                  جاري تحميل نص {surah.nameAr} الموثّق وحفظه للاستخدام دون اتصال...
                </Text>
              </View>
            ) : ayahs.length > 0 ? (
              <View style={styles.versesList}>
                {ayahs.map((ayah) => {
                  const bookmarked = bookmarks.includes(`${surah.id}:${ayah.number}`);
                  const target: ActiveVerseTarget = {
                    surahId: surah.id,
                    surahNameAr: surah.nameAr,
                    ayahNumber: ayah.number,
                    textAr: ayah.textAr,
                    translationEn: ayah.translationEn,
                    translationFr: ayah.translationFr,
                  };
                  return (
                    <Pressable
                      key={ayah.number}
                      onPress={() => openVerseMenu(target)}
                      style={[
                        styles.verseRow,
                        bookmarked
                          ? { backgroundColor: `${theme.accent}25`, borderColor: theme.accent }
                          : { borderColor: 'transparent' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.quranText,
                          {
                            color: theme.foreground,
                            fontSize: quranFontSize,
                            lineHeight: Math.round(quranFontSize * 1.9),
                          },
                        ]}
                      >
                        {ayah.textAr}{' '}
                        <Text style={{ color: theme.primary }}>
                          ﴿{toArabicDigits(ayah.number)}﴾
                        </Text>
                        {bookmarked ? ' 🔖' : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={[styles.errorBox, { backgroundColor: theme.muted }]}>
                <Text style={[styles.loadingText, { color: theme.mutedForeground }]}>
                  {errorMsg ?? 'تعذّر تحميل السورة حالياً. يرجى التحقق من الاتصال بالإنترنت.'}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Display Settings Modal */}
      <Modal
        visible={settingsOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setSettingsOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSettingsOpen(false)}>
          <Pressable
            style={[
              styles.displayModal,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            onPress={() => undefined}
          >
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: theme.border, flexDirection: isRtl ? 'row-reverse' : 'row' },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.foreground }]}>
                {language === 'en'
                  ? 'Mushaf Settings'
                  : language === 'fr'
                    ? 'Paramètres du Mushaf'
                    : 'إعدادات المصحف'}
              </Text>
              <Pressable onPress={() => setSettingsOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={theme.foreground} />
              </Pressable>
            </View>

            <View style={styles.modalSection}>
              <Text
                style={[
                  styles.modalLabel,
                  { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left' },
                ]}
              >
                {language === 'en'
                  ? 'Reading mode'
                  : language === 'fr'
                    ? 'Mode de lecture'
                    : 'وضع القراءة'}
              </Text>
              <View style={styles.modeGrid}>
                <Pressable
                  onPress={() => void setMushafViewMode('verses')}
                  style={[
                    styles.modeOptionBtn,
                    {
                      borderColor: mushafViewMode === 'verses' ? theme.primary : theme.border,
                      backgroundColor:
                        mushafViewMode === 'verses' ? theme.primary : theme.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.modeOptionText,
                      {
                        color:
                          mushafViewMode === 'verses'
                            ? theme.primaryForeground
                            : theme.foreground,
                      },
                    ]}
                  >
                    {language === 'en' ? 'Verses' : language === 'fr' ? 'Versets' : 'الآيات'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void setMushafViewMode('page')}
                  style={[
                    styles.modeOptionBtn,
                    {
                      borderColor: mushafViewMode === 'page' ? theme.primary : theme.border,
                      backgroundColor: mushafViewMode === 'page' ? theme.primary : theme.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.modeOptionText,
                      {
                        color:
                          mushafViewMode === 'page' ? theme.primaryForeground : theme.foreground,
                      },
                    ]}
                  >
                    {language === 'en'
                      ? 'Pages (1-604)'
                      : language === 'fr'
                        ? 'Pages (1-604)'
                        : 'الصفحات (١-٦٠٤)'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {mushafViewMode === 'page' ? (
              <View
                style={[
                  styles.settingRow,
                  { flexDirection: isRtl ? 'row-reverse' : 'row' },
                ]}
              >
                <Text style={[styles.settingLabel, { color: theme.foreground }]}>
                  {language === 'en'
                    ? 'Go to page'
                    : language === 'fr'
                      ? 'Aller à la page'
                      : 'الانتقال إلى صفحة'}
                </Text>
                <TextInput
                  value={pageInput}
                  onChangeText={(val) => {
                    setPageInput(val);
                    const num = Number.parseInt(val, 10);
                    if (Number.isFinite(num) && num >= 1 && num <= 604) {
                      void setCurrentMushafPage(num);
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={3}
                  style={[
                    styles.pageInput,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                      color: theme.foreground,
                    },
                  ]}
                />
              </View>
            ) : null}

            <View
              style={[
                styles.settingRow,
                { flexDirection: isRtl ? 'row-reverse' : 'row' },
              ]}
            >
              <Text style={[styles.settingLabel, { color: theme.foreground }]}>
                {language === 'en'
                  ? 'Quran text size'
                  : language === 'fr'
                    ? 'Taille du texte'
                    : 'حجم خط المصحف'}
              </Text>
              <View style={styles.stepperRow}>
                <Pressable
                  onPress={() => void setQuranFontSize(quranFontSize - 2)}
                  style={[
                    styles.stepBtn,
                    { borderColor: theme.border, backgroundColor: theme.background },
                  ]}
                >
                  <Ionicons name="remove" size={16} color={theme.foreground} />
                </Pressable>
                <Text style={[styles.stepVal, { color: theme.mutedForeground }]}>
                  {formatNum(quranFontSize, language)}
                </Text>
                <Pressable
                  onPress={() => void setQuranFontSize(quranFontSize + 2)}
                  style={[
                    styles.stepBtn,
                    { borderColor: theme.border, backgroundColor: theme.background },
                  ]}
                >
                  <Ionicons name="add" size={16} color={theme.foreground} />
                </Pressable>
              </View>
            </View>

            <View style={[styles.badgesFooter, { borderTopColor: theme.border }]}>
              <View style={styles.badgesWrap}>
                {cachedOffline ? (
                  <View style={[styles.pill, { backgroundColor: theme.secondary }]}>
                    <Text style={[styles.pillText, { color: theme.primary }]}>
                      {copy.mushafCachedText}
                    </Text>
                  </View>
                ) : null}
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
              <Text
                style={[
                  styles.tapHint,
                  { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left' },
                ]}
              >
                {copy.mushafTapHint}
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Verse Action Sheet Modal */}
      <Modal
        visible={verseMenuTarget !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setVerseMenuTarget(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setVerseMenuTarget(null)}>
          <Pressable
            style={[
              styles.verseSheet,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            onPress={() => undefined}
          >
            {verseMenuTarget ? (
              <ScrollView contentContainerStyle={styles.sheetContent}>
                <View
                  style={[
                    styles.modalHeader,
                    {
                      borderBottomColor: theme.border,
                      flexDirection: isRtl ? 'row-reverse' : 'row',
                    },
                  ]}
                >
                  <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                    <Text style={[styles.sheetTitle, { color: theme.primary }]}>
                      {verseMenuTarget.surahNameAr} • الآية{' '}
                      {toArabicDigits(verseMenuTarget.ayahNumber)}
                    </Text>
                    <Text style={[styles.sheetSub, { color: theme.mutedForeground }]}>
                      خيارات الآية المحددة
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setVerseMenuTarget(null)}
                    style={[
                      styles.closeBtn,
                      { borderColor: theme.border, backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons name="close" size={20} color={theme.foreground} />
                  </Pressable>
                </View>

                <View style={[styles.previewBox, { backgroundColor: theme.secondary }]}>
                  <Text style={[styles.previewArabic, { color: theme.foreground }]}>
                    {verseMenuTarget.textAr}
                  </Text>
                </View>

                <AudioPlayerBar
                  surahId={verseMenuTarget.surahId}
                  surahName={verseMenuTarget.surahNameAr}
                  ayahNumber={verseMenuTarget.ayahNumber}
                />

                <View style={styles.sheetGrid}>
                  <Pressable
                    onPress={() => void handleToggleTranslationInModal()}
                    style={[
                      styles.sheetActionBtn,
                      {
                        borderColor: showVerseTranslation ? theme.primary : theme.border,
                        backgroundColor: showVerseTranslation ? theme.primary : theme.background,
                      },
                    ]}
                  >
                    <Ionicons
                      name="book-outline"
                      size={16}
                      color={showVerseTranslation ? theme.primaryForeground : theme.foreground}
                    />
                    <Text
                      style={[
                        styles.sheetActionText,
                        {
                          color: showVerseTranslation
                            ? theme.primaryForeground
                            : theme.foreground,
                        },
                      ]}
                    >
                      {showVerseTranslation ? 'إخفاء الترجمة' : 'ترجمة الآية'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      void toggleBookmark(verseMenuTarget.surahId, verseMenuTarget.ayahNumber)
                    }
                    style={[
                      styles.sheetActionBtn,
                      {
                        borderColor: isTargetBookmarked ? theme.accent : theme.border,
                        backgroundColor: isTargetBookmarked
                          ? `${theme.accent}33`
                          : theme.background,
                      },
                    ]}
                  >
                    <Ionicons
                      name={isTargetBookmarked ? 'bookmark' : 'bookmark-outline'}
                      size={16}
                      color={theme.foreground}
                    />
                    <Text style={[styles.sheetActionText, { color: theme.foreground }]}>
                      {isTargetBookmarked ? 'إزالة العلامة' : 'وضع علامة'}
                    </Text>
                  </Pressable>
                </View>

                {loadingTranslation ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : null}

                {showVerseTranslation && !loadingTranslation ? (
                  <View
                    style={[
                      styles.translationBox,
                      { borderColor: theme.border, backgroundColor: theme.muted },
                    ]}
                  >
                    <Text style={[styles.translationText, { color: theme.foreground }]}>
                      {language === 'fr'
                        ? verseMenuTarget.translationFr
                        : verseMenuTarget.translationEn}
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  onPress={() => {
                    void setCursor(verseMenuTarget.surahId, verseMenuTarget.ayahNumber);
                    setVerseMenuTarget(null);
                    router.push('/memorize');
                  }}
                  style={[styles.memorizeCta, { backgroundColor: theme.primary }]}
                >
                  <Ionicons name="sparkles-outline" size={16} color={theme.primaryForeground} />
                  <Text style={[styles.memorizeCtaText, { color: theme.primaryForeground }]}>
                    حفظ هذه الآية
                  </Text>
                </Pressable>
              </ScrollView>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stack: { gap: SPACING.lg },
  toolbar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: 10,
  },
  pickerWrap: { flex: 1 },
  displayBtn: {
    minHeight: 48,
    alignItems: 'center',
    gap: 6,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  displayBtnText: { fontSize: 12, fontWeight: '700' },
  surfaceCard: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  pageHeader: {
    borderBottomWidth: 1,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageHeaderTitle: { fontSize: 12, fontWeight: '600' },
  juzPill: { borderRadius: RADII.pill, paddingHorizontal: 10, paddingVertical: 4 },
  juzText: { fontSize: 12, fontWeight: '600' },
  loadingBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 10 },
  loadingText: { fontSize: 13, textAlign: 'center' },
  errorBox: { borderRadius: RADII.control, padding: SPACING.xl },
  pageContent: { gap: 8 },
  versesList: { gap: 8 },
  surahBanner: {
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginVertical: 4,
  },
  surahBannerTitle: { fontSize: 22, fontWeight: '700' },
  surahBannerMeta: { fontSize: 12, marginTop: 2 },
  basmalahText: {
    fontSize: 20,
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingVertical: 6,
  },
  verseRow: {
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  quranText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  pageFooter: {
    marginTop: 12,
    borderTopWidth: 1,
    paddingTop: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageNavBtn: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  pageNavText: { fontSize: 12, fontWeight: '700' },
  pageCounter: { fontSize: 14, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  displayModal: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  modalHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  closeBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSection: { gap: 8 },
  modalLabel: { fontSize: 12, fontWeight: '700' },
  modeGrid: { flexDirection: 'row-reverse', gap: 8 },
  modeOptionBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  modeOptionText: { fontSize: 12, fontWeight: '700' },
  settingRow: { alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  settingLabel: { fontSize: 13, fontWeight: '600' },
  pageInput: {
    width: 80,
    height: 44,
    borderRadius: RADII.control,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
  },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepVal: { minWidth: 34, textAlign: 'center', fontSize: 13, fontWeight: '700' },
  badgesFooter: { borderTopWidth: 1, paddingTop: 12, gap: 8 },
  badgesWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  pill: { borderRadius: RADII.pill, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 11, fontWeight: '600' },
  tapHint: { fontSize: 11, lineHeight: 18 },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  verseSheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
  },
  sheetContent: { padding: SPACING.lg, gap: 12 },
  sheetTitle: { fontSize: 16, fontWeight: '700' },
  sheetSub: { fontSize: 12 },
  previewBox: { borderRadius: RADII.control, padding: 14 },
  previewArabic: {
    fontSize: 22,
    lineHeight: 42,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  sheetGrid: { flexDirection: 'row-reverse', gap: 8 },
  sheetActionBtn: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  sheetActionText: { fontSize: 12, fontWeight: '700' },
  translationBox: { borderRadius: RADII.control, borderWidth: 1, padding: 14 },
  translationText: { fontSize: 14, lineHeight: 22, textAlign: 'left' },
  memorizeCta: {
    minHeight: 48,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADII.control,
    paddingHorizontal: 16,
  },
  memorizeCtaText: { fontSize: 14, fontWeight: '700' },
});
