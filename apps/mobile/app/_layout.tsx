import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MillaProvider } from '../src/context/MillaContext';
import { COLORS } from '../src/theme/tokens';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <MillaProvider>
        <StatusBar style="dark" backgroundColor={COLORS.warmIvory} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.warmIvory } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </MillaProvider>
    </SafeAreaProvider>
  );
}
