import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMilla } from '../../context/MillaContext';
import { useResponsiveLayout } from '../../theme/responsive';
import { SPACING } from '../../theme/tokens';

interface AppShellProps {
  title?: string;
  subtitle?: string;
  hideBottomNav?: boolean;
  hideTopActions?: boolean;
  children: React.ReactNode;
}

export function AppShell({
  hideBottomNav = false,
  children,
}: AppShellProps) {
  const { theme } = useMilla();
  const insets = useSafeAreaInsets();
  const { contentMaxWidth, horizontalPadding } = useResponsiveLayout();

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: SPACING.lg,
            paddingBottom: (hideBottomNav ? 40 : 96) + insets.bottom,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.innerColumn, { maxWidth: contentMaxWidth }]}>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  innerColumn: {
    width: '100%',
    alignSelf: 'center',
  },
});
