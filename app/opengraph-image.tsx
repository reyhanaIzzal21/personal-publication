import { ImageResponse } from 'next/og';
import { getNewsreaderFont } from '@/lib/seo/font';

export const alt = 'Reyhana Izzal — Personal Publication';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  const fontData = await getNewsreaderFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#F4EFE6',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          fontFamily: fontData ? 'Newsreader, Georgia, serif' : 'Georgia, serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#686156',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              REYHANA IZZAL
            </div>
            <div
              style={{
                fontSize: 14,
                color: '#686156',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              EDITORIAL PUBLICATION
            </div>
          </div>
          <div
            style={{
              width: '100%',
              height: '1px',
              backgroundColor: '#E2DAC4',
            }}
          />
        </div>

        {/* Hero Title & Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1040px' }}>
          <div
            style={{
              fontSize: 68,
              color: '#1A1816',
              lineHeight: 1.15,
              fontWeight: 500,
            }}
          >
            Personal Publication
          </div>
          <div
            style={{
              fontSize: 24,
              color: '#686156',
              lineHeight: 1.45,
            }}
          >
            An editorial publication featuring research, hypotheses, essays, and analysis on technology, AI, economics, and society.
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              width: '100%',
              height: '1px',
              backgroundColor: '#E2DAC4',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: 15,
                color: '#686156',
                letterSpacing: '0.04em',
              }}
            >
              Research · Hypothesis · Essay · Analysis
            </div>
            <div
              style={{
                fontSize: 15,
                color: '#686156',
              }}
            >
              reyhanizzal.com
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [
            {
              name: 'Newsreader',
              data: fontData,
              style: 'normal',
              weight: 500,
            },
          ]
        : undefined,
    }
  );
}
