'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { customersAPI, branchesAPI, devicesAPI } from '@/lib/api';
import { useScents, useActiveDeviceTypes, useInvalidate } from '@/hooks/useData';
import Pagination from '@/components/Pagination';
import { Users, Plus, Search, Phone, Mail, Building2, Edit3, MapPin, CreditCard, X } from 'lucide-react';

export default function CustomersPage() {
  const { scents } = useScents();
  const { deviceTypes } = useActiveDeviceTypes();
  const { invalidateCustomers, invalidateBranches, invalidateDevices } = useInvalidate();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // טופס יצירת לקוח חדש
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    status: 'active',
    monthlyPrice: '',
    billingDetails: {
      phone: '',
      email: '',
      taxId: '',
      address: ''
    },
    // סניפים - מערך של סניפים עם מכשירים
    branches: []
  });

  // סניף חדש לטופס
  const [newBranch, setNewBranch] = useState({
    branchName: '',
    city: '',
    address: '',
    useCustomerAddress: false,
    devices: []
  });

  // מכשיר חדש לסניף
  const [newDevice, setNewDevice] = useState({
    deviceType: '',
    scentId: '',
    locationInBranch: ''
  });

  // אינדקס הסניף שמוסיפים לו מכשיר
  const [addingDeviceToBranchIndex, setAddingDeviceToBranchIndex] = useState(null);

  // טופס עריכת לקוח
  const [editCustomer, setEditCustomer] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // SWR for paginated customers
  const customerParams = new URLSearchParams({ page: currentPage, limit: 20 });
  if (debouncedSearch) customerParams.set('search', debouncedSearch);

  const { data: customerData, isLoading: customersLoading } = useSWR(`/customers?${customerParams.toString()}`);
  const customers = customerData?.data || [];
  const pagination = customerData?.pagination || null;
  const loading = customersLoading && !customerData;

  async function viewCustomerDetails(customerId) {
    try {
      const data = await customersAPI.getById(customerId);
      setSelectedCustomer(data);
      setShowModal(true);
    } catch (err) {
      // Error loading customer details
    }
  }

  async function handleCreateCustomer(e) {
    e.preventDefault();
    if (!newCustomer.name) return;

    try {
      setSaving(true);

      // יצירת הלקוח
      const customerData = {
        name: newCustomer.name,
        status: newCustomer.status,
        monthlyPrice: parseInt(newCustomer.monthlyPrice) || 0,
        billingDetails: {
          phone: newCustomer.billingDetails.phone,
          email: newCustomer.billingDetails.email,
          taxId: newCustomer.billingDetails.taxId,
          address: newCustomer.billingDetails.address
        }
      };

      const createdCustomer = await customersAPI.create(customerData);

      // יצירת כל הסניפים והמכשירים שלהם
      for (const branch of newCustomer.branches) {
        if (!branch.branchName) continue;

        const branchData = {
          customerId: createdCustomer._id,
          branchName: branch.branchName,
          city: branch.city || '',
          address: branch.useCustomerAddress
            ? newCustomer.billingDetails.address
            : branch.address || '',
          isActive: true,
          visitIntervalDays: 45
        };
        const createdBranch = await branchesAPI.create(branchData);

        // יצירת מכשירים לסניף
        if (branch.devices && branch.devices.length > 0) {
          for (const device of branch.devices) {
            await devicesAPI.create({
              branchId: createdBranch._id,
              deviceType: device.deviceType,
              scentId: device.scentId || undefined,
              locationInBranch: device.locationInBranch || '',
              isActive: true
            });
          }
        }
      }

      invalidateCustomers();
      invalidateBranches();
      invalidateDevices();
      setShowCreateModal(false);
      resetNewCustomerForm();
    } catch (err) {
      alert(err.message || 'שגיאה ביצירת לקוח');
    } finally {
      setSaving(false);
    }
  }

  function resetNewCustomerForm() {
    setNewCustomer({
      name: '',
      status: 'active',
      monthlyPrice: '',
      billingDetails: { phone: '', email: '', taxId: '', address: '' },
      branches: []
    });
    setNewBranch({
      branchName: '',
      city: '',
      address: '',
      useCustomerAddress: false,
      devices: []
    });
  }

  // הוספת סניף חדש לרשימה
  function addBranchToList() {
    if (!newBranch.branchName) return;
    setNewCustomer({
      ...newCustomer,
      branches: [...newCustomer.branches, { ...newBranch, id: Date.now() }]
    });
    setNewBranch({
      branchName: '',
      city: '',
      address: '',
      useCustomerAddress: false,
      devices: []
    });
  }

  // הסרת סניף מהרשימה
  function removeBranchFromList(branchId) {
    setNewCustomer({
      ...newCustomer,
      branches: newCustomer.branches.filter(b => b.id !== branchId)
    });
  }

  // הוספת מכשיר לסניף ברשימה
  function addDeviceToBranch(branchIndex) {
    if (!newDevice.deviceType) return;
    const updatedBranches = [...newCustomer.branches];
    updatedBranches[branchIndex].devices = [
      ...updatedBranches[branchIndex].devices,
      { ...newDevice, id: Date.now() }
    ];
    setNewCustomer({ ...newCustomer, branches: updatedBranches });
    setNewDevice({ deviceType: '', scentId: '', locationInBranch: '' });
    setAddingDeviceToBranchIndex(null);
  }

  // הסרת מכשיר מסניף
  function removeDeviceFromBranch(branchIndex, deviceId) {
    const updatedBranches = [...newCustomer.branches];
    updatedBranches[branchIndex].devices = updatedBranches[branchIndex].devices.filter(d => d.id !== deviceId);
    setNewCustomer({ ...newCustomer, branches: updatedBranches });
  }

  // הוספת מכשיר לסניף החדש (לפני הוספה לרשימה)
  function addDeviceToNewBranch() {
    if (!newDevice.deviceType) return;
    setNewBranch({
      ...newBranch,
      devices: [...newBranch.devices, { ...newDevice, id: Date.now() }]
    });
    setNewDevice({ deviceType: '', scentId: '', locationInBranch: '' });
  }

  // הסרת מכשיר מהסניף החדש
  function removeDeviceFromNewBranch(deviceId) {
    setNewBranch({
      ...newBranch,
      devices: newBranch.devices.filter(d => d.id !== deviceId)
    });
  }

  // פתיחת מודל עריכה
  function openEditModal() {
    setEditCustomer({
      ...selectedCustomer,
      status: selectedCustomer.status || 'active'
    });
    setShowModal(false);
    setShowEditModal(true);
  }

  // שמירת עריכת לקוח
  async function handleUpdateCustomer(e) {
    e.preventDefault();
    if (!editCustomer.name) return;

    try {
      setSaving(true);
      await customersAPI.update(editCustomer._id, {
        name: editCustomer.name,
        status: editCustomer.status,
        monthlyPrice: parseInt(editCustomer.monthlyPrice) || 0,
        billingDetails: editCustomer.billingDetails
      });
      invalidateCustomers();
      invalidateBranches();
      invalidateDevices();
      setShowEditModal(false);
      setEditCustomer(null);
    } catch (err) {
      alert(err.message || 'שגיאה בעדכון לקוח');
    } finally {
      setSaving(false);
    }
  }

  // השהיית/הפעלת לקוח
  async function toggleCustomerStatus() {
    if (!selectedCustomer) return;
    const newStatus = selectedCustomer.status === 'active' ? 'inactive' : 'active';
    try {
      setSaving(true);
      await customersAPI.update(selectedCustomer._id, { status: newStatus });
      invalidateCustomers();
      invalidateBranches();
      invalidateDevices();
      const updated = await customersAPI.getById(selectedCustomer._id);
      setSelectedCustomer(updated);
    } catch (err) {
      alert('שגיאה בעדכון סטטוס');
    } finally {
      setSaving(false);
    }
  }

  // Filtering is now server-side
  const filteredCustomers = customers;

  const totalMonthly = customers.reduce((sum, c) => sum + (c.monthlyPrice || 0), 0);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="loading-spinner-inner">
          <div className="loading-spinner-circle" />
          <p className="loading-spinner-text">טוען לקוחות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* כותרת */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Users className="w-7 h-7 text-[var(--color-primary)]" />
            לקוחות
          </h1>
          <p className="page-subtitle">ניהול לקוחות משלמים</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="text-start sm:text-left">
            <div className="text-xl md:text-2xl font-bold text-[var(--color-primary)]">{customers.length} לקוחות</div>
            <div className="text-sm text-[var(--color-text-secondary)]">הכנסה חודשית: {totalMonthly.toLocaleString()} &#8362;</div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            לקוח חדש
          </button>
        </div>
      </div>

      {/* חיפוש */}
      <div className="card">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="חיפוש לפי שם, אימייל או טלפון..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-4 pe-11 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          />
        </div>
      </div>

      {/* רשימת לקוחות */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <div
            key={customer._id}
            className="card hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => viewCustomerDetails(customer._id)}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg text-[var(--color-text-primary)]">{customer.name}</h3>
              <span className={`status-badge ${
                customer.status === 'active'
                  ? 'status-badge-green'
                  : customer.status === 'pending'
                  ? 'status-badge-yellow'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {customer.status === 'active' ? 'פעיל' :
                 customer.status === 'pending' ? 'בתהליך' : 'לא פעיל'}
              </span>
            </div>

            <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              {customer.billingDetails?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[var(--color-primary)]" />
                  <span>{customer.billingDetails.phone}</span>
                </div>
              )}
              {customer.billingDetails?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[var(--color-primary)]" />
                  <span className="truncate">{customer.billingDetails.email}</span>
                </div>
              )}
              {customer.billingDetails?.taxId && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
                  <span>ע.מ: {customer.billingDetails.taxId}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--color-border-light)] flex justify-between items-center">
              <span className="text-[var(--color-text-muted)] text-sm">מחיר חודשי</span>
              <span className="text-xl font-bold text-[var(--color-primary)]">
                {(customer.monthlyPrice || 0).toLocaleString()} &#8362;
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Users className="w-7 h-7" />
          </div>
          <p>לא נמצאו לקוחות התואמים לחיפוש</p>
        </div>
      )}

      {/* מודל פרטי לקוח */}
      {showModal && selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content w-full max-w-2xl">
            <div className="modal-header">
              <h2>{selectedCustomer.name}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="modal-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="modal-body space-y-6">
              {/* פרטי חיוב */}
              <div>
                <h3 className="font-bold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[var(--color-primary)]" />
                  פרטי חיוב
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[var(--color-text-muted)]" />
                    <span className="text-[var(--color-text-secondary)]">טלפון:</span>
                    <span className="me-2">{selectedCustomer.billingDetails?.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[var(--color-text-muted)]" />
                    <span className="text-[var(--color-text-secondary)]">אימייל:</span>
                    <span className="me-2">{selectedCustomer.billingDetails?.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[var(--color-text-muted)]" />
                    <span className="text-[var(--color-text-secondary)]">ע.מורשה:</span>
                    <span className="me-2">{selectedCustomer.billingDetails?.taxId || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[var(--color-text-muted)]" />
                    <span className="text-[var(--color-text-secondary)]">מחיר חודשי:</span>
                    <span className="me-2 font-bold text-[var(--color-primary)]">{selectedCustomer.monthlyPrice || 0} &#8362;</span>
                  </div>
                </div>
              </div>

              {/* סניפים */}
              {selectedCustomer.branches && selectedCustomer.branches.length > 0 && (
                <div>
                  <h3 className="font-bold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[var(--color-primary)]" />
                    סניפים ({selectedCustomer.branches.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedCustomer.branches.map((branch) => (
                      <div
                        key={branch._id}
                        className="p-3 bg-[var(--color-sage-50)] rounded-xl flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium text-[var(--color-text-primary)]">{branch.branchName}</div>
                          <div className="text-sm text-[var(--color-text-secondary)]">
                            {branch.city} {branch.address && `- ${branch.address}`}
                          </div>
                        </div>
                        <a
                          href={`/branches?id=${branch._id}`}
                          className="action-btn action-btn-primary"
                        >
                          צפה בסניף
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer flex-col sm:flex-row justify-between">
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={openEditModal}
                  className="action-btn action-btn-edit flex-1 sm:flex-initial justify-center"
                >
                  <Edit3 className="w-4 h-4" />
                  ערוך לקוח
                </button>
                <button
                  onClick={toggleCustomerStatus}
                  disabled={saving}
                  className={`action-btn flex-1 sm:flex-initial justify-center ${
                    selectedCustomer.status === 'active'
                      ? 'action-btn-warning'
                      : 'action-btn-primary'
                  }`}
                >
                  {saving ? '...' : selectedCustomer.status === 'active' ? 'השהה לקוח' : 'הפעל לקוח'}
                </button>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary w-full sm:w-auto"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* מודל עריכת לקוח */}
      {showEditModal && editCustomer && (
        <div className="modal-overlay">
          <div className="modal-content w-full max-w-2xl">
            <div className="modal-header">
              <h2>עריכת לקוח - {editCustomer.name}</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditCustomer(null);
                }}
                className="modal-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="modal-body space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">שם הלקוח *</label>
                  <input
                    type="text"
                    value={editCustomer.name}
                    onChange={(e) => setEditCustomer({ ...editCustomer, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">סטטוס</label>
                  <select
                    value={editCustomer.status}
                    onChange={(e) => setEditCustomer({ ...editCustomer, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="active">פעיל</option>
                    <option value="pending">בתהליך</option>
                    <option value="inactive">לא פעיל</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">מחיר חודשי (&#8362;)</label>
                  <input
                    type="number"
                    value={editCustomer.monthlyPrice || ''}
                    onChange={(e) => setEditCustomer({ ...editCustomer, monthlyPrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">טלפון</label>
                  <input
                    type="tel"
                    value={editCustomer.billingDetails?.phone || ''}
                    onChange={(e) => setEditCustomer({
                      ...editCustomer,
                      billingDetails: { ...editCustomer.billingDetails, phone: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">אימייל</label>
                  <input
                    type="email"
                    value={editCustomer.billingDetails?.email || ''}
                    onChange={(e) => setEditCustomer({
                      ...editCustomer,
                      billingDetails: { ...editCustomer.billingDetails, email: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">ע.מ / ח.פ</label>
                  <input
                    type="text"
                    value={editCustomer.billingDetails?.taxId || ''}
                    onChange={(e) => setEditCustomer({
                      ...editCustomer,
                      billingDetails: { ...editCustomer.billingDetails, taxId: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">כתובת</label>
                <input
                  type="text"
                  value={editCustomer.billingDetails?.address || ''}
                  onChange={(e) => setEditCustomer({
                    ...editCustomer,
                    billingDetails: { ...editCustomer.billingDetails, address: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-[var(--color-border-light)]">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditCustomer(null);
                  }}
                  className="btn-secondary w-full sm:w-auto"
                  disabled={saving}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={!editCustomer.name || saving}
                  className="btn-primary w-full sm:w-auto disabled:opacity-50"
                >
                  {saving ? 'שומר...' : 'שמור שינויים'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pagination */}
      <Pagination pagination={pagination} onPageChange={setCurrentPage} />

      {/* מודל יצירת לקוח חדש */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content w-full max-w-2xl">
            <div className="modal-header">
              <h2>לקוח חדש</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetNewCustomerForm();
                }}
                className="modal-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="modal-body space-y-6">
              {/* פרטי לקוח */}
              <div className="space-y-4">
                <h3 className="font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--color-primary)]" />
                  פרטי לקוח
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      שם הלקוח *
                    </label>
                    <input
                      type="text"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      placeholder="שם העסק"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      מחיר חודשי (&#8362;)
                    </label>
                    <input
                      type="number"
                      value={newCustomer.monthlyPrice}
                      onChange={(e) => setNewCustomer({ ...newCustomer, monthlyPrice: e.target.value })}
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      טלפון
                    </label>
                    <input
                      type="tel"
                      value={newCustomer.billingDetails.phone}
                      onChange={(e) => setNewCustomer({
                        ...newCustomer,
                        billingDetails: { ...newCustomer.billingDetails, phone: e.target.value }
                      })}
                      placeholder="050-0000000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      אימייל
                    </label>
                    <input
                      type="email"
                      value={newCustomer.billingDetails.email}
                      onChange={(e) => setNewCustomer({
                        ...newCustomer,
                        billingDetails: { ...newCustomer.billingDetails, email: e.target.value }
                      })}
                      placeholder="email@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      ע.מ / ח.פ
                    </label>
                    <input
                      type="text"
                      value={newCustomer.billingDetails.taxId}
                      onChange={(e) => setNewCustomer({
                        ...newCustomer,
                        billingDetails: { ...newCustomer.billingDetails, taxId: e.target.value }
                      })}
                      placeholder="מספר עוסק מורשה"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      כתובת
                    </label>
                    <input
                      type="text"
                      value={newCustomer.billingDetails.address}
                      onChange={(e) => setNewCustomer({
                        ...newCustomer,
                        billingDetails: { ...newCustomer.billingDetails, address: e.target.value }
                      })}
                      placeholder="כתובת מלאה"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* סניפים */}
              <div className="space-y-4 pt-4 border-t border-[var(--color-border-light)]">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[var(--color-primary)]" />
                    סניפים ({newCustomer.branches.length})
                  </h3>
                </div>

                {/* רשימת סניפים שנוספו */}
                {newCustomer.branches.length > 0 && (
                  <div className="space-y-3">
                    {newCustomer.branches.map((branch, branchIndex) => (
                      <div key={branch.id} className="p-4 bg-[var(--color-sage-50)] rounded-xl border border-[var(--color-border-light)]">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-medium text-[var(--color-text-primary)]">{branch.branchName}</div>
                            <div className="text-sm text-[var(--color-text-secondary)]">
                              {branch.city}
                              {branch.useCustomerAddress
                                ? ' (כתובת הלקוח)'
                                : branch.address && ` - ${branch.address}`}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeBranchFromList(branch.id)}
                            className="action-btn action-btn-danger"
                          >
                            <X className="w-3.5 h-3.5" />
                            הסר סניף
                          </button>
                        </div>

                        {/* מכשירים בסניף */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-[var(--color-text-secondary)]">
                            מכשירים ({branch.devices.length})
                          </div>
                          {branch.devices.map(device => (
                            <div key={device.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-[var(--color-border-light)] text-sm">
                              <div>
                                <span className="font-medium text-[var(--color-text-primary)]">
                                  {deviceTypes.find(dt => dt._id === device.deviceType)?.name || device.deviceType}
                                </span>
                                {device.locationInBranch && (
                                  <span className="text-[var(--color-text-muted)] me-2">({device.locationInBranch})</span>
                                )}
                                {device.scentId && (
                                  <span className="text-[var(--color-primary)] me-2">
                                    - {scents.find(s => s._id === device.scentId)?.name}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeDeviceFromBranch(branchIndex, device.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}

                          {/* הוספת מכשיר לסניף קיים */}
                          {addingDeviceToBranchIndex === branchIndex ? (
                            <div className="p-3 bg-[var(--color-primary-50)] rounded-xl border border-[var(--color-primary-200)]">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                                <select
                                  value={newDevice.deviceType}
                                  onChange={(e) => setNewDevice({ ...newDevice, deviceType: e.target.value })}
                                  className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)]"
                                >
                                  <option value="">בחר סוג מכשיר</option>
                                  {deviceTypes.map(type => (
                                    <option key={type._id} value={type._id}>{type.name}</option>
                                  ))}
                                </select>
                                <select
                                  value={newDevice.scentId}
                                  onChange={(e) => setNewDevice({ ...newDevice, scentId: e.target.value })}
                                  className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)]"
                                >
                                  <option value="">בחר ריח</option>
                                  {scents.map(scent => (
                                    <option key={scent._id} value={scent._id}>{scent.name}</option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  value={newDevice.locationInBranch}
                                  onChange={(e) => setNewDevice({ ...newDevice, locationInBranch: e.target.value })}
                                  placeholder="מיקום"
                                  className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => addDeviceToBranch(branchIndex)}
                                  disabled={!newDevice.deviceType}
                                  className="btn-primary text-sm disabled:opacity-50"
                                >
                                  <Plus className="w-4 h-4" />
                                  הוסף
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddingDeviceToBranchIndex(null);
                                    setNewDevice({ deviceType: '', scentId: '', locationInBranch: '' });
                                  }}
                                  className="btn-secondary text-sm"
                                >
                                  ביטול
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAddingDeviceToBranchIndex(branchIndex)}
                              className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] text-sm font-medium flex items-center gap-1"
                            >
                              <Plus className="w-4 h-4" />
                              הוסף מכשיר לסניף
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* טופס הוספת סניף חדש */}
                <div className="p-4 border-2 border-dashed border-[var(--color-border)] rounded-xl">
                  <h4 className="font-medium text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[var(--color-primary)]" />
                    הוסף סניף
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">שם הסניף</label>
                      <input
                        type="text"
                        value={newBranch.branchName}
                        onChange={(e) => setNewBranch({ ...newBranch, branchName: e.target.value })}
                        placeholder="לדוגמה: סניף ראשי"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">עיר</label>
                      <input
                        type="text"
                        value={newBranch.city}
                        onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
                        placeholder="עיר"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-[var(--color-primary-50)] rounded-xl mb-3">
                    <input
                      type="checkbox"
                      id="useCustomerAddressNew"
                      checked={newBranch.useCustomerAddress}
                      onChange={(e) => setNewBranch({ ...newBranch, useCustomerAddress: e.target.checked })}
                      className="w-4 h-4 text-[var(--color-primary)] border-gray-300 rounded focus:ring-[var(--color-primary)]"
                    />
                    <label htmlFor="useCustomerAddressNew" className="text-sm text-[var(--color-text-secondary)]">
                      השתמש בכתובת הלקוח
                      {newCustomer.billingDetails.address && (
                        <span className="font-medium text-[var(--color-primary-dark)] me-1">({newCustomer.billingDetails.address})</span>
                      )}
                    </label>
                  </div>

                  {!newBranch.useCustomerAddress && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">כתובת הסניף</label>
                      <input
                        type="text"
                        value={newBranch.address}
                        onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                        placeholder="כתובת"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                    </div>
                  )}

                  {/* מכשירים לסניף החדש */}
                  <div className="space-y-2 mb-3">
                    <div className="text-sm font-medium text-[var(--color-text-secondary)]">
                      מכשירים לסניף ({newBranch.devices.length})
                    </div>
                    {newBranch.devices.map(device => (
                      <div key={device.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-[var(--color-border-light)] text-sm">
                        <div>
                          <span className="font-medium text-[var(--color-text-primary)]">
                            {deviceTypes.find(dt => dt._id === device.deviceType)?.name || device.deviceType}
                          </span>
                          {device.locationInBranch && (
                            <span className="text-[var(--color-text-muted)] me-2">({device.locationInBranch})</span>
                          )}
                          {device.scentId && (
                            <span className="text-[var(--color-primary)] me-2">
                              - {scents.find(s => s._id === device.scentId)?.name}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDeviceFromNewBranch(device.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={newDevice.deviceType}
                        onChange={(e) => setNewDevice({ ...newDevice, deviceType: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)]"
                      >
                        <option value="">בחר סוג מכשיר</option>
                        {deviceTypes.map(type => (
                          <option key={type._id} value={type._id}>{type.name}</option>
                        ))}
                      </select>
                      <select
                        value={newDevice.scentId}
                        onChange={(e) => setNewDevice({ ...newDevice, scentId: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)]"
                      >
                        <option value="">בחר ריח</option>
                        {scents.map(scent => (
                          <option key={scent._id} value={scent._id}>{scent.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newDevice.locationInBranch}
                        onChange={(e) => setNewDevice({ ...newDevice, locationInBranch: e.target.value })}
                        placeholder="מיקום"
                        className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addDeviceToNewBranch}
                      disabled={!newDevice.deviceType}
                      className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      הוסף מכשיר לסניף
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={addBranchToList}
                    disabled={!newBranch.branchName}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                    הוסף סניף
                  </button>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-[var(--color-border-light)]">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetNewCustomerForm();
                  }}
                  className="btn-secondary w-full sm:w-auto"
                  disabled={saving}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={!newCustomer.name || saving}
                  className="btn-primary w-full sm:w-auto disabled:opacity-50"
                >
                  {saving ? 'שומר...' : 'צור לקוח'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
