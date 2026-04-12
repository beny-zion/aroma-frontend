'use client';

import { useState, useEffect } from 'react';
import { deviceTypesAPI } from '@/lib/api';
import { Settings, Plus, Search, Edit3, Trash2, Package, AlertTriangle, Pause, Play } from 'lucide-react';

export default function DeviceTypesPage() {
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // מודלים
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedDeviceType, setSelectedDeviceType] = useState(null);

  // טופס
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mlPerRefill: 100,
    defaultRefillInterval: 45,
    price: 0,
    stockQuantity: 0,
    minStockAlert: 5,
    isActive: true
  });

  // כמות להוספה למלאי
  const [stockToAdd, setStockToAdd] = useState('');

  useEffect(() => {
    loadDeviceTypes();
  }, []);

  async function loadDeviceTypes() {
    try {
      setLoading(true);
      const data = await deviceTypesAPI.getAll();
      setDeviceTypes(data);
    } catch (err) {
      console.error('Error loading device types:', err);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      mlPerRefill: 100,
      defaultRefillInterval: 45,
      price: 0,
      stockQuantity: 0,
      minStockAlert: 5,
      isActive: true
    });
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!formData.name) return;

    try {
      setSaving(true);
      await deviceTypesAPI.create(formData);
      await loadDeviceTypes();
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      console.error('Error creating device type:', err);
      alert(err.message || 'שגיאה ביצירת סוג מכשיר');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!formData.name || !selectedDeviceType) return;

    try {
      setSaving(true);
      await deviceTypesAPI.update(selectedDeviceType._id, formData);
      await loadDeviceTypes();
      setShowEditModal(false);
      setSelectedDeviceType(null);
      resetForm();
    } catch (err) {
      console.error('Error updating device type:', err);
      alert(err.message || 'שגיאה בעדכון סוג מכשיר');
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(deviceType) {
    setSelectedDeviceType(deviceType);
    setFormData({
      name: deviceType.name,
      description: deviceType.description || '',
      mlPerRefill: deviceType.mlPerRefill || 100,
      defaultRefillInterval: deviceType.defaultRefillInterval || 45,
      price: deviceType.price || 0,
      stockQuantity: deviceType.stockQuantity || 0,
      minStockAlert: deviceType.minStockAlert || 5,
      isActive: deviceType.isActive !== false
    });
    setShowEditModal(true);
  }

  function openAddStockModal(deviceType) {
    setSelectedDeviceType(deviceType);
    setStockToAdd('');
    setShowAddStockModal(true);
  }

  async function handleAddStock(e) {
    e.preventDefault();
    if (!stockToAdd || !selectedDeviceType) return;

    try {
      setSaving(true);
      await deviceTypesAPI.addStock(selectedDeviceType._id, parseInt(stockToAdd));
      await loadDeviceTypes();
      setShowAddStockModal(false);
      setSelectedDeviceType(null);
      setStockToAdd('');
    } catch (err) {
      console.error('Error adding stock:', err);
      alert(err.message || 'שגיאה בהוספת מלאי');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(deviceType) {
    try {
      setSaving(true);
      await deviceTypesAPI.update(deviceType._id, { isActive: !deviceType.isActive });
      await loadDeviceTypes();
    } catch (err) {
      console.error('Error toggling status:', err);
      alert('שגיאה בעדכון סטטוס');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(deviceType) {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את "${deviceType.name}"?`)) return;

    try {
      setSaving(true);
      await deviceTypesAPI.delete(deviceType._id);
      await loadDeviceTypes();
    } catch (err) {
      console.error('Error deleting device type:', err);
      alert(err.message || 'שגיאה במחיקת סוג מכשיר');
    } finally {
      setSaving(false);
    }
  }

  const filteredDeviceTypes = deviceTypes.filter(dt => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return dt.name?.toLowerCase().includes(search) ||
           dt.description?.toLowerCase().includes(search);
  });

  // סטטיסטיקות
  const totalStock = deviceTypes.reduce((sum, dt) => sum + (dt.stockQuantity || 0), 0);
  const lowStockCount = deviceTypes.filter(dt => dt.stockQuantity <= dt.minStockAlert).length;
  const activeCount = deviceTypes.filter(dt => dt.isActive !== false).length;

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
            <Settings className="w-7 h-7 text-(--color-primary)" />
            סוגי מכשירים
          </h1>
          <p className="page-subtitle">ניהול סוגי המכשירים במערכת</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          סוג מכשיר חדש
        </button>
      </div>

      {/* סטטיסטיקות */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-card-icon bg-(--color-primary-50)">
            <Settings className="w-5 h-5 text-(--color-primary)" />
          </div>
          <div>
            <div className="stat-card-label">סה"כ סוגים</div>
            <div className="stat-card-value text-gray-800">{deviceTypes.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon bg-green-50">
            <Play className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="stat-card-label">פעילים</div>
            <div className="stat-card-value text-(--color-primary)">{activeCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon bg-blue-50">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="stat-card-label">סה"כ מלאי</div>
            <div className="stat-card-value text-blue-600">{totalStock}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon bg-red-50">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="stat-card-label">מלאי נמוך</div>
            <div className="stat-card-value text-red-600">{lowStockCount}</div>
          </div>
        </div>
      </div>

      {/* חיפוש */}
      <div className="card">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="חיפוש לפי שם או תיאור..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
          />
        </div>
      </div>

      {/* טבלת סוגי מכשירים - Desktop */}
      <div className="table-container hide-mobile">
        <table>
          <thead>
            <tr>
              <th>שם</th>
              <th>תיאור</th>
              <th>מ"ל למילוי</th>
              <th>מחזור (ימים)</th>
              <th>מלאי</th>
              <th>סטטוס</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeviceTypes.map((deviceType) => {
              const isLowStock = deviceType.stockQuantity <= deviceType.minStockAlert;
              return (
                <tr key={deviceType._id}>
                  <td>
                    <span className="font-medium">{deviceType.name}</span>
                  </td>
                  <td className="text-sm text-gray-500">
                    {deviceType.description || '-'}
                  </td>
                  <td className="text-sm">
                    {deviceType.mlPerRefill} מ"ל
                  </td>
                  <td className="text-sm">
                    {deviceType.defaultRefillInterval} ימים
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isLowStock ? 'text-red-600' : 'text-(--color-primary)'}`}>
                        {deviceType.stockQuantity}
                      </span>
                      {isLowStock && (
                        <span className="text-xs text-red-500 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          מלאי נמוך!
                        </span>
                      )}
                      <button
                        onClick={() => openAddStockModal(deviceType)}
                        className="action-btn action-btn-primary"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        הוסף
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      deviceType.isActive !== false
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {deviceType.isActive !== false ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(deviceType)}
                        className="action-btn action-btn-edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        ערוך
                      </button>
                      <button
                        onClick={() => toggleStatus(deviceType)}
                        className={`action-btn ${
                          deviceType.isActive !== false
                            ? 'action-btn-warning'
                            : 'action-btn-primary'
                        }`}
                      >
                        {deviceType.isActive !== false ? (
                          <><Pause className="w-3.5 h-3.5" /> השבת</>
                        ) : (
                          <><Play className="w-3.5 h-3.5" /> הפעל</>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(deviceType)}
                        className="action-btn action-btn-danger"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        מחק
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredDeviceTypes.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Settings className="w-8 h-8" />
            </div>
            <p>לא נמצאו סוגי מכשירים</p>
          </div>
        )}
      </div>

      {/* כרטיסים - Mobile */}
      <div className="show-mobile-only space-y-3">
        {filteredDeviceTypes.map((deviceType) => {
          const isLowStock = deviceType.stockQuantity <= deviceType.minStockAlert;
          return (
            <div key={deviceType._id} className="mobile-card">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-800">{deviceType.name}</h3>
                  {deviceType.description && (
                    <p className="text-sm text-gray-500 mt-1">{deviceType.description}</p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  deviceType.isActive !== false
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {deviceType.isActive !== false ? 'פעיל' : 'לא פעיל'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                <div>
                  <span className="text-gray-500 block text-xs">מ"ל למילוי</span>
                  <span className="font-medium">{deviceType.mlPerRefill}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">מחזור</span>
                  <span className="font-medium">{deviceType.defaultRefillInterval} ימים</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">מלאי</span>
                  <span className={`font-bold ${isLowStock ? 'text-red-600' : 'text-(--color-primary)'}`}>
                    {deviceType.stockQuantity}
                  </span>
                  {isLowStock && (
                    <AlertTriangle className="w-3 h-3 text-red-500 inline mr-1" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openEditModal(deviceType)}
                  className="action-btn action-btn-edit flex-1 justify-center"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  ערוך
                </button>
                <button
                  onClick={() => openAddStockModal(deviceType)}
                  className="action-btn action-btn-primary flex-1 justify-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                  הוסף מלאי
                </button>
                <button
                  onClick={() => toggleStatus(deviceType)}
                  className={`action-btn flex-1 justify-center ${
                    deviceType.isActive !== false ? 'action-btn-warning' : 'action-btn-primary'
                  }`}
                >
                  {deviceType.isActive !== false ? (
                    <><Pause className="w-3.5 h-3.5" /> השבת</>
                  ) : (
                    <><Play className="w-3.5 h-3.5" /> הפעל</>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(deviceType)}
                  className="action-btn action-btn-danger"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredDeviceTypes.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Settings className="w-8 h-8" />
            </div>
            <p>לא נמצאו סוגי מכשירים</p>
          </div>
        )}
      </div>

      {/* מודל יצירה */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">סוג מכשיר חדש</h2>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">שם *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">תיאור</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">מ"ל למילוי</label>
                  <input
                    type="number"
                    value={formData.mlPerRefill}
                    onChange={(e) => setFormData({ ...formData, mlPerRefill: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">מחזור מילוי (ימים)</label>
                  <input
                    type="number"
                    value={formData.defaultRefillInterval}
                    onChange={(e) => setFormData({ ...formData, defaultRefillInterval: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">מלאי התחלתי</label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">התראת מלאי מינימלי</label>
                  <input
                    type="number"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={saving}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={!formData.name || saving}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving ? 'שומר...' : 'צור סוג מכשיר'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* מודל עריכה */}
      {showEditModal && selectedDeviceType && (
        <div className="modal-overlay">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">עריכת סוג מכשיר - {selectedDeviceType.name}</h2>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">שם *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">תיאור</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">מ"ל למילוי</label>
                  <input
                    type="number"
                    value={formData.mlPerRefill}
                    onChange={(e) => setFormData({ ...formData, mlPerRefill: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">מחזור מילוי (ימים)</label>
                  <input
                    type="number"
                    value={formData.defaultRefillInterval}
                    onChange={(e) => setFormData({ ...formData, defaultRefillInterval: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">מלאי נוכחי</label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">התראת מלאי מינימלי</label>
                  <input
                    type="number"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">סטטוס</label>
                <select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                >
                  <option value="active">פעיל</option>
                  <option value="inactive">לא פעיל</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedDeviceType(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={saving}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={!formData.name || saving}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving ? 'שומר...' : 'שמור שינויים'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* מודל הוספת מלאי */}
      {showAddStockModal && selectedDeviceType && (
        <div className="modal-overlay">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">הוספת מלאי</h2>
              <p className="text-gray-500 text-sm">{selectedDeviceType.name}</p>
              <p className="text-sm mt-1">מלאי נוכחי: <span className="font-bold">{selectedDeviceType.stockQuantity}</span></p>
            </div>

            <form onSubmit={handleAddStock} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">כמות להוספה *</label>
                <input
                  type="number"
                  value={stockToAdd}
                  onChange={(e) => setStockToAdd(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                  min="1"
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStockModal(false);
                    setSelectedDeviceType(null);
                    setStockToAdd('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={saving}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={!stockToAdd || saving}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving ? 'מוסיף...' : 'הוסף למלאי'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
