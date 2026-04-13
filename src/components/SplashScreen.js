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
        {/* Logo */}
        <div
          className="w-64 mx-auto rounded-2xl px-6 py-5 shadow-xl mb-6"
          style={{
            backgroundColor: 'var(--color-primary-50)',
            boxShadow: '0 20px 40px rgba(74, 107, 89, 0.3)',
          }}
        >
          <img src="/AromaPlus.svg" alt="ארומה פלוס" className="w-full h-auto object-contain" />
        </div>
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
