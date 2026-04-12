'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { branchesAPI, customersAPI, scentsAPI, devicesAPI, deviceTypesAPI } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import { Building2, MapPin, Plus, Search, Eye, Edit3, Pause, Play, Trash2, Droplets, X } from 'lucide-react';

export default function BranchesPage() {
  const searchParams = useSearchParams();
  const preselectedBranchId = searchParams.get('id');

  const [branches, setBranches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // טופס יצירת סניף חדש
  const [newBranch, setNewBranch] = useState({
    customerId: '',
    branchName: '',
    city: '',
    address: '',
    region: '',
    visitIntervalDays: 45,
    useCustomerAddress: true
  });

  // כתובת הלקוח הנבחר
  const [selectedCustomerAddress, setSelectedCustomerAddress] = useState('');

  // ריחות ושינוי ריח במכשיר
  const [scents, setScents] = useState([]);
  const [editingScentDevice, setEditingScentDevice] = useState(null);
  const [newScentId, setNewScentId] = useState('');

  // עריכת סניף
  const [showEditBranchModal, setShowEditBranchModal] = useState(false);
  const [editBranch, setEditBranch] = useState(null);

  // הוספת מכשיר לסניף
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [newDeviceData, setNewDeviceData] = useState({
    deviceType: '',
    scentId: '',
    locationInBranch: ''
  });

  // סוגי מכשירים
  const [deviceTypes, setDeviceTypes] = useState([]);

  useEffect(() => {
    loadBranches();
    loadCustomers();
    loadScents();
    loadDeviceTypes();
  }, []);

  async function loadDeviceTypes() {
    try {
      const data = await deviceTypesAPI.getAll({ isActive: true });
      setDeviceTypes(data);
    } catch (err) {
      console.error('Error loading device types:', err);
    }
  }

  // פתיחת מודל סניף אם יש id ב-URL
  useEffect(() => {
    if (preselectedBranchId && branches.length > 0) {
      viewBranchDetails(preselectedBranchId);
    }
  }, [preselectedBranchId, branches]);

  async function loadBranches() {
    try {
      setLoading(true);
      const data = await branchesAPI.getAll();
      setBranches(data);
    } catch (err) {
      console.error('Error loading branches:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomers() {
    try {
      const data = await customersAPI.getAll();
      setCustomers(data);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  }

  async function loadScents() {
    try {
      const data = await scentsAPI.getAll();
      setScents(data);
    } catch (err) {
      console.error('Error loading scents:', err);
    }
  }

  async function handleChangeDeviceScent(deviceId) {
    if (!newScentId) return;
    try {
      setSaving(true);
      await devicesAPI.update(deviceId, { scentId: newScentId });
      // רענן את פרטי הסניף
      const data = await branchesAPI.getById(selectedBranch._id);
      setSelectedBranch(data);
      setEditingScentDevice(null);
      setNewScentId('');
    } catch (err) {
      console.error('Error updating device scent:', err);
      alert('שגיאה בעדכון הריח');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateBranch(e) {
    e.preventDefault();
    if (!newBranch.customerId || !newBranch.branchName) return;

    try {
      setSaving(true);

      const branchData = {
        customerId: newBranch.customerId,
        branchName: newBranch.branchName,
        city: newBranch.city,
        address: newBranch.useCustomerAddress ? selectedCustomerAddress : newBranch.address,
        region: newBranch.region,
        visitIntervalDays: parseInt(newBranch.visitIntervalDays) || 45,
        isActive: true
      };

      await branchesAPI.create(branchData);
      await loadBranches();
      setShowCreateModal(false);
      setNewBranch({
        customerId: '',
        branchName: '',
        city: '',
        address: '',
        region: '',
        visitIntervalDays: 45,
        useCustomerAddress: true
      });
      setSelectedCustomerAddress('');
    } catch (err) {
      console.error('Error creating branch:', err);
      alert(err.message || 'שגיאה ביצירת סניף');
    } finally {
      setSaving(false);
    }
  }

  // עדכון כתובת לקוח כאשר בוחרים לקוח
  function handleCustomerChange(customerId) {
    setNewBranch({ ...newBranch, customerId });
    const customer = customers.find(c => c._id === customerId);
    if (customer && customer.billingDetails?.address) {
      setSelectedCustomerAddress(customer.billingDetails.address);
    } else {
      setSelectedCustomerAddress('');
    }
  }

  async function viewBranchDetails(branchId) {
    try {
      const data = await branchesAPI.getById(branchId);
      setSelectedBranch(data);
      setShowModal(true);
    } catch (err) {
      console.error('Error loading branch details:', err);
    }
  }

  // פתיחת מודל עריכת סניף
  function openEditBranchModal() {
    setEditBranch({
      ...selectedBranch,
      customerId: selectedBranch.customerId?._id || selectedBranch.customerId
    });
    setShowModal(false);
    setShowEditBranchModal(true);
  }

  // שמירת עריכת סניף
  async function handleUpdateBranch(e) {
    e.preventDefault();
    if (!editBranch.branchName) return;

    try {
      setSaving(true);
      await branchesAPI.update(editBranch._id, {
        branchName: editBranch.branchName,
        city: editBranch.city,
        address: editBranch.address,
        region: editBranch.region,
        visitIntervalDays: parseInt(editBranch.visitIntervalDays) || 45,
        isActive: editBranch.isActive
      });
      await loadBranches();
      setShowEditBranchModal(false);
      setEditBranch(null);
    } catch (err) {
      console.error('Error updating branch:', err);
      alert(err.message || 'שגיאה בעדכון סניף');
    } finally {
      setSaving(false);
    }
  }

  // השהיית/הפעלת סניף
  async function toggleBranchStatus() {
    if (!selectedBranch) return;
    const newStatus = !selectedBranch.isActive;
    try {
      setSaving(true);
      await branchesAPI.update(selectedBranch._id, { isActive: newStatus });
      await loadBranches();
      const updated = await branchesAPI.getById(selectedBranch._id);
      setSelectedBranch(updated);
    } catch (err) {
      console.error('Error updating branch status:', err);
      alert('שגיאה בעדכון סטטוס');
    } finally {
      setSaving(false);
    }
  }

  // הוספת מכשיר לסניף
  async function handleAddDevice(e) {
    e.preventDefault();
    if (!newDeviceData.deviceType) return;

    try {
      setSaving(true);
      await devicesAPI.create({
        branchId: selectedBranch._id,
        deviceType: newDeviceData.deviceType,
        scentId: newDeviceData.scentId || undefined,
        locationInBranch: newDeviceData.locationInBranch || '',
        isActive: true
      });
      // רענן פרטי סניף
      const updated = await branchesAPI.getById(selectedBranch._id);
      setSelectedBranch(updated);
      setShowAddDeviceModal(false);
      setNewDeviceData({ deviceType: '', scentId: '', locationInBranch: '' });
    } catch (err) {
      console.error('Error adding device:', err);
      alert(err.message || 'שגיאה בהוספת מכשיר');
    } finally {
      setSaving(false);
    }
  }

  // השהיית/הפעלת מכשיר
  async function toggleDeviceStatus(device) {
    try {
      setSaving(true);
      await devicesAPI.update(device._id, { isActive: !device.isActive });
      const updated = await branchesAPI.getById(selectedBranch._id);
      setSelectedBranch(updated);
    } catch (err) {
      console.error('Error updating device status:', err);
      alert('שגיאה בעדכון סטטוס מכשיר');
    } finally {
      setSaving(false);
    }
  }

  // הסרת מכשיר מסניף
  async function removeDeviceFromBranch(deviceId) {
    if (!confirm('האם אתה בטוח שברצונך להסיר את המכשיר?')) return;
    try {
      setSaving(true);
      await devicesAPI.delete(deviceId);
      const updated = await branchesAPI.getById(selectedBranch._id);
      setSelectedBranch(updated);
    } catch (err) {
      console.error('Error removing device:', err);
      alert('שגיאה בהסרת מכשיר');
    } finally {
      setSaving(false);
    }
  }

  // רשימת ערים ייחודיות
  const cities = [...new Set(branches.map(b => b.city).filter(Boolean))].sort();

  const filteredBranches = branches.filter(branch => {
    if (cityFilter !== 'all' && branch.city !== cityFilter) return false;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return branch.branchName?.toLowerCase().includes(search) ||
             branch.customerId?.name?.toLowerCase().includes(search) ||
             branch.address?.toLowerCase().includes(search);
    }

    return true;
  });

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('he-IL');
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="loading-spinner-inner">
          <div className="loading-spinner-circle" />
          <p className="loading-spinner-text">טוען סניפים...</p>
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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-50)' }}>
              <Building2 size={22} style={{ color: 'var(--color-primary)' }} />
            </div>
            סניפים
          </h1>
          <p className="page-subtitle">ניהול סניפים ומיקומים</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
            {branches.length} סניפים
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <Plus size={18} />
            סניף חדש
          </button>
        </div>
      </div>

      {/* פילטרים */}
      <div className="card">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-center">
          {/* חיפוש */}
          <div className="flex-1 min-w-0 sm:min-w-64 relative">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }}>
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="חיפוש לפי שם סניף, לקוח או כתובת..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
            />
          </div>

          {/* פילטר עיר */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
          >
            <option value="all">כל הערים</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {/* רשימת סניפים לפי עיר */}
      {cityFilter === 'all' ? (
        // תצוגה מקובצת לפי עיר
        cities.map(city => {
          const cityBranches = filteredBranches.filter(b => b.city === city);
          if (cityBranches.length === 0) return null;

          return (
            <div key={city} className="space-y-3">
              <h2 className="text-lg md:text-xl font-bold text-gray-700 flex items-center gap-2">
                <MapPin size={20} style={{ color: 'var(--color-primary)' }} />
                {city}
                <span className="text-sm font-normal" style={{ color: 'var(--color-text-muted)' }}>
                  ({cityBranches.length} סניפים)
                </span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cityBranches.map(branch => (
                  <div
                    key={branch._id}
                    className="card hover:shadow-lg transition-shadow cursor-pointer relative overflow-hidden"
                    onClick={() => viewBranchDetails(branch._id)}
                  >
                    {/* Subtle icon decoration */}
                    <div className="absolute -left-3 -bottom-3 opacity-[0.04]">
                      <Building2 size={80} />
                    </div>
                    <div className="relative">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-800">{branch.branchName}</h3>
                        {branch.isActive ? (
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: 'var(--color-primary)' }}></span>
                        ) : (
                          <span className="w-2.5 h-2.5 bg-gray-300 rounded-full shrink-0"></span>
                        )}
                      </div>

                      <div className="text-sm mb-3 space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                        <div className="font-medium">{branch.customerId?.name}</div>
                        {branch.address && (
                          <div className="flex items-center gap-1.5">
                            <MapPin size={13} className="shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                            {branch.address}
                          </div>
                        )}
                        {branch.region && <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{branch.region}</div>}
                      </div>

                      <div className="flex justify-between items-center text-sm pt-2" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          מחזור ביקור: {branch.visitIntervalDays} יום
                        </span>
                        <span className="action-btn action-btn-primary text-xs">
                          <Eye size={14} />
                          פרטים
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        // תצוגה רגילה כשיש פילטר עיר
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBranches.map(branch => (
            <div
              key={branch._id}
              className="card hover:shadow-lg transition-shadow cursor-pointer relative overflow-hidden"
              onClick={() => viewBranchDetails(branch._id)}
            >
              {/* Subtle icon decoration */}
              <div className="absolute -left-3 -bottom-3 opacity-[0.04]">
                <Building2 size={80} />
              </div>
              <div className="relative">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-800">{branch.branchName}</h3>
                  {branch.isActive ? (
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: 'var(--color-primary)' }}></span>
                  ) : (
                    <span className="w-2.5 h-2.5 bg-gray-300 rounded-full shrink-0"></span>
                  )}
                </div>

                <div className="text-sm mb-3 space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                  <div className="font-medium">{branch.customerId?.name}</div>
                  {branch.address && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                      {branch.address}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm pt-2" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    מחזור: {branch.visitIntervalDays} יום
                  </span>
                  <span className="action-btn action-btn-primary text-xs">
                    <Eye size={14} />
                    פרטים
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredBranches.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Building2 size={28} />
          </div>
          <p>לא נמצאו סניפים התואמים לחיפוש</p>
        </div>
      )}

      {/* מודל פרטי סניף */}
      {showModal && selectedBranch && (
        <div className="modal-overlay">
          <div className="modal-content w-full max-w-3xl">
            <div className="modal-header">
              <div>
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {selectedBranch.branchName}
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '14px' }}>
                  {selectedBranch.customerId?.name}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body space-y-6">
              {/* פרטי סניף */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
                  <MapPin size={16} style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>עיר</span>
                    <div className="font-medium">{selectedBranch.city || '-'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
                  <MapPin size={16} style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>אזור</span>
                    <div className="font-medium">{selectedBranch.region || '-'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
                  <Building2 size={16} style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>כתובת</span>
                    <div className="font-medium">{selectedBranch.address || '-'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
                  <Droplets size={16} style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>מחזור ביקור</span>
                    <div className="font-medium">{selectedBranch.visitIntervalDays} ימים</div>
                  </div>
                </div>
              </div>

              {/* מכשירים בסניף */}
              {selectedBranch.devices && selectedBranch.devices.length > 0 && (
                <div>
                  <div className="section-heading">
                    <div className="section-heading-bar"></div>
                    <h2>מכשירים בסניף ({selectedBranch.devices.length})</h2>
                  </div>

                  {/* Desktop table */}
                  <div className="table-container hidden md:block">
                    <table>
                      <thead>
                        <tr>
                          <th>סטטוס</th>
                          <th>סוג</th>
                          <th>מיקום</th>
                          <th>ריח</th>
                          <th>מילוי אחרון</th>
                          <th>פעולות</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBranch.devices.map(device => (
                          <tr key={device._id}>
                            <td>
                              <StatusBadge status={device.refillStatus} showText={false} />
                            </td>
                            <td>{device.deviceType}</td>
                            <td>{device.locationInBranch || '-'}</td>
                            <td>
                              {editingScentDevice === device._id ? (
                                <div className="flex items-center gap-2">
                                  <select
                                    value={newScentId}
                                    onChange={(e) => setNewScentId(e.target.value)}
                                    className="text-xs px-2 py-1 border border-gray-300 rounded-xl focus:ring-1 focus:ring-(--color-primary)"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <option value="">בחר ריח</option>
                                    {scents.map(scent => (
                                      <option key={scent._id} value={scent._id}>
                                        {scent.name}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleChangeDeviceScent(device._id);
                                    }}
                                    disabled={!newScentId || saving}
                                    className="action-btn action-btn-primary text-xs disabled:opacity-50"
                                  >
                                    {saving ? '...' : 'שמור'}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingScentDevice(null);
                                      setNewScentId('');
                                    }}
                                    className="action-btn text-xs"
                                    style={{ color: 'var(--color-text-muted)' }}
                                  >
                                    ביטול
                                  </button>
                                </div>
                              ) : (
                                <span
                                  className="cursor-pointer transition-colors"
                                  style={{ color: 'var(--color-text-primary)' }}
                                  onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'}
                                  onMouseLeave={(e) => e.target.style.color = 'var(--color-text-primary)'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingScentDevice(device._id);
                                    setNewScentId(device.scentId?._id || '');
                                  }}
                                  title="לחץ לשינוי ריח"
                                >
                                  {device.scentId?.name || '-'}
                                </span>
                              )}
                            </td>
                            <td>{formatDate(device.lastRefillDate)}</td>
                            <td>
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={`/refill?device=${device._id}`}
                                  className="action-btn action-btn-primary"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Droplets size={14} />
                                  מילוי
                                </a>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDeviceStatus(device);
                                  }}
                                  className={`action-btn ${device.isActive !== false ? 'action-btn-warning' : 'action-btn-primary'}`}
                                >
                                  {device.isActive !== false ? <Pause size={14} /> : <Play size={14} />}
                                  {device.isActive !== false ? 'השהה' : 'הפעל'}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeDeviceFromBranch(device._id);
                                  }}
                                  className="action-btn action-btn-danger"
                                >
                                  <Trash2 size={14} />
                                  הסר
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3">
                    {selectedBranch.devices.map(device => (
                      <div key={device._id} className="mobile-card">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-medium text-sm">{device.deviceType}</div>
                            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              {device.locationInBranch || 'ללא מיקום'}
                            </div>
                          </div>
                          <StatusBadge status={device.refillStatus} showText={false} />
                        </div>
                        <div className="text-sm mb-3 space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                          <div>ריח: {device.scentId?.name || '-'}</div>
                          <div>מילוי אחרון: {formatDate(device.lastRefillDate)}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap pt-2" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                          <a
                            href={`/refill?device=${device._id}`}
                            className="action-btn action-btn-primary"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Droplets size={14} />
                            מילוי
                          </a>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDeviceStatus(device);
                            }}
                            className={`action-btn ${device.isActive !== false ? 'action-btn-warning' : 'action-btn-primary'}`}
                          >
                            {device.isActive !== false ? <Pause size={14} /> : <Play size={14} />}
                            {device.isActive !== false ? 'השהה' : 'הפעל'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeDeviceFromBranch(device._id);
                            }}
                            className="action-btn action-btn-danger"
                          >
                            <Trash2 size={14} />
                            הסר
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowAddDeviceModal(true)}
                    className="btn-quick-action mt-4 w-full sm:w-auto"
                  >
                    <Plus size={16} />
                    הוסף מכשיר לסניף
                  </button>
                </div>
              )}

              {/* כפתור הוספת מכשיר אם אין מכשירים */}
              {(!selectedBranch.devices || selectedBranch.devices.length === 0) && (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Droplets size={28} />
                  </div>
                  <p className="mb-4">אין מכשירים בסניף זה</p>
                  <button
                    onClick={() => setShowAddDeviceModal(true)}
                    className="btn-quick-action"
                  >
                    <Plus size={16} />
                    הוסף מכשיר ראשון לסניף
                  </button>
                </div>
              )}
            </div>

            <div className="modal-footer flex-col sm:flex-row gap-2">
              <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                <a
                  href={`/refill?branch=${selectedBranch._id}`}
                  className="btn-primary flex-1 sm:flex-none"
                >
                  <Droplets size={16} />
                  מילוי לסניף
                </a>
                <button
                  onClick={openEditBranchModal}
                  className="btn-secondary flex-1 sm:flex-none"
                >
                  <Edit3 size={16} />
                  ערוך סניף
                </button>
                <button
                  onClick={toggleBranchStatus}
                  disabled={saving}
                  className={`btn-secondary flex-1 sm:flex-none ${
                    selectedBranch.isActive !== false
                      ? 'text-orange-600 hover:bg-orange-50'
                      : ''
                  }`}
                  style={selectedBranch.isActive !== false ? {} : { color: 'var(--color-primary-dark)' }}
                >
                  {selectedBranch.isActive !== false ? <Pause size={16} /> : <Play size={16} />}
                  {saving ? '...' : selectedBranch.isActive !== false ? 'השהה סניף' : 'הפעל סניף'}
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

      {/* מודל יצירת סניף חדש */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content w-full max-w-lg">
            <div className="modal-header">
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>סניף חדש</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '2px' }}>הוספת סניף חדש למערכת</p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewBranch({
                    customerId: '',
                    branchName: '',
                    city: '',
                    address: '',
                    region: '',
                    visitIntervalDays: 45,
                    useCustomerAddress: true
                  });
                  setSelectedCustomerAddress('');
                }}
                className="modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="modal-body space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  לקוח *
                </label>
                <select
                  value={newBranch.customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                  required
                >
                  <option value="">בחר לקוח</option>
                  {customers.map(customer => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  שם הסניף *
                </label>
                <input
                  type="text"
                  value={newBranch.branchName}
                  onChange={(e) => setNewBranch({ ...newBranch, branchName: e.target.value })}
                  placeholder="לדוגמה: סניף ראשי"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    עיר
                  </label>
                  <input
                    type="text"
                    value={newBranch.city}
                    onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
                    placeholder="עיר"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    אזור
                  </label>
                  <input
                    type="text"
                    value={newBranch.region}
                    onChange={(e) => setNewBranch({ ...newBranch, region: e.target.value })}
                    placeholder="צפון/מרכז/דרום"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                  />
                </div>
              </div>

              {/* אפשרות להשתמש בכתובת הלקוח */}
              {newBranch.customerId && selectedCustomerAddress && (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-primary-50)' }}>
                  <input
                    type="checkbox"
                    id="useCustomerAddressBranch"
                    checked={newBranch.useCustomerAddress}
                    onChange={(e) => setNewBranch({ ...newBranch, useCustomerAddress: e.target.checked })}
                    className="w-4 h-4 rounded focus:ring-(--color-primary)"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <label htmlFor="useCustomerAddressBranch" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    השתמש בכתובת הלקוח: <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{selectedCustomerAddress}</span>
                  </label>
                </div>
              )}

              {/* כתובת ידנית אם לא משתמשים בכתובת הלקוח */}
              {(!newBranch.useCustomerAddress || !selectedCustomerAddress) && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    כתובת
                  </label>
                  <input
                    type="text"
                    value={newBranch.address}
                    onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                    placeholder="כתובת מלאה"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  מחזור ביקור (ימים)
                </label>
                <input
                  type="number"
                  value={newBranch.visitIntervalDays}
                  onChange={(e) => setNewBranch({ ...newBranch, visitIntervalDays: e.target.value })}
                  placeholder="45"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                  min="1"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewBranch({
                      customerId: '',
                      branchName: '',
                      city: '',
                      address: '',
                      region: '',
                      visitIntervalDays: 45,
                      useCustomerAddress: true
                    });
                    setSelectedCustomerAddress('');
                  }}
                  className="btn-secondary"
                  disabled={saving}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={!newBranch.customerId || !newBranch.branchName || saving}
                  className="btn-primary disabled:opacity-50"
                >
                  <Plus size={16} />
                  {saving ? 'שומר...' : 'צור סניף'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* מודל עריכת סניף */}
      {showEditBranchModal && editBranch && (
        <div className="modal-overlay">
          <div className="modal-content w-full max-w-lg">
            <div className="modal-header">
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>עריכת סניף</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '2px' }}>{editBranch.branchName}</p>
              </div>
              <button
                onClick={() => {
                  setShowEditBranchModal(false);
                  setEditBranch(null);
                }}
                className="modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateBranch} className="modal-body space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>שם הסניף *</label>
                <input
                  type="text"
                  value={editBranch.branchName}
                  onChange={(e) => setEditBranch({ ...editBranch, branchName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>עיר</label>
                  <input
                    type="text"
                    value={editBranch.city || ''}
                    onChange={(e) => setEditBranch({ ...editBranch, city: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>אזור</label>
                  <input
                    type="text"
                    value={editBranch.region || ''}
                    onChange={(e) => setEditBranch({ ...editBranch, region: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>כתובת</label>
                <input
                  type="text"
                  value={editBranch.address || ''}
                  onChange={(e) => setEditBranch({ ...editBranch, address: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>מחזור ביקור (ימים)</label>
                  <input
                    type="number"
                    value={editBranch.visitIntervalDays || 45}
                    onChange={(e) => setEditBranch({ ...editBranch, visitIntervalDays: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>סטטוס</label>
                  <select
                    value={editBranch.isActive !== false ? 'active' : 'inactive'}
                    onChange={(e) => setEditBranch({ ...editBranch, isActive: e.target.value === 'active' })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                  >
                    <option value="active">פעיל</option>
                    <option value="inactive">מושהה</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditBranchModal(false);
                    setEditBranch(null);
                  }}
                  className="btn-secondary"
                  disabled={saving}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={!editBranch.branchName || saving}
                  className="btn-primary disabled:opacity-50"
                >
                  <Edit3 size={16} />
                  {saving ? 'שומר...' : 'שמור שינויים'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* מודל הוספת מכשיר */}
      {showAddDeviceModal && (
        <div className="modal-overlay">
          <div className="modal-content w-full max-w-md">
            <div className="modal-header">
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>הוספת מכשיר לסניף</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '2px' }}>{selectedBranch?.branchName}</p>
              </div>
              <button
                onClick={() => {
                  setShowAddDeviceModal(false);
                  setNewDeviceData({ deviceType: '', scentId: '', locationInBranch: '' });
                }}
                className="modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddDevice} className="modal-body space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>סוג מכשיר *</label>
                <select
                  value={newDeviceData.deviceType}
                  onChange={(e) => setNewDeviceData({ ...newDeviceData, deviceType: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                  required
                >
                  <option value="">בחר סוג מכשיר</option>
                  {deviceTypes.map(type => (
                    <option key={type._id} value={type.name}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>ריח</label>
                <select
                  value={newDeviceData.scentId}
                  onChange={(e) => setNewDeviceData({ ...newDeviceData, scentId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                >
                  <option value="">בחר ריח</option>
                  {scents.map(scent => (
                    <option key={scent._id} value={scent._id}>{scent.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>מיקום במבנה</label>
                <input
                  type="text"
                  value={newDeviceData.locationInBranch}
                  onChange={(e) => setNewDeviceData({ ...newDeviceData, locationInBranch: e.target.value })}
                  placeholder="לדוגמה: לובי, חדר ישיבות..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDeviceModal(false);
                    setNewDeviceData({ deviceType: '', scentId: '', locationInBranch: '' });
                  }}
                  className="btn-secondary"
                  disabled={saving}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={!newDeviceData.deviceType || saving}
                  className="btn-primary disabled:opacity-50"
                >
                  <Plus size={16} />
                  {saving ? 'מוסיף...' : 'הוסף מכשיר'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
