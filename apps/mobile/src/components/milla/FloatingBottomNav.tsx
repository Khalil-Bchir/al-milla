import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MILLA_COPY } from '@al-milla/core';
import { useMilla } from '../../context/MillaContext';
import { useResponsiveLayout } from '../../theme/responsive';
import { SPACING } from '../../theme/tokens';

type NavRoute = '/' | '/memorize' | '/revision' | '/settings';

interface NavItemDef {
  href: NavRoute;
  label: string;
  icon: 'home-outline' | 'book-outline' | 'refresh-outline' | 'person-outline';
  activeIcon: 'home' | 'book' | 'refresh' | 'person';
  active: boolean;
}

const DOCK_PADDING = 4;

/**
 * Persistent floating bottom navigation dock mounted once at root level
 * so route transitions never unmount or interrupt the spring pill glide.
 */
export function FloatingBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { contentMaxWidth, horizontalPadding } = useResponsiveLayout();
  const { state, theme } = useMilla();

  const language = state?.language ?? 'ar';
  const copy = MILLA_COPY[language];
  const isRtl = language === 'ar';

  const navItems: NavItemDef[] = [
    {
      href: '/',
      label: copy.navHome,
      icon: 'home-outline',
      activeIcon: 'home',
      active: pathname === '/',
    },
    {
      href: '/memorize',
      label: copy.navMemorize,
      icon: 'book-outline',
      activeIcon: 'book',
      active: pathname.startsWith('/memorize'),
    },
    {
      href: '/revision',
      label: copy.navRevision,
      icon: 'refresh-outline',
      activeIcon: 'refresh',
      active: pathname.startsWith('/revision'),
    },
    {
      href: '/settings',
      label: language === 'en' ? 'My Space' : language === 'fr' ? 'Mon espace' : 'مساحتي',
      icon: 'person-outline',
      activeIcon: 'person',
      active: pathname.startsWith('/settings'),
    },
  ];

  const activeIdx = Math.max(
    0,
    navItems.findIndex((item) => item.active),
  );
  const visualIdx = isRtl ? navItems.length - 1 - activeIdx : activeIdx;

  const [dockWidth, setDockWidth] = useState(0);
  const slotWidth = dockWidth > 0 ? (dockWidth - DOCK_PADDING * 2) / navItems.length : 0;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const didSetInitialRef = useRef(false);

  const tabScales = useRef<Animated.Value[]>([
    new Animated.Value(1),
    new Animated.Value(0.94),
    new Animated.Value(0.94),
    new Animated.Value(0.94),
  ]).current;

  useEffect(() => {
    if (slotWidth <= 0) return;

    const targetX = visualIdx * slotWidth;
    if (!didSetInitialRef.current) {
      didSetInitialRef.current = true;
      slideAnim.setValue(targetX);
      tabScales.forEach((anim, idx) => {
        anim.setValue(idx === activeIdx ? 1 : 0.94);
      });
      return;
    }

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: targetX,
        stiffness: 170,
        damping: 20,
        mass: 0.8,
        useNativeDriver: true,
      }),
      ...tabScales.map((anim, idx) =>
        Animated.spring(anim, {
          toValue: idx === activeIdx ? 1 : 0.94,
          stiffness: 200,
          damping: 20,
          mass: 0.75,
          useNativeDriver: true,
        }),
      ),
    ]).start();
  }, [visualIdx, activeIdx, slotWidth, slideAnim, tabScales]);

  const activeFgColor = theme.isDark ? theme.foreground : theme.primaryForeground;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.dockOuter,
        {
          paddingHorizontal: horizontalPadding,
          paddingBottom: Math.max(insets.bottom, 10) + 2,
        },
      ]}
    >
      <View
        accessibilityRole="tablist"
        onLayout={(e) => {
          const nextW = e.nativeEvent.layout.width;
          if (nextW > 0 && nextW !== dockWidth) {
            setDockWidth(nextW);
          }
        }}
        style={[
          styles.dockPill,
          {
            maxWidth: contentMaxWidth,
            width: '100%',
            alignSelf: 'center',
            flexDirection: isRtl ? 'row-reverse' : 'row',
            borderColor: theme.isDark
              ? 'rgba(242, 239, 230, 0.14)'
              : 'rgba(7, 61, 53, 0.12)',
          },
        ]}
      >
        <BlurView
          intensity={theme.isDark ? 45 : 65}
          tint={theme.isDark ? 'dark' : 'light'}
          blurMethod="dimezisBlurView"
          style={styles.blurFill}
        />
        <View
          pointerEvents="none"
          style={[
            styles.blurFill,
            {
              backgroundColor: theme.isDark
                ? 'rgba(20, 20, 19, 0.68)'
                : 'rgba(255, 255, 255, 0.72)',
            },
          ]}
        />
        {slotWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activeSlider,
              {
                width: slotWidth,
                backgroundColor: theme.isDark ? '#242624' : theme.primary,
                borderWidth: theme.isDark ? 1 : 0,
                borderColor: theme.isDark ? '#333532' : 'transparent',
                transform: [{ translateX: slideAnim }],
              },
            ]}
          />
        ) : null}

        {navItems.map((item, idx) => (
          <Pressable
            key={item.href}
            onPress={() => {
              if (pathname !== item.href) {
                router.replace(item.href);
              }
            }}
            style={styles.navItem}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: item.active }}
          >
            <Animated.View
              style={[
                styles.navItemInner,
                { transform: [{ scale: tabScales[idx] ?? 1 }] },
              ]}
            >
              <Ionicons
                name={item.active ? item.activeIcon : item.icon}
                size={20}
                color={item.active ? activeFgColor : theme.mutedForeground}
              />
              <Text
                style={[
                  styles.navLabel,
                  {
                    color: item.active ? activeFgColor : theme.mutedForeground,
                    fontWeight: item.active ? '700' : '600',
                  },
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
              {item.active ? (
                <View style={[styles.activeDot, { backgroundColor: theme.accent }]} />
              ) : null}
            </Animated.View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dockOuter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    backgroundColor: 'transparent',
    paddingHorizontal: SPACING.lg,
    paddingTop: 6,
  },
  dockPill: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    padding: DOCK_PADDING,
  },
  blurFill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  activeSlider: {
    position: 'absolute',
    top: DOCK_PADDING,
    bottom: DOCK_PADDING,
    left: DOCK_PADDING,
    borderRadius: 15,
  },
  navItem: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  navItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  navLabel: {
    fontSize: 11,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
});
