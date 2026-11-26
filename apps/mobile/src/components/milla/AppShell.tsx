import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMilla } from '../../context/MillaContext';
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

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          hideBottomNav ? styles.scrollContentNoNav : null,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
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
    padding: SPACING.lg,
    paddingBottom: 108,
  },
  scrollContentNoNav: {
    paddingBottom: 40,
  },
});
