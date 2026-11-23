import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MillaProvider, useMilla } from '../src/context/MillaContext';

function RootNavigator() {
  const { theme } = useMilla();
  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: theme.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <MillaProvider>
        <RootNavigator />
      </MillaProvider>
    </SafeAreaProvider>
  );
}
