'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { workOrdersAPI } from '@/lib/api';
import { useBranches, useTechnicians, useInvalidate } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import {
  ClipboardList, Plus, Filter, Calendar, User, MapPin,
  ChevronLeft, ChevronRight, Zap, Clock, AlertTriangle, CheckCircle, XCircle, X
} from 'lucide-react';

const statusLabels = {
  pending: 'ממתין',
  assigned: 'שובץ',
  in_progress: 'בביצוע',
  completed: 'הושלם',
  cancelled: 'בוטל'
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
};

const priorityLabels = {
  low: 'נמוכה',
  medium: 'בינונית',
  high: 'גבוהה',
  urgent: 'דחוף'
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-red-100 text-red-700'
};

const priorityBorderColors = {
  low: '#E5E7EB',
  medium: '#93C5FD',
  high: '#FCD34D',
  urgent: '#FCA5A5'
};

const typeLabels = {
  routine_refill: 'מילוי שוטף',
  repair: 'תיקון',
  installation: 'התקנה',
  removal: 'הסרה',
  complaint: 'תלונה'
};

export default function WorkOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Shared dropdown data (cached via SWR)
  const { branches } = useBranches();
  const { technicians } = useTechnicians();
  const { invalidateWorkOrders } = useInvalidate();

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignedTo: '',
    branchId: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newOrder, setNewOrder] = useState({
    branchId: '',
    assignedTo: '',
    scheduledDate: '',
    priority: 'medium',
    type: 'routine_refill',
    notes: '',
    estimatedDuration: ''
  });

  // Detail modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Redirect technicians to my-tasks
  useEffect(() => {
    if (user?.role === 'technician') {
      router.replace('/my-tasks');
    }
  }, [user, router]);

  // SWR for paginated work orders
  const orderParams = useMemo(() => {
    const params = new URLSearchParams({ page: currentPage, limit: 20 });
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.assignedTo) params.set('assignedTo', filters.assignedTo);
    if (filters.branchId) params.set('branchId', filters.branchId);
    return params.toString();
  }, [currentPage, filters]);

  const { data: orderData, isLoading: ordersLoading } = useSWR(`/work-orders?${orderParams}`);
  const workOrders = orderData?.data || [];
  const pagination = { page: currentPage, limit: 20, total: orderData?.pagination?.total || 0 };
  const loading = ordersLoading && !orderData;

  async function handleCreate(e) {
    e.preventDefault();
    if (!newOrder.branchId || !newOrder.scheduledDate) return;

    try {
      setSaving(true);
      await workOrdersAPI.create({
        ...newOrder,
        estimatedDuration: newOrder.estimatedDuration ? Number(newOrder.estimatedDuration) : undefined,
        assignedTo: newOrder.assignedTo || undefined
      });
      setShowCreateModal(false);
      setNewOrder({
        branchId: '', assignedTo: '', scheduledDate: '', priority: 'medium',
        type: 'routine_refill', notes: '', estimatedDuration: ''
      });
      invalidateWorkOrders();
    } catch (err) {
      alert(err.message || 'שגיאה ביצירת הזמנת עבודה');
    } finally {
      setSaving(false);
    }
  }

  async function handleAutoGenerate() {
    if (!confirm('ליצור הזמנות עבודה אוטומטיות לכל המכשירים שצריכים מילוי?')) return;
    try {
      const result = await workOrdersAPI.autoGenerate({});
      alert(result.message);
      invalidateWorkOrders();
    } catch (err) {
      alert(err.message || 'שגיאה ביצירה אוטומטית');
    }
  }

  async function viewOrderDetails(id) {
    try {
      const data = await workOrdersAPI.getById(id);
      setSelectedOrder(data);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Error loading work order:', err);
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      await workOrdersAPI.updateStatus(id, newStatus);
      invalidateWorkOrders();
      if (selectedOrder?._id === id) {
        const updated = await workOrdersAPI.getById(id);
        setSelectedOrder(updated);
      }
    } catch (err) {
      alert(err.message || 'שגיאה בעדכון סטטוס');
    }
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  if (user?.role === 'technician') return null;

  if (loading && workOrders.length === 0) {
    return (
      <div className="loading-spinner">
        <div className="loading-spinner-inner">
          <div className="loading-spinner-circle"></div>
        </div>
        <p className="loading-spinner-text">טוען הזמנות עבודה...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-50)' }}>
            <ClipboardList className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">הזמנות עבודה</h1>
            <p className="text-gray-500 mt-1 text-sm">ניהול ושיבוץ משימות לטכנאים</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleAutoGenerate}
            className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm hover:bg-gray-50 transition-colors"
            style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
          >
            <Zap className="w-4 h-4" />
            יצירה אוטומטית
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            הזמנה חדשה
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <Filter className="w-4 h-4" />
          סינון
          {Object.values(filters).some(v => v) && (
            <span className="px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
              {Object.values(filters).filter(v => v).length}
            </span>
          )}
        </button>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <select
              value={filters.status}
              onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-(--color-primary)"
            >
              <option value="">כל הסטטוסים</option>
              {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select
              value={filters.priority}
              onChange={(e) => { setFilters({ ...filters, priority: e.target.value }); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-(--color-primary)"
            >
              <option value="">כל העדיפויות</option>
              {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select
              value={filters.assignedTo}
              onChange={(e) => { setFilters({ ...filters, assignedTo: e.target.value }); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-(--color-primary)"
            >
              <option value="">כל הטכנאים</option>
              {technicians.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
            <button
              onClick={() => { setFilters({ status: '', priority: '', assignedTo: '', branchId: '' }); setCurrentPage(1); }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-xl"
            >
              נקה סינון
            </button>
          </div>
        )}
      </div>

      {/* Table (Desktop) */}
      <div className="hide-mobile table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ background: 'linear-gradient(to bottom, #F9FAFB, #F3F4F6)' }}>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">סניף</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">טכנאי</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">תאריך</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">סוג</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">עדיפות</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">סטטוס</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">מכשירים</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {workOrders.map((order) => (
              <tr
                key={order._id}
                className="border-b transition-colors cursor-pointer"
                onClick={() => viewOrderDetails(order._id)}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{order.branchId?.branchName || '-'}</div>
                  <div className="text-xs text-gray-500">{order.branchId?.customerId?.name || ''}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {order.assignedTo?.name || <span className="text-gray-400">לא שובץ</span>}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.scheduledDate)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{typeLabels[order.type] || order.type}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[order.priority]}`}>
                    {priorityLabels[order.priority]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{order.devices?.length || 0}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(order._id, 'cancelled')}
                      className="action-btn action-btn-danger flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      ביטול
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {workOrders.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <ClipboardList className="w-8 h-8" />
            </div>
            <p className="text-gray-500 font-medium">אין הזמנות עבודה להצגה</p>
          </div>
        )}
      </div>

      {/* Cards (Mobile) */}
      <div className="show-mobile-only space-y-3">
        {workOrders.map((order) => (
          <div
            key={order._id}
            className="card border-r-4 cursor-pointer hover:shadow-md transition-shadow"
            style={{ borderRightColor: priorityBorderColors[order.priority] }}
            onClick={() => viewOrderDetails(order._id)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-medium text-gray-800">{order.branchId?.branchName || '-'}</div>
                <div className="text-xs text-gray-500">{order.branchId?.customerId?.name || ''}</div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                {statusLabels[order.status]}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(order.scheduledDate)}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {order.assignedTo?.name || 'לא שובץ'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${priorityColors[order.priority]}`}>
                {priorityLabels[order.priority]}
              </span>
            </div>
          </div>
        ))}
        {workOrders.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <ClipboardList className="w-8 h-8" />
            </div>
            <p className="text-gray-500 font-medium">אין הזמנות עבודה להצגה</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="card">
          <div className="flex justify-center items-center gap-4 py-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600">
              עמוד {pagination.page} מתוך {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={pagination.page >= totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg w-full">
            <div className="modal-header">
              <h2 className="text-xl font-bold">הזמנת עבודה חדשה</h2>
              <button onClick={() => setShowCreateModal(false)} className="modal-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">סניף *</label>
                <select
                  value={newOrder.branchId}
                  onChange={(e) => setNewOrder({ ...newOrder, branchId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                  required
                >
                  <option value="">בחר סניף</option>
                  {branches.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.branchName} - {b.customerId?.name || b.city || ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">טכנאי</label>
                <select
                  value={newOrder.assignedTo}
                  onChange={(e) => setNewOrder({ ...newOrder, assignedTo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                >
                  <option value="">ללא שיבוץ</option>
                  {technicians.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">תאריך מתוכנן *</label>
                  <input
                    type="date"
                    value={newOrder.scheduledDate}
                    onChange={(e) => setNewOrder({ ...newOrder, scheduledDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">זמן משוער (דקות)</label>
                  <input
                    type="number"
                    value={newOrder.estimatedDuration}
                    onChange={(e) => setNewOrder({ ...newOrder, estimatedDuration: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                    min="0"
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">עדיפות</label>
                  <select
                    value={newOrder.priority}
                    onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                  >
                    {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">סוג</label>
                  <select
                    value={newOrder.type}
                    onChange={(e) => setNewOrder({ ...newOrder, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                  >
                    {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">הערות</label>
                <textarea
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                  rows={3}
                  placeholder="הערות נוספות..."
                />
              </div>

              <div className="modal-footer" style={{ margin: '0 -24px -24px', borderRadius: '0 0 var(--radius-xl) var(--radius-xl)' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                  disabled={saving}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={!newOrder.branchId || !newOrder.scheduledDate || saving}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving ? 'יוצר...' : 'צור הזמנה'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl w-full">
            <div className="modal-header">
              <div>
                <h2 className="text-xl font-bold">פרטי הזמנת עבודה</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedOrder.branchId?.branchName} - {selectedOrder.branchId?.customerId?.name}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="modal-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Priority */}
              <div className="flex flex-wrap gap-3">
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[selectedOrder.status]}`}>
                  {statusLabels[selectedOrder.status]}
                </span>
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${priorityColors[selectedOrder.priority]}`}>
                  {priorityLabels[selectedOrder.priority]}
                </span>
                <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                  {typeLabels[selectedOrder.type]}
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">טכנאי:</span>
                  <span className="mr-2 font-medium">{selectedOrder.assignedTo?.name || 'לא שובץ'}</span>
                </div>
                <div>
                  <span className="text-gray-500">תאריך מתוכנן:</span>
                  <span className="mr-2 font-medium">{formatDate(selectedOrder.scheduledDate)}</span>
                </div>
                <div>
                  <span className="text-gray-500">נוצר ע"י:</span>
                  <span className="mr-2">{selectedOrder.createdBy?.name || '-'}</span>
                </div>
                {selectedOrder.completedDate && (
                  <div>
                    <span className="text-gray-500">הושלם:</span>
                    <span className="mr-2">{formatDate(selectedOrder.completedDate)}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">כתובת:</span>
                  <span className="mr-2">{selectedOrder.branchId?.address || '-'} {selectedOrder.branchId?.city || ''}</span>
                </div>
                {selectedOrder.estimatedDuration && (
                  <div>
                    <span className="text-gray-500">זמן משוער:</span>
                    <span className="mr-2">{selectedOrder.estimatedDuration} דקות</span>
                  </div>
                )}
              </div>

              {/* Devices */}
              {selectedOrder.devices?.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-700 mb-3">מכשירים ({selectedOrder.devices.length})</h3>
                  <div className="space-y-2">
                    {selectedOrder.devices.map((device, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium">{device.deviceId?.deviceType || 'מכשיר'}</span>
                          {device.deviceId?.locationInBranch && (
                            <span className="text-gray-500 mr-2">({device.deviceId.locationInBranch})</span>
                          )}
                          {device.taskDescription && (
                            <p className="text-sm text-gray-500 mt-1">{device.taskDescription}</p>
                          )}
                        </div>
                        {device.isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="font-bold text-gray-700 mb-2">הערות</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedOrder.notes}</p>
                </div>
              )}
              {selectedOrder.completionNotes && (
                <div>
                  <h3 className="font-bold text-gray-700 mb-2">הערות סיום</h3>
                  <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">{selectedOrder.completionNotes}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="modal-footer flex-wrap">
              {selectedOrder.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange(selectedOrder._id, 'cancelled')}
                  className="action-btn action-btn-danger flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  ביטול
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={() => setShowDetailModal(false)}
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
