'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';
import { customersAPI, branchesAPI } from '@/lib/api';
import { useInvalidate } from '@/hooks/useData';
import Breadcrumb from '@/components/shared/Breadcrumb';
import VisitsPanel from '@/components/VisitsPanel';
import AuditLogPanel from '@/components/AuditLogPanel';
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
  Users, Phone, Mail, Building2, CreditCard, MapPin,
  ArrowRight, Edit3, Eye, Loader2, Plus, MoreVertical, Pause, Play, Trash2,
  Receipt, Sparkles
} from 'lucide-react';

const statusConfig = {
  active: { label: 'פעיל', className: 'status-badge-green' },
  pending: { label: 'בתהליך', className: 'status-badge-yellow' },
  inactive: { label: 'לא פעיל', className: 'bg-[var(--surface-muted)] text-[var(--text-soft)]' },
};

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const swrKey = id ? `/customers/${id}` : null;
  const { data: customer, error, isLoading } = useSWR(swrKey);
  const { invalidateCustomers, invalidateBranches } = useInvalidate();

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Add/edit-branch dialog (mode: 'add' | 'edit')
  const [branchOpen, setBranchOpen] = useState(false);
  const [branchMode, setBranchMode] = useState('add');
  const [branchForm, setBranchForm] = useState(null);
  const [editingBranchId, setEditingBranchId] = useState(null);
  const [branchNameAuto, setBranchNameAuto] = useState(true);
  const [savingBranch, setSavingBranch] = useState(false);

  function openAddBranch() {
    setBranchMode('add');
    setEditingBranchId(null);
    setBranchForm({
      branchName: '',
      city: '',
      region: '',
      address: customer?.billingDetails?.address || '',
      contactPerson: '',
      contactPhone: '',
      visitIntervalDays: 30
    });
    setBranchNameAuto(true);
    setBranchOpen(true);
  }

  function openEditBranch(branch) {
    setBranchMode('edit');
    setEditingBranchId(branch._id);
    setBranchForm({
      branchName: branch.branchName || '',
      city: branch.city || '',
      region: branch.region || '',
      address: branch.address || '',
      contactPerson: branch.contactPerson || '',
      contactPhone: branch.contactPhone || '',
      visitIntervalDays: branch.visitIntervalDays || 30
    });
    setBranchNameAuto(false); // user already named it
    setBranchOpen(true);
  }

  async function toggleBranchActive(branch) {
    try {
      await branchesAPI.update(branch._id, { isActive: !branch.isActive });
      await mutate(swrKey);
      invalidateBranches();
      toast.success(branch.isActive ? 'הסניף הוקפא' : 'הסניף הופעל');
    } catch (err) {
      toast.error(err.message || 'שגיאה בעדכון סטטוס');
    }
  }

  function setBranchField(field, value) {
    setBranchForm(prev => {
      const next = { ...prev, [field]: value };
      if ((field === 'city') && branchNameAuto) {
        const cityTrimmed = (next.city || '').trim();
        next.branchName = cityTrimmed ? `${customer.name} ${cityTrimmed}` : customer.name;
      }
      return next;
    });
  }

  function setBranchName(value) {
    setBranchNameAuto(false);
    setBranchForm(prev => ({ ...prev, branchName: value }));
  }

  async function handleSaveBranch() {
    if (!branchForm.branchName?.trim()) {
      toast.error('שם סניף הוא שדה חובה');
      return;
    }
    const payload = {
      branchName: branchForm.branchName.trim(),
      city: branchForm.city,
      region: branchForm.region,
      address: branchForm.address,
      contactPerson: branchForm.contactPerson,
      contactPhone: branchForm.contactPhone,
      visitIntervalDays: parseInt(branchForm.visitIntervalDays) || 30
    };
    try {
      setSavingBranch(true);
      if (branchMode === 'edit' && editingBranchId) {
        await branchesAPI.update(editingBranchId, payload);
        toast.success('פרטי הסניף עודכנו');
      } else {
        await branchesAPI.create({
          ...payload,
          customerId: customer._id,
          isActive: true
        });
        toast.success('הסניף נוסף בהצלחה');
      }
      await mutate(swrKey);
      invalidateBranches();
      setBranchOpen(false);
    } catch (err) {
      toast.error(err.message || 'שגיאה בשמירת סניף');
    } finally {
      setSavingBranch(false);
    }
  }

  function openEdit() {
    setForm({
      name: customer.name || '',
      status: customer.status || 'active',
      monthlyPrice: customer.monthlyPrice || 0,
      notes: customer.notes || '',
      billingDetails: {
        phone: customer.billingDetails?.phone || '',
        email: customer.billingDetails?.email || '',
        taxId: customer.billingDetails?.taxId || '',
        address: customer.billingDetails?.address || '',
      }
    });
    setEditOpen(true);
  }

  async function handleSave() {
    if (!form.name?.trim()) {
      toast.error('שם לקוח הוא שדה חובה');
      return;
    }
    try {
      setSaving(true);
      await customersAPI.update(customer._id, {
        name: form.name.trim(),
        status: form.status,
        monthlyPrice: Number(form.monthlyPrice) || 0,
        billingDetails: form.billingDetails,
        notes: form.notes
      });
      await mutate(swrKey);
      invalidateCustomers();
      toast.success('פרטי הלקוח עודכנו');
      setEditOpen(false);
    } catch (err) {
      toast.error(err.message || 'שגיאה בעדכון פרטי לקוח');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-7 h-7 animate-spin text-[var(--brand)]" />
      </div>
    );
  }

  if (error || (!isLoading && !customer)) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><Users className="w-7 h-7" /></div>
        <p>{error?.message || 'הלקוח לא נמצא'}</p>
        <Button onClick={() => router.push('/customers')} className="mt-4">חזרה לרשימת לקוחות</Button>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'לקוחות', href: '/customers' },
    { label: customer.name, href: `/customers/${customer._id}` },
  ];

  const status = statusConfig[customer.status] || statusConfig.inactive;

  return (
    <div className="space-y-4">
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/customers')}
            className="h-8 w-8 rounded-md flex items-center justify-center text-[var(--text-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)] transition-colors"
            aria-label="חזרה"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-[var(--text-strong)]">
              {customer.name}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={`status-badge ${status.className}`}>{status.label}</span>
              {customer.branches && (
                <span className="text-[12px] text-[var(--text-soft)] font-tabular">
                  · {customer.branches.length} סניפים
                  · {customer.branches.reduce((s, b) => s + (b.activeDeviceCount || 0), 0)} מכשירים פעילים
                </span>
              )}
            </div>
          </div>
        </div>
        <Button onClick={openEdit} variant="outline" size="sm">
          <Edit3 className="w-4 h-4" />
          ערוך פרטים
        </Button>
      </div>

      <Tabs defaultValue="details" className="w-full" dir="rtl">
        <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0 gap-1">
          <TabsTrigger
            value="details"
            className="!flex-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--brand)] data-[state=active]:text-[var(--brand)] data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-2 text-sm"
          >
            פרטים
          </TabsTrigger>
          <TabsTrigger
            value="branches"
            className="!flex-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--brand)] data-[state=active]:text-[var(--brand)] data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-2 text-sm"
          >
            סניפים
            {customer.branches?.length > 0 && (
              <span className="text-[var(--text-soft)] font-tabular ms-1">({customer.branches.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="visits"
            className="!flex-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--brand)] data-[state=active]:text-[var(--brand)] data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-2 text-sm"
          >
            ביקורים
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="!flex-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--brand)] data-[state=active]:text-[var(--brand)] data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-2 text-sm"
          >
            תשלומים
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="!flex-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--brand)] data-[state=active]:text-[var(--brand)] data-[state=active]:shadow-none rounded-none border-b-2 border-transparent px-4 py-2 text-sm"
          >
            תיעוד שינויים
          </TabsTrigger>
        </TabsList>

        {/* TAB: פרטים */}
        <TabsContent value="details" className="mt-4 space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm flex items-center gap-2 text-[var(--text-strong)]">
                <CreditCard className="w-4 h-4 text-[var(--brand)]" />
                פרטי לקוח
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <DetailRow icon={Phone} label="טלפון" value={customer.billingDetails?.phone} />
              <DetailRow icon={Mail} label="אימייל" value={customer.billingDetails?.email} />
              <DetailRow icon={Building2} label="ע.מורשה" value={customer.billingDetails?.taxId} />
              <DetailRow icon={MapPin} label="כתובת" value={customer.billingDetails?.address} />
              <DetailRow
                icon={CreditCard}
                label="מחיר חודשי"
                value={`${(customer.monthlyPrice || 0).toLocaleString('he-IL')} ₪`}
                highlight
              />
            </div>
            {customer.notes && (
              <div className="mt-3 pt-3 border-t border-[var(--border-soft)]">
                <span className="text-xs text-[var(--text-soft)]">הערות: </span>
                <span className="text-sm text-[var(--text-default)]">{customer.notes}</span>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB: סניפים */}
        <TabsContent value="branches" className="mt-4 space-y-3">
          <div className="flex items-center justify-end mb-1">
            <Button size="sm" variant="outline" onClick={openAddBranch}>
              <Plus className="w-4 h-4" />
              סניף חדש
            </Button>
          </div>

        {customer.branches && customer.branches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {customer.branches.map((branch) => (
              <div
                key={branch._id}
                className="card hover:border-[var(--border-strong)] transition group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3
                    className="font-semibold text-[var(--text-strong)] cursor-pointer hover:text-[var(--brand)]"
                    onClick={() => router.push(`/branches/${branch._id}`)}
                  >
                    {branch.branchName}
                    {!branch.isActive && (
                      <span className="text-[11px] font-normal text-[var(--text-muted)] mr-2">(מוקפא)</span>
                    )}
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="h-7 w-7 -m-1 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)]"
                        aria-label="פעולות"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-44">
                      <DropdownMenuItem onClick={() => router.push(`/branches/${branch._id}`)}>
                        <Eye className="w-4 h-4" />
                        צפה בפרטי הסניף
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditBranch(branch)}>
                        <Edit3 className="w-4 h-4" />
                        ערוך פרטים
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toggleBranchActive(branch)}>
                        {branch.isActive ? (
                          <>
                            <Pause className="w-4 h-4" />
                            הקפא סניף
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            הפעל סניף
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div
                  className="text-[12.5px] mb-2 space-y-0.5 text-[var(--text-soft)] cursor-pointer"
                  onClick={() => router.push(`/branches/${branch._id}`)}
                >
                  {branch.city && <div>{branch.city}{branch.region && <span className="text-[var(--text-muted)]"> · {branch.region}</span>}</div>}
                  {branch.address && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="shrink-0 text-[var(--text-muted)]" />
                      {branch.address}
                    </div>
                  )}
                  {branch.contactPerson && (
                    <div className="text-[11.5px] text-[var(--text-muted)]">
                      {branch.contactPerson} {branch.contactPhone && `· ${branch.contactPhone}`}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs pt-2 border-t border-[var(--border-soft)] gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[var(--text-muted)] shrink-0">
                      {branch.activeDeviceCount ?? branch.deviceCount ?? 0} מכשירים
                    </span>
                    {branch.totalMonthlyRate > 0 && (
                      <span className="text-[var(--brand)] font-tabular font-medium truncate">
                        · {branch.totalMonthlyRate.toLocaleString('he-IL')} ₪/חודש
                      </span>
                    )}
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium shrink-0 ${
                    branch.isActive ? 'text-[var(--status-green-text)]' : 'text-[var(--text-muted)]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      branch.isActive ? 'bg-[var(--status-green)]' : 'bg-[var(--border-strong)]'
                    }`} />
                    {branch.isActive ? 'פעיל' : 'מוקפא'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><Building2 className="w-6 h-6" /></div>
            <p>אין סניפים עדיין ללקוח זה</p>
          </div>
        )}
        </TabsContent>

        {/* TAB: ביקורים */}
        <TabsContent value="visits" className="mt-4">
          <VisitsPanel customerId={customer._id} title="ביקורים בכל הסניפים" />
        </TabsContent>

        {/* TAB: תשלומים */}
        <TabsContent value="payments" className="mt-4">
          <PaymentsPanel customer={customer} />
        </TabsContent>

        {/* TAB: תיעוד שינויים */}
        <TabsContent value="audit" className="mt-4">
          <AuditLogPanel entityType="customer" entityId={customer._id} />
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>עריכת לקוח</DialogTitle>
            <DialogDescription>עדכן את פרטי הלקוח. שינויים יישמרו לכל הסניפים והדוחות.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="grid gap-3 py-1">
              <div className="grid gap-1.5">
                <Label htmlFor="cust-name">שם לקוח</Label>
                <Input
                  id="cust-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="cust-status">סטטוס</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger id="cust-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">פעיל</SelectItem>
                      <SelectItem value="pending">בתהליך</SelectItem>
                      <SelectItem value="inactive">לא פעיל</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="cust-price">מחיר חודשי (₪)</Label>
                  <Input
                    id="cust-price"
                    type="number"
                    min="0"
                    value={form.monthlyPrice}
                    onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="cust-phone">טלפון</Label>
                  <Input
                    id="cust-phone"
                    value={form.billingDetails.phone}
                    onChange={(e) => setForm({ ...form, billingDetails: { ...form.billingDetails, phone: e.target.value } })}
                    placeholder="050-1234567"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="cust-email">אימייל</Label>
                  <Input
                    id="cust-email"
                    type="email"
                    value={form.billingDetails.email}
                    onChange={(e) => setForm({ ...form, billingDetails: { ...form.billingDetails, email: e.target.value } })}
                    placeholder="customer@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="cust-taxid">ע.מורשה / ח.פ.</Label>
                  <Input
                    id="cust-taxid"
                    value={form.billingDetails.taxId}
                    onChange={(e) => setForm({ ...form, billingDetails: { ...form.billingDetails, taxId: e.target.value } })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="cust-address">כתובת</Label>
                  <Input
                    id="cust-address"
                    value={form.billingDetails.address}
                    onChange={(e) => setForm({ ...form, billingDetails: { ...form.billingDetails, address: e.target.value } })}
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cust-notes">הערות</Label>
                <Textarea
                  id="cust-notes"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="הערות נוספות..."
                />
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

      {/* Add/Edit-branch dialog */}
      <Dialog open={branchOpen} onOpenChange={setBranchOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{branchMode === 'edit' ? 'עריכת סניף' : 'סניף חדש'}</DialogTitle>
            <DialogDescription>
              {branchMode === 'edit'
                ? 'עדכן את פרטי הסניף.'
                : <>הוספת סניף ללקוח <span className="font-semibold">{customer?.name}</span>.</>
              }
            </DialogDescription>
          </DialogHeader>
          {branchForm && (
            <div className="grid gap-3 py-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="br-city">עיר</Label>
                  <Input
                    id="br-city"
                    value={branchForm.city}
                    onChange={(e) => setBranchField('city', e.target.value)}
                    placeholder="לדוגמה: ירושלים"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="br-region">אזור</Label>
                  <Input
                    id="br-region"
                    value={branchForm.region}
                    onChange={(e) => setBranchField('region', e.target.value)}
                    placeholder="לדוגמה: רוממה"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="br-name">שם סניף *</Label>
                <Input
                  id="br-name"
                  value={branchForm.branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="ימולא אוטומטית מהעיר"
                />
                <p className="text-[11px] text-[var(--text-muted)]">השם נבנה אוטומטית מ"{customer?.name} + עיר" — אפשר לערוך</p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="br-address">כתובת</Label>
                <Input
                  id="br-address"
                  value={branchForm.address}
                  onChange={(e) => setBranchField('address', e.target.value)}
                  placeholder="רחוב ומספר"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="br-contact">איש קשר בסניף</Label>
                  <Input
                    id="br-contact"
                    value={branchForm.contactPerson}
                    onChange={(e) => setBranchField('contactPerson', e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="br-phone">טלפון בסניף</Label>
                  <Input
                    id="br-phone"
                    value={branchForm.contactPhone}
                    onChange={(e) => setBranchField('contactPhone', e.target.value)}
                    placeholder="050-1234567"
                  />
                </div>
              </div>
              <div className="grid gap-1.5 max-w-[200px]">
                <Label htmlFor="br-interval">מחזור ביקור (ימים)</Label>
                <Input
                  id="br-interval"
                  type="number"
                  min="1"
                  value={branchForm.visitIntervalDays}
                  onChange={(e) => setBranchField('visitIntervalDays', e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBranchOpen(false)} disabled={savingBranch}>ביטול</Button>
            <Button onClick={handleSaveBranch} disabled={savingBranch}>
              {savingBranch
                ? 'שומר...'
                : branchMode === 'edit' ? 'שמור שינויים' : 'הוסף סניף'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, highlight }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
      <span className="text-[var(--text-soft)]">{label}:</span>
      <span className={highlight ? 'font-semibold text-[var(--brand)] font-tabular' : 'text-[var(--text-default)]'}>
        {value || '-'}
      </span>
    </div>
  );
}

function PaymentsPanel({ customer }) {
  const monthlyPrice = customer?.monthlyPrice || 0;
  const computedFromDevices = customer?.computedMonthlyTotal || 0;
  const totalMonthly = monthlyPrice + computedFromDevices;
  const annualEstimate = totalMonthly * 12;
  const totalDevices = (customer?.branches || []).reduce((s, b) => s + (b.activeDeviceCount || 0), 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[var(--brand)]" />
          <h2 className="text-sm font-semibold text-[var(--text-strong)]">תשלומים</h2>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[var(--brand-50)] text-[var(--brand-hover)] flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            בקרוב
          </span>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
        <div className="rounded-md border border-[var(--border-default)] p-2.5">
          <div className="text-[11px] text-[var(--text-soft)]">סה"כ חודשי</div>
          <div className="text-base font-bold text-[var(--brand)] font-tabular mt-0.5">
            {totalMonthly.toLocaleString('he-IL')} ₪
          </div>
        </div>
        <div className="rounded-md border border-[var(--border-default)] p-2.5">
          <div className="text-[11px] text-[var(--text-soft)]">צפי שנתי</div>
          <div className="text-base font-bold text-[var(--text-soft)] font-tabular mt-0.5">
            {annualEstimate.toLocaleString('he-IL')} ₪
          </div>
        </div>
        <div className="rounded-md border border-[var(--border-default)] p-2.5 col-span-2 md:col-span-1">
          <div className="text-[11px] text-[var(--text-soft)]">מכשירים פעילים</div>
          <div className="text-base font-bold text-[var(--text-strong)] font-tabular mt-0.5">
            {totalDevices.toLocaleString('he-IL')}
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="rounded-md bg-[var(--surface-subtle)] p-3 mb-3 text-[12.5px] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-soft)]">תעריף חודשי קבוע (כרטיס לקוח)</span>
          <span className="font-tabular text-[var(--text-default)]">{monthlyPrice.toLocaleString('he-IL')} ₪</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-soft)]">סך תעריפי מכשירים פעילים</span>
          <span className="font-tabular text-[var(--text-default)]">{computedFromDevices.toLocaleString('he-IL')} ₪</span>
        </div>
        <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border-default)]">
          <span className="font-medium text-[var(--text-strong)]">סך הכנסה חודשית</span>
          <span className="font-tabular font-bold text-[var(--brand)]">{totalMonthly.toLocaleString('he-IL')} ₪</span>
        </div>
      </div>

      {/* Future placeholder */}
      <div className="rounded-md border border-dashed border-[var(--border-default)] p-3 text-center">
        <Receipt className="w-4 h-4 mx-auto text-[var(--text-muted)] mb-1" />
        <p className="text-[12px] font-medium text-[var(--text-default)]">היסטוריית תשלומים</p>
        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
          המודול יחובר למערכת חיוב חיצונית בהמשך.
        </p>
      </div>
    </div>
  );
}
