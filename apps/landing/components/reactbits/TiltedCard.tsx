'use client';

import { useRef, useState } from 'react';

interface TiltedCardProps {
  children: React.ReactNode;
  className?: string;
  maxTiltDeg?: number;
}

/**
 * ReactBits-inspired TiltedCard: tactile 3D perspective tilt on hover.
 */
export function TiltedCard({ children, className = '', maxTiltDeg = 7 }: TiltedCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState<{ rx: number; ry: number; scale: number }>({
    rx: 0,
    ry: 0,
    scale: 1,
  });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rx: -py * maxTiltDeg * 2,
      ry: px * maxTiltDeg * 2,
      scale: 1.015,
    });
  };

  const handleLeave = () => {
    setTilt({ rx: 0, ry: 0, scale: 1 });
  };

  return (
    <div style={{ perspective: '1000px' }} className={className}>
      <div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="h-full transition-transform duration-300 ease-out will-change-transform"
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${tilt.scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
