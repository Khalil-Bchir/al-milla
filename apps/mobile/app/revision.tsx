import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  MILLA_COPY,
  computeRevisionQueues,
  formatCueText,
  formatNum,
  getSurahById,
  getSurahDisplayName,
  toArabicDigits,
  type MemorizedVerseRecord,
  type SelfEvalRating,
} from '@al-milla/core';
import { AppShell } from '../src/components/milla/AppShell';
import { AudioPlayerBar } from '../src/components/milla/AudioPlayerBar';
import { useMilla } from '../src/context/MillaContext';
import { loadVerifiedSurahAyahs } from '../src/services/quran';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '../src/theme/tokens';

type RevisionGroupId = 'yesterday' | 'older' | 'weak';
type RecallViewMode = 'full' | 'cue' | 'hidden';

interface RevisionTargetItem {
  key: string;
  surahId: number;
  ayahNumber: number;
}

interface SurahRevisionBucket {
  surahId: number;
  items: RevisionTargetItem[];
}

interface RevisionGroupMeta {
  id: RevisionGroupId;
  title: string;
  subtitle: string;
  icon: 'time-outline' | 'refresh-circle-outline' | 'alert-circle-outline';
  items: RevisionTargetItem[];
  surahBuckets: SurahRevisionBucket[];
}

function toTargetItems(records: MemorizedVerseRecord[]): RevisionTargetItem[] {
  return [...records]
    .sort((a, b) => a.surahId - b.surahId || a.ayahNumber - b.ayahNumber)
    .map((r) => ({ key: r.key, surahId: r.surahId, ayahNumber: r.ayahNumber }));
}

function groupItemsBySurah(items: RevisionTargetItem[]): SurahRevisionBucket[] {
  const bySurah = new Map<number, RevisionTargetItem[]>();
  for (const item of items) {
    const existing = bySurah.get(item.surahId);
    if (existing) existing.push(item);
    else bySurah.set(item.surahId, [item]);
  }
  return Array.from(bySurah.entries())
    .sort(([a], [b]) => a - b)
    .map(([surahId, surahItems]) => ({ surahId, items: surahItems }));
}

export default function RevisionScreen() {
  const router = useRouter();
  const { state, theme, evaluateVerse, setDailyStage } = useMilla();

  const language = state?.language ?? 'ar';
  const copy = MILLA_COPY[language];
  const isRtl = language === 'ar';
  const backArrow = isRtl ? 'arrow-forward' : 'arrow-back';
  const forwardArrow = isRtl ? 'arrow-back' : 'arrow-forward';

  const queues = useMemo(() => {
    if (!state) {
      return { yesterdayItems: [], olderDueItems: [], weakItems: [], totalDueCount: 0 };
    }
    return computeRevisionQueues(state.verseRecords, {
      lastSessionKeys: state.lastSessionKeys,
      lastSessionCompletedAt: state.lastSessionCompletedAt,
    });
  }, [state]);

  const totalMemorizedCount = state ? Object.keys(state.verseRecords).length : 0;

  const [activeGroupId, setActiveGroupId] = useState<RevisionGroupId | null>(null);
  const [selectedSurahId, setSelectedSurahId] = useState<number | null>(null);
  const [activeAudioIdx, setActiveAudioIdx] = useState<number>(0);
  const [recallMode, setRecallMode] = useState<RecallViewMode>('full');
  const [groupRating, setGroupRating] = useState<SelfEvalRating>('good');
  const [completedTitle, setCompletedTitle] = useState<string | null>(null);
  const [completedSurahNotice, setCompletedSurahNotice] = useState<string | null>(null);
  const [ayahTextMap, setAyahTextMap] = useState<Record<string, string>>({});
  const [loadingTexts, setLoadingTexts] = useState<boolean>(false);

  const groups = useMemo<RevisionGroupMeta[]>(() => {
    const yesterdayItems = toTargetItems(queues.yesterdayItems);
    const olderItems = toTargetItems(queues.olderDueItems);
    const weakItems = toTargetItems(queues.weakItems);

    return [
      {
        id: 'yesterday',
        title: copy.revisionPillar1Title,
        subtitle: copy.revisionPillar1Sub,
        icon: 'time-outline',
        items: yesterdayItems,
        surahBuckets: groupItemsBySurah(yesterdayItems),
      },
      {
        id: 'older',
        title: copy.revisionPillar2Title,
        subtitle: copy.revisionPillar2Sub,
        icon: 'refresh-circle-outline',
        items: olderItems,
        surahBuckets: groupItemsBySurah(olderItems),
      },
      {
        id: 'weak',
        title: copy.revisionPillar3Title,
        subtitle: copy.revisionPillar3Sub,
        icon: 'alert-circle-outline',
        items: weakItems,
        surahBuckets: groupItemsBySurah(weakItems),
      },
    ];
  }, [queues, copy]);

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === activeGroupId) ?? null,
    [groups, activeGroupId],
  );

  const activeBucket = useMemo(() => {
    if (!activeGroup || activeGroup.surahBuckets.length === 0) return null;
    return (
      activeGroup.surahBuckets.find((b) => b.surahId === selectedSurahId) ??
      activeGroup.surahBuckets[0] ??
      null
    );
  }, [activeGroup, selectedSurahId]);

  useEffect(() => {
    if (!activeBucket || activeBucket.items.length === 0) return;
    const firstKey = activeBucket.items[0]?.key;
    if (firstKey && ayahTextMap[firstKey]) return;

    let cancelled = false;
    setLoadingTexts(true);

    void loadVerifiedSurahAyahs(activeBucket.surahId).then((res) => {
      if (cancelled) return;
      if (res.ayahs.length > 0) {
        setAyahTextMap((prev) => {
          const next = { ...prev };
          for (const a of res.ayahs) {
            next[`${activeBucket.surahId}:${a.number}`] = a.textAr;
          }
          return next;
        });
      }
      setLoadingTexts(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeBucket, ayahTextMap]);

  if (!state) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const startGroup = (groupId: RevisionGroupId, initialSurahId?: number) => {
    const group = groups.find((g) => g.id === groupId);
    const firstSurahId = initialSurahId ?? group?.surahBuckets[0]?.surahId ?? null;
    setActiveGroupId(groupId);
    setSelectedSurahId(firstSurahId);
    setActiveAudioIdx(0);
    setRecallMode('full');
    setGroupRating('good');
    setCompletedTitle(null);
    setCompletedSurahNotice(null);
  };

  const handleCompleteSurah = async () => {
    if (!activeGroup || !activeBucket) return;

    const completedSurah = getSurahById(activeBucket.surahId);
    const remainingBuckets = activeGroup.surahBuckets.filter(
      (b) => b.surahId !== activeBucket.surahId,
    );

    for (const item of activeBucket.items) {
      if (state.verseRecords[item.key]) {
        await evaluateVerse(item.surahId, item.ayahNumber, groupRating, false);
      }
    }

    if (remainingBuckets.length > 0) {
      setSelectedSurahId(remainingBuckets[0]?.surahId ?? null);
      setActiveAudioIdx(0);
      setGroupRating('good');
      setCompletedSurahNotice(getSurahDisplayName(completedSurah, language));
      return;
    }

    if (activeGroup.id === 'yesterday') {
      await setDailyStage('yesterdayReview', true);
    } else if (activeGroup.id === 'older' || activeGroup.id === 'weak') {
      await setDailyStage('olderReview', true);
    }

    setCompletedTitle(activeGroup.title);
    setActiveGroupId(null);
    setSelectedSurahId(null);
  };

  const evalOptions: { id: SelfEvalRating; label: string; hint: string }[] = [
    { id: 'difficult', label: copy.evalDifficult, hint: copy.evalDifficultHint },
    { id: 'good', label: copy.evalGood, hint: copy.evalGoodHint },
    { id: 'easy', label: copy.evalEasy, hint: copy.evalEasyHint },
  ];

  const safeAudioIdx =
    activeBucket && activeAudioIdx < activeBucket.items.length ? activeAudioIdx : 0;
  const activeTarget = activeBucket?.items[safeAudioIdx] ?? activeBucket?.items[0] ?? null;
  const activeSurah = activeBucket ? getSurahById(activeBucket.surahId) : null;

  if (activeGroup && activeBucket && activeTarget && activeSurah) {
    const surahDisplayName = getSurahDisplayName(activeSurah, language);
    const chooseSurahHeading =
      language === 'en'
        ? 'Choose Surah to revise'
        : language === 'fr'
          ? 'Choisir la sourate à réviser'
          : 'اختر السورة للمراجعة';

    return (
      <AppShell title={activeGroup.title} subtitle={surahDisplayName}>
        <View style={styles.stack}>
          <View
            style={[
              styles.rowBetween,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <Pressable
              onPress={() => {
                setActiveGroupId(null);
                setSelectedSurahId(null);
              }}
              style={[
                styles.backPill,
                {
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                  borderColor: theme.border,
                  backgroundColor: theme.card,
                },
              ]}
            >
              <Ionicons name={backArrow} size={16} color={theme.foreground} />
              <Text style={[styles.backPillText, { color: theme.foreground }]}>
                {copy.revisionBackBtn}
              </Text>
            </Pressable>

            <View style={[styles.badge, { backgroundColor: theme.secondary }]}>
              <Text style={[styles.badgeText, { color: theme.primary }]}>
                {copy.ayahLabel} {formatNum(safeAudioIdx + 1, language)} /{' '}
                {formatNum(activeBucket.items.length, language)}
              </Text>
            </View>
          </View>

          {activeGroup.surahBuckets.length > 1 ? (
            <View
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <Text
                style={[
                  styles.smallMuted,
                  { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left' },
                ]}
              >
                {chooseSurahHeading}
              </Text>
              <View
                style={[
                  styles.wrapRow,
                  { flexDirection: isRtl ? 'row-reverse' : 'row' },
                ]}
              >
                {activeGroup.surahBuckets.map((bucket) => {
                  const bucketSurah = getSurahById(bucket.surahId);
                  const selected = bucket.surahId === activeBucket.surahId;
                  return (
                    <Pressable
                      key={bucket.surahId}
                      onPress={() => {
                        setSelectedSurahId(bucket.surahId);
                        setActiveAudioIdx(0);
                        setCompletedSurahNotice(null);
                      }}
                      style={[
                        styles.surahChip,
                        {
                          flexDirection: isRtl ? 'row-reverse' : 'row',
                          borderColor: selected ? theme.primary : theme.border,
                          backgroundColor: selected ? theme.primary : theme.background,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.surahChipText,
                          { color: selected ? theme.primaryForeground : theme.foreground },
                        ]}
                      >
                        {getSurahDisplayName(bucketSurah, language)}
                      </Text>
                      <Text
                        style={[
                          styles.surahChipCount,
                          { color: selected ? theme.primaryForeground : theme.primary },
                        ]}
                      >
                        {formatNum(bucket.items.length, language)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {completedSurahNotice ? (
            <View
              style={[
                styles.noticeBox,
                {
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                  borderColor: theme.primary,
                  backgroundColor: theme.secondary,
                },
              ]}
            >
              <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
              <Text style={[styles.noticeText, { color: theme.primary }]}>
                {copy.revisionCompletedBanner}: {completedSurahNotice}
              </Text>
            </View>
          ) : null}

          {/* 3-mode Recall Switcher */}
          <View
            style={[
              styles.modeSwitcher,
              {
                flexDirection: isRtl ? 'row-reverse' : 'row',
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            {(
              [
                { id: 'full', label: copy.revisionModeFull, icon: 'eye-outline' },
                { id: 'cue', label: copy.revisionModeCue, icon: 'sparkles-outline' },
                { id: 'hidden', label: copy.revisionModeHidden, icon: 'eye-off-outline' },
              ] as const
            ).map((mode) => {
              const selected = recallMode === mode.id;
              return (
                <Pressable
                  key={mode.id}
                  onPress={() => setRecallMode(mode.id)}
                  style={[
                    styles.modeBtn,
                    {
                      flexDirection: isRtl ? 'row-reverse' : 'row',
                      backgroundColor: selected ? theme.primary : 'transparent',
                    },
                  ]}
                >
                  <Ionicons
                    name={mode.icon}
                    size={14}
                    color={selected ? theme.primaryForeground : theme.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.modeBtnText,
                      { color: selected ? theme.primaryForeground : theme.mutedForeground },
                    ]}
                    numberOfLines={1}
                  >
                    {mode.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Reading Surface */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View
              style={[
                styles.surfaceHeader,
                {
                  borderBottomColor: theme.border,
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                },
              ]}
            >
              <Text style={[styles.surfaceTitle, { color: theme.foreground }]}>
                {surahDisplayName} • {copy.ayahLabel} {formatNum(activeTarget.ayahNumber, language)}
              </Text>
              <Text style={[styles.smallMuted, { color: theme.mutedForeground }]}>
                {copy.revisionTapAyahHint}
              </Text>
            </View>

            <View style={[styles.surfaceBody, { backgroundColor: theme.secondary }]}>
              {recallMode === 'hidden' ? (
                <View style={styles.hiddenBox}>
                  <Ionicons name="eye-off-outline" size={28} color={theme.primary} />
                  <Text style={[styles.hiddenTitle, { color: theme.foreground }]}>
                    {copy.revisionHiddenTitle}
                  </Text>
                  <Text style={[styles.hiddenBody, { color: theme.mutedForeground }]}>
                    {copy.revisionHiddenBody}
                  </Text>
                </View>
              ) : loadingTexts && !ayahTextMap[activeTarget.key] ? (
                <View style={styles.hiddenBox}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={[styles.hiddenBody, { color: theme.mutedForeground }]}>
                    {copy.loadingLabel}
                  </Text>
                </View>
              ) : (
                <View style={styles.versesWrap}>
                  {activeBucket.items.map((item, idx) => {
                    const isSelected = idx === safeAudioIdx;
                    const rawText = ayahTextMap[item.key] ?? '';
                    const displayedText =
                      recallMode === 'cue' && rawText ? formatCueText(rawText) : rawText;
                    return (
                      <Pressable
                        key={item.key}
                        onPress={() => setActiveAudioIdx(idx)}
                        style={[
                          styles.ayahLineBtn,
                          isSelected
                            ? {
                                backgroundColor: `${theme.primary}1F`,
                                borderColor: theme.primary,
                              }
                            : { borderColor: 'transparent' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.quranText,
                            { color: theme.foreground, fontSize: state.quranFontSize },
                          ]}
                        >
                          {displayedText || copy.loadingLabel}{' '}
                          <Text style={{ color: theme.primary }}>
                            ﴿{toArabicDigits(item.ayahNumber)}﴾
                          </Text>
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </View>

          <AudioPlayerBar
            mode="reference"
            surahId={activeTarget.surahId}
            surahName={surahDisplayName}
            ayahNumber={activeTarget.ayahNumber}
            onPrevAyah={
              safeAudioIdx > 0 ? () => setActiveAudioIdx((i) => Math.max(0, i - 1)) : undefined
            }
            onNextAyah={
              safeAudioIdx + 1 < activeBucket.items.length
                ? () => setActiveAudioIdx((i) => i + 1)
                : undefined
            }
          />

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text
              style={[
                styles.evalHeading,
                { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
              ]}
            >
              {copy.revisionEvalPrompt} ({surahDisplayName})
            </Text>
            <View style={[styles.evalGrid, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              {evalOptions.map((opt) => {
                const selected = groupRating === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setGroupRating(opt.id)}
                    style={[
                      styles.evalTile,
                      {
                        borderColor: selected ? theme.primary : theme.border,
                        backgroundColor: selected ? theme.primary : theme.background,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.evalTitle,
                        { color: selected ? theme.primaryForeground : theme.foreground },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text
                      style={[
                        styles.evalSub,
                        { color: selected ? theme.primaryForeground : theme.mutedForeground },
                      ]}
                    >
                      {opt.hint}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => void handleCompleteSurah()}
              style={[
                styles.primaryBtn,
                { flexDirection: isRtl ? 'row-reverse' : 'row', backgroundColor: theme.primary },
              ]}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={theme.primaryForeground} />
              <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                {activeGroup.surahBuckets.length > 1
                  ? `${copy.revisionCompleteBtn} (${surahDisplayName})`
                  : copy.revisionCompleteBtn}
              </Text>
            </Pressable>
          </View>
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell title={copy.revisionTitle} subtitle={copy.revisionSubtitle}>
      <View style={styles.stack}>
        {/* Hero Banner */}
        <View style={[styles.heroBanner, { backgroundColor: theme.heroBg }]}>
          <View
            style={[
              styles.rowBetween,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <Text style={styles.heroBannerLabel}>{copy.revisionHeaderLabel}</Text>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>{copy.revisionThreePillars}</Text>
            </View>
          </View>
          <Text style={[styles.heroTitle, { textAlign: isRtl ? 'right' : 'left' }]}>
            {queues.totalDueCount > 0
              ? `${copy.revisionDueToday} ${formatNum(queues.totalDueCount, language)} ${copy.versesUnit}`
              : copy.revisionNoneDue}
          </Text>
          <View style={[styles.heroGrid, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLbl}>{copy.homeYesterdayShort}</Text>
              <Text style={styles.heroStatVal}>
                {formatNum(queues.yesterdayItems.length, language)}
              </Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLbl}>{copy.homeOlderShort}</Text>
              <Text style={styles.heroStatVal}>
                {formatNum(queues.olderDueItems.length, language)}
              </Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLbl}>{copy.homeWeakShort}</Text>
              <Text style={styles.heroStatVal}>
                {formatNum(queues.weakItems.length, language)}
              </Text>
            </View>
          </View>
        </View>

        {completedTitle ? (
          <View
            style={[
              styles.card,
              {
                flexDirection: isRtl ? 'row-reverse' : 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: theme.card,
                borderColor: theme.primary,
              },
            ]}
          >
            <View
              style={[
                styles.rowLeft,
                { flexDirection: isRtl ? 'row-reverse' : 'row', flex: 1 },
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: theme.secondary }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                <Text style={[styles.pillarTitle, { color: theme.foreground }]}>
                  {copy.revisionCompletedBanner}: {completedTitle}
                </Text>
                <Text style={[styles.pillarSub, { color: theme.mutedForeground }]}>
                  {copy.revisionCompletedSub}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => setCompletedTitle(null)}
              style={styles.closeIconBtn}
              accessibilityLabel={copy.mushafClose}
            >
              <Ionicons name="close" size={16} color={theme.mutedForeground} />
            </Pressable>
          </View>
        ) : null}

        {totalMemorizedCount === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Ionicons name="book-outline" size={32} color={theme.primary} />
            <Text style={[styles.emptyTitle, { color: theme.foreground }]}>
              {copy.revisionEmptyTitle}
            </Text>
            <Text style={[styles.emptyBody, { color: theme.mutedForeground }]}>
              {copy.revisionEmptyBody}
            </Text>
            <Pressable
              onPress={() => router.push('/memorize')}
              style={[
                styles.primaryBtn,
                {
                  width: '100%',
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                  backgroundColor: theme.primary,
                },
              ]}
            >
              <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                {copy.revisionGoToSession}
              </Text>
              <Ionicons name={forwardArrow} size={18} color={theme.primaryForeground} />
            </Pressable>
          </View>
        ) : (
          groups.map((group) => {
            const isAvailable = group.items.length > 0;
            return (
              <View
                key={group.id}
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View
                  style={[
                    styles.rowBetween,
                    { flexDirection: isRtl ? 'row-reverse' : 'row' },
                  ]}
                >
                  <View
                    style={[
                      styles.rowLeft,
                      { flexDirection: isRtl ? 'row-reverse' : 'row', flex: 1 },
                    ]}
                  >
                    <View style={[styles.iconBox, { backgroundColor: theme.secondary }]}>
                      <Ionicons name={group.icon} size={20} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                      <Text style={[styles.pillarTitle, { color: theme.foreground }]}>
                        {group.title}
                      </Text>
                      <Text
                        style={[
                          styles.pillarSub,
                          { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left' },
                        ]}
                      >
                        {group.subtitle}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.badge, { backgroundColor: theme.secondary }]}>
                    <Text style={[styles.badgeText, { color: theme.secondaryForeground }]}>
                      {formatNum(group.items.length, language)}{' '}
                      {group.items.length === 1 ? copy.verseSingular : copy.versesUnit}
                    </Text>
                  </View>
                </View>

                {group.surahBuckets.length > 0 ? (
                  <View
                    style={[
                      styles.wrapRow,
                      { flexDirection: isRtl ? 'row-reverse' : 'row' },
                    ]}
                  >
                    {group.surahBuckets.map((bucket) => {
                      const bucketSurah = getSurahById(bucket.surahId);
                      return (
                        <Pressable
                          key={bucket.surahId}
                          onPress={() => startGroup(group.id, bucket.surahId)}
                          style={[
                            styles.surahChip,
                            {
                              flexDirection: isRtl ? 'row-reverse' : 'row',
                              borderColor: theme.border,
                              backgroundColor: theme.background,
                            },
                          ]}
                        >
                          <Text style={[styles.surahChipText, { color: theme.foreground }]}>
                            {getSurahDisplayName(bucketSurah, language)}
                          </Text>
                          <Text style={[styles.surahChipCount, { color: theme.primary }]}>
                            {formatNum(bucket.items.length, language)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}

                <Pressable
                  disabled={!isAvailable}
                  onPress={() => startGroup(group.id)}
                  style={[
                    styles.startGroupBtn,
                    {
                      flexDirection: isRtl ? 'row-reverse' : 'row',
                      backgroundColor: isAvailable ? theme.primary : theme.muted,
                      borderColor: isAvailable ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="play-circle-outline"
                    size={18}
                    color={isAvailable ? theme.primaryForeground : theme.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.startGroupBtnText,
                      { color: isAvailable ? theme.primaryForeground : theme.mutedForeground },
                    ]}
                  >
                    {isAvailable ? copy.revisionStartBtn : copy.revisionEmptyBtn}
                  </Text>
                </Pressable>
              </View>
            );
          })
        )}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stack: { gap: SPACING.lg },
  heroBanner: {
    borderRadius: RADII.card,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  rowBetween: { alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  rowLeft: { alignItems: 'center', gap: 10 },
  heroBannerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  heroPill: {
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  heroPillText: { fontSize: 12, fontWeight: '600', color: '#ffffff' },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  heroGrid: { gap: 10, marginTop: 4 },
  heroStat: {
    flex: 1,
    borderRadius: RADII.control,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    alignItems: 'center',
  },
  heroStatLbl: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  heroStatVal: { fontSize: 18, fontWeight: '700', color: '#ffffff', marginTop: 4 },
  card: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarTitle: { fontSize: 16, fontWeight: '700' },
  pillarSub: { fontSize: 12, marginTop: 2 },
  badge: { borderRadius: RADII.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  wrapRow: { flexWrap: 'wrap', gap: 6 },
  surahChip: {
    minHeight: 36,
    alignItems: 'center',
    gap: 6,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  surahChipText: { fontSize: 12, fontWeight: '600' },
  surahChipCount: { fontSize: 11, fontWeight: '700' },
  startGroupBtn: {
    minHeight: 48,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  startGroupBtnText: { fontSize: 14, fontWeight: '700' },
  emptyCard: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyBody: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  primaryBtn: {
    minHeight: 52,
    borderRadius: RADII.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700' },
  backPill: {
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    gap: 6,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  backPillText: { fontSize: 12, fontWeight: '700' },
  smallMuted: { fontSize: 11, fontWeight: '600' },
  noticeBox: {
    borderRadius: RADII.control,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  noticeText: { fontSize: 12, fontWeight: '600' },
  modeSwitcher: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: 6,
    gap: 6,
  },
  modeBtn: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 6,
  },
  modeBtnText: { fontSize: 12, fontWeight: '700' },
  surfaceHeader: {
    borderBottomWidth: 1,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  surfaceTitle: { fontSize: 12, fontWeight: '700' },
  surfaceBody: { borderRadius: RADII.control, padding: SPACING.md },
  hiddenBox: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  hiddenTitle: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  hiddenBody: { fontSize: 12, textAlign: 'center' },
  versesWrap: { gap: 8 },
  ayahLineBtn: {
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  quranText: {
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 46,
  },
  evalHeading: { fontSize: 13, fontWeight: '700' },
  evalGrid: { gap: 8 },
  evalTile: {
    flex: 1,
    minHeight: 60,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  evalTitle: { fontSize: 12, fontWeight: '700' },
  evalSub: { fontSize: 10, marginTop: 2 },
});
