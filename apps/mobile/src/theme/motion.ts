import { LayoutAnimation, Platform, UIManager } from 'react-native';

let layoutAnimInitialized = false;

function ensureLayoutAnimationEnabled(): void {
  if (layoutAnimInitialized) return;
  layoutAnimInitialized = true;
  if (
    Platform.OS === 'android' &&
    typeof UIManager.setLayoutAnimationEnabledExperimental === 'function'
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

/**
 * Triggers a smooth layout transition before state changes that show, hide,
 * or resize sections so UI updates glide instead of popping abruptly.
 */
export function animateLayout(durationMs = 220): void {
  ensureLayoutAnimationEnabled();
  LayoutAnimation.configureNext({
    duration: durationMs,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  });
}
