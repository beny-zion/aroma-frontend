'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { devicesAPI, scentsAPI, serviceLogsAPI } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import { Droplets, Search, CheckCircle, ArrowRight } from 'lucide-react';

export default function RefillPage() {
  const searchParams = useSearchParams();
  const preselectedDeviceId = searchParams.get('device');
  const preselectedBranchId = searchParams.get('branch');

  const [devices, setDevices] = useState([]);
  const [scents, setScents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // טופס
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedScent, setSelectedScent] = useState('');
  const [mlFilled, setMlFilled] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [notes, setNotes] = useState('');

  // חיפוש מכשיר
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // אם יש מכשיר מראש ב-URL
    if (preselectedDeviceId && devices.length > 0) {
      const device = devices.find(d => d._id === preselectedDeviceId);
      if (device) {
        selectDevice(device);
      }
    }
  }, [preselectedDeviceId, devices]);

  useEffect(() => {
    // אם יש סניף מראש ב-URL - סנן לפי הסניף
    if (preselectedBranchId && devices.length > 0) {
      const branchDevices = devices.filter(d => d.branchId?._id === preselectedBranchId);
      if (branchDevices.length > 0) {
        const branchName = branchDevices[0]?.branchId?.branchName || '';
        setSearchTerm(branchName);
      }
    }
  }, [preselectedBranchId, devices]);

  async function loadData() {
    try {
      setLoading(true);
      const [devicesData, scentsData] = await Promise.all([
        devicesAPI.getAll(),
        scentsAPI.getAll()
      ]);
      setDevices(devicesData);
      setScents(scentsData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  function selectDevice(device) {
    setSelectedDevice(device);
    setSelectedScent(device.scentId?._id || '');
    setMlFilled(device.mlPerRefill?.toString() || '100');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!selectedDevice || !mlFilled) {
      alert('יש לבחור מכשיר ולהזין כמות מילוי');
      return;
    }

    try {
      setSaving(true);

      await serviceLogsAPI.create({
        deviceId: selectedDevice._id,
        mlFilled: parseInt(mlFilled),
        scentId: selectedScent || undefined,
        technicianName: technicianName || undefined,
        technicianNotes: notes || undefined,
        date: new Date().toISOString()
      });

      setSuccess(true);

      // איפוס הטופס
      setTimeout(() => {
        setSelectedDevice(null);
        setSelectedScent('');
        setMlFilled('');
        setNotes('');
        setSuccess(false);
        loadData(); // רענון הנתונים
      }, 2000);

    } catch (err) {
      console.error('Error saving refill:', err);
      alert(err.message || 'שגיאה בשמירת המילוי');
    } finally {
      setSaving(false);
    }
  }

  const filteredDevices = devices.filter(device => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return device.branchId?.branchName?.toLowerCase().includes(search) ||
           device.branchId?.customerId?.name?.toLowerCase().includes(search) ||
           device.deviceType?.toLowerCase().includes(search) ||
           device.locationInBranch?.toLowerCase().includes(search);
  });

  // מיון לפי דחיפות
  const sortedDevices = [...filteredDevices].sort((a, b) => {
    const statusOrder = { red: 0, yellow: 1, green: 2, unknown: 3 };
    return (statusOrder[a.refillStatus] || 3) - (statusOrder[b.refillStatus] || 3);
  });

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

  // הודעת הצלחה
  if (success) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-(--color-primary)">המילוי נרשם בהצלחה!</h2>
          <p className="text-gray-500 mt-2">מעבר לטופס חדש...</p>
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
            ביצוע מילוי
          </h1>
          <p className="page-subtitle">רישום מילוי חדש למכשיר</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* בחירת מכשיר */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4">בחר מכשיר</h2>

          {/* חיפוש */}
          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש מכשיר..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
            />
          </div>

          {/* רשימת מכשירים */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {sortedDevices.slice(0, 50).map(device => (
              <div
                key={device._id}
                onClick={() => selectDevice(device)}
                className={`p-3 rounded-lg cursor-pointer transition-colors border-2 ${
                  selectedDevice?._id === device._id
                    ? 'border-(--color-primary) bg-(--color-primary-50)'
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={device.refillStatus} showText={false} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {device.branchId?.customerId?.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {device.branchId?.branchName} | {device.deviceType}
                      {device.locationInBranch && ` | ${device.locationInBranch}`}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {device.scentId?.name}
                  </div>
                </div>
              </div>
            ))}

            {sortedDevices.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Search className="w-8 h-8" />
                </div>
                <p>לא נמצאו מכשירים</p>
              </div>
            )}

            {sortedDevices.length > 50 && (
              <div className="text-center py-2 text-gray-400 text-sm">
                מציג 50 מתוך {sortedDevices.length} מכשירים. הקלד לחיפוש מדויק יותר.
              </div>
            )}
          </div>
        </div>

        {/* טופס מילוי */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4">פרטי המילוי</h2>

          {selectedDevice ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* פרטי מכשיר נבחר */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <StatusBadge status={selectedDevice.refillStatus} />
                  <span className="font-bold">{selectedDevice.deviceType}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <div>{selectedDevice.branchId?.customerId?.name}</div>
                  <div>{selectedDevice.branchId?.branchName}</div>
                  {selectedDevice.locationInBranch && (
                    <div>מיקום: {selectedDevice.locationInBranch}</div>
                  )}
                </div>
              </div>

              {/* בחירת ריח */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ריח {selectedScent && selectedScent !== selectedDevice.scentId?._id && (
                    <span className="text-orange-600 text-xs mr-2">(שונה מהריח הקודם)</span>
                  )}
                </label>
                <select
                  value={selectedScent}
                  onChange={(e) => setSelectedScent(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                >
                  <option value="">ללא שינוי / לא ידוע</option>
                  {scents.map(scent => (
                    <option key={scent._id} value={scent._id}>
                      {scent.name} ({scent.stockQuantity} מ"ל במלאי)
                    </option>
                  ))}
                </select>
                {/* כפתורי בחירה מהירה לריחות */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {scents.slice(0, 5).map(scent => (
                    <button
                      key={scent._id}
                      type="button"
                      onClick={() => setSelectedScent(scent._id)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        selectedScent === scent._id
                          ? 'bg-(--color-primary) text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {scent.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* כמות מילוי */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  כמות מילוי (מ"ל) *
                </label>
                <input
                  type="number"
                  value={mlFilled}
                  onChange={(e) => setMlFilled(e.target.value)}
                  required
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent text-lg"
                  placeholder="100"
                />
                <div className="flex gap-2 mt-2">
                  {[50, 80, 100, 120, 150].map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setMlFilled(amount.toString())}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* שם טכנאי */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שם טכנאי
                </label>
                <input
                  type="text"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                  placeholder="הכנס שם"
                />
              </div>

              {/* הערות */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  הערות
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                  placeholder="הערות נוספות..."
                />
              </div>

              {/* כפתור שמירה */}
              <button
                type="submit"
                disabled={saving}
                className="w-full btn-primary py-3 text-lg disabled:opacity-50"
              >
                {saving ? 'שומר...' : (
                  <>
                    <Droplets className="w-5 h-5" />
                    שמור מילוי
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <ArrowRight className="w-8 h-8" />
              </div>
              <p>בחר מכשיר מהרשימה כדי לרשום מילוי</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
