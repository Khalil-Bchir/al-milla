import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';
export const alt = 'Al-Millah: Calm Quran Memorization Companion';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #073d35 0%, #0b4f45 55%, #062b25 100%)',
          color: '#f7f5ed',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              borderRadius: 999,
              padding: '10px 22px',
              background: 'rgba(255, 142, 121, 0.16)',
              border: '1px solid rgba(255, 142, 121, 0.45)',
              color: '#ff8e79',
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            <span>Hafs an Asim • 100% Free • Local-First</span>
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: '#dce8e2',
            }}
          >
            al-milla.khalilbchir.pro
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 960 }}>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.1, color: '#ffffff' }}>
            Al-Millah
          </div>
          <div style={{ fontSize: 34, lineHeight: 1.35, color: '#dce8e2' }}>
            Calm, private daily Quran memorization, spaced revision, and Uthmani Mushaf.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, fontSize: 22, color: '#9fd0c5' }}>
          <span>5-Stage Daily Loop</span>
          <span>•</span>
          <span>114 Surahs</span>
          <span>•</span>
          <span>No Ads • No Account Required</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
