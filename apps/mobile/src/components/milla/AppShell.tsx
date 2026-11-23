import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MILLA_COPY } from '@al-milla/core';
import { useMilla } from '../../context/MillaContext';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '../../theme/tokens';

const LOGO_ASSET = require('../../../assets/images/al-milla-logo.png');

interface AppShellProps {
  title: string;
  subtitle?: string;
  hideBottomNav?: boolean;
  hideTopActions?: boolean;
  children: React.ReactNode;
}

type NavRoute = '/' | '/memorize' | '/revision' | '/progress';

interface NavItemDef {
  href: NavRoute;
  label: string;
  icon: 'home-outline' | 'book-outline' | 'refresh-outline' | 'person-outline';
  active: boolean;
}

export function AppShell({
  title,
  subtitle,
  hideBottomNav = false,
  hideTopActions = false,
  children,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { state, theme } = useMilla();

  const language = state?.language ?? 'ar';
  const copy = MILLA_COPY[language];
  const isRtl = language === 'ar';

  const navItems: NavItemDef[] = [
    { href: '/', label: copy.navHome, icon: 'home-outline', active: pathname === '/' },
    {
      href: '/memorize',
      label: copy.navMemorize,
      icon: 'book-outline',
      active: pathname.startsWith('/memorize'),
    },
    {
      href: '/revision',
      label: copy.navRevision,
      icon: 'refresh-outline',
      active:
        pathname.startsWith('/revision') ||
        pathname.startsWith('/self-test') ||
        pathname.startsWith('/mutashabihat'),
    },
    {
      href: '/progress',
      label: copy.navProgress,
      icon: 'person-outline',
      active: pathname.startsWith('/progress') || pathname.startsWith('/settings'),
    },
  ];

  const mushafActive = pathname.startsWith('/mushaf');
  const settingsActive = pathname.startsWith('/settings');

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Top Bar */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.background, borderBottomColor: theme.border },
        ]}
      >
        <View
          style={[
            styles.headerRow,
            { flexDirection: isRtl ? 'row-reverse' : 'row' },
          ]}
        >
          <Pressable
            onPress={() => router.push('/')}
            style={[
              styles.brandBtn,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
            accessibilityRole="button"
            accessibilityLabel={copy.brandName}
          >
            <Image
              source={LOGO_ASSET}
              style={[styles.logo, { borderColor: theme.border }]}
              accessibilityLabel={copy.brandName}
            />
            <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
              <Text style={[styles.brandTitle, { color: theme.primary }]}>
                {copy.brandName}
              </Text>
              <Text
                style={[styles.headerSubtitle, { color: theme.mutedForeground }]}
                numberOfLines={1}
              >
                {title}
              </Text>
            </View>
          </Pressable>

          {!hideTopActions ? (
            <View
              style={[
                styles.topActions,
                { flexDirection: isRtl ? 'row-reverse' : 'row' },
              ]}
            >
              <Pressable
                onPress={() => router.push('/mushaf')}
                style={[
                  styles.mushafBtn,
                  {
                    flexDirection: isRtl ? 'row-reverse' : 'row',
                    borderColor: mushafActive ? theme.primary : theme.border,
                    backgroundColor: mushafActive ? theme.primary : theme.card,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={copy.mushafLink}
              >
                <Ionicons
                  name="library-outline"
                  size={16}
                  color={mushafActive ? theme.primaryForeground : theme.primary}
                />
                <Text
                  style={[
                    styles.mushafBtnText,
                    { color: mushafActive ? theme.primaryForeground : theme.foreground },
                  ]}
                >
                  {copy.mushafLink}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/settings')}
                style={[
                  styles.settingsBtn,
                  {
                    borderColor: settingsActive ? theme.primary : theme.border,
                    backgroundColor: settingsActive ? theme.primary : theme.card,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={copy.settingsLink}
              >
                <Ionicons
                  name="settings-outline"
                  size={18}
                  color={settingsActive ? theme.primaryForeground : theme.foreground}
                />
              </Pressable>
            </View>
          ) : null}
        </View>

        {subtitle ? (
          <View style={[styles.subtitleStrip, { borderTopColor: theme.border }]}>
            <Text
              style={[
                styles.subtitleText,
                {
                  color: theme.mutedForeground,
                  textAlign: isRtl ? 'right' : 'left',
                },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Scrollable Main Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.mainContent,
          hideBottomNav ? styles.mainContentNoNav : null,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      {/* Persistent 4-Destination Bottom Navigation */}
      {!hideBottomNav ? (
        <SafeAreaView
          edges={['bottom']}
          style={[
            styles.bottomNavWrap,
            { backgroundColor: theme.card, borderTopColor: theme.border },
          ]}
        >
          <View
            style={[
              styles.bottomNavGrid,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            {navItems.map((item) => (
              <Pressable
                key={item.href}
                onPress={() => router.push(item.href)}
                style={[
                  styles.navItem,
                  item.active ? { backgroundColor: theme.secondary } : null,
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: item.active }}
                accessibilityLabel={item.label}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={item.active ? theme.primary : theme.mutedForeground}
                />
                <Text
                  style={[
                    styles.navLabel,
                    {
                      color: item.active ? theme.primary : theme.mutedForeground,
                      fontWeight: item.active ? '700' : '500',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </SafeAreaView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { borderBottomWidth: 1 },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
  },
  brandBtn: {
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: RADII.control,
    borderWidth: 1,
  },
  brandTitle: { fontSize: 16, fontWeight: '700', lineHeight: 20 },
  headerSubtitle: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  topActions: { alignItems: 'center', gap: SPACING.sm },
  mushafBtn: {
    minHeight: 40,
    alignItems: 'center',
    gap: 6,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  mushafBtnText: { fontSize: 12, fontWeight: '700' },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleStrip: {
    borderTopWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 5,
  },
  subtitleText: { fontSize: 11 },
  scroll: { flex: 1 },
  mainContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: 28,
  },
  mainContentNoNav: {
    paddingBottom: SPACING.xxxl,
  },
  bottomNavWrap: {
    borderTopWidth: 1,
  },
  bottomNavGrid: {
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  navItem: {
    flex: 1,
    minHeight: 52,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  navLabel: { fontSize: 12 },
});
