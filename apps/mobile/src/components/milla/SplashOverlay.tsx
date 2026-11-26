import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MILLA_COPY } from '@al-milla/core';
import { useMilla } from '../../context/MillaContext';
import { QURAN_FONT_FAMILY, SPACING } from '../../theme/tokens';

const LOGO_ASSET = require('../../../assets/images/al-milla-logo.png');
const LOGO_DARK_ASSET = require('../../../assets/images/al-milla-logo-dark.jpg');

interface SplashOverlayProps {
  ready: boolean;
  onFinish: () => void;
}

export function SplashOverlay({ ready, onFinish }: SplashOverlayProps) {
  const { state, theme } = useMilla();
  const language = state?.language ?? 'ar';
  const copy = MILLA_COPY[language];

  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const [motionChecked, setMotionChecked] = useState<boolean>(false);
  const [minHoldElapsed, setMinHoldElapsed] = useState<boolean>(false);
  const [isExiting, setIsExiting] = useState<boolean>(false);

  const hasTriggeredExitRef = useRef<boolean>(false);
  const overlayOpacity = useRef<Animated.Value>(new Animated.Value(1)).current;
  const contentTranslateY = useRef<Animated.Value>(new Animated.Value(0)).current;
  const contentScale = useRef<Animated.Value>(new Animated.Value(1)).current;

  const haloOpacity = useRef<Animated.Value>(new Animated.Value(0)).current;
  const haloScale = useRef<Animated.Value>(new Animated.Value(0.75)).current;
  const breatheScale = useRef<Animated.Value>(new Animated.Value(1)).current;

  const logoOpacity = useRef<Animated.Value>(new Animated.Value(0)).current;
  const logoScale = useRef<Animated.Value>(new Animated.Value(0.82)).current;

  const basmalahOpacity = useRef<Animated.Value>(new Animated.Value(0)).current;
  const titleOpacity = useRef<Animated.Value>(new Animated.Value(0)).current;
  const titleTranslateY = useRef<Animated.Value>(new Animated.Value(16)).current;

  const taglineOpacity = useRef<Animated.Value>(new Animated.Value(0)).current;
  const taglineTranslateY = useRef<Animated.Value>(new Animated.Value(16)).current;

  const progressScaleX = useRef<Animated.Value>(new Animated.Value(0.08)).current;

  useEffect(() => {
    let active = true;
    const checkReduceMotion = async () => {
      try {
        const enabled = await AccessibilityInfo.isReduceMotionEnabled();
        if (active) {
          setReduceMotion(enabled);
        }
      } catch {
        // Default to standard motion when AccessibilityInfo query fails
      } finally {
        if (active) {
          setMotionChecked(true);
        }
      }
    };
    void checkReduceMotion();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!motionChecked) return;

    const holdMs = reduceMotion ? 380 : 1100;
    const holdTimer = setTimeout(() => {
      setMinHoldElapsed(true);
    }, holdMs);

    if (reduceMotion) {
      haloOpacity.setValue(1);
      haloScale.setValue(1);
      logoOpacity.setValue(1);
      logoScale.setValue(1);
      basmalahOpacity.setValue(1);
      titleOpacity.setValue(1);
      titleTranslateY.setValue(0);
      taglineOpacity.setValue(1);
      taglineTranslateY.setValue(0);
      progressScaleX.setValue(1);
      return () => clearTimeout(holdTimer);
    }

    const entranceAnim = Animated.parallel([
      Animated.timing(haloOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(haloScale, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        speed: 14,
        bounciness: 6,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(80),
        Animated.timing(basmalahOpacity, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(140),
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(titleTranslateY, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(240),
        Animated.parallel([
          Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(taglineTranslateY, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.timing(progressScaleX, {
        toValue: 1,
        duration: 980,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheScale, {
          toValue: 1.06,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breatheScale, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    entranceAnim.start();
    breatheLoop.start();

    return () => {
      clearTimeout(holdTimer);
      entranceAnim.stop();
      breatheLoop.stop();
    };
  }, [
    motionChecked,
    reduceMotion,
    haloOpacity,
    haloScale,
    logoOpacity,
    logoScale,
    basmalahOpacity,
    titleOpacity,
    titleTranslateY,
    taglineOpacity,
    taglineTranslateY,
    progressScaleX,
    breatheScale,
  ]);

  useEffect(() => {
    if (!ready || !minHoldElapsed || hasTriggeredExitRef.current) return;
    hasTriggeredExitRef.current = true;
    setIsExiting(true);

    const exitDuration = reduceMotion ? 160 : 340;
    const exitAnim = Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: exitDuration,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: reduceMotion ? 0 : -12,
        duration: exitDuration,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentScale, {
        toValue: reduceMotion ? 1 : 1.03,
        duration: exitDuration,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    exitAnim.start(() => {
      onFinish();
    });

    return () => {
      exitAnim.stop();
    };
  }, [
    ready,
    minHoldElapsed,
    reduceMotion,
    overlayOpacity,
    contentTranslateY,
    contentScale,
    onFinish,
  ]);

  const outerHaloBorder = theme.isDark
    ? 'rgba(242, 239, 230, 0.14)'
    : `${theme.primary}22`;
  const innerHaloBorder = theme.isDark
    ? 'rgba(242, 239, 230, 0.22)'
    : `${theme.primary}38`;

  return (
    <Animated.View
      pointerEvents={isExiting ? 'none' : 'auto'}
      accessibilityViewIsModal
      accessibilityLabel={copy.brandName}
      style={[
        styles.overlay,
        {
          backgroundColor: theme.background,
          opacity: overlayOpacity,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.centerGroup,
          {
            transform: [
              { translateY: contentTranslateY },
              { scale: contentScale },
            ],
          },
        ]}
      >
        {/* Concentric Quiet Devotion Halos */}
        <View style={styles.haloStage}>
          <Animated.View
            style={[
              styles.outerHalo,
              {
                borderColor: outerHaloBorder,
                backgroundColor: `${theme.secondary}66`,
                opacity: haloOpacity,
                transform: [{ scale: Animated.multiply(haloScale, breatheScale) }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.innerHalo,
              {
                borderColor: innerHaloBorder,
                backgroundColor: theme.secondary,
                opacity: haloOpacity,
                transform: [{ scale: haloScale }],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.logoCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                shadowColor: theme.isDark ? '#000000' : '#073d35',
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Image
              source={theme.isDark ? LOGO_DARK_ASSET : LOGO_ASSET}
              style={styles.logoImage}
              accessibilityLabel={copy.brandName}
            />
            <View
              style={[
                styles.coralDot,
                { backgroundColor: theme.accent, borderColor: theme.card },
              ]}
            />
          </Animated.View>
        </View>

        <Animated.Text
          style={[
            styles.basmalah,
            {
              color: theme.mutedForeground,
              opacity: basmalahOpacity,
            },
          ]}
        >
          بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
        </Animated.Text>

        <Animated.Text
          style={[
            styles.brandTitle,
            {
              color: theme.isDark ? theme.foreground : theme.primary,
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          {copy.brandName}
        </Animated.Text>

        <Animated.Text
          style={[
            styles.tagline,
            {
              color: theme.mutedForeground,
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslateY }],
            },
          ]}
        >
          {copy.tagline}
        </Animated.Text>
      </Animated.View>

      {/* Bottom Calm Progress Track */}
      <View style={styles.bottomArea}>
        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.accent,
                transform: [{ scaleX: progressScaleX }],
              },
            ]}
          />
        </View>
        <Text style={[styles.footerNote, { color: theme.mutedForeground }]}>
          {copy.freeIndividualNote}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 56,
    paddingHorizontal: SPACING.xxl,
  },
  centerGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  haloStage: {
    width: 224,
    height: 224,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  outerHalo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
  },
  innerHalo: {
    position: 'absolute',
    width: 164,
    height: 164,
    borderRadius: 82,
    borderWidth: 1,
  },
  logoCard: {
    width: 104,
    height: 104,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 4,
  },
  logoImage: {
    width: 78,
    height: 78,
    borderRadius: 18,
  },
  coralDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  basmalah: {
    fontFamily: QURAN_FONT_FAMILY,
    fontSize: 18,
    lineHeight: 30,
    textAlign: 'center',
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  tagline: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 280,
  },
  bottomArea: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  progressTrack: {
    width: 120,
    height: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  footerNote: {
    fontSize: 11,
    textAlign: 'center',
  },
});
