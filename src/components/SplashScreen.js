'use client';

import { useState, useEffect } from 'react';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('entering'); // entering -> visible -> exiting -> done

  useEffect(() => {
    // Animation timeline
    const t1 = setTimeout(() => setPhase('visible'), 100);
    const t2 = setTimeout(() => setPhase('exiting'), 2200);
    const t3 = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  if (phase === 'done') return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #F0F5F2 0%, #E1EBE5 30%, #C3D7CB 60%, #E1EBE5 100%)',
        opacity: phase === 'exiting' ? 0 : 1,
        transition: 'opacity 0.6s ease-out',
      }}
    >
      {/* Subtle background circles */}
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
        className="relative text-center"
        style={{
          opacity: phase === 'entering' ? 0 : phase === 'exiting' ? 0 : 1,
          transform: phase === 'entering' ? 'scale(0.8) translateY(20px)' : phase === 'exiting' ? 'scale(1.05) translateY(-10px)' : 'scale(1) translateY(0)',
          transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Logo icon */}
        <div
          className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center shadow-xl mb-6"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
            boxShadow: '0 20px 40px rgba(74, 107, 89, 0.3)',
          }}
        >
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>

        {/* Brand name */}
        <h1
          className="text-4xl font-bold mb-2"
          style={{ color: 'var(--color-primary-dark)' }}
        >
          ארומה פלוס
        </h1>
        <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
          מערכת ניהול מכשירי ריח
        </p>

        {/* Loading dots */}
        <div className="flex items-center justify-center gap-1.5 mt-8">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                backgroundColor: 'var(--color-primary)',
                opacity: 0.5,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
