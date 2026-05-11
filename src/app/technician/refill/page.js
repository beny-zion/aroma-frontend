'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { serviceLogsAPI } from '@/lib/api';
import { useAllDevices, useScents, useInvalidate } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import { Droplets, Search, CheckCircle, ArrowLeft } from 'lucide-react';

export default function TechnicianRefillPage() {
  const { user } = useAuth();
  const { devices, isLoading: devicesLoading } = useAllDevices();
  const { scents, isLoading: scentsLoading } = useScents();
  const { invalidateDevices, invalidateScents, invalidateServiceLogs } = useInvalidate();
  const loading = devicesLoading || scentsLoading;

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedScent, setSelectedScent] = useState('');
  const [mlFilled, setMlFilled] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  function selectDevice(device) {
    setSelectedDevice(device);
    setSelectedScent(device.scentId?._id || '');
    setMlFilled(device.mlPerRefill?.toString() || '100');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedDevice || !mlFilled) {
      toast.error('יש לבחור מכשיר ולהזין כמות');
      return;
    }
    try {
      setSaving(true);
      await serviceLogsAPI.create({
        deviceId: selectedDevice._id,
        mlFilled: parseInt(mlFilled),
        scentId: selectedScent || undefined,
        technicianName: user?.name,
        technicianNotes: notes || undefined,
        date: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => {
        setSelectedDevice(null);
        setSelectedScent('');
        setMlFilled('');
        setNotes('');
        setSearchTerm('');
        setSuccess(false);
        invalidateDevices();
        invalidateScents();
        invalidateServiceLogs();
      }, 1500);
    } catch (err) {
      toast.error(err.message || 'שגיאה');
    } finally {
      setSaving(false);
    }
  }

  const filtered = devices.filter(d => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return d.branchId?.branchName?.toLowerCase().includes(s) ||
      d.branchId?.customerId?.name?.toLowerCase().includes(s) ||
      d.deviceType?.toLowerCase().includes(s) ||
      d.locationInBranch?.toLowerCase().includes(s);
  });
  const sorted = [...filtered].sort((a, b) => {
    const order = { red: 0, yellow: 1, green: 2, unknown: 3 };
    return (order[a.refillStatus] || 3) - (order[b.refillStatus] || 3);
  });

  if (loading) return <div className="text-center py-12 text-muted-foreground">טוען...</div>;

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <CheckCircle className="w-16 h-16 text-green-500 mb-3" />
        <h2 className="text-lg font-bold text-primary">המילוי נרשם!</h2>
      </div>
    );
  }

  // Selected device → form view
  if (selectedDevice) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedDevice(null)}
          className="flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          חזרה לבחירת מכשיר
        </button>

        <div className="bg-card border rounded-xl p-3">
          <div className="text-xs text-muted-foreground">{selectedDevice.branchId?.customerId?.name}</div>
          <div className="font-bold">{selectedDevice.branchId?.branchName}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {selectedDevice.deviceType}
            {selectedDevice.locationInBranch && ` · ${selectedDevice.locationInBranch}`}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">ריח</label>
            <select
              value={selectedScent}
              onChange={(e) => setSelectedScent(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg text-sm bg-card"
            >
              <option value="">ללא שינוי</option>
              {scents.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">כמות מילוי (מ"ל) *</label>
            <input
              type="number"
              value={mlFilled}
              onChange={(e) => setMlFilled(e.target.value)}
              required
              min="1"
              className="w-full px-3 py-3 border rounded-lg text-lg font-bold bg-card"
              placeholder="100"
            />
            <div className="flex gap-1.5 mt-2">
              {[50, 80, 100, 120, 150].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMlFilled(n.toString())}
                  className={`flex-1 py-2 rounded-md text-sm font-medium ${
                    mlFilled === n.toString() ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >{n}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">הערות</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-card"
              placeholder="הערות..."
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-base bg-primary disabled:opacity-50"
          >
            <Droplets className="w-5 h-5" />
            {saving ? 'שומר...' : 'שמור מילוי'}
          </button>
        </form>
      </div>
    );
  }

  // Device picker
  return (
    <div className="space-y-3">
      <header>
        <h1 className="text-xl font-bold">מילוי מהיר</h1>
        <p className="text-sm text-muted-foreground">בחר מכשיר ורשום מילוי</p>
      </header>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="חיפוש לפי סניף, לקוח או סוג מכשיר..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2.5 pr-9 border rounded-lg text-sm bg-card"
        />
      </div>

      <div className="space-y-1.5">
        {sorted.slice(0, 80).map(device => {
          const statusColor = {
            red: 'bg-red-500', yellow: 'bg-amber-500', green: 'bg-green-500', unknown: 'bg-gray-300'
          }[device.refillStatus] || 'bg-gray-300';
          return (
            <button
              key={device._id}
              onClick={() => selectDevice(device)}
              className="w-full text-right p-3 bg-card border rounded-lg hover:bg-muted/50 active:bg-muted/80 transition-colors flex items-center gap-3"
            >
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusColor}`}></span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{device.branchId?.branchName || '-'}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {device.branchId?.customerId?.name} · {device.deviceType}
                  {device.locationInBranch && ` · ${device.locationInBranch}`}
                </div>
              </div>
              {device.scentId?.name && (
                <span className="text-[10px] text-muted-foreground shrink-0 max-w-20 truncate">{device.scentId.name}</span>
              )}
            </button>
          );
        })}
        {sorted.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">לא נמצאו מכשירים</p>
          </div>
        )}
        {sorted.length > 80 && (
          <p className="text-center text-xs text-muted-foreground py-2">
            מציג 80 מתוך {sorted.length}. הקלד לחיפוש מדויק יותר.
          </p>
        )}
      </div>
    </div>
  );
}
