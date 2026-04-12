'use client';

import { useState, useEffect } from 'react';
import { refillsAPI, scentsAPI } from '@/lib/api';

/**
 * Quick Refill Modal Component
 * פופ-אפ מהיר לביצוע מילוי
 */
export default function QuickRefillModal({ device, onClose, onSuccess }) {
  const [quantity, setQuantity] = useState(100);
  const [selectedScent, setSelectedScent] = useState(device.scentId?._id || '');
  const [scents, setScents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingScents, setLoadingScents] = useState(true);
  const [error, setError] = useState(null);

  // טעינת רשימת הריחות
  useEffect(() => {
    async function loadScents() {
      try {
        const data = await scentsAPI.getAll();
        setScents(data.scents || []);
      } catch (err) {
        console.error('Error loading scents:', err);
      } finally {
        setLoadingScents(false);
      }
    }
    loadScents();
  }, []);

  // ביצוע המילוי
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await refillsAPI.create({
        deviceId: device._id,
        scentId: selectedScent,
        quantityMl: quantity,
        refillDate: new Date().toISOString(),
        notes: 'מילוי מהיר מהמערכת'
      });

      onSuccess?.(result);
    } catch (err) {
      setError(err.message || 'שגיאה בביצוע המילוי');
    } finally {
      setLoading(false);
    }
  };

  // סגירה בלחיצה על הרקע
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-l from-[var(--color-primary-50)] to-white p-5 border-b border-[var(--color-border-light)]">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                ביצוע מילוי
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {device.deviceType} - {device.locationInBranch || device.branchId?.branchName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn-icon hover:bg-gray-100"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* שגיאה */}
          {error && (
            <div className="p-3 bg-[var(--color-status-red-bg)] text-[var(--color-status-red-text)] rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* כמות מילוי */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              כמות מילוי (מ"ל)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(10, q - 10))}
                className="btn-icon bg-gray-100 hover:bg-gray-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="flex-1 text-center text-2xl font-bold p-3 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                min="10"
                max="500"
                step="10"
              />
              <button
                type="button"
                onClick={() => setQuantity(q => Math.min(500, q + 10))}
                className="btn-icon bg-gray-100 hover:bg-gray-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            {/* Quick amounts */}
            <div className="flex gap-2 mt-3">
              {[50, 100, 150, 200].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setQuantity(amount)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    quantity === amount
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {amount} מ"ל
                </button>
              ))}
            </div>
          </div>

          {/* סוג ריח */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              סוג ריח
            </label>
            {loadingScents ? (
              <div className="p-3 bg-gray-50 rounded-xl text-center text-gray-400">
                טוען ריחות...
              </div>
            ) : (
              <select
                value={selectedScent}
                onChange={(e) => setSelectedScent(e.target.value)}
                className="w-full p-3 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white"
                required
              >
                <option value="">בחר ריח</option>
                {scents.map((scent) => (
                  <option key={scent._id} value={scent._id}>
                    {scent.name} {scent.stockQuantity && `(${scent.stockQuantity} מ"ל במלאי)`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading || !selectedScent}
              className="btn-primary flex-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  שומר...
                </span>
              ) : (
                'אישור מילוי'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
