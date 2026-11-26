import { useWindowDimensions } from 'react-native';
import { SPACING } from './tokens';

export interface ResponsiveLayout {
  width: number;
  height: number;
  isCompact: boolean;
  isTablet: boolean;
  contentMaxWidth: number;
  horizontalPadding: number;
}

/**
 * Responsive layout metrics adapting spacing and max content width
 * across compact Android phones (<360dp), standard phones, and tablets (>=600dp).
 */
export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();
  const isCompact = width < 360;
  const isTablet = width >= 600;
  const horizontalPadding = isCompact ? 14 : isTablet ? 28 : SPACING.lg;

  return {
    width,
    height,
    isCompact,
    isTablet,
    contentMaxWidth: 680,
    horizontalPadding,
  };
}

