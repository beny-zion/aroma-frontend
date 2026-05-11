'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';
import { devicesAPI } from '@/lib/api';
import { useScents, useActiveDeviceTypes, useInvalidate } from '@/hooks/useData';
import Breadcrumb from '@/components/shared/Breadcrumb';
import StatusBadge from '@/components/StatusBadge';
import RefillProgressBar from '@/components/RefillProgressBar';
import VisitsPanel from '@/components/VisitsPanel';
import AuditLogPanel from '@/components/AuditLogPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Droplets, MapPin, Calendar, Wrench, PlusCircle, MinusCircle,
  RefreshCw, ArrowRight, Loader2, Clock, User, FileText,
  Edit3, MoreVertical, Pause, Play
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

const serviceTypeConfig = {
  refill: {
    label: 'מילוי',
    color: 'var(--color-status-green-text)',
    bg: 'var(--color-status-green-bg)',
    borderColor: 'var(--color-status-green)',
    Icon: Droplets,
  },
  repair: {
    label: 'תיקון',
    color: 'var(--color-status-amber-text)',
    bg: 'var(--color-status-amber-bg)',
    borderColor: 'var(--color-status-amber)',
    Icon: Wrench,
  },
  replacement: {
    label: 'החלפה',
    color: '#2563EB',
    bg: '#EFF6FF',
    borderColor: '#93C5FD',
    Icon: RefreshCw,
  },
  installation: {
    label: 'התקנה',
    color: 'var(--color-primary-dark)',
    bg: 'var(--color-primary-50)',
    borderColor: 'var(--color-primary-light)',
    Icon: PlusCircle,
  },
  removal: {
    label: 'הסרה',
    color: 'var(--color-status-red-text)',
    bg: 'var(--color-status-red-bg)',
    borderColor: 'var(--color-status-red)',
    Icon: MinusCircle,
  },
};

export default function DeviceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const swrKey = id ? `/devices/${id}` : null;

  const { data: device, error: deviceError, isLoading: deviceLoading } = useSWR(swrKey);
  const { data: logsData, error: logsError, isLoading: logsLoading } = useSWR(id ? `/service-logs/device/${id}/history` : null);
  const { scents } = useScents();
  const { deviceTypes } = useActiveDeviceTypes();
  const { invalidateDevices } = useInvalidate();

  const serviceLogs = Array.isArray(logsData) ? logsData : [];
  const isLoading = deviceLoading || logsLoading;
  const error = deviceError || logsError;

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

  function openEdit() {
    setEditForm({
      deviceType: device.deviceType || '',
      scentId: device.scentId?._id || device.scentId || '',
      locationInBranch: device.locationInBranch || '',
      mlPerRefill: device.mlPerRefill || 100,
      refillIntervalDays: device.refillIntervalDays || 30,
      monthlyRate: device.monthlyRate || 0
    });
    setEditOpen(true);
  }

  function handleDeviceTypeChange(typeName) {
    const dt = deviceTypes?.find(t => t.name === typeName);
    setEditForm(prev => ({
      ...prev,
      deviceType: typeName,
      mlPerRefill: dt?.mlPerRefill || prev.mlPerRefill,
      refillIntervalDays: dt?.defaultRefillInterval || prev.refillIntervalDays
    }));
  }

  async function handleSave() {
    if (!editForm.deviceType) {
      toast.error('יש לבחור סוג מכשיר');
      return;
    }
    try {
      setSaving(true);
      await devicesAPI.update(device._id, {
        deviceType: editForm.deviceType,
        scentId: editForm.scentId || null,
        locationInBranch: editForm.locationInBranch,
        mlPerRefill: parseInt(editForm.mlPerRefill) || 100,
        refillIntervalDays: parseInt(editForm.refillIntervalDays) || 30,
        monthlyRate: Number(editForm.monthlyRate) || 0
      });
      await mutate(swrKey);
      invalidateDevices();
      toast.success('פרטי המכשיר עודכנו');
      setEditOpen(false);
    } catch (err) {
      toast.error(err.message || 'שגיאה בעדכון מכשיר');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    try {
      await devicesAPI.update(device._id, { isActive: !device.isActive });
      await mutate(swrKey);
      invalidateDevices();
      toast.success(device.isActive ? 'המכשיר הוקפא' : 'המכשיר הופעל');
    } catch (err) {
      toast.error(err.message || 'שגיאה בעדכון סטטוס');
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  if (error || (!isLoading && !device)) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="empty-state">
          <div className="empty-state-icon"><Droplets className="w-7 h-7" /></div>
          <p>{error?.message || 'המכשיר לא נמצא'}</p>
          <button onClick={() => router.back()} className="btn-primary mt-4">
            חזרה
          </button>
        </div>
      </div>
    );
  }

  const branchId = device.branchId?._id;
  const branchName = device.branchId?.branchName || 'סניף';
  const customerId = device.branchId?.customerId?._id;
  const customerName = device.branchId?.customerId?.name || 'לקוח';
  const daysSince = getDaysSince(device.lastRefillDate);
  const deviceLabel = `${device.deviceType}${device.locationInBranch ? ` - ${device.locationInBranch}` : ''}`;

  const breadcrumbItems = [
    { label: 'לקוחות', href: '/customers' },
    { label: customerName, href: `/customers/${customerId}` },
    { label: branchName, href: `/branches/${branchId}` },
    { label: deviceLabel, href: `/devices/${device._id}` },
  ];

  return (
    <div className="space-y-4">
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/branches/${branchId}`)}
            className="h-8 w-8 rounded-md flex items-center justify-center text-[var(--text-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)] transition-colors"
            aria-label="חזרה"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-[var(--text-strong)]">
              {deviceLabel}
            </h1>
            <p className="text-[12.5px] text-[var(--text-soft)] mt-0.5">
              {branchName} · {customerName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={device.refillStatus} />
          {device.isActive === false && (
            <span className="status-badge bg-[var(--surface-muted)] text-[var(--text-soft)]">מוקפא</span>
          )}
          <Button onClick={openEdit} variant="outline" size="sm">
            <Edit3 className="w-4 h-4" />
            ערוך
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-9 w-9 rounded-md border flex items-center justify-center text-[var(--text-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)]"
                aria-label="פעולות"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem onClick={toggleActive}>
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
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full" dir="rtl">
        <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0 gap-1">
          <TabsTrigger value="details" className="!flex-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--brand)] data-[state=active]:text-[var(--brand)] data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-2 text-sm">
            פרטים
          </TabsTrigger>
          <TabsTrigger value="history" className="!flex-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--brand)] data-[state=active]:text-[var(--brand)] data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-2 text-sm">
            היסטוריית שירות
            {serviceLogs.length > 0 && (
              <span className="text-[var(--text-soft)] font-tabular ms-1">({serviceLogs.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="visits" className="!flex-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--brand)] data-[state=active]:text-[var(--brand)] data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-2 text-sm">
            הזמנות עבודה
          </TabsTrigger>
          <TabsTrigger value="audit" className="!flex-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--brand)] data-[state=active]:text-[var(--brand)] data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-2 text-sm">
            תיעוד שינויים
          </TabsTrigger>
        </TabsList>

        {/* TAB: פרטים */}
        <TabsContent value="details" className="mt-4 space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Droplets className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            פרטי מכשיר
          </h2>
          <a
            href={`/refill?device=${device._id}`}
            className="action-btn action-btn-primary"
          >
            <Droplets size={14} />
            ביצוע מילוי
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
            <Droplets size={16} style={{ color: 'var(--color-primary)' }} />
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>סוג מכשיר</span>
              <div className="font-medium">{device.deviceType}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
            <MapPin size={16} style={{ color: 'var(--color-primary)' }} />
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>מיקום בסניף</span>
              <div className="font-medium">{device.locationInBranch || '-'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
            <Droplets size={16} style={{ color: 'var(--color-primary)' }} />
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>ריח נוכחי</span>
              <div className="font-medium">{device.scentId?.name || '-'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
            <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>מילוי אחרון</span>
              <div className="font-medium">{formatDate(device.lastRefillDate)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
            <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>מילוי הבא</span>
              <div className="font-medium">{formatDate(device.nextScheduledRefill)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
            <Clock size={16} style={{ color: 'var(--color-primary)' }} />
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>מרווח מילוי</span>
              <div className="font-medium">{device.refillIntervalDays || 30} ימים | {device.mlPerRefill || 100} מ"ל</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
            <Wrench size={16} style={{ color: 'var(--color-primary)' }} />
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>תעריף חודשי</span>
              <div className="font-bold text-[var(--brand)] font-tabular">
                {device.monthlyRate ? `${device.monthlyRate.toLocaleString('he-IL')} ₪` : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {daysSince !== null && (
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
            <RefillProgressBar daysSinceRefill={daysSince} />
          </div>
        )}

        {device.notes && (
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>הערות: </span>
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{device.notes}</span>
          </div>
        )}
      </div>

        </TabsContent>

        {/* TAB: ביקורים */}
        <TabsContent value="visits" className="mt-4">
          <VisitsPanel deviceId={device._id} title="הזמנות עבודה הכוללות מכשיר זה" />
        </TabsContent>

        {/* TAB: היסטוריית שירות */}
        <TabsContent value="history" className="mt-4">
      <div>
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <FileText className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          היסטוריית שירות
          <span className="text-sm font-normal" style={{ color: 'var(--color-text-muted)' }}>
            ({serviceLogs.length})
          </span>
        </h2>

        {serviceLogs.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div
              className="absolute top-0 bottom-0 hidden md:block"
              style={{
                right: '19px',
                width: '2px',
                background: 'var(--color-border)',
              }}
            />

            <div className="space-y-3">
              {serviceLogs.map((log, index) => {
                const typeConfig = serviceTypeConfig[log.serviceType] || serviceTypeConfig.refill;
                const { Icon } = typeConfig;

                return (
                  <div key={log._id || index} className="flex gap-3 md:gap-4 relative">
                    {/* Timeline dot - desktop */}
                    <div className="hidden md:flex shrink-0 w-10 items-start justify-center pt-4 z-10">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: typeConfig.bg, border: `2px solid ${typeConfig.borderColor}` }}
                      >
                        <Icon size={14} style={{ color: typeConfig.color }} />
                      </div>
                    </div>

                    {/* Card */}
                    <div className="card flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {/* Mobile icon */}
                          <div
                            className="md:hidden w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: typeConfig.bg, border: `2px solid ${typeConfig.borderColor}` }}
                          >
                            <Icon size={12} style={{ color: typeConfig.color }} />
                          </div>
                          <span
                            className="text-xs font-medium px-2 py-1 rounded-full"
                            style={{ background: typeConfig.bg, color: typeConfig.color }}
                          >
                            {typeConfig.label}
                          </span>
                          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            {formatDate(log.date)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {log.technicianName && (
                          <div className="flex items-center gap-1.5">
                            <User size={13} className="shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                            <span>טכנאי: <span style={{ color: 'var(--color-text-primary)' }}>{log.technicianName}</span></span>
                          </div>
                        )}
                        {log.mlFilled > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Droplets size={13} className="shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                            <span>כמות: <span style={{ color: 'var(--color-text-primary)' }}>{log.mlFilled} מ"ל</span></span>
                          </div>
                        )}
                        {log.scentId?.name && (
                          <div className="flex items-center gap-1.5">
                            <Droplets size={13} className="shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                            <span>ריח: <span style={{ color: 'var(--color-text-primary)' }}>{log.scentId.name}</span></span>
                          </div>
                        )}
                      </div>

                      {(log.technicianNotes || log.issuesFound) && (
                        <div className="mt-2 pt-2 text-sm" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                          {log.issuesFound && (
                            <div style={{ color: 'var(--color-status-red-text)' }}>
                              תקלות: {log.issuesFound}
                            </div>
                          )}
                          {log.technicianNotes && (
                            <div style={{ color: 'var(--color-text-secondary)' }}>
                              הערות: {log.technicianNotes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><FileText className="w-7 h-7" /></div>
            <p>אין היסטוריית שירות למכשיר זה</p>
          </div>
        )}
      </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <AuditLogPanel entityType="device" entityId={device._id} />
        </TabsContent>
      </Tabs>

      {/* Edit device dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>עריכת מכשיר</DialogTitle>
            <DialogDescription>עדכון סוג, ריח, מיקום ומחזור מילוי.</DialogDescription>
          </DialogHeader>
          {editForm && (
            <div className="grid gap-3 py-1">
              <div className="grid gap-1.5">
                <Label htmlFor="dev-type">סוג מכשיר *</Label>
                <Select value={editForm.deviceType} onValueChange={handleDeviceTypeChange}>
                  <SelectTrigger id="dev-type"><SelectValue placeholder="בחר סוג מכשיר" /></SelectTrigger>
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
                  <Label htmlFor="dev-scent">ריח</Label>
                  <Select
                    value={editForm.scentId || 'none'}
                    onValueChange={(v) => setEditForm({ ...editForm, scentId: v === 'none' ? '' : v })}
                  >
                    <SelectTrigger id="dev-scent"><SelectValue placeholder="בחר ריח" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">ללא ריח</SelectItem>
                      {scents?.map(s => (
                        <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="dev-location">מיקום בסניף</Label>
                  <Input
                    id="dev-location"
                    value={editForm.locationInBranch}
                    onChange={(e) => setEditForm({ ...editForm, locationInBranch: e.target.value })}
                    placeholder="כניסה / קופה / מסדרון"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="dev-ml">כמות מילוי (מ"ל)</Label>
                  <Input
                    id="dev-ml"
                    type="number"
                    min="1"
                    value={editForm.mlPerRefill}
                    onChange={(e) => setEditForm({ ...editForm, mlPerRefill: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="dev-interval">מחזור מילוי (ימים)</Label>
                  <Input
                    id="dev-interval"
                    type="number"
                    min="1"
                    value={editForm.refillIntervalDays}
                    onChange={(e) => setEditForm({ ...editForm, refillIntervalDays: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-1.5 max-w-[240px]">
                <Label htmlFor="dev-rate">תעריף חודשי (₪)</Label>
                <Input
                  id="dev-rate"
                  type="number"
                  min="0"
                  value={editForm.monthlyRate}
                  onChange={(e) => setEditForm({ ...editForm, monthlyRate: e.target.value })}
                  placeholder="0"
                />
                <p className="text-[11px] text-[var(--text-muted)]">תשלום חודשי שהלקוח משלם על המכשיר הזה.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>ביטול</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'שומר...' : 'שמור שינויים'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
