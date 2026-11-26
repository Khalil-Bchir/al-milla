import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useMilla } from '../../context/MillaContext';

export type ArabesqueVariant = 'featured' | 'subtle' | 'corner';
export type ArabesquePattern = 'medallion' | 'rosette' | 'lattice' | 'arch' | 'crescent';

export const ARABESQUE_CARD_PATTERNS: readonly ArabesquePattern[] = [
  'medallion',
  'rosette',
  'lattice',
  'crescent',
];

interface GeometricMotifProps {
  pattern: ArabesquePattern;
  size: number;
  color: string;
  strokeWidth?: number;
  ringScale?: number;
}

function RubElHizbMedallion({
  size,
  color,
  strokeWidth = 1.1,
  ringScale,
}: Omit<GeometricMotifProps, 'pattern'>) {
  const outerBoxSize = ringScale ? Math.round(size * ringScale) : size;
  const inscribedCircleSize = Math.round(size * 0.62);
  const innerDiamondSize = Math.round(size * 0.34);
  const centerDotSize = Math.max(4, Math.round(size * 0.09));

  return (
    <View
      style={[
        styles.motifRoot,
        {
          width: outerBoxSize,
          height: outerBoxSize,
        },
      ]}
    >
      {ringScale ? (
        <View
          style={[
            styles.absLayer,
            {
              width: outerBoxSize,
              height: outerBoxSize,
              borderRadius: outerBoxSize / 2,
              borderColor: color,
              borderWidth: strokeWidth,
            },
          ]}
        />
      ) : null}

      <View
        style={[
          styles.starSquare,
          {
            width: size,
            height: size,
            borderColor: color,
            borderWidth: strokeWidth,
          },
        ]}
      />

      <View
        style={[
          styles.starSquare,
          styles.rotated45,
          {
            width: size,
            height: size,
            borderColor: color,
            borderWidth: strokeWidth,
          },
        ]}
      />

      <View
        style={[
          styles.absLayer,
          {
            width: inscribedCircleSize,
            height: inscribedCircleSize,
            borderRadius: inscribedCircleSize / 2,
            borderColor: color,
            borderWidth: strokeWidth,
          },
        ]}
      />

      <View
        style={[
          styles.innerDiamond,
          styles.rotated45,
          {
            width: innerDiamondSize,
            height: innerDiamondSize,
            borderColor: color,
            borderWidth: strokeWidth,
          },
        ]}
      />

      <View
        style={{
          width: centerDotSize,
          height: centerDotSize,
          borderRadius: centerDotSize / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function ShamsaRosette({
  size,
  color,
  strokeWidth = 1.05,
  ringScale,
}: Omit<GeometricMotifProps, 'pattern'>) {
  const outerBoxSize = ringScale ? Math.round(size * ringScale) : size;
  const innerCircleSize = Math.round(size * 0.56);
  const centerDotSize = Math.max(4, Math.round(size * 0.08));

  return (
    <View
      style={[
        styles.motifRoot,
        {
          width: outerBoxSize,
          height: outerBoxSize,
        },
      ]}
    >
      {ringScale ? (
        <View
          style={[
            styles.absLayer,
            {
              width: outerBoxSize,
              height: outerBoxSize,
              borderRadius: outerBoxSize / 2,
              borderColor: color,
              borderWidth: strokeWidth,
            },
          ]}
        />
      ) : null}

      <View
        style={[
          styles.rosetteSquare,
          {
            width: size,
            height: size,
            borderColor: color,
            borderWidth: strokeWidth,
          },
        ]}
      />
      <View
        style={[
          styles.rosetteSquare,
          styles.rotated30,
          {
            width: size,
            height: size,
            borderColor: color,
            borderWidth: strokeWidth,
          },
        ]}
      />
      <View
        style={[
          styles.rosetteSquare,
          styles.rotated60,
          {
            width: size,
            height: size,
            borderColor: color,
            borderWidth: strokeWidth,
          },
        ]}
      />

      <View
        style={[
          styles.absLayer,
          {
            width: innerCircleSize,
            height: innerCircleSize,
            borderRadius: innerCircleSize / 2,
            borderColor: color,
            borderWidth: strokeWidth,
          },
        ]}
      />

      <View
        style={{
          width: centerDotSize,
          height: centerDotSize,
          borderRadius: centerDotSize / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function MashrabiyaLattice({
  size,
  color,
  strokeWidth = 1.05,
}: Omit<GeometricMotifProps, 'pattern' | 'ringScale'>) {
  const diamondSize = Math.round(size * 0.44);
  const innerDiamondSize = Math.round(size * 0.22);
  const offset = Math.round(size * 0.24);

  const offsets = [
    { top: offset, left: offset },
    { top: offset, right: offset },
    { bottom: offset, left: offset },
    { bottom: offset, right: offset },
  ] as const;

  return (
    <View style={[styles.motifRoot, { width: size, height: size }]}>
      {offsets.map((pos, idx) => (
        <View
          key={idx}
          style={[
            styles.latticeDiamond,
            styles.rotated45,
            pos,
            {
              width: diamondSize,
              height: diamondSize,
              borderColor: color,
              borderWidth: strokeWidth,
            },
          ]}
        />
      ))}
      <View
        style={[
          styles.innerDiamond,
          styles.rotated45,
          {
            width: innerDiamondSize,
            height: innerDiamondSize,
            borderColor: color,
            borderWidth: strokeWidth,
          },
        ]}
      />
    </View>
  );
}

function MihrabArch({
  size,
  color,
  strokeWidth = 1.05,
}: Omit<GeometricMotifProps, 'pattern' | 'ringScale'>) {
  const width = Math.round(size * 0.78);
  const height = size;
  const innerWidth = Math.round(width * 0.72);
  const innerHeight = Math.round(height * 0.78);
  const apexSize = Math.max(6, Math.round(size * 0.12));

  return (
    <View style={[styles.motifRoot, { width, height }]}>
      <View
        style={{
          width,
          height,
          borderTopLeftRadius: width / 2,
          borderTopRightRadius: width / 2,
          borderColor: color,
          borderWidth: strokeWidth,
          borderBottomWidth: 0,
        }}
      />
      <View
        style={[
          styles.absLayer,
          {
            bottom: 0,
            width: innerWidth,
            height: innerHeight,
            borderTopLeftRadius: innerWidth / 2,
            borderTopRightRadius: innerWidth / 2,
            borderColor: color,
            borderWidth: strokeWidth,
            borderBottomWidth: 0,
          },
        ]}
      />
      <View
        style={[
          styles.absLayer,
          styles.rotated45,
          {
            top: Math.round(height * 0.24),
            width: apexSize,
            height: apexSize,
            borderColor: color,
            borderWidth: strokeWidth,
          },
        ]}
      />
    </View>
  );
}

function HilalArcs({
  size,
  color,
  strokeWidth = 1.05,
}: Omit<GeometricMotifProps, 'pattern' | 'ringScale'>) {
  const innerRingSize = Math.round(size * 0.78);
  const innerOffset = Math.round(size * 0.16);
  const starSize = Math.max(12, Math.round(size * 0.22));

  return (
    <View style={[styles.motifRoot, { width: size, height: size }]}>
      <View
        style={[
          styles.absLayer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
            borderWidth: strokeWidth,
          },
        ]}
      />
      <View
        style={[
          styles.absLayer,
          {
            width: innerRingSize,
            height: innerRingSize,
            borderRadius: innerRingSize / 2,
            borderColor: color,
            borderWidth: strokeWidth,
            transform: [{ translateX: innerOffset }, { translateY: -Math.round(innerOffset * 0.35) }],
          },
        ]}
      />
      <View
        style={[
          styles.absLayer,
          {
            top: Math.round(size * 0.2),
            right: Math.round(size * 0.14),
          },
        ]}
      >
        <RubElHizbMedallion size={starSize} color={color} strokeWidth={strokeWidth} />
      </View>
    </View>
  );
}

function GeometricMotif({
  pattern,
  size,
  color,
  strokeWidth,
  ringScale,
}: GeometricMotifProps) {
  switch (pattern) {
    case 'rosette':
      return (
        <ShamsaRosette
          size={size}
          color={color}
          strokeWidth={strokeWidth}
          ringScale={ringScale}
        />
      );
    case 'lattice':
      return <MashrabiyaLattice size={size} color={color} strokeWidth={strokeWidth} />;
    case 'arch':
      return <MihrabArch size={size} color={color} strokeWidth={strokeWidth} />;
    case 'crescent':
      return <HilalArcs size={size} color={color} strokeWidth={strokeWidth} />;
    case 'medallion':
    default:
      return (
        <RubElHizbMedallion
          size={size}
          color={color}
          strokeWidth={strokeWidth}
          ringScale={ringScale}
        />
      );
  }
}

interface ArabesqueBackdropProps {
  variant?: ArabesqueVariant;
  pattern?: ArabesquePattern;
  opacityMultiplier?: number;
}

export function ArabesqueBackdrop({
  variant = 'featured',
  pattern = 'medallion',
  opacityMultiplier = 1,
}: ArabesqueBackdropProps) {
  const { state, theme } = useMilla();
  const isRtl = (state?.language ?? 'ar') === 'ar';
  const lineColor = theme.isDark ? theme.foreground : theme.primary;

  if (variant === 'corner') {
    const cornerOpacity = (theme.isDark ? 0.038 : 0.05) * opacityMultiplier;
    return (
      <View pointerEvents="none" style={styles.container}>
        <View
          style={[
            styles.trailingCornerMedallion,
            isRtl ? styles.anchorLeft : styles.anchorRight,
            { opacity: cornerOpacity },
          ]}
        >
          <GeometricMotif
            pattern={pattern}
            size={88}
            color={lineColor}
            strokeWidth={1}
            ringScale={1.2}
          />
        </View>
      </View>
    );
  }

  if (variant === 'subtle') {
    const topRightSubtleOpacity = (theme.isDark ? 0.042 : 0.055) * opacityMultiplier;
    const bottomLeftSubtleOpacity = (theme.isDark ? 0.038 : 0.05) * opacityMultiplier;
    return (
      <View pointerEvents="none" style={styles.container}>
        <View style={[styles.subtleTopRightMedallion, { opacity: topRightSubtleOpacity }]}>
          <GeometricMotif
            pattern={pattern}
            size={112}
            color={lineColor}
            strokeWidth={1}
            ringScale={1.2}
          />
        </View>
        <View style={[styles.subtleBottomLeftMedallion, { opacity: bottomLeftSubtleOpacity }]}>
          <GeometricMotif
            pattern={pattern}
            size={96}
            color={lineColor}
            strokeWidth={1}
            ringScale={1.2}
          />
        </View>
      </View>
    );
  }

  const topRightOpacity = (theme.isDark ? 0.065 : 0.085) * opacityMultiplier;
  const bottomLeftOpacity = (theme.isDark ? 0.06 : 0.08) * opacityMultiplier;
  const centerOpacity = (theme.isDark ? 0.032 : 0.045) * opacityMultiplier;
  const cornerStarOpacity = (theme.isDark ? 0.055 : 0.075) * opacityMultiplier;

  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={[styles.centerWrap, { opacity: centerOpacity }]}>
        <GeometricMotif
          pattern={pattern}
          size={188}
          color={lineColor}
          strokeWidth={1}
          ringScale={1.18}
        />
      </View>

      <View style={[styles.topRightMedallion, { opacity: topRightOpacity }]}>
        <GeometricMotif
          pattern={pattern}
          size={156}
          color={lineColor}
          strokeWidth={1.15}
          ringScale={1.24}
        />
      </View>

      <View style={[styles.bottomLeftMedallion, { opacity: bottomLeftOpacity }]}>
        <GeometricMotif
          pattern={pattern}
          size={132}
          color={lineColor}
          strokeWidth={1.1}
          ringScale={1.24}
        />
      </View>

      <View style={[styles.topLeftCornerStar, { opacity: cornerStarOpacity }]}>
        <RubElHizbMedallion size={26} color={lineColor} strokeWidth={1} />
      </View>

      <View style={[styles.bottomRightCornerStar, { opacity: cornerStarOpacity }]}>
        <RubElHizbMedallion size={26} color={lineColor} strokeWidth={1} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  centerWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRightMedallion: {
    position: 'absolute',
    top: -54,
    right: -46,
  },
  bottomLeftMedallion: {
    position: 'absolute',
    bottom: -48,
    left: -40,
  },
  subtleTopRightMedallion: {
    position: 'absolute',
    top: -42,
    right: -38,
  },
  subtleBottomLeftMedallion: {
    position: 'absolute',
    bottom: -38,
    left: -34,
  },
  trailingCornerMedallion: {
    position: 'absolute',
    bottom: -32,
  },
  anchorLeft: {
    left: -28,
  },
  anchorRight: {
    right: -28,
  },
  topLeftCornerStar: {
    position: 'absolute',
    top: 18,
    left: 18,
  },
  bottomRightCornerStar: {
    position: 'absolute',
    bottom: 18,
    right: 18,
  },
  motifRoot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  absLayer: {
    position: 'absolute',
  },
  starSquare: {
    position: 'absolute',
    borderRadius: 3,
  },
  rosetteSquare: {
    position: 'absolute',
    borderRadius: 4,
  },
  latticeDiamond: {
    position: 'absolute',
    borderRadius: 2,
  },
  innerDiamond: {
    position: 'absolute',
    borderRadius: 2,
  },
  rotated30: {
    transform: [{ rotate: '30deg' }],
  },
  rotated45: {
    transform: [{ rotate: '45deg' }],
  },
  rotated60: {
    transform: [{ rotate: '60deg' }],
  },
});
