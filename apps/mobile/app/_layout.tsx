import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import {
  Stack,
  usePathname,
  useRootNavigationState,
  useRouter,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Asset } from 'expo-asset';
import { useFonts } from 'expo-font';
import * as Updates from 'expo-updates';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FloatingBottomNav } from '../src/components/milla/FloatingBottomNav';
import { SplashOverlay } from '../src/components/milla/SplashOverlay';
import { MillaProvider, useMilla } from '../src/context/MillaContext';

function RootNavigator() {
  const router = useRouter();
  const pathname = usePathname();
  const rootNavigationState = useRootNavigationState();
  const { state, theme, isLoading } = useMilla();
  const [fontsLoaded, fontError] = useFonts({
    AmiriQuran: require('../assets/fonts/AmiriQuran-Regular.ttf'),
  });
  const fontsReady = fontsLoaded || Boolean(fontError);

  const [splashVisible, setSplashVisible] = useState<boolean>(true);
  const [initialRouteReady, setInitialRouteReady] = useState<boolean>(false);
  const [assetsReady, setAssetsReady] = useState<boolean>(false);
  const didInitRef = useRef<boolean>(false);
  const handleSplashFinish = useCallback(() => {
    setSplashVisible(false);
  }, []);

  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setAssetsReady(true);
      setInitialRouteReady(true);
    }, 3000);
    return () => clearTimeout(safetyTimer);
  }, []);

  useEffect(() => {
    if (!Updates.isEnabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (!cancelled && result.isAvailable) {
          const fetched = await Updates.fetchUpdateAsync();
          if (!cancelled && fetched.isNew) {
            await Updates.reloadAsync();
          }
        }
      } catch {
        // Silent fallback when offline or in embedded-only mode
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await Asset.loadAsync([
          require('../assets/images/al-milla-logo.png'),
          require('../assets/images/al-milla-logo-dark.jpg'),
          require('../assets/images/mushaf-morning.jpg'),
          require('../assets/images/quiet-study.jpg'),
          require('../assets/images/hero-memorize.jpg'),
          require('../assets/images/hero-revision.jpg'),
          require('../assets/images/hero-space.jpg'),
        ]);
      } catch {
        // Asset preloading failure should never block startup
      } finally {
        if (!cancelled) {
          setAssetsReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (didInitRef.current || isLoading || !rootNavigationState?.key) {
      return;
    }
    didInitRef.current = true;

    if (state && !state.onboardingCompleted && pathname !== '/onboarding') {
      router.replace('/onboarding');
      const frame = requestAnimationFrame(() => {
        setInitialRouteReady(true);
      });
      return () => cancelAnimationFrame(frame);
    }

    setInitialRouteReady(true);
    return undefined;
  }, [isLoading, rootNavigationState?.key, state, pathname, router]);

  const showBottomNav =
    pathname === '/' ||
    pathname === '/memorize' ||
    pathname === '/revision' ||
    pathname === '/settings';

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            animationDuration: 180,
            contentStyle: { backgroundColor: theme.background },
          }}
        />
      </View>
      {showBottomNav ? <FloatingBottomNav /> : null}
      {splashVisible ? (
        <SplashOverlay
          ready={!isLoading && initialRouteReady && fontsReady && assetsReady}
          onFinish={handleSplashFinish}
        />
      ) : null}
    </View>
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
