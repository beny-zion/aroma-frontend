'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { usersAPI } from '@/lib/api';
import { useInvalidate } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import {
  UserCog, Plus, Search, Mail, Phone, Shield, ChevronLeft, ChevronRight,
  Edit3, Pause, Play, X
} from 'lucide-react';

const roleLabels = {
  admin: 'מנהל',
  manager: 'מנהל משרד',
  technician: 'טכנאי'
};

const roleColors = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  technician: 'bg-green-100 text-green-700'
};

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { invalidateUsers } = useInvalidate();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'technician',
    assignedRegions: ''
  });

  // Redirect non-admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/');
    }
  }, [user, router]);

  // SWR for paginated users
  const userParams = useMemo(() => {
    const params = new URLSearchParams({ page: currentPage, limit: 20 });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (roleFilter) params.set('role', roleFilter);
    return params.toString();
  }, [currentPage, debouncedSearch, roleFilter]);

  const { data: userData, isLoading: usersLoading } = useSWR(`/users?${userParams}`);
  const users = userData?.data || [];
  const pagination = { page: currentPage, limit: 20, total: userData?.pagination?.total || 0 };
  const loading = usersLoading && !userData;

  function handleSearch(e) {
    e.preventDefault();
    setDebouncedSearch(searchTerm);
    setCurrentPage(1);
  }

  function openCreateModal() {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', phone: '', role: 'technician', assignedRegions: '' });
    setShowModal(true);
  }

  function openEditModal(u) {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      phone: u.phone || '',
      role: u.role,
      assignedRegions: (u.assignedRegions || []).join(', ')
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setSaving(true);
      const data = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        assignedRegions: formData.assignedRegions
          ? formData.assignedRegions.split(',').map(r => r.trim()).filter(Boolean)
          : []
      };

      if (editingUser) {
        if (formData.password) data.password = formData.password;
        await usersAPI.update(editingUser._id, data);
      } else {
        data.password = formData.password;
        await usersAPI.create(data);
      }

      setShowModal(false);
      invalidateUsers();
    } catch (err) {
      alert(err.message || 'שגיאה בשמירת משתמש');
    } finally {
      setSaving(false);
    }
  }

  async function toggleUserStatus(u) {
    if (!confirm(`${u.isActive ? 'להשבית' : 'להפעיל'} את ${u.name}?`)) return;
    try {
      if (u.isActive) {
        await usersAPI.delete(u._id);
      } else {
        await usersAPI.update(u._id, { isActive: true });
      }
      invalidateUsers();
    } catch (err) {
      alert(err.message || 'שגיאה בעדכון');
    }
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  if (user?.role !== 'admin') return null;

  if (loading && users.length === 0) {
    return (
      <div className="loading-spinner">
        <div className="loading-spinner-inner">
          <div className="loading-spinner-circle"></div>
        </div>
        <p className="loading-spinner-text">טוען משתמשים...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-50)' }}>
            <UserCog className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">ניהול משתמשים</h1>
            <p className="text-gray-500 mt-1 text-sm">ניהול טכנאים, מנהלים ומשתמשי מערכת</p>
          </div>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          משתמש חדש
        </button>
      </div>

      {/* Search & Filter */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש לפי שם או אימייל..."
              className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
          >
            <option value="">כל התפקידים</option>
            {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button type="submit" className="btn-primary">חפש</button>
        </form>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => (
          <div key={u._id} className={`card hover:shadow-lg transition-shadow ${!u.isActive ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center">
                  <span className="text-lg font-bold text-[var(--color-primary-dark)]">
                    {u.name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{u.name}</h3>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${roleColors[u.role]}`}>
                    {roleLabels[u.role]}
                  </span>
                </div>
              </div>
              {!u.isActive && (
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs">מושבת</span>
              )}
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="truncate" dir="ltr">{u.email}</span>
              </div>
              {u.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{u.phone}</span>
                </div>
              )}
              {u.assignedRegions?.length > 0 && (
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{u.assignedRegions.join(', ')}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t flex gap-2">
              <button
                onClick={() => openEditModal(u)}
                className="flex-1 py-2.5 text-sm action-btn action-btn-edit flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                עריכה
              </button>
              {u.isActive ? (
                <button
                  onClick={() => toggleUserStatus(u)}
                  className="flex-1 py-2.5 text-sm action-btn action-btn-danger flex items-center justify-center gap-1.5"
                >
                  <Pause className="w-3.5 h-3.5" />
                  השבת
                </button>
              ) : (
                <button
                  onClick={() => toggleUserStatus(u)}
                  className="flex-1 py-2.5 text-sm action-btn action-btn-primary flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  הפעל
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <UserCog className="w-8 h-8" />
          </div>
          <p className="text-gray-500 font-medium">לא נמצאו משתמשים</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
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
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content w-full max-w-lg">
            <div className="modal-header">
              <h2>
                {editingUser ? `עריכת משתמש - ${editingUser.name}` : 'משתמש חדש'}
              </h2>
              <button onClick={() => setShowModal(false)} className="modal-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">שם מלא *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">תפקיד *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                  >
                    {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">אימייל *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingUser ? 'סיסמה חדשה (השאר ריק לללא שינוי)' : 'סיסמה *'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                  dir="ltr"
                  minLength={8}
                  placeholder="מינימום 8 תווים"
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">טלפון</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                  placeholder="050-0000000"
                />
              </div>

              {formData.role === 'technician' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">אזורי עבודה</label>
                  <input
                    type="text"
                    value={formData.assignedRegions}
                    onChange={(e) => setFormData({ ...formData, assignedRegions: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary)"
                    placeholder="צפון, מרכז, דרום (מופרדים בפסיקים)"
                  />
                </div>
              )}

              <div className="modal-footer" style={{ margin: '0 -24px -24px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                  disabled={saving}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={!formData.name || !formData.email || (!editingUser && !formData.password) || saving}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving ? 'שומר...' : editingUser ? 'שמור שינויים' : 'צור משתמש'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
