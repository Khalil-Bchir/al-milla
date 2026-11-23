import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  KAHF_TAFSIR_WORDS,
  MILLA_COPY,
  getSurahById,
} from '@al-milla/core';
import { AppShell } from '../src/components/milla/AppShell';
import { useMilla } from '../src/context/MillaContext';
import { RADII, SPACING } from '../src/theme/tokens';

export default function TafsirScreen() {
  const router = useRouter();
  const { state, theme } = useMilla();

  const language = state?.language ?? 'ar';
  const copy = MILLA_COPY[language];
  const isRtl = language === 'ar';
  const kahf = getSurahById(18);
  const ayah1 = kahf.ayahs[0]?.textAr ?? '';
  const ayah2 = kahf.ayahs[1]?.textAr ?? '';

  return (
    <AppShell title={copy.tafsirTitle} subtitle={copy.tafsirSubtitle}>
      <View style={styles.stack}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text
            style={[
              styles.badgeText,
              { color: theme.primary, textAlign: isRtl ? 'right' : 'left' },
            ]}
          >
            {copy.hafsBadge}
          </Text>
          <View style={[styles.verseBox, { backgroundColor: theme.secondary }]}>
            <Text
              style={[
                styles.quranText,
                { color: theme.foreground, fontSize: state?.quranFontSize ?? 24 },
              ]}
            >
              {ayah1} ﴿١﴾ {ayah2} ﴿٢﴾
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.disclaimerBox,
            {
              flexDirection: isRtl ? 'row-reverse' : 'row',
              backgroundColor: theme.secondary,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons name="information-circle-outline" size={18} color={theme.primary} />
          <Text
            style={[
              styles.disclaimerText,
              { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
            ]}
          >
            {copy.tafsirDisclaimer}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View
            style={[
              styles.sectionHeader,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <Ionicons name="book-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
              {copy.tafsirWordsTitle}
            </Text>
          </View>

          {KAHF_TAFSIR_WORDS.map((item) => (
            <View
              key={item.word}
              style={[styles.wordBox, { backgroundColor: theme.secondary }]}
            >
              <View
                style={[
                  styles.wordChip,
                  {
                    backgroundColor: theme.primary,
                    alignSelf: isRtl ? 'flex-end' : 'flex-start',
                  },
                ]}
              >
                <Text style={[styles.wordText, { color: theme.primaryForeground }]}>
                  {item.word}
                </Text>
              </View>
              <Text
                style={[
                  styles.meaningText,
                  { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
                ]}
              >
                {language === 'en'
                  ? item.meaningEn
                  : language === 'fr'
                    ? item.meaningFr
                    : item.meaningAr}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View
            style={[
              styles.sectionHeader,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <Ionicons name="sparkles-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
              {copy.tafsirMentalAnchorTitle}
            </Text>
          </View>

          <View
            style={[
              styles.anchorBox,
              {
                flexDirection: isRtl ? 'row-reverse' : 'row',
                backgroundColor: theme.secondary,
              },
            ]}
          >
            <Ionicons name="bulb-outline" size={18} color={theme.primary} />
            <Text
              style={[
                styles.anchorText,
                { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
              ]}
            >
              {language === 'en'
                ? 'Connect the ending of verse 1 (“ʿiwajā”, no crookedness) directly to the beginning of verse 2 (“qayyiman”, straight).'
                : language === 'fr'
                  ? 'Reliez directement la fin du verset 1 (« ʿiwajā », sans tortuosité) au début du verset 2 (« qayyiman », droit).'
                  : 'حين تقف على رأس الآية الأولى «عِوَجًا» تذكّر أن بداية الآية الثانية تعلّة لما بعدها: «قَيِّمًا لِّيُنذِرَ».'}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/self-test')}
          style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
          accessibilityRole="button"
        >
          <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
            {copy.tafsirGoSelfTest}
          </Text>
        </Pressable>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  stack: { gap: SPACING.xl },
  card: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  verseBox: { borderRadius: RADII.card, padding: SPACING.lg },
  quranText: {
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 46,
  },
  disclaimerBox: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: 10,
    alignItems: 'flex-start',
  },
  disclaimerText: { flex: 1, fontSize: 12, lineHeight: 20 },
  sectionHeader: { alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  wordBox: { borderRadius: RADII.control, padding: 14, gap: 8 },
  wordChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  wordText: { fontSize: 16, fontWeight: '700' },
  meaningText: { fontSize: 13, lineHeight: 20 },
  anchorBox: {
    borderRadius: RADII.control,
    padding: 14,
    gap: 10,
    alignItems: 'flex-start',
  },
  anchorText: { flex: 1, fontSize: 13, lineHeight: 20 },
  primaryBtn: {
    minHeight: 52,
    borderRadius: RADII.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '700' },
});
