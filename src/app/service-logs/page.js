'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { serviceLogsAPI } from '@/lib/api';
import { useAllDevices, useBranches, useScents, useInvalidate } from '@/hooks/useData';
import Pagination from '@/components/Pagination';
import { FileText, Plus, Search, Calendar, Droplets, User, Eye, Edit3, Trash2, Filter, X, ClipboardList, Beaker } from 'lucide-react';

export default function ServiceLogsPage() {
  // Shared dropdown data (cached via SWR)
  const { devices } = useAllDevices();
  const { branches } = useBranches();
  const { scents } = useScents();
  const { invalidateServiceLogs, invalidateDevices, invalidateScents } = useInvalidate();

  const [saving, setSaving] = useState(false);

  // פילטרים
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // מודלים
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // טופס
  const [formData, setFormData] = useState({
    deviceId: '',
    scentId: '',
    mlFilled: 100,
    technicianName: '',
    technicianNotes: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Build SWR key for paginated service logs with date filter
  const logParams = useMemo(() => {
    const params = new URLSearchParams({ page: currentPage, limit: 20 });
    if (dateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dateFilter === 'today') {
        params.set('startDate', today.toISOString());
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.set('startDate', weekAgo.toISOString());
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        params.set('startDate', monthAgo.toISOString());
      }
    }
    return params.toString();
  }, [currentPage, dateFilter]);

  const { data: logData, isLoading: logsLoading } = useSWR(`/service-logs?${logParams}`);
  const serviceLogs = logData?.data || [];
  const pagination = logData?.pagination || null;
  const loading = logsLoading && !logData;

  function resetForm() {
    setFormData({
      deviceId: '',
      scentId: '',
      mlFilled: 100,
      technicianName: '',
      technicianNotes: '',
      date: new Date().toISOString().split('T')[0]
    });
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!formData.deviceId || !formData.mlFilled) return;

    try {
      setSaving(true);
      await serviceLogsAPI.create({
        deviceId: formData.deviceId,
        scentId: formData.scentId || undefined,
        mlFilled: parseInt(formData.mlFilled),
        technicianName: formData.technicianName || undefined,
        technicianNotes: formData.technicianNotes || undefined,
        date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString()
      });
      invalidateServiceLogs();
      invalidateDevices();
      invalidateScents();
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      console.error('Error creating service log:', err);
      alert(err.message || 'שגיאה ביצירת רישום');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!selectedLog) return;

    try {
      setSaving(true);
      await serviceLogsAPI.update(selectedLog._id, {
        scentId: formData.scentId || undefined,
        mlFilled: parseInt(formData.mlFilled),
        technicianName: formData.technicianName || undefined,
        technicianNotes: formData.technicianNotes || undefined
      });
      invalidateServiceLogs();
      invalidateDevices();
      invalidateScents();
      setShowEditModal(false);
      setSelectedLog(null);
      resetForm();
    } catch (err) {
      console.error('Error updating service log:', err);
      alert(err.message || 'שגיאה בעדכון רישום');
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(log) {
    setSelectedLog(log);
    setFormData({
      deviceId: log.deviceId?._id || '',
      scentId: log.scentId?._id || '',
      mlFilled: log.mlFilled || 100,
      technicianName: log.technicianName || '',
      technicianNotes: log.technicianNotes || '',
      date: log.date ? new Date(log.date).toISOString().split('T')[0] : ''
    });
    setShowEditModal(true);
  }

  function openDetailsModal(log) {
    setSelectedLog(log);
    setShowDetailsModal(true);
  }

  async function handleDelete(log) {
    if (!confirm('האם אתה בטוח שברצונך למחוק רישום זה?')) return;

    try {
      setSaving(true);
      await serviceLogsAPI.delete(log._id);
      invalidateServiceLogs();
      invalidateDevices();
      invalidateScents();
    } catch (err) {
      console.error('Error deleting service log:', err);
      alert(err.message || 'שגיאה במחיקת רישום');
    } finally {
      setSaving(false);
    }
  }

  function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatDateShort(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('he-IL');
  }

  // Date filtering is now server-side; branch & search filter on current page
  const filteredLogs = serviceLogs.filter(log => {
    if (branchFilter !== 'all') {
      if (log.deviceId?.branchId?._id !== branchFilter) return false;
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const branchName = log.deviceId?.branchId?.branchName?.toLowerCase() || '';
      const technicianName = log.technicianName?.toLowerCase() || '';
      const scentName = log.scentId?.name?.toLowerCase() || '';
      return branchName.includes(search) || technicianName.includes(search) || scentName.includes(search);
    }
    return true;
  });

  // Already sorted by server (date: -1)
  const sortedLogs = filteredLogs;

  // Stats from current page
  const totalMl = serviceLogs.reduce((sum, log) => sum + (log.mlFilled || 0), 0);
  const todayLogs = serviceLogs.filter(log => {
    const logDate = new Date(log.date);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  });
  const todayMl = todayLogs.reduce((sum, log) => sum + (log.mlFilled || 0), 0);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="loading-spinner-inner">
          <div className="loading-spinner-circle" />
          <p className="loading-spinner-text">טוען יומן שירות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5 md:space-y-6">
      {/* כותרת */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: 'var(--color-primary-50)' }}>
              <FileText size={22} style={{ color: 'var(--color-primary)' }} />
            </div>
            יומן שירות
          </h1>
          <p className="page-subtitle">היסטוריית מילויים ושירותים</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary w-full md:w-auto"
        >
          <Plus size={18} />
          רישום חדש
        </button>
      </div>

      {/* סטטיסטיקות */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--color-primary-50)' }}>
            <ClipboardList size={22} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <div className="stat-card-label">סה"כ רישומים</div>
            <div className="stat-card-value" style={{ color: 'var(--color-text-primary)' }}>{serviceLogs.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--color-primary-50)' }}>
            <Droplets size={22} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <div className="stat-card-label">סה"כ מ"ל</div>
            <div className="stat-card-value" style={{ color: 'var(--color-primary)' }}>{totalMl.toLocaleString()}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--color-status-green-bg)' }}>
            <Calendar size={22} style={{ color: 'var(--color-status-green-text)' }} />
          </div>
          <div>
            <div className="stat-card-label">מילויים היום</div>
            <div className="stat-card-value" style={{ color: 'var(--color-status-green-text)' }}>{todayLogs.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--color-primary-50)' }}>
            <Beaker size={22} style={{ color: 'var(--color-primary-dark)' }} />
          </div>
          <div>
            <div className="stat-card-label">מ"ל היום</div>
            <div className="stat-card-value" style={{ color: 'var(--color-primary-dark)' }}>{todayMl.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* פילטרים */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-center">
          {/* חיפוש */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="חיפוש לפי לקוח, סניף, טכנאי, ריח..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full ps-4 pe-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
            />
          </div>

          {/* פילטר תאריך */}
          <div className="relative flex items-center gap-2">
            <Calendar size={16} className="hidden md:block shrink-0" style={{ color: 'var(--color-text-muted)' }} />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
            >
              <option value="all">כל הזמנים</option>
              <option value="today">היום</option>
              <option value="week">שבוע אחרון</option>
              <option value="month">חודש אחרון</option>
            </select>
          </div>

          {/* פילטר סניף */}
          <div className="relative flex items-center gap-2">
            <Filter size={16} className="hidden md:block shrink-0" style={{ color: 'var(--color-text-muted)' }} />
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
            >
              <option value="all">כל הסניפים</option>
              {branches.map(branch => (
                <option key={branch._id} value={branch._id}>
                  {branch.customerId?.name} - {branch.branchName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* טבלת רישומים - דסקטופ */}
      <div className="table-container hide-mobile">
        <table>
          <thead>
            <tr>
              <th>תאריך</th>
              <th>לקוח</th>
              <th>סניף</th>
              <th>מכשיר</th>
              <th>ריח</th>
              <th>כמות</th>
              <th>טכנאי</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {sortedLogs.map((log) => (
              <tr key={log._id}>
                <td>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
                    {formatDateShort(log.date)}
                  </div>
                </td>
                <td className="font-medium">
                  {log.deviceId?.branchId?.customerId?.name || '-'}
                </td>
                <td>
                  {log.deviceId?.branchId?.branchName || '-'}
                </td>
                <td>
                  <span className="tag">
                    {log.deviceId?.deviceType || '-'}
                  </span>
                  {log.deviceId?.locationInBranch && (
                    <span className="text-xs me-1" style={{ color: 'var(--color-text-muted)' }}>
                      ({log.deviceId.locationInBranch})
                    </span>
                  )}
                </td>
                <td>
                  {log.scentId?.name || '-'}
                </td>
                <td>
                  <span className="font-bold" style={{ color: 'var(--color-primary)' }}>{log.mlFilled} מ"ל</span>
                </td>
                <td style={{ color: 'var(--color-text-secondary)' }}>
                  {log.technicianName || '-'}
                </td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openDetailsModal(log)}
                      className="action-btn action-btn-primary"
                      title="פרטים"
                    >
                      <Eye size={14} />
                      <span className="hidden lg:inline">פרטים</span>
                    </button>
                    <button
                      onClick={() => openEditModal(log)}
                      className="action-btn action-btn-edit"
                      title="ערוך"
                    >
                      <Edit3 size={14} />
                      <span className="hidden lg:inline">ערוך</span>
                    </button>
                    <button
                      onClick={() => handleDelete(log)}
                      className="action-btn action-btn-danger"
                      title="מחק"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedLogs.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={28} />
            </div>
            <p>לא נמצאו רישומים</p>
          </div>
        )}
      </div>

      {/* כרטיסים - מובייל */}
      <div className="show-mobile-only space-y-3">
        {sortedLogs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={28} />
            </div>
            <p>לא נמצאו רישומים</p>
          </div>
        ) : (
          sortedLogs.map((log) => (
            <div key={log._id} className="mobile-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    {log.deviceId?.branchId?.customerId?.name || '-'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {log.deviceId?.branchId?.branchName || '-'}
                  </div>
                </div>
                <span className="font-bold text-sm" style={{ color: 'var(--color-primary)' }}>
                  {log.mlFilled} מ"ל
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDateShort(log.date)}
                </span>
                {log.technicianName && (
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {log.technicianName}
                  </span>
                )}
                {log.scentId?.name && (
                  <span className="flex items-center gap-1">
                    <Droplets size={12} />
                    {log.scentId.name}
                  </span>
                )}
                {log.deviceId?.deviceType && (
                  <span className="tag">{log.deviceId.deviceType}</span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                <button
                  onClick={() => openDetailsModal(log)}
                  className="action-btn action-btn-primary flex-1 justify-center"
                >
                  <Eye size={14} />
                  פרטים
                </button>
                <button
                  onClick={() => openEditModal(log)}
                  className="action-btn action-btn-edit flex-1 justify-center"
                >
                  <Edit3 size={14} />
                  ערוך
                </button>
                <button
                  onClick={() => handleDelete(log)}
                  className="action-btn action-btn-danger justify-center"
                  style={{ minWidth: '40px' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <Pagination pagination={pagination} onPageChange={setCurrentPage} />

      {/* מודל יצירה */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content w-full max-w-lg">
            <div className="modal-header">
              <div>
                <h2 className="text-lg md:text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>רישום שירות חדש</h2>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="modal-body space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>מכשיר *</label>
                <select
                  value={formData.deviceId}
                  onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                  required
                >
                  <option value="">בחר מכשיר</option>
                  {devices.map(device => (
                    <option key={device._id} value={device._id}>
                      {device.branchId?.customerId?.name} - {device.branchId?.branchName} - {device.deviceType}
                      {device.locationInBranch && ` (${device.locationInBranch})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>תאריך</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>כמות (מ"ל) *</label>
                  <input
                    type="number"
                    value={formData.mlFilled}
                    onChange={(e) => setFormData({ ...formData, mlFilled: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>ריח</label>
                <select
                  value={formData.scentId}
                  onChange={(e) => setFormData({ ...formData, scentId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                >
                  <option value="">ללא שינוי</option>
                  {scents.map(scent => (
                    <option key={scent._id} value={scent._id}>{scent.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>שם טכנאי</label>
                <input
                  type="text"
                  value={formData.technicianName}
                  onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                  placeholder="שם הטכנאי"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>הערות</label>
                <textarea
                  value={formData.technicianNotes}
                  onChange={(e) => setFormData({ ...formData, technicianNotes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                  placeholder="הערות נוספות..."
                />
              </div>

              <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="btn-secondary w-full md:w-auto"
                  disabled={saving}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={!formData.deviceId || !formData.mlFilled || saving}
                  className="btn-primary w-full md:w-auto disabled:opacity-50"
                >
                  {saving ? 'שומר...' : 'צור רישום'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* מודל עריכה */}
      {showEditModal && selectedLog && (
        <div className="modal-overlay">
          <div className="modal-content w-full max-w-lg">
            <div className="modal-header">
              <div>
                <h2 className="text-lg md:text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>עריכת רישום</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {selectedLog.deviceId?.branchId?.customerId?.name} - {selectedLog.deviceId?.branchId?.branchName}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedLog(null);
                  resetForm();
                }}
                className="modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="modal-body space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>כמות (מ"ל) *</label>
                <input
                  type="number"
                  value={formData.mlFilled}
                  onChange={(e) => setFormData({ ...formData, mlFilled: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>ריח</label>
                <select
                  value={formData.scentId}
                  onChange={(e) => setFormData({ ...formData, scentId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                >
                  <option value="">ללא שינוי</option>
                  {scents.map(scent => (
                    <option key={scent._id} value={scent._id}>{scent.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>שם טכנאי</label>
                <input
                  type="text"
                  value={formData.technicianName}
                  onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>הערות</label>
                <textarea
                  value={formData.technicianNotes}
                  onChange={(e) => setFormData({ ...formData, technicianNotes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                />
              </div>

              <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedLog(null);
                    resetForm();
                  }}
                  className="btn-secondary w-full md:w-auto"
                  disabled={saving}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary w-full md:w-auto disabled:opacity-50"
                >
                  {saving ? 'שומר...' : 'שמור שינויים'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* מודל פרטים */}
      {showDetailsModal && selectedLog && (
        <div className="modal-overlay">
          <div className="modal-content w-full max-w-lg">
            <div className="modal-header">
              <h2 className="text-lg md:text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>פרטי רישום</h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedLog(null);
                }}
                className="modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>תאריך</span>
                  </div>
                  <div className="font-medium text-sm">{formatDate(selectedLog.date)}</div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'var(--color-primary-50)' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Droplets size={14} style={{ color: 'var(--color-primary)' }} />
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>כמות</span>
                  </div>
                  <div className="font-bold text-sm" style={{ color: 'var(--color-primary)' }}>{selectedLog.mlFilled} מ"ל</div>
                </div>
              </div>

              <div className="border-t pt-4" style={{ borderColor: 'var(--color-border-light)' }}>
                <div className="flex items-center gap-1.5 mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  <FileText size={14} />
                  <span className="text-xs">מכשיר</span>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
                  <div className="font-medium text-sm">{selectedLog.deviceId?.deviceType}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {selectedLog.deviceId?.branchId?.customerId?.name} - {selectedLog.deviceId?.branchId?.branchName}
                  </div>
                  {selectedLog.deviceId?.locationInBranch && (
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>מיקום: {selectedLog.deviceId.locationInBranch}</div>
                  )}
                </div>
              </div>

              {selectedLog.scentId && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    <Droplets size={14} />
                    <span className="text-xs">ריח</span>
                  </div>
                  <div className="font-medium text-sm">{selectedLog.scentId.name}</div>
                </div>
              )}

              {selectedLog.technicianName && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    <User size={14} />
                    <span className="text-xs">טכנאי</span>
                  </div>
                  <div className="font-medium text-sm">{selectedLog.technicianName}</div>
                </div>
              )}

              {selectedLog.technicianNotes && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    <Edit3 size={14} />
                    <span className="text-xs">הערות</span>
                  </div>
                  <div className="p-3 rounded-xl text-sm" style={{ background: 'var(--color-bg)' }}>{selectedLog.technicianNotes}</div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedLog(null);
                }}
                className="btn-secondary"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
