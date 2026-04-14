'use client';

import { useState, useEffect } from 'react';

const loadingMessages = [
  'מתחבר לשרת...',
  'השרת נכנס לפעולה...',
  'זה יכול לקחת מספר שניות...',
  'מחמם את המנועים...',
  'עוד כמה רגעים...',
  'מכין את הכל בשבילך...',
  'כמעט שם...',
  'עוד קצת סבלנות...',
  'השרת מתעורר מתנומה...',
  'מארגן את הנתונים...',
  'רק עוד רגע קט...',
  'תודה על הסבלנות!',
  'השרת שותה קפה בוקר...',
  'אנחנו בדרך...',
  'הריחות כבר מגיעים...',
];

export default function ServerLoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const [showMessages, setShowMessages] = useState(false);
  const [progress, setProgress] = useState(0);

  // Start showing rotating messages after 2 seconds (warm server won't even reach this)
  useEffect(() => {
    const t = setTimeout(() => setShowMessages(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // Rotate messages every 3.5 seconds with fade transition
  useEffect(() => {
    if (!showMessages) return;
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setMessageIndex(prev => (prev + 1) % loadingMessages.length);
        setFadeIn(true);
      }, 350);
    }, 3500);
    return () => clearInterval(interval);
  }, [showMessages]);

  // Animate progress bar (indeterminate but with slow progress feel)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return 90 + Math.random() * 2;
        return prev + (90 - prev) * 0.02 + Math.random() * 0.5;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #F0F5F2 0%, #E1EBE5 30%, #C3D7CB 60%, #E1EBE5 100%)',
      }}
    >
      {/* Background decoration circles */}
      <div
        className="absolute w-96 h-96 rounded-full"
        style={{
          top: '-10%',
          right: '-10%',
          background: 'radial-gradient(circle, rgba(107,142,123,0.15) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute w-80 h-80 rounded-full"
        style={{
          bottom: '-5%',
          left: '-5%',
          background: 'radial-gradient(circle, rgba(107,142,123,0.1) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute w-60 h-60 rounded-full"
        style={{
          top: '50%',
          left: '20%',
          transform: 'translateY(-50%)',
          background: 'radial-gradient(circle, rgba(107,142,123,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative text-center px-6">
        {/* Logo card */}
        <div
          className="w-56 md:w-64 mx-auto rounded-2xl px-6 py-5 mb-6"
          style={{
            backgroundColor: 'var(--color-primary-50)',
            boxShadow: '0 20px 40px rgba(74, 107, 89, 0.2)',
          }}
        >
          <img
            src="/AromaPlus.svg"
            alt="ארומה פלוס"
            className="w-full h-auto object-contain"
          />
        </div>

        <p
          className="text-sm font-medium mb-8"
          style={{ color: 'var(--color-primary)' }}
        >
          מערכת ניהול מכשירי ריח
        </p>

        {/* Progress bar */}
        <div
          className="w-52 md:w-64 mx-auto h-1.5 rounded-full overflow-hidden mb-6"
          style={{ backgroundColor: 'var(--color-primary-100)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              backgroundColor: 'var(--color-primary)',
              width: `${progress}%`,
              transition: 'width 0.3s ease-out',
            }}
          />
        </div>

        {/* Rotating message area */}
        <div className="h-14 flex flex-col items-center justify-center">
          <p
            className="text-sm font-medium"
            style={{
              color: 'var(--color-primary-dark)',
              opacity: showMessages ? (fadeIn ? 1 : 0) : 1,
              transition: 'opacity 0.35s ease-in-out',
            }}
          >
            {showMessages ? loadingMessages[messageIndex] : 'טוען...'}
          </p>

          {/* Secondary hint - only shows after the rotating messages start */}
          {showMessages && (
            <p
              className="text-xs mt-2"
              style={{
                color: 'var(--color-primary-300, #A5C3B1)',
                opacity: fadeIn ? 0.7 : 0,
                transition: 'opacity 0.35s ease-in-out',
              }}
            >
              השרת מתעורר אחרי חוסר פעילות
            </p>
          )}
        </div>

        {/* Animated dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: 'var(--color-primary)',
                animation: `serverLoadingPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes serverLoadingPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
