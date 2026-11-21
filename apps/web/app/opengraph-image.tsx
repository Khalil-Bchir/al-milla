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
              borderRadius: 999,
              padding: '10px 22px',
              background: 'rgba(255, 142, 121, 0.16)',
              border: '1px solid rgba(255, 142, 121, 0.45)',
              color: '#ff8e79',
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            <span>Quran Memorization PWA • Hafs an Asim</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#dce8e2' }}>
            app.al-milla.khalilbchir.pro
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 960 }}>
          <div style={{ fontSize: 70, fontWeight: 800, lineHeight: 1.1, color: '#ffffff' }}>
            Al-Millah
          </div>
          <div style={{ fontSize: 34, lineHeight: 1.35, color: '#dce8e2' }}>
            Guided daily memorization, spaced revision, self-testing, and Uthmani Mushaf.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, fontSize: 22, color: '#9fd0c5' }}>
          <span>Free Forever</span>
          <span>•</span>
          <span>Offline-Capable</span>
          <span>•</span>
          <span>Private & Local-First</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
