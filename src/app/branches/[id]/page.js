'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';
import { branchesAPI, devicesAPI } from '@/lib/api';
import { useScents, useActiveDeviceTypes, useInvalidate } from '@/hooks/useData';
import Breadcrumb from '@/components/shared/Breadcrumb';
import StatusBadge from '@/components/StatusBadge';
import RefillProgressBar from '@/components/RefillProgressBar';
import VisitsPanel from '@/components/VisitsPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Building2, MapPin, Phone, User, Droplets, Eye,
  ArrowRight, Loader2, Edit3, Plus, MoreVertical, Pause, Play
} from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('he-IL');
}

function getDaysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function BranchDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const swrKey = id ? `/branches/${id}` : null;
  const { data: branch, error, isLoading } = useSWR(swrKey);
  const { scents } = useScents();
  const { deviceTypes } = useActiveDeviceTypes();
  const { invalidateBranches, invalidateDevices } = useInvalidate();

  // Edit branch dialog
  const [branchOpen, setBranchOpen] = useState(false);
  const [branchForm, setBranchForm] = useState(null);
  const [savingBranch, setSavingBranch] = useState(false);

  // Add/edit device dialog (mode: 'add' | 'edit')
  const [deviceOpen, setDeviceOpen] = useState(false);
  const [deviceMode, setDeviceMode] = useState('add');
  const [editingDeviceId, setEditingDeviceId] = useState(null);
  const [deviceForm, setDeviceForm] = useState(null);
  const [savingDevice, setSavingDevice] = useState(false);

  function openEditBranch() {
    setBranchForm({
      branchName: branch.branchName || '',
      city: branch.city || '',
      region: branch.region || '',
      address: branch.address || '',
      contactPerson: branch.contactPerson || '',
      contactPhone: branch.contactPhone || '',
      visitIntervalDays: branch.visitIntervalDays || 30,
      isActive: branch.isActive !== false,
      notes: branch.notes || ''
    });
    setBranchOpen(true);
  }

  async function handleSaveBranch() {
    if (!branchForm.branchName?.trim()) {
      toast.error('שם סניף הוא שדה חובה');
      return;
    }
    try {
      setSavingBranch(true);
      await branchesAPI.update(branch._id, {
        branchName: branchForm.branchName.trim(),
        city: branchForm.city,
        region: branchForm.region,
        address: branchForm.address,
        contactPerson: branchForm.contactPerson,
        contactPhone: branchForm.contactPhone,
        visitIntervalDays: parseInt(branchForm.visitIntervalDays) || 30,
        isActive: branchForm.isActive,
        notes: branchForm.notes
      });
      await mutate(swrKey);
      invalidateBranches();
      toast.success('פרטי הסניף עודכנו');
      setBranchOpen(false);
    } catch (err) {
      toast.error(err.message || 'שגיאה בעדכון סניף');
    } finally {
      setSavingBranch(false);
    }
  }

  function openAddDevice() {
    setDeviceMode('add');
    setEditingDeviceId(null);
    setDeviceForm({
      deviceType: '',
      scentId: '',
      locationInBranch: '',
      mlPerRefill: 100,
      refillIntervalDays: 30,
      monthlyRate: 0
    });
    setDeviceOpen(true);
  }

  function openEditDevice(device) {
    setDeviceMode('edit');
    setEditingDeviceId(device._id);
    setDeviceForm({
      deviceType: device.deviceType || '',
      scentId: device.scentId?._id || device.scentId || '',
      locationInBranch: device.locationInBranch || '',
      mlPerRefill: device.mlPerRefill || 100,
      refillIntervalDays: device.refillIntervalDays || 30,
      monthlyRate: device.monthlyRate || 0
    });
    setDeviceOpen(true);
  }

  async function handleSaveDevice() {
    if (!deviceForm.deviceType) {
      toast.error('יש לבחור סוג מכשיר');
      return;
    }
    const payload = {
      deviceType: deviceForm.deviceType,
      scentId: deviceForm.scentId || null,
      locationInBranch: deviceForm.locationInBranch,
      mlPerRefill: parseInt(deviceForm.mlPerRefill) || 100,
      refillIntervalDays: parseInt(deviceForm.refillIntervalDays) || 30,
      monthlyRate: Number(deviceForm.monthlyRate) || 0
    };
    try {
      setSavingDevice(true);
      if (deviceMode === 'edit' && editingDeviceId) {
        await devicesAPI.update(editingDeviceId, payload);
        toast.success('פרטי המכשיר עודכנו');
      } else {
        await devicesAPI.create({
          ...payload,
          branchId: branch._id,
          isActive: true
        });
        toast.success('המכשיר נוסף');
      }
      await mutate(swrKey);
      invalidateDevices();
      setDeviceOpen(false);
    } catch (err) {
      toast.error(err.message || 'שגיאה בשמירת מכשיר');
    } finally {
      setSavingDevice(false);
    }
  }

  async function toggleDeviceActive(device) {
    try {
      await devicesAPI.update(device._id, { isActive: !device.isActive });
      await mutate(swrKey);
      invalidateDevices();
      toast.success(device.isActive ? 'המכשיר הוקפא' : 'המכשיר הופעל');
    } catch (err) {
      toast.error(err.message || 'שגיאה בעדכון סטטוס מכשיר');
    }
  }

  // When the device-type dropdown changes, prefill mlPerRefill from its default
  function handleDeviceTypeChange(typeName) {
    const dt = deviceTypes?.find(t => t.name === typeName);
    setDeviceForm(prev => ({
      ...prev,
      deviceType: typeName,
      mlPerRefill: dt?.mlPerRefill || prev.mlPerRefill,
      refillIntervalDays: dt?.defaultRefillInterval || prev.refillIntervalDays
    }));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-7 h-7 animate-spin text-[var(--brand)]" />
      </div>
    );
  }

  if (error || (!isLoading && !branch)) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><Building2 className="w-7 h-7" /></div>
        <p>{error?.message || 'הסניף לא נמצא'}</p>
        <Button onClick={() => router.back()} className="mt-4">חזרה</Button>
      </div>
    );
  }

  const customerId = branch.customerId?._id;
  const customerName = branch.customerId?.name || 'לקוח';

  const breadcrumbItems = [
    { label: 'לקוחות', href: '/customers' },
    { label: customerName, href: `/customers/${customerId}` },
    { label: branch.branchName, href: `/branches/${branch._id}` },
  ];

  return (
    <div className="space-y-4">
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/customers/${customerId}`)}
            className="h-8 w-8 rounded-md flex items-center justify-center text-[var(--text-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)] transition-colors"
            aria-label="חזרה"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-[var(--text-strong)]">
              {branch.branchName}
            </h1>
            <p className="text-[12.5px] text-[var(--text-soft)] mt-0.5">
              {customerName}
              {branch.devices && (
                <span className="font-tabular">
                  {' '}· {branch.devices.filter(d => d.isActive !== false).length} מכשירים פעילים
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {branch.isActive ? (
            <span className="status-badge status-badge-green">פעיל</span>
          ) : (
            <span className="status-badge bg-[var(--surface-muted)] text-[var(--text-soft)]">מוקפא</span>
          )}
          <Button onClick={openEditBranch} variant="outline" size="sm">
            <Edit3 className="w-4 h-4" />
            ערוך פרטים
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full" dir="rtl">
        <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0 gap-1">
          <TabsTrigger value="details" className="!flex-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--brand)] data-[state=active]:text-[var(--brand)] data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-2 text-sm">
            פרטים
          </TabsTrigger>
          <TabsTrigger value="devices" className="!flex-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--brand)] data-[state=active]:text-[var(--brand)] data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-2 text-sm">
            מכשירים
            {branch.devices?.length > 0 && (
              <span className="text-[var(--text-soft)] font-tabular ms-1">({branch.devices.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="visits" className="!flex-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--brand)] data-[state=active]:text-[var(--brand)] data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-2 text-sm">
            ביקורים
          </TabsTrigger>
          <TabsTrigger value="docs" disabled className="!flex-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--brand)] data-[state=active]:text-[var(--brand)] data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-2 text-sm opacity-50">
            תיעוד
            <span className="text-[10px] font-medium px-1 py-0 rounded bg-[var(--brand-50)] text-[var(--brand-hover)] ms-1">בקרוב</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB: פרטים */}
        <TabsContent value="details" className="mt-4 space-y-4">
      <div className="card">
        <h2 className="font-semibold text-sm flex items-center gap-2 text-[var(--text-strong)] mb-3">
          <Building2 className="w-4 h-4 text-[var(--brand)]" />
          פרטי סניף
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
          <DetailRow icon={MapPin} label="עיר" value={branch.city} />
          <DetailRow icon={MapPin} label="אזור" value={branch.region} />
          <DetailRow icon={Building2} label="כתובת" value={branch.address} />
          <DetailRow icon={Droplets} label="מחזור ביקור" value={`${branch.visitIntervalDays || 30} ימים`} />
          {branch.contactPerson && (
            <DetailRow icon={User} label="איש קשר" value={branch.contactPerson} />
          )}
          {branch.contactPhone && (
            <DetailRow icon={Phone} label="טלפון" value={branch.contactPhone} />
          )}
        </div>

        {branch.notes && (
          <div className="mt-3 pt-3 border-t border-[var(--border-soft)]">
            <span className="text-xs text-[var(--text-soft)]">הערות: </span>
            <span className="text-sm text-[var(--text-default)]">{branch.notes}</span>
          </div>
        )}
      </div>

        </TabsContent>

        {/* TAB: ביקורים */}
        <TabsContent value="visits" className="mt-4">
          <VisitsPanel branchId={branch._id} title="ביקורים והזמנות עבודה" />
        </TabsContent>

        {/* TAB: מכשירים */}
        <TabsContent value="devices" className="mt-4">
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-[var(--brand)]" />
            <h2 className="text-sm font-semibold text-[var(--text-strong)]">
              מכשירים בסניף
              {branch.devices && (
                <span className="text-[var(--text-soft)] font-medium font-tabular"> ({branch.devices.length})</span>
              )}
            </h2>
            {branch.devices && (() => {
              const totalRate = branch.devices
                .filter(d => d.isActive !== false)
                .reduce((s, d) => s + (d.monthlyRate || 0), 0);
              if (totalRate <= 0) return null;
              return (
                <span className="text-[12px] text-[var(--text-soft)]">
                  · סך תעריפים: <span className="font-tabular font-bold text-[var(--brand)]">{totalRate.toLocaleString('he-IL')} ₪/חודש</span>
                </span>
              );
            })()}
          </div>
          <Button onClick={openAddDevice} variant="outline" size="sm">
            <Plus className="w-4 h-4" />
            מכשיר חדש
          </Button>
        </div>

        {branch.devices && branch.devices.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="table-container hidden md:block">
              <table>
                <thead>
                  <tr>
                    <th>סטטוס</th>
                    <th>סוג</th>
                    <th>מיקום</th>
                    <th>ריח</th>
                    <th>תעריף</th>
                    <th>מילוי אחרון</th>
                    <th>ימים מאז מילוי</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {branch.devices.map(device => {
                    const daysSince = getDaysSince(device.lastRefillDate);
                    return (
                      <tr key={device._id}>
                        <td>
                          <StatusBadge status={device.refillStatus} showText={false} />
                        </td>
                        <td className="font-medium">
                          {device.deviceType}
                          {device.isActive === false && (
                            <span className="text-[11px] font-normal text-[var(--text-muted)] mr-2">(מוקפא)</span>
                          )}
                        </td>
                        <td>{device.locationInBranch || '-'}</td>
                        <td>{device.scentId?.name || '-'}</td>
                        <td className="font-tabular text-[var(--text-soft)]">
                          {device.monthlyRate ? `${device.monthlyRate.toLocaleString('he-IL')} ₪` : '-'}
                        </td>
                        <td>{formatDate(device.lastRefillDate)}</td>
                        <td>
                          {daysSince !== null ? (
                            <span className={`font-medium ${
                              daysSince > 45 ? 'text-[var(--status-red-text)]' :
                              daysSince > 30 ? 'text-[var(--status-amber-text)]' :
                              'text-[var(--status-green-text)]'
                            }`}>
                              {daysSince} ימים
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`/devices/${device._id}`}
                              className="action-btn action-btn-primary"
                              title="פרטי מכשיר"
                            >
                              <Eye size={12} />
                              פרטים
                            </a>
                            <button
                              onClick={() => openEditDevice(device)}
                              className="action-btn action-btn-edit"
                              title="ערוך מכשיר"
                            >
                              <Edit3 size={12} />
                              ערוך
                            </button>
                            <a
                              href={`/refill?device=${device._id}`}
                              className="action-btn action-btn-warning"
                              title="מילוי"
                            >
                              <Droplets size={12} />
                              מילוי
                            </a>
                            <DeviceMenu
                              device={device}
                              onToggle={() => toggleDeviceActive(device)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {branch.devices.map(device => {
                const daysSince = getDaysSince(device.lastRefillDate);
                return (
                  <div key={device._id} className="card">
                    <div className="flex justify-between items-start mb-2">
                      <div onClick={() => router.push(`/devices/${device._id}`)} className="cursor-pointer">
                        <div className="font-semibold text-[var(--text-strong)]">
                          {device.deviceType}
                          {device.isActive === false && (
                            <span className="text-[11px] font-normal text-[var(--text-muted)] mr-2">(מוקפא)</span>
                          )}
                        </div>
                        <div className="text-[12.5px] text-[var(--text-soft)]">
                          {device.locationInBranch || '-'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <StatusBadge status={device.refillStatus} />
                        <button
                          onClick={() => openEditDevice(device)}
                          className="action-btn action-btn-edit"
                          title="ערוך"
                        >
                          <Edit3 size={12} />
                        </button>
                        <DeviceMenu
                          device={device}
                          onToggle={() => toggleDeviceActive(device)}
                        />
                      </div>
                    </div>

                    <div className="text-[12.5px] space-y-0.5 mb-2 text-[var(--text-soft)]">
                      <div>ריח: {device.scentId?.name || '-'}</div>
                      <div>מילוי אחרון: {formatDate(device.lastRefillDate)}</div>
                      {device.monthlyRate > 0 && (
                        <div>תעריף: <span className="font-tabular font-medium text-[var(--brand)]">{device.monthlyRate.toLocaleString('he-IL')} ₪</span></div>
                      )}
                    </div>

                    {daysSince !== null && (
                      <RefillProgressBar daysSinceRefill={daysSince} />
                    )}

                    <div className="flex gap-2 mt-2 pt-2 border-t border-[var(--border-soft)]">
                      <a
                        href={`/devices/${device._id}`}
                        className="action-btn action-btn-primary flex-1 justify-center"
                      >
                        <Eye size={12} />
                        פרטים
                      </a>
                      <a
                        href={`/refill?device=${device._id}`}
                        className="action-btn action-btn-edit flex-1 justify-center"
                      >
                        <Droplets size={12} />
                        מילוי
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><Droplets className="w-6 h-6" /></div>
            <p>אין מכשירים בסניף זה</p>
          </div>
        )}
      </div>
        </TabsContent>
      </Tabs>

      {/* Edit branch dialog */}
      <Dialog open={branchOpen} onOpenChange={setBranchOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>עריכת סניף</DialogTitle>
            <DialogDescription>עדכון פרטי הסניף, איש קשר ומחזור הביקור.</DialogDescription>
          </DialogHeader>
          {branchForm && (
            <div className="grid gap-3 py-1">
              <div className="grid gap-1.5">
                <Label htmlFor="bd-name">שם סניף *</Label>
                <Input
                  id="bd-name"
                  value={branchForm.branchName}
                  onChange={(e) => setBranchForm({ ...branchForm, branchName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="bd-city">עיר</Label>
                  <Input
                    id="bd-city"
                    value={branchForm.city}
                    onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="bd-region">אזור</Label>
                  <Input
                    id="bd-region"
                    value={branchForm.region}
                    onChange={(e) => setBranchForm({ ...branchForm, region: e.target.value })}
                    placeholder="לדוגמה: רוממה"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="bd-address">כתובת</Label>
                <Input
                  id="bd-address"
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="bd-contact">איש קשר</Label>
                  <Input
                    id="bd-contact"
                    value={branchForm.contactPerson}
                    onChange={(e) => setBranchForm({ ...branchForm, contactPerson: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="bd-phone">טלפון</Label>
                  <Input
                    id="bd-phone"
                    value={branchForm.contactPhone}
                    onChange={(e) => setBranchForm({ ...branchForm, contactPhone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="bd-interval">מחזור ביקור (ימים)</Label>
                  <Input
                    id="bd-interval"
                    type="number"
                    min="1"
                    value={branchForm.visitIntervalDays}
                    onChange={(e) => setBranchForm({ ...branchForm, visitIntervalDays: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="bd-active">סטטוס</Label>
                  <Select
                    value={branchForm.isActive ? 'active' : 'inactive'}
                    onValueChange={(v) => setBranchForm({ ...branchForm, isActive: v === 'active' })}
                  >
                    <SelectTrigger id="bd-active"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">פעיל</SelectItem>
                      <SelectItem value="inactive">מוקפא</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="bd-notes">הערות</Label>
                <Textarea
                  id="bd-notes"
                  rows={2}
                  value={branchForm.notes}
                  onChange={(e) => setBranchForm({ ...branchForm, notes: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBranchOpen(false)} disabled={savingBranch}>ביטול</Button>
            <Button onClick={handleSaveBranch} disabled={savingBranch}>
              {savingBranch ? 'שומר...' : 'שמור שינויים'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit device dialog */}
      <Dialog open={deviceOpen} onOpenChange={setDeviceOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{deviceMode === 'edit' ? 'עריכת מכשיר' : 'מכשיר חדש'}</DialogTitle>
            <DialogDescription>
              {deviceMode === 'edit' ? 'עדכון פרטי המכשיר.' : 'הוספת מכשיר חדש לסניף.'}
            </DialogDescription>
          </DialogHeader>
          {deviceForm && (
            <div className="grid gap-3 py-1">
              <div className="grid gap-1.5">
                <Label htmlFor="dv-type">סוג מכשיר *</Label>
                <Select
                  value={deviceForm.deviceType}
                  onValueChange={handleDeviceTypeChange}
                >
                  <SelectTrigger id="dv-type"><SelectValue placeholder="בחר סוג מכשיר" /></SelectTrigger>
                  <SelectContent>
                    {deviceTypes?.map(t => (
                      <SelectItem key={t._id} value={t.name}>
                        {t.name}{t.mlPerRefill ? ` · ${t.mlPerRefill} מ"ל` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="dv-scent">ריח</Label>
                  <Select
                    value={deviceForm.scentId || 'none'}
                    onValueChange={(v) => setDeviceForm({ ...deviceForm, scentId: v === 'none' ? '' : v })}
                  >
                    <SelectTrigger id="dv-scent"><SelectValue placeholder="בחר ריח" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">ללא ריח</SelectItem>
                      {scents?.map(s => (
                        <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="dv-location">מיקום בסניף</Label>
                  <Input
                    id="dv-location"
                    value={deviceForm.locationInBranch}
                    onChange={(e) => setDeviceForm({ ...deviceForm, locationInBranch: e.target.value })}
                    placeholder="כניסה / קופה / מסדרון"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="dv-ml">כמות מילוי (מ"ל)</Label>
                  <Input
                    id="dv-ml"
                    type="number"
                    min="1"
                    value={deviceForm.mlPerRefill}
                    onChange={(e) => setDeviceForm({ ...deviceForm, mlPerRefill: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="dv-interval">מחזור מילוי (ימים)</Label>
                  <Input
                    id="dv-interval"
                    type="number"
                    min="1"
                    value={deviceForm.refillIntervalDays}
                    onChange={(e) => setDeviceForm({ ...deviceForm, refillIntervalDays: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-1.5 max-w-[240px]">
                <Label htmlFor="dv-rate">תעריף חודשי (₪)</Label>
                <Input
                  id="dv-rate"
                  type="number"
                  min="0"
                  value={deviceForm.monthlyRate}
                  onChange={(e) => setDeviceForm({ ...deviceForm, monthlyRate: e.target.value })}
                  placeholder="0"
                />
                <p className="text-[11px] text-[var(--text-muted)]">תשלום חודשי שהלקוח משלם על המכשיר הזה.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeviceOpen(false)} disabled={savingDevice}>ביטול</Button>
            <Button onClick={handleSaveDevice} disabled={savingDevice}>
              {savingDevice ? 'שומר...' : deviceMode === 'edit' ? 'שמור שינויים' : 'הוסף מכשיר'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
      <span className="text-[var(--text-soft)]">{label}:</span>
      <span className="text-[var(--text-default)]">{value || '-'}</span>
    </div>
  );
}

function DeviceMenu({ device, onToggle }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-7 w-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)]"
          aria-label="עוד פעולות"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuItem onClick={onToggle}>
          {device.isActive ? (
            <>
              <Pause className="w-4 h-4" />
              הקפא מכשיר
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              הפעל מכשיר
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
