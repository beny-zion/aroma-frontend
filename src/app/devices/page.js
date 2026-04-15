'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { devicesAPI } from '@/lib/api';
import { useScents, useActiveDeviceTypes, useBranches, useInvalidate } from '@/hooks/useData';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import { Cpu, Search, Plus, Edit3, Pause, Play, Trash2, Droplets } from 'lucide-react';

export default function DevicesPage() {
  // Shared dropdown data (cached globally via SWR)
  const { scents } = useScents();
  const { deviceTypes } = useActiveDeviceTypes();
  const { branches } = useBranches();
  const { invalidateDevices } = useInvalidate();

  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // מודלים
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // טופס יצירת/עריכת מכשיר
  const [deviceForm, setDeviceForm] = useState({
    branchId: '',
    deviceType: '',
    scentId: '',
    locationInBranch: '',
    isActive: true
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // SWR for paginated devices
  const deviceParams = new URLSearchParams({ page: currentPage, limit: 20 });
  if (filter !== 'all') deviceParams.set('status', filter);
  if (debouncedSearch) deviceParams.set('search', debouncedSearch);

  const { data: deviceData, isLoading: devicesLoading } = useSWR(`/devices?${deviceParams.toString()}`);
  const devices = deviceData?.data || [];
  const pagination = deviceData?.pagination || null;
  const loading = devicesLoading && !deviceData;

  // יצירת מכשיר
  async function handleCreateDevice(e) {
    e.preventDefault();
    if (!deviceForm.branchId || !deviceForm.deviceType) return;

    try {
      setSaving(true);
      await devicesAPI.create({
        branchId: deviceForm.branchId,
        deviceType: deviceForm.deviceType,
        scentId: deviceForm.scentId || undefined,
        locationInBranch: deviceForm.locationInBranch || '',
        isActive: true
      });
      invalidateDevices();
      setShowCreateModal(false);
      setDeviceForm({
        branchId: '',
        deviceType: '',
        scentId: '',
        locationInBranch: '',
        isActive: true
      });
    } catch (err) {
      console.error('Error creating device:', err);
      alert(err.message || 'שגיאה ביצירת מכשיר');
    } finally {
      setSaving(false);
    }
  }

  // עריכת מכשיר
  async function handleUpdateDevice(e) {
    e.preventDefault();
    if (!deviceForm.deviceType) return;

    try {
      setSaving(true);
      await devicesAPI.update(selectedDevice._id, {
        deviceType: deviceForm.deviceType,
        scentId: deviceForm.scentId || undefined,
        locationInBranch: deviceForm.locationInBranch || '',
        isActive: deviceForm.isActive
      });
      invalidateDevices();
      setShowEditModal(false);
      setSelectedDevice(null);
    } catch (err) {
      console.error('Error updating device:', err);
      alert(err.message || 'שגיאה בעדכון מכשיר');
    } finally {
      setSaving(false);
    }
  }

  // פתיחת מודל עריכה
  function openEditModal(device) {
    setSelectedDevice(device);
    setDeviceForm({
      branchId: device.branchId?._id || '',
      deviceType: device.deviceType,
      scentId: device.scentId?._id || '',
      locationInBranch: device.locationInBranch || '',
      isActive: device.isActive !== false
    });
    setShowEditModal(true);
  }

  // השהיית/הפעלת מכשיר
  async function toggleDeviceStatus(device) {
    try {
      setSaving(true);
      await devicesAPI.update(device._id, { isActive: device.isActive === false });
      invalidateDevices();
    } catch (err) {
      console.error('Error updating device status:', err);
      alert('שגיאה בעדכון סטטוס');
    } finally {
      setSaving(false);
    }
  }

  // מחיקת מכשיר
  async function deleteDevice(device) {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את המכשיר ${device.deviceType} מ-${device.branchId?.branchName}?`)) return;

    try {
      setSaving(true);
      await devicesAPI.delete(device._id);
      invalidateDevices();
    } catch (err) {
      console.error('Error deleting device:', err);
      alert('שגיאה במחיקת מכשיר');
    } finally {
      setSaving(false);
    }
  }

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('he-IL');
  };

  const getDaysSince = (date) => {
    if (!date) return null;
    return Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
  };

  // Devices are now filtered server-side via API params
  const filteredDevices = devices;

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="loading-spinner-inner">
          <div className="loading-spinner-circle" />
          <p className="loading-spinner-text">טוען מכשירים...</p>
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
            <Cpu size={28} style={{ color: 'var(--color-primary)' }} />
            מכשירים
          </h1>
          <p className="page-subtitle">ניהול כל המכשירים במערכת</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
            {pagination?.total || devices.length} מכשירים
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary w-full sm:w-auto"
          >
            <Plus size={18} />
            מכשיר חדש
          </button>
        </div>
      </div>

      {/* פילטרים */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          {/* חיפוש */}
          <div className="flex-1 min-w-0 relative">
            <Search size={18} className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="חיפוש לפי לקוח, סניף, סוג מכשיר..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
          </div>

          {/* כפתורי פילטר */}
          <div className="filter-chips">
            <button
              onClick={() => { setFilter('all'); setCurrentPage(1); }}
              className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
            >
              הכל
            </button>
            <button
              onClick={() => { setFilter('green'); setCurrentPage(1); }}
              className={`filter-chip ${filter === 'green' ? 'active' : ''}`}
            >
              תקין
            </button>
            <button
              onClick={() => { setFilter('yellow'); setCurrentPage(1); }}
              className={`filter-chip ${filter === 'yellow' ? 'active' : ''}`}
            >
              תשומת לב
            </button>
            <button
              onClick={() => { setFilter('red'); setCurrentPage(1); }}
              className={`filter-chip ${filter === 'red' ? 'active' : ''}`}
            >
              דחוף
            </button>
          </div>
        </div>
      </div>

      {/* טבלת מכשירים - דסקטופ */}
      <div className="hide-mobile">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>סטטוס</th>
                <th>לקוח</th>
                <th>סניף</th>
                <th>סוג</th>
                <th>מיקום</th>
                <th>ריח</th>
                <th>מילוי אחרון</th>
                <th>ימים</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device) => {
                const days = getDaysSince(device.lastRefillDate);
                return (
                  <tr key={device._id}>
                    <td>
                      <StatusBadge status={device.refillStatus} showText={false} />
                    </td>
                    <td className="font-medium">
                      {device.branchId?.customerId?.name || '-'}
                    </td>
                    <td>
                      {device.branchId?.branchName || '-'}
                    </td>
                    <td>
                      <span className="tag">
                        {device.deviceType}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>
                      {device.locationInBranch || '-'}
                    </td>
                    <td>
                      {device.scentId?.name || '-'}
                    </td>
                    <td>
                      {formatDate(device.lastRefillDate)}
                    </td>
                    <td>
                      <span className={`font-bold ${
                        days > 45 ? 'text-red-600' :
                        days > 30 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {days !== null ? days : '-'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <a
                          href={`/refill?device=${device._id}`}
                          className="action-btn action-btn-primary"
                        >
                          <Droplets size={14} />
                          מילוי
                        </a>
                        <button
                          onClick={() => openEditModal(device)}
                          className="action-btn action-btn-edit"
                        >
                          <Edit3 size={14} />
                          ערוך
                        </button>
                        <button
                          onClick={() => toggleDeviceStatus(device)}
                          className="action-btn action-btn-warning"
                        >
                          {device.isActive !== false ? (
                            <><Pause size={14} /> השהה</>
                          ) : (
                            <><Play size={14} /> הפעל</>
                          )}
                        </button>
                        <button
                          onClick={() => deleteDevice(device)}
                          className="action-btn action-btn-danger"
                        >
                          <Trash2 size={14} />
                          מחק
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredDevices.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Cpu size={28} />
              </div>
              <p>לא נמצאו מכשירים התואמים לחיפוש</p>
            </div>
          )}
        </div>
      </div>

      {/* תצוגת כרטיסים - מובייל */}
      <div className="show-mobile-only space-y-3">
        {filteredDevices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Cpu size={28} />
            </div>
            <p>לא נמצאו מכשירים התואמים לחיפוש</p>
          </div>
        ) : (
          filteredDevices.map((device) => {
            const days = getDaysSince(device.lastRefillDate);
            return (
              <div key={device._id} className="mobile-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={device.refillStatus} showText={false} />
                    <div>
                      <div className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        {device.branchId?.customerId?.name || '-'}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {device.branchId?.branchName || '-'}
                      </div>
                    </div>
                  </div>
                  <span className="tag">{device.deviceType}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                  <div>
                    <span className="font-medium">מיקום: </span>
                    {device.locationInBranch || '-'}
                  </div>
                  <div>
                    <span className="font-medium">ריח: </span>
                    {device.scentId?.name || '-'}
                  </div>
                  <div>
                    <span className="font-medium">מילוי אחרון: </span>
                    {formatDate(device.lastRefillDate)}
                  </div>
                  <div>
                    <span className="font-medium">ימים: </span>
                    <span className={`font-bold ${
                      days > 45 ? 'text-red-600' :
                      days > 30 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {days !== null ? days : '-'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                  <a
                    href={`/refill?device=${device._id}`}
                    className="action-btn action-btn-primary"
                  >
                    <Droplets size={14} />
                    מילוי
                  </a>
                  <button
                    onClick={() => openEditModal(device)}
                    className="action-btn action-btn-edit"
                  >
                    <Edit3 size={14} />
                    ערוך
                  </button>
                  <button
                    onClick={() => toggleDeviceStatus(device)}
                    className="action-btn action-btn-warning"
                  >
                    {device.isActive !== false ? (
                      <><Pause size={14} /> השהה</>
                    ) : (
                      <><Play size={14} /> הפעל</>
                    )}
                  </button>
                  <button
                    onClick={() => deleteDevice(device)}
                    className="action-btn action-btn-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <Pagination pagination={pagination} onPageChange={setCurrentPage} />

      {/* מודל יצירת מכשיר */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '448px' }}>
            <div className="modal-header">
              <h2>מכשיר חדש</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setDeviceForm({
                    branchId: '',
                    deviceType: '',
                    scentId: '',
                    locationInBranch: '',
                    isActive: true
                  });
                }}
                className="modal-close"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateDevice}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">סניף *</label>
                  <select
                    value={deviceForm.branchId}
                    onChange={(e) => setDeviceForm({ ...deviceForm, branchId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]"
                    required
                  >
                    <option value="">בחר סניף</option>
                    {branches.map(branch => (
                      <option key={branch._id} value={branch._id}>
                        {branch.customerId?.name} - {branch.branchName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">סוג מכשיר *</label>
                  <select
                    value={deviceForm.deviceType}
                    onChange={(e) => setDeviceForm({ ...deviceForm, deviceType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]"
                    required
                  >
                    <option value="">בחר סוג מכשיר</option>
                    {deviceTypes.map(type => (
                      <option key={type._id} value={type.name}>{type.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ריח</label>
                  <select
                    value={deviceForm.scentId}
                    onChange={(e) => setDeviceForm({ ...deviceForm, scentId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="">בחר ריח</option>
                    {scents.map(scent => (
                      <option key={scent._id} value={scent._id}>{scent.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">מיקום במבנה</label>
                  <input
                    type="text"
                    value={deviceForm.locationInBranch}
                    onChange={(e) => setDeviceForm({ ...deviceForm, locationInBranch: e.target.value })}
                    placeholder="לדוגמה: לובי, חדר ישיבות..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setDeviceForm({
                      branchId: '',
                      deviceType: '',
                      scentId: '',
                      locationInBranch: '',
                      isActive: true
                    });
                  }}
                  className="btn-secondary"
                  disabled={saving}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={!deviceForm.branchId || !deviceForm.deviceType || saving}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving ? 'מוסיף...' : 'הוסף מכשיר'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* מודל עריכת מכשיר */}
      {showEditModal && selectedDevice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '448px' }}>
            <div className="modal-header">
              <div>
                <h2>עריכת מכשיר</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                  {selectedDevice.branchId?.customerId?.name} - {selectedDevice.branchId?.branchName}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedDevice(null);
                }}
                className="modal-close"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateDevice}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">סוג מכשיר *</label>
                  <select
                    value={deviceForm.deviceType}
                    onChange={(e) => setDeviceForm({ ...deviceForm, deviceType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]"
                    required
                  >
                    <option value="">בחר סוג מכשיר</option>
                    {deviceTypes.map(type => (
                      <option key={type._id} value={type.name}>{type.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ריח</label>
                  <select
                    value={deviceForm.scentId}
                    onChange={(e) => setDeviceForm({ ...deviceForm, scentId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="">בחר ריח</option>
                    {scents.map(scent => (
                      <option key={scent._id} value={scent._id}>{scent.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">מיקום במבנה</label>
                  <input
                    type="text"
                    value={deviceForm.locationInBranch}
                    onChange={(e) => setDeviceForm({ ...deviceForm, locationInBranch: e.target.value })}
                    placeholder="לדוגמה: לובי, חדר ישיבות..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">סטטוס</label>
                  <select
                    value={deviceForm.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setDeviceForm({ ...deviceForm, isActive: e.target.value === 'active' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="active">פעיל</option>
                    <option value="inactive">מושהה</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedDevice(null);
                  }}
                  className="btn-secondary"
                  disabled={saving}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={!deviceForm.deviceType || saving}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving ? 'שומר...' : 'שמור שינויים'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
