import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  MILLA_COPY,
  RECITERS,
  formatDigitsInText,
  formatNum,
  type ReciterId,
} from '@al-milla/core';
import { useMilla } from '../../context/MillaContext';
import type { PlaybackSpeed } from '../../db/database';
import { createAyahAudioController } from '../../services/audio';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '../../theme/tokens';
import { MillaPicker } from './MillaPicker';
import { MillaSwitch } from './MillaSwitch';
import { QuranText } from './QuranText';

const DAILY_PRESETS = [3, 4, 5] as const;
const DIFFICULTY_PRESETS = [
  { value: 3, labelAr: 'سريع', labelEn: 'Fast', labelFr: 'Rapide' },
  { value: 5, labelAr: 'متوازن', labelEn: 'Balanced', labelFr: 'Équilibré' },
  { value: 7, labelAr: 'تدريجي', labelEn: 'Gradual', labelFr: 'Progressif' },
] as const;
const SPEED_OPTIONS: PlaybackSpeed[] = [0.75, 1.0, 1.25];

/**
 * Top-corner Info + Settings icon buttons that open clean modals
 * for memorization notes and preferences without cluttering learning screens.
 */
export function MemorizeCornerActions() {
  const { state, theme } = useMilla();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const isRtl = (state?.language ?? 'ar') === 'ar';

  return (
    <>
      <View style={[styles.cornerRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
        <Pressable
          onPress={() => setInfoOpen(true)}
          style={[
            styles.iconBtn,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel="دليل الحفظ"
        >
          <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
        </Pressable>

        <Pressable
          onPress={() => setSettingsOpen(true)}
          style={[
            styles.iconBtn,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel="إعدادات الحفظ"
        >
          <Ionicons name="settings-outline" size={20} color={theme.foreground} />
        </Pressable>
      </View>

      <MemorizeSettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <MemorizeInfoModal visible={infoOpen} onClose={() => setInfoOpen(false)} />
    </>
  );
}

interface ModalProps {
  visible: boolean;
  onClose: () => void;
}

export function MemorizeSettingsModal({ visible, onClose }: ModalProps) {
  const {
    state,
    theme,
    setDailyTarget,
    setMandatoryRepeats,
    setReciter,
    setPlaybackSpeed,
    setQuranFontSize,
    setShowTranslation,
  } = useMilla();

  const [draftTarget, setDraftTarget] = useState<number>(state?.dailyTarget ?? 3);
  const [draftRepeats, setDraftRepeats] = useState<number>(state?.mandatoryRepeats ?? 5);
  const [draftReciter, setDraftReciter] = useState<ReciterId>(state?.reciter ?? 'hudhaify');
  const [draftSpeed, setDraftSpeed] = useState<PlaybackSpeed>(state?.playbackSpeed ?? 1.0);
  const [draftFontSize, setDraftFontSize] = useState<number>(state?.quranFontSize ?? 26);
  const [draftTranslation, setDraftTranslation] = useState<boolean>(state?.showTranslation ?? false);

  const [previewingReciter, setPreviewingReciter] = useState<ReciterId | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewCtrlRef = useRef(createAyahAudioController());

  useEffect(() => {
    if (visible && state) {
      setDraftTarget(state.dailyTarget);
      setDraftRepeats(state.mandatoryRepeats);
      setDraftReciter(state.reciter);
      setDraftSpeed(state.playbackSpeed);
      setDraftFontSize(state.quranFontSize);
      setDraftTranslation(state.showTranslation);
      setPreviewError(null);
    } else if (!visible) {
      setPreviewingReciter(null);
      void previewCtrlRef.current.stop();
    }
  }, [visible, state]);

  useEffect(() => {
    const ctrl = previewCtrlRef.current;
    return () => {
      void ctrl.stop();
    };
  }, []);

  if (!state) return null;
  const language = state.language;
  const copy = MILLA_COPY[language];
  const isRtl = language === 'ar';

  const handleToggleReciterPreview = async (reciterId: ReciterId) => {
    setPreviewError(null);
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
  };

  const handleConfirm = async () => {
    await previewCtrlRef.current.stop();
    setPreviewingReciter(null);
    await setDailyTarget(draftTarget);
    await setMandatoryRepeats(draftRepeats);
    await setReciter(draftReciter);
    await setPlaybackSpeed(draftSpeed);
    await setQuranFontSize(draftFontSize);
    await setShowTranslation(draftTranslation);
    onClose();
  };

  const handleCancel = async () => {
    await previewCtrlRef.current.stop();
    setPreviewingReciter(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => void handleCancel()}
    >
      <SafeAreaView style={[styles.modalRoot, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View
          style={[
            styles.modalHeader,
            { borderBottomColor: theme.border, flexDirection: isRtl ? 'row-reverse' : 'row' },
          ]}
        >
          <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
            <Text style={[styles.modalTitle, { color: theme.foreground }]}>إعدادات الحفظ</Text>
            <Text style={[styles.modalSub, { color: theme.mutedForeground }]}>
              اضبط وردك والقارئ ثم احفظ التغييرات
            </Text>
          </View>
          <Pressable
            onPress={() => void handleCancel()}
            style={[styles.closeBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            accessibilityRole="button"
            accessibilityLabel="إغلاق"
          >
            <Ionicons name="close" size={20} color={theme.foreground} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.modalBody}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Daily Portion (3, 4, or 5 verse presets) */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
              <Text style={[styles.label, { color: theme.foreground }]}>ورد الحفظ اليومي</Text>
              <Text style={[styles.hintText, { color: theme.mutedForeground }]}>
                اختر عدد الآيات في كل جلسة (٣، ٤ أو ٥)
              </Text>
            </View>

            <View style={[styles.chipsRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              {DAILY_PRESETS.map((preset) => {
                const selected = draftTarget === preset;
                return (
                  <Pressable
                    key={preset}
                    onPress={() => setDraftTarget(preset)}
                    style={[
                      styles.chip,
                      {
                        borderColor: selected ? theme.primary : theme.border,
                        backgroundColor: selected ? theme.primary : theme.background,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: selected ? theme.primaryForeground : theme.foreground },
                      ]}
                    >
                      {formatNum(preset, language)} آيات
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 2. Memorization Difficulty / Pace */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
              <Text style={[styles.label, { color: theme.foreground }]}>مستوى صعوبة الحفظ</Text>
              <Text style={[styles.hintText, { color: theme.mutedForeground }]}>
                يتحكم في سرعة تدرّج الإخفاء حسب سهولة الحفظ لديك
              </Text>
            </View>

            <View style={[styles.chipsRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              {DIFFICULTY_PRESETS.map((preset) => {
                const selected = draftRepeats === preset.value;
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
                      styles.chip,
                      {
                        borderColor: selected ? theme.primary : theme.border,
                        backgroundColor: selected ? theme.primary : theme.background,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: selected ? theme.primaryForeground : theme.foreground },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 3. Reciter Picker + Live Voice Preview + Playback Speed */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.label, { color: theme.foreground }]}>القارئ</Text>
              <Text style={[styles.hintText, { color: theme.mutedForeground }]}>
                {copy.hafsBadge}
              </Text>
            </View>

            {previewError ? (
              <Text style={[styles.errorText, { color: theme.destructive, textAlign: isRtl ? 'right' : 'left' }]}>
                {previewError}
              </Text>
            ) : null}

            <MillaPicker
              searchable
              fullWidth
              value={draftReciter}
              onChange={(val) => {
                setDraftReciter(val as ReciterId);
              }}
              previewingValue={previewingReciter}
              onPreviewOption={(val) => void handleToggleReciterPreview(val as ReciterId)}
              onClosePicker={() => {
                setPreviewingReciter(null);
                void previewCtrlRef.current.stop();
              }}
              title={copy.onboardingReciterPickerTitle}
              ariaLabel={copy.onboardingReciterPickerTitle}
              iconName="volume-high-outline"
              options={RECITERS.map((r) => ({
                value: r.id,
                label: language === 'ar' ? r.nameAr : r.nameEn,
                description: r.styleAr,
                keywords: `${r.nameAr} ${r.nameEn}`,
              }))}
            />

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <Text style={[styles.label, { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' }]}>
              سرعة التلاوة
            </Text>
            <View style={[styles.chipsRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              {SPEED_OPTIONS.map((spd) => {
                const selected = draftSpeed === spd;
                return (
                  <Pressable
                    key={spd}
                    onPress={() => setDraftSpeed(spd)}
                    style={[
                      styles.chip,
                      {
                        flex: 1,
                        borderColor: selected ? theme.primary : theme.border,
                        backgroundColor: selected ? theme.primary : theme.background,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: selected ? theme.primaryForeground : theme.foreground },
                      ]}
                    >
                      {formatDigitsInText(`${spd}×`, language)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 4. Quran Font Size + Live Preview + Translation */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.label, { color: theme.foreground }]}>حجم خط القرآن</Text>
              <View style={[styles.stepperPill, { borderColor: theme.border, backgroundColor: theme.background }]}>
                <Pressable
                  onPress={() => setDraftFontSize((s) => Math.max(18, s - 2))}
                  style={styles.stepperSideBtn}
                  accessibilityRole="button"
                  accessibilityLabel="تصغير خط القرآن"
                >
                  <Ionicons name="remove" size={18} color={theme.foreground} />
                </Pressable>
                <Text style={[styles.stepperValueText, { color: theme.primary }]}>
                  {formatNum(draftFontSize, language)}
                </Text>
                <Pressable
                  onPress={() => setDraftFontSize((s) => Math.min(36, s + 2))}
                  style={styles.stepperSideBtn}
                  accessibilityRole="button"
                  accessibilityLabel="تكبير خط القرآن"
                >
                  <Ionicons name="add" size={18} color={theme.foreground} />
                </Pressable>
              </View>
            </View>

            <View style={[styles.previewBox, { backgroundColor: theme.secondary }]}>
              <QuranText align="center" fontSize={draftFontSize}>
                بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
              </QuranText>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.label, { color: theme.foreground }]}>عرض التفسير الميسّر أثناء الحفظ</Text>
              <MillaSwitch
                value={draftTranslation}
                onValueChange={setDraftTranslation}
                accessibilityLabel="عرض التفسير الميسّر أثناء الحفظ"
              />
            </View>
          </View>
        </ScrollView>

        {/* Sticky Confirm / Cancel Footer */}
        <View
          style={[
            styles.modalFooter,
            {
              backgroundColor: theme.card,
              borderTopColor: theme.border,
              flexDirection: isRtl ? 'row-reverse' : 'row',
            },
          ]}
        >
          <Pressable
            onPress={() => void handleConfirm()}
            style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
            accessibilityRole="button"
          >
            <Ionicons name="checkmark" size={18} color={theme.primaryForeground} />
            <Text style={[styles.confirmBtnText, { color: theme.primaryForeground }]}>
              حفظ الإعدادات
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void handleCancel()}
            style={[styles.cancelBtn, { borderColor: theme.border, backgroundColor: theme.background }]}
            accessibilityRole="button"
          >
            <Text style={[styles.cancelBtnText, { color: theme.foreground }]}>إلغاء</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export function MemorizeInfoModal({ visible, onClose }: ModalProps) {
  const { state, theme } = useMilla();
  const language = state?.language ?? 'ar';
  const isRtl = language === 'ar';

  const modalTitle =
    language === 'en'
      ? 'Memorization Guide'
      : language === 'fr'
        ? 'Guide de mémorisation'
        : 'دليل الحفظ';

  const notes: { title: string; body: string }[] =
    language === 'en'
      ? [
          {
            title: '1. Guided Session Flow',
            body: 'Each session starts by reviewing earlier lessons in your active Surah, then learning today’s new verses, reciting from memory, and finally connecting them with preceding verses. On a Surah’s first session, only Memorize and Self-Test appear.',
          },
          {
            title: '2. Repetition & Smart Word Hiding',
            body: 'Tap the repeat button or play the audio; words hide gradually based on your chosen difficulty pace and verse length.',
          },
          {
            title: '3. How the Final Rating Works (One Rating per Lesson)',
            body: 'At the last step, one honest rating guides both your next memorization session and your Revision schedule:\n• Difficult (Learning): Your next session repeats these same verses before moving forward, and any verses you flag enter Gentle Care first.\n• Good (Strengthening): Moves forward to new verses and enters gradual-hiding review soon.\n• Easy (Mastered): Moves forward, marks the lesson as mastered, and spaces reviews further apart (1, 3, 7, 14, 30 sessions).',
          },
          {
            title: '4. Tajweed Note',
            body: 'Self-evaluation helps track your retention, and pairs best with reciting to a qualified teacher.',
          },
        ]
      : language === 'fr'
        ? [
            {
              title: '1. Parcours de la séance',
              body: 'Chaque séance commence par la révision des leçons précédentes de la sourate, puis l’apprentissage des nouveaux versets, l’auto-test de mémoire et enfin la liaison avec les versets précédents. Lors de la première séance d’une sourate, seules Mémorisation et Auto-test apparaissent.',
            },
            {
              title: '2. Répétition et masquage intelligent',
              body: 'Appuyez sur répéter ou écoutez l’audio ; les mots se masquent progressivement selon votre rythme et la longueur du verset.',
            },
            {
              title: '3. Comment fonctionne l’évaluation finale',
              body: 'À la dernière étape, une seule évaluation guide la suite et la révision :\n• Difficile (En apprentissage) : La prochaine séance reprend ces mêmes versets sans avancer, et les versets signalés passent en Soin particulier.\n• Bien (Consolidation) : Vous avancez vers de nouveaux versets et la leçon revient bientôt avec masquage progressif.\n• Facile (Maîtrisé) : Vous avancez et la révision s’espace progressivement (1, 3, 7, 14, 30 séances).',
            },
            {
              title: '4. Rappel de Tajwid',
              body: 'L’auto-évaluation complète l’écoute et ne remplace pas la récitation auprès d’un enseignant qualifié.',
            },
          ]
        : [
            {
              title: '١. مسار الجلسة الهادئة',
              body: 'تبدأ الجلسة بمراجعة الدروس السابقة في السورة الجارية، ثم حفظ الآيات الجديدة، ثم تسميعها غيباً، وأخيراً ربطها بالآيات السابقة. في الجلسة الأولى للسورة تظهر خطوتا الحفظ والتسميع فقط.',
            },
            {
              title: '٢. عدّاد التكرار والإخفاء الذكي',
              body: 'اضغط على زر التكرار أو شغّل التلاوة الصوتية؛ يزداد إخفاء الكلمات تدريجياً حسب مستوى الصعوبة الذي اخترته وطول الآية.',
            },
            {
              title: '٣. كيف يؤثر التقييم في نهاية الدرس؟',
              body: 'في الخطوة الأخيرة تقيّم الجلسة كاملةً بتقييم واحد يوجّه الحفظ والمراجعة معاً:\n• صعب (قيد التعلّم): تبقى الآيات نفسها للجلسة القادمة دون الانتقال لجديد، وتُرفع أولويتها وتدخل «عناية خاصة» مع الآيات التي حدّدتها.\n• جيد (تثبيت): تنتقل للآيات التالية، ويدخل الدرس مرحلة التثبيت بالإخفاء التدريجي ويُراجع قريباً.\n• سهل (متقن): تنتقل للآيات التالية ويُعتمد محفوظاً، وتتباعد مراجعته تلقائياً (١، ٣، ٧، ١٤، ٣٠ جلسة).',
            },
            {
              title: '٤. تنبيه التجويد',
              body: 'التقييم الذاتي يساعدك على ضبط الحفظ ولا يُغني عن التلقّي والمراجعة مع معلم متقن للتجويد.',
            },
          ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modalRoot, { backgroundColor: theme.background }]}>
        <View
          style={[
            styles.modalHeader,
            { borderBottomColor: theme.border, flexDirection: isRtl ? 'row-reverse' : 'row' },
          ]}
        >
          <Text style={[styles.modalTitle, { color: theme.foreground }]}>{modalTitle}</Text>
          <Pressable
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            accessibilityRole="button"
            accessibilityLabel="إغلاق"
          >
            <Ionicons name="close" size={20} color={theme.foreground} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
          {notes.map((note) => (
            <View
              key={note.title}
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <Text style={[styles.label, { color: theme.primary, textAlign: isRtl ? 'right' : 'left' }]}>
                {note.title}
              </Text>
              <Text style={[styles.noteBody, { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' }]}>
                {note.body}
              </Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cornerRow: {
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRoot: { flex: 1 },
  modalHeader: {
    borderBottomWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalSub: { fontSize: 12, marginTop: 2 },
  closeBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: 28,
  },
  card: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  rowBetween: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: { fontSize: 14, fontWeight: '700' },
  hintText: { fontSize: 12, marginTop: 2 },
  errorText: { fontSize: 12, fontWeight: '600' },
  noteBody: { fontSize: 13, lineHeight: 22 },
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADII.control,
    height: MIN_TOUCH_TARGET,
    overflow: 'hidden',
  },
  stepperSideBtn: {
    width: 40,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperInput: {
    width: 44,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 0,
  },
  stepperValueText: {
    minWidth: 40,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
  },
  chipsRow: { flexWrap: 'wrap', gap: 8 },
  chip: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: 40,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  reciterPickerRow: {
    alignItems: 'center',
    gap: 8,
  },
  reciterPickerFlex: {
    flex: 1,
  },
  previewPlayBtn: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  previewPlayText: { fontSize: 12, fontWeight: '700' },
  divider: { height: 1, width: '100%' },
  previewBox: {
    borderRadius: RADII.control,
    padding: SPACING.md,
  },
  modalFooter: {
    borderTopWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: 10,
  },
  confirmBtn: {
    flex: 2,
    minHeight: 50,
    borderRadius: RADII.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmBtnText: { fontSize: 15, fontWeight: '700' },
  cancelBtn: {
    flex: 1,
    minHeight: 50,
    borderRadius: RADII.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600' },
});
