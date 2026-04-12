'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Mail, ArrowLeft, Loader2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverReady, setServerReady] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // Wake up the server on page load (Render free tier sleeps after inactivity)
  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then(() => setServerReady(true))
      .catch(() => setServerReady(true));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // MUST create AudioContext AND schedule sound synchronously during click event
    // After an await, browsers no longer consider it a user gesture
    let audioCtx = null;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        audioCtx = new AC();
        // Schedule the chime to play ~1.5s in the future (when splash screen will be visible)
        const delay = 1.8;
        const masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.1;
        masterGain.connect(audioCtx.destination);

        // Note 1: C5 (523 Hz)
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.value = 523.25;
        gain1.gain.setValueAtTime(0, audioCtx.currentTime + delay);
        gain1.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + delay + 0.08);
        gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + 0.6);
        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc1.start(audioCtx.currentTime + delay);
        osc1.stop(audioCtx.currentTime + delay + 0.6);

        // Note 2: E5 (659 Hz)
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.value = 659.25;
        gain2.gain.setValueAtTime(0, audioCtx.currentTime + delay + 0.15);
        gain2.gain.linearRampToValueAtTime(0.7, audioCtx.currentTime + delay + 0.22);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + 0.9);
        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.start(audioCtx.currentTime + delay + 0.15);
        osc2.stop(audioCtx.currentTime + delay + 0.9);

        // Note 3: G5 (783 Hz)
        const osc3 = audioCtx.createOscillator();
        const gain3 = audioCtx.createGain();
        osc3.type = 'sine';
        osc3.frequency.value = 783.99;
        gain3.gain.setValueAtTime(0, audioCtx.currentTime + delay + 0.35);
        gain3.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + delay + 0.42);
        gain3.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + 1.2);
        osc3.connect(gain3);
        gain3.connect(masterGain);
        osc3.start(audioCtx.currentTime + delay + 0.35);
        osc3.stop(audioCtx.currentTime + delay + 1.2);

        // Auto-cleanup after sound finishes
        setTimeout(() => {
          audioCtx.close().catch(() => {});
        }, (delay + 2) * 1000);
      }
    } catch {}

    try {
      await login(email, password);
      sessionStorage.setItem('aroma_just_logged_in', '1');
      router.replace('/');
    } catch (err) {
      // Clean up AudioContext if login fails (stop scheduled sound)
      if (audioCtx) {
        try { audioCtx.close(); } catch {}
      }
      setError(err.message || 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #F0F5F2 0%, #E1EBE5 50%, #F9FAFB 100%)' }}>
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20" style={{ background: 'var(--color-primary-200)' }} />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10" style={{ background: 'var(--color-primary)' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center shadow-lg mb-5">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-primary-dark)]">ארומה פלוס</h1>
          <p className="text-[var(--color-text-muted)] mt-1 text-sm">מערכת ניהול מכשירי ריח</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-[var(--color-border-light)] p-8">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1 text-center">
            התחברות למערכת
          </h2>
          <p className="text-center text-sm text-[var(--color-text-muted)] mb-6">
            הזן את פרטי הגישה שלך
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl text-sm"
                style={{
                  backgroundColor: 'var(--color-status-red-bg)',
                  color: 'var(--color-status-red-text)'
                }}>
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                אימייל
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  className="w-full pl-11 pr-4 py-3 border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] transition-all outline-none"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                סיסמה
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  dir="ltr"
                  className="w-full pl-11 pr-4 py-3 border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!serverReady && (
              <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>מתחבר לשרת...</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn-primary w-full text-lg py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  מתחבר...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  התחברות
                  <ArrowLeft className="w-5 h-5" />
                </span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--color-text-muted)] mt-8">
          ארומה פלוס &copy; {new Date().getFullYear()} | מערכת ניהול מקצועית
        </p>
      </div>
    </div>
  );
}
