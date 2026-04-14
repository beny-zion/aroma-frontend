import { ImageResponse } from 'next/og';

export const alt = 'ארומה פלוס - מערכת ניהול מכשירי ריח';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  // Load Heebo font for Hebrew rendering
  const heeboRegular = await fetch(
    'https://fonts.gstatic.com/s/heebo/v26/NGSpv5_NC0k9P_v6ZUCbLRAHxK1EiSycduml.woff2'
  ).then(res => res.arrayBuffer());

  const heeboBold = await fetch(
    'https://fonts.gstatic.com/s/heebo/v26/NGSpv5_NC0k9P_v6ZUCbLRAHxK1EiSysdUmm.woff2'
  ).then(res => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #F0F5F2 0%, #E1EBE5 30%, #C3D7CB 60%, #E1EBE5 100%)',
          fontFamily: 'Heebo',
          direction: 'rtl',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 450,
            height: 450,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(107,142,123,0.2) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(107,142,123,0.15) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '45%',
            left: '10%',
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(107,142,123,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Main card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'white',
            borderRadius: 32,
            padding: '56px 80px',
            boxShadow: '0 25px 60px rgba(74, 107, 89, 0.15)',
          }}
        >
          {/* Logo icon placeholder + brand name */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              marginBottom: 16,
            }}
          >
            {/* Icon circle */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                backgroundColor: '#6B8E7B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Simple leaf/aroma SVG */}
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3c-1.5 2-3 4.5-3 7 0 3.3 2.7 6 6 6 1.5 0 2.8-.5 3.8-1.4C18.3 17.5 15.4 20 12 20c-4.4 0-8-3.6-8-8 0-5.3 6-9.7 8-9z"
                  fill="white"
                  opacity="0.9"
                />
                <path
                  d="M15 7c-1 1.5-2 3.5-2 5.5 0 2 1.3 3.5 3 3.5s3-1.5 3-3.5C19 10.5 17 8.5 15 7z"
                  fill="white"
                  opacity="0.6"
                />
              </svg>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 56, fontWeight: 700, color: '#1F2937', lineHeight: 1.1 }}>
                ארומה פלוס
              </span>
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              width: 80,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#6B8E7B',
              marginTop: 8,
              marginBottom: 20,
            }}
          />

          {/* Subtitle */}
          <span style={{ fontSize: 26, color: '#6B7280', fontWeight: 400 }}>
            מערכת ניהול מכשירי ריח
          </span>
        </div>

        {/* Bottom features strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 32,
            marginTop: 40,
          }}
        >
          {['מעקב מכשירים', 'ניהול טכנאים', 'חשבוניות', 'דוחות'].map((text) => (
            <div
              key={text}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#4A6B59',
                fontSize: 18,
                fontWeight: 400,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#8BA99A',
                }}
              />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Heebo',
          data: heeboRegular,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'Heebo',
          data: heeboBold,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  );
}
