'use client';

import { useState, useEffect } from 'react';
import { scentsAPI } from '@/lib/api';
import { Droplets, Plus, Search, AlertTriangle, Package, TrendingUp } from 'lucide-react';

export default function ScentsPage() {
  const [scents, setScents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedScent, setSelectedScent] = useState(null);
  const [stockAmount, setStockAmount] = useState('');
  const [saving, setSaving] = useState(false);

  // טופס יצירת ריח חדש
  const [newScent, setNewScent] = useState({
    name: '',
    stockQuantity: '',
    description: ''
  });

  useEffect(() => {
    loadScents();
  }, []);

  async function loadScents() {
    try {
      setLoading(true);
      const data = await scentsAPI.getAll();
      setScents(data);
    } catch (err) {
      console.error('Error loading scents:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddStock() {
    if (!selectedScent || !stockAmount || parseInt(stockAmount) <= 0) return;

    try {
      setSaving(true);
      await scentsAPI.addStock(selectedScent._id, parseInt(stockAmount));
      await loadScents();
      setShowAddStockModal(false);
      setStockAmount('');
      setSelectedScent(null);
    } catch (err) {
      console.error('Error adding stock:', err);
      alert('שגיאה בהוספת מלאי');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateScent(e) {
    e.preventDefault();
    if (!newScent.name) return;

    try {
      setSaving(true);
      await scentsAPI.create({
        name: newScent.name,
        stockQuantity: parseInt(newScent.stockQuantity) || 0,
        description: newScent.description
      });
      await loadScents();
      setShowCreateModal(false);
      setNewScent({ name: '', stockQuantity: '', description: '' });
    } catch (err) {
      console.error('Error creating scent:', err);
      alert(err.message || 'שגיאה ביצירת ריח');
    } finally {
      setSaving(false);
    }
  }

  const totalStock = scents.reduce((sum, s) => sum + (s.stockQuantity || 0), 0);
  const lowStockScents = scents.filter(s => s.stockQuantity <= (s.minStockAlert || 500));

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="loading-spinner-inner">
          <div className="loading-spinner-circle" />
          <p className="loading-spinner-text">טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* כותרת */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Droplets className="w-7 h-7 text-(--color-primary)" />
            ריחות
          </h1>
          <p className="page-subtitle">ניהול מלאי ריחות</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="text-left">
            <div className="text-2xl font-bold text-(--color-primary)">{scents.length} ריחות</div>
            <div className="text-sm text-gray-500">
              סה"כ מלאי: {(totalStock / 1000).toFixed(1)} ליטר
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <Plus className="w-5 h-5" />
            ריח חדש
          </button>
        </div>
      </div>

      {/* התראת מלאי נמוך */}
      {lowStockScents.length > 0 && (
        <div className="card bg-red-50 border-red-200">
          <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            התראת מלאי נמוך
          </h3>
          <div className="flex flex-wrap gap-2">
            {lowStockScents.map(scent => (
              <span
                key={scent._id}
                className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm inline-flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" />
                {scent.name}: {scent.stockQuantity} מ"ל
              </span>
            ))}
          </div>
        </div>
      )}

      {/* טבלת ריחות */}
      {scents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scents.map(scent => {
            const isLowStock = scent.stockQuantity <= (scent.minStockAlert || 500);
            const stockPercentage = Math.min(100, (scent.stockQuantity / 10000) * 100);

            return (
              <div
                key={scent._id}
                className={`card ${isLowStock ? 'border-red-300 bg-red-50' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{scent.name}</h3>
                    {scent.description && (
                      <p className="text-sm text-gray-500">{scent.description}</p>
                    )}
                  </div>
                  {isLowStock && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      מלאי נמוך
                    </span>
                  )}
                </div>

                {/* בר מלאי */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">מלאי נוכחי</span>
                    <span className={`font-bold ${isLowStock ? 'text-red-600' : 'text-(--color-primary)'}`}>
                      {scent.stockQuantity.toLocaleString()} מ"ל
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        isLowStock ? 'bg-red-500' : 'bg-(--color-primary)'
                      }`}
                      style={{ width: `${stockPercentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {(scent.stockQuantity / 1000).toFixed(2)} ליטר
                  </div>
                </div>

                {/* כפתור הוספת מלאי */}
                <button
                  onClick={() => {
                    setSelectedScent(scent);
                    setShowAddStockModal(true);
                  }}
                  className="w-full btn-primary text-center"
                >
                  <Plus className="w-4 h-4" />
                  הוסף מלאי
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Droplets className="w-8 h-8" />
          </div>
          <p>אין ריחות במערכת. הוסף ריח חדש כדי להתחיל.</p>
        </div>
      )}

      {/* מודל הוספת מלאי */}
      {showAddStockModal && selectedScent && (
        <div className="modal-overlay">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">הוספת מלאי - {selectedScent.name}</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מלאי נוכחי
                </label>
                <div className="text-2xl font-bold text-gray-800">
                  {selectedScent.stockQuantity.toLocaleString()} מ"ל
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  כמות להוספה (מ"ל)
                </label>
                <input
                  type="number"
                  value={stockAmount}
                  onChange={(e) => setStockAmount(e.target.value)}
                  placeholder="לדוגמה: 1000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent text-lg"
                  min="1"
                />
              </div>

              {stockAmount && parseInt(stockAmount) > 0 && (
                <div className="p-3 bg-(--color-primary-50) rounded-xl">
                  <div className="text-sm text-gray-600">מלאי חדש יהיה:</div>
                  <div className="text-xl font-bold text-(--color-primary)">
                    {(selectedScent.stockQuantity + parseInt(stockAmount)).toLocaleString()} מ"ל
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddStockModal(false);
                  setStockAmount('');
                  setSelectedScent(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={saving}
              >
                ביטול
              </button>
              <button
                onClick={handleAddStock}
                disabled={!stockAmount || parseInt(stockAmount) <= 0 || saving}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? 'שומר...' : 'הוסף מלאי'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* מודל יצירת ריח חדש */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">ריח חדש</h2>
            </div>

            <form onSubmit={handleCreateScent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שם הריח *
                </label>
                <input
                  type="text"
                  value={newScent.name}
                  onChange={(e) => setNewScent({ ...newScent, name: e.target.value })}
                  placeholder="לדוגמה: לבנדר"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מלאי התחלתי (מ"ל)
                </label>
                <input
                  type="number"
                  value={newScent.stockQuantity}
                  onChange={(e) => setNewScent({ ...newScent, stockQuantity: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תיאור
                </label>
                <input
                  type="text"
                  value={newScent.description}
                  onChange={(e) => setNewScent({ ...newScent, description: e.target.value })}
                  placeholder="תיאור קצר של הריח"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewScent({ name: '', stockQuantity: '', description: '' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={saving}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={!newScent.name || saving}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving ? 'שומר...' : 'צור ריח'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
