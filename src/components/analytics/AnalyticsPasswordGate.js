'use client';

import { useState, useEffect } from 'react';
import { Lock, BarChart3, Loader2, Eye, EyeOff } from 'lucide-react';
import { analyticsAPI } from '@/lib/api';

export default function AnalyticsPasswordGate({ children }) {
  const [password, setPassword] = useState('');
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Check if already verified in this session
  useEffect(() => {
    const stored = sessionStorage.getItem('analytics_admin_password');
    if (stored) {
      analyticsAPI.verifyPassword(stored)
        .then(() => setVerified(true))
        .catch(() => sessionStorage.removeItem('analytics_admin_password'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    setError('');
    setLoading(true);
    try {
      await analyticsAPI.verifyPassword(password);
      sessionStorage.setItem('analytics_admin_password', password);
      setVerified(true);
    } catch {
      setError('סיסמה שגויה');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F0F5F2 0%, #E1EBE5 50%, #F9FAFB 100%)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  if (verified) return children;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl" style={{ background: 'linear-gradient(135deg, #F0F5F2 0%, #E1EBE5 50%, #F9FAFB 100%)' }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#E1EBE5' }}>
            <BarChart3 className="w-8 h-8" style={{ color: '#4A6B59' }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">אנליטיקס - ארומה פלוס</h1>
          <p className="text-gray-500 mt-1 text-sm">הזן סיסמת גישה לדשבורד</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline-block ml-1" />
                סיסמת אדמין
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="הזן סיסמה..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:outline-none transition-all"
                  style={{ '--tw-ring-color': '#6B8E7B' }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!password.trim()}
              className="w-full py-3 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#6B8E7B' }}
              onMouseEnter={(e) => { if (!e.target.disabled) e.target.style.backgroundColor = '#4A6B59'; }}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#6B8E7B'}
            >
              כניסה לדשבורד
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          דשבורד אנליטיקס פנימי - לצוות פיתוח וניהול בלבד
        </p>
      </div>
    </div>
  );
}
