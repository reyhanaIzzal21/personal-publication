import { ImageResponse } from 'next/og';
import { getPublishedPublicationBySlug } from '@/lib/publications/queries';
import { getNewsreaderFont } from '@/lib/seo/font';

export const alt = 'Publication Open Graph Image';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const { data: publication } = await getPublishedPublicationBySlug(slug);

  const fontData = await getNewsreaderFont();

  // If not found or draft, render clean branded fallback
  if (!publication) {
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            <div style={{ width: '100%', height: '1px', backgroundColor: '#E2DAC4' }} />
          </div>
          <div style={{ fontSize: 56, color: '#1A1816', fontWeight: 500 }}>
            Publication Not Found
          </div>
          <div style={{ width: '100%', height: '1px', backgroundColor: '#E2DAC4' }} />
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

  // Determine dynamic font size based on title length to prevent clipping
  const titleLength = publication.title.length;
  let titleFontSize = 60;
  if (titleLength > 80) {
    titleFontSize = 42;
  } else if (titleLength > 50) {
    titleFontSize = 50;
  }

  const hasSubtitle = Boolean(publication.subtitle && publication.subtitle.trim().length > 0);

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
          padding: '64px 80px',
          fontFamily: fontData ? 'Newsreader, Georgia, serif' : 'Georgia, serif',
        }}
      >
        {/* Top bar with Author identity & Content Type badge */}
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
                fontSize: 15,
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
                padding: '4px 12px',
                border: '1px solid #E2DAC4',
                borderRadius: '4px',
              }}
            >
              {publication.contentType.toUpperCase()}
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

        {/* Center: Title and Subtitle */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            maxWidth: '1040px',
            marginTop: 'auto',
            marginBottom: 'auto',
            paddingTop: '16px',
            paddingBottom: '16px',
          }}
        >
          <div
            style={{
              fontSize: titleFontSize,
              color: '#1A1816',
              lineHeight: 1.18,
              fontWeight: 500,
              textWrap: 'balance',
            }}
          >
            {publication.title}
          </div>
          {hasSubtitle && (
            <div
              style={{
                fontSize: titleLength > 70 ? 20 : 23,
                color: '#686156',
                lineHeight: 1.4,
              }}
            >
              {publication.subtitle}
            </div>
          )}
        </div>

        {/* Bottom bar: Subject Category and Domain */}
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
              {publication.subject}
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
