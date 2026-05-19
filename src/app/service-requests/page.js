'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { toast } from 'sonner';
import { serviceRequestsAPI, branchesAPI } from '@/lib/api';
import { useBranches, useTechnicians, useInvalidate } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import BranchCombobox from '@/components/BranchCombobox';
import {
  AlertTriangle, Wrench, Plus, Building2, Phone, Calendar, CheckCircle2,
  Loader2, X, Clock, ChevronLeft
} from 'lucide-react';

const URGENCY_META = {
  urgent: { label: 'מאוד דחוף', color: 'bg-red-100 text-red-700 border-red-300', days: 3 },
  medium: { label: 'דחוף', color: 'bg-amber-100 text-amber-700 border-amber-300', days: 10 },
  low:    { label: 'לא דחוף', color: 'bg-blue-100 text-blue-700 border-blue-300', days: 14 },
};
const STATUS_META = {
  open: { label: 'פתוח', color: 'bg-gray-100 text-gray-700' },
  scheduled: { label: 'שובץ', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'טופל', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'בוטל', color: 'bg-red-100 text-red-700' },
};
const ISSUE_TYPES = [
  { value: 'device_broken', label: 'תקלה במכשיר' },
  { value: 'scent_issue', label: 'בעיית ריח' },
  { value: 'refill_request', label: 'בקשת מילוי' },
  { value: 'leak', label: 'דליפה' },
  { value: 'noise', label: 'רעש' },
  { value: 'other', label: 'אחר' },
];

function daysUntil(date) {
  if (!date) return null;
  const diff = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function ServiceRequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { branches } = useBranches();
  const { technicians } = useTechnicians();
  const { invalidateWorkOrders } = useInvalidate();

  const [statusFilter, setStatusFilter] = useState('open');
  const [urgencyFilter, setUrgencyFilter] = useState('');

  const swrKey = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (urgencyFilter) params.set('urgency', urgencyFilter);
    return `/service-requests?${params.toString()}`;
  }, [statusFilter, urgencyFilter]);
  const { data, isLoading, mutate } = useSWR(swrKey);
  const requests = data?.data || [];

  // Role guard
  if (!authLoading && user && !['admin', 'manager', 'secretary'].includes(user.role)) {
    router.replace('/');
    return null;
  }

  // ---- Create dialog ----
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const emptyForm = { branchId: '', issueType: 'device_broken', urgency: 'medium', description: '', reportedBy: '', notes: '' };
  const [form, setForm] = useState(emptyForm);
  function openCreate() {
    setForm(emptyForm);
    setCreateOpen(true);
  }
  async function submitCreate() {
    if (!form.branchId || !form.description) {
      toast.error('יש לבחור סניף ולהזין תיאור');
      return;
    }
    try {
      setCreating(true);
      await serviceRequestsAPI.create(form);
      toast.success('פניה נוצרה');
      setCreateOpen(false);
      mutate();
    } catch (err) {
      toast.error(err.message || 'שגיאה ביצירת פניה');
    } finally {
      setCreating(false);
    }
  }

  // ---- Schedule dialog ----
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [assignedTo, setAssignedTo] = useState('');
  const [scheduling, setScheduling] = useState(false);
  function openSchedule(r) {
    setScheduleTarget(r);
    setAssignedTo('');
  }
  async function submitSchedule() {
    if (!scheduleTarget) return;
    try {
      setScheduling(true);
      await serviceRequestsAPI.schedule(scheduleTarget._id, { assignedTo: assignedTo || undefined });
      toast.success('הפניה שובצה ונוצרה הזמנת עבודה');
      setScheduleTarget(null);
      mutate();
      invalidateWorkOrders();
    } catch (err) {
      toast.error(err.message || 'שגיאה בשיבוץ');
    } finally {
      setScheduling(false);
    }
  }

  // ---- Cancel / mark completed ----
  async function quickStatusChange(r, status) {
    try {
      await serviceRequestsAPI.update(r._id, { status });
      mutate();
      toast.success('עודכן');
    } catch (err) { toast.error(err.message || 'שגיאה'); }
  }

  // Counts for the urgency strip
  const counts = useMemo(() => {
    const c = { urgent: 0, medium: 0, low: 0, total: requests.length };
    for (const r of requests) c[r.urgency] = (c[r.urgency] || 0) + 1;
    return c;
  }, [requests]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="פניות שירות"
        subtitle="לקוחות שדיווחו על תקלה — שיבוץ לפי דחיפות"
        icon={Wrench}
        count={data?.pagination?.total ?? requests.length}
      >
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          פניה חדשה
        </Button>
      </PageHeader>

      {/* Status tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted w-full md:w-auto">
        {[
          { key: 'open', label: 'פתוחות' },
          { key: 'scheduled', label: 'שובצו' },
          { key: 'completed', label: 'טופלו' },
          { key: '', label: 'הכל' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setStatusFilter(t.key)}
            className={`flex-1 md:flex-none md:px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              statusFilter === t.key ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {/* Urgency filter chips */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground">דחיפות:</span>
        {[
          { key: '', label: 'הכל' },
          { key: 'urgent', label: `מאוד דחוף${counts.urgent ? ` (${counts.urgent})` : ''}` },
          { key: 'medium', label: `דחוף${counts.medium ? ` (${counts.medium})` : ''}` },
          { key: 'low', label: `לא דחוף${counts.low ? ` (${counts.low})` : ''}` },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setUrgencyFilter(f.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
              urgencyFilter === f.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:bg-muted'
            }`}
          >{f.label}</button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          טוען פניות...
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card border rounded-xl">
          <Wrench className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>אין פניות תואמות</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map(r => {
            const urgency = URGENCY_META[r.urgency] || URGENCY_META.medium;
            const status = STATUS_META[r.status] || STATUS_META.open;
            const days = daysUntil(r.targetByDate);
            const overdue = days < 0 && r.status === 'open';
            const issueLabel = ISSUE_TYPES.find(t => t.value === r.issueType)?.label || 'תקלה';
            return (
              <div
                key={r._id}
                className={`bg-card border rounded-xl p-3 border-r-4 ${
                  r.urgency === 'urgent' ? 'border-r-red-500' :
                  r.urgency === 'medium' ? 'border-r-amber-500' : 'border-r-blue-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                    r.urgency === 'urgent' ? 'bg-red-100 text-red-700' :
                    r.urgency === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <Link href={`/branches/${r.branchId?._id}`} className="font-bold text-sm hover:underline">
                        {r.branchId?.branchName || '—'}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {r.branchId?.customerId?.name}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${urgency.color}`}>
                        {urgency.label}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="text-sm mt-1 text-foreground/90">
                      <span className="text-muted-foreground">{issueLabel}:</span> {r.description}
                    </div>

                    {r.reportedBy && (
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        דווח ע"י: {r.reportedBy}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                      {r.branchId?.city && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {r.branchId.city}{r.branchId.region ? ` · ${r.branchId.region}` : ''}
                        </span>
                      )}
                      {r.branchId?.contactPhone && (
                        <a href={`tel:${r.branchId.contactPhone}`} className="flex items-center gap-1 hover:text-primary">
                          <Phone className="w-3 h-3" />
                          {r.branchId.contactPerson || r.branchId.contactPhone}
                        </a>
                      )}
                      <span className={`flex items-center gap-1 ${overdue ? 'text-red-700 font-medium' : ''}`}>
                        <Clock className="w-3 h-3" />
                        {r.status === 'open'
                          ? (days >= 0 ? `יעד: בעוד ${days} ימים` : `פיגור של ${Math.abs(days)} ימים`)
                          : `יעד: ${new Date(r.targetByDate).toLocaleDateString('he-IL')}`}
                      </span>
                    </div>

                    {r.workOrderId && (
                      <div className="text-[11px] mt-1">
                        <Link href={`/work-orders?id=${r.workOrderId._id || r.workOrderId}`} className="text-primary hover:underline inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          הזמנה משובצת
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {r.status === 'open' && (
                      <>
                        <Button size="sm" onClick={() => openSchedule(r)} className="gap-1 h-7 text-xs">
                          <Calendar className="w-3.5 h-3.5" />
                          שבץ
                        </Button>
                        <button
                          onClick={() => quickStatusChange(r, 'cancelled')}
                          className="text-[11px] text-muted-foreground hover:text-destructive"
                        >
                          בטל
                        </button>
                      </>
                    )}
                    {r.status === 'scheduled' && (
                      <button
                        onClick={() => quickStatusChange(r, 'completed')}
                        className="px-2 py-1 rounded text-[11px] font-medium bg-green-100 text-green-700 hover:bg-green-200"
                      >
                        סמן כטופל
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== Create dialog ===== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>פניה חדשה</DialogTitle>
            <DialogDescription>תיעוד פניה מלקוח על תקלה. השיבוץ ייקבע לפי הדחיפות.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">סניף *</Label>
              <BranchCombobox
                branches={branches}
                value={form.branchId}
                onChange={(id) => setForm({ ...form, branchId: id })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">סוג תקלה</Label>
                <Select value={form.issueType} onValueChange={v => setForm({ ...form, issueType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ISSUE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">דחיפות</Label>
                <Select value={form.urgency} onValueChange={v => setForm({ ...form, urgency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">מאוד דחוף (תוך 3 ימים)</SelectItem>
                    <SelectItem value="medium">דחוף (תוך 10 ימים)</SelectItem>
                    <SelectItem value="low">לא דחוף (תוך שבועיים)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">תיאור התקלה *</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="פירוט הבעיה..."
                rows={3}
              />
            </div>

            <div>
              <Label className="text-xs">דווח ע"י</Label>
              <Input
                value={form.reportedBy}
                onChange={e => setForm({ ...form, reportedBy: e.target.value })}
                placeholder="שם איש הקשר אצל הלקוח"
              />
            </div>

            <div>
              <Label className="text-xs">הערות פנימיות</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>ביטול</Button>
            <Button onClick={submitCreate} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              צור פניה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Schedule dialog ===== */}
      <Dialog open={!!scheduleTarget} onOpenChange={(o) => !o && setScheduleTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>שבץ פניה</DialogTitle>
            <DialogDescription>
              {scheduleTarget && (
                <>
                  הזמנת עבודה תיווצר אוטומטית לתאריך{' '}
                  <span className="font-bold text-foreground">
                    {new Date(scheduleTarget.targetByDate).toLocaleDateString('he-IL', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                  {' '}({URGENCY_META[scheduleTarget.urgency]?.label})
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label className="text-xs">שייך לטכנאי (אופציונלי)</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger><SelectValue placeholder="ללא שיוך — ישאר ב'ממתין'" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">— ללא שיוך —</SelectItem>
                {technicians.map(t => (
                  <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setScheduleTarget(null)}>ביטול</Button>
            <Button onClick={submitSchedule} disabled={scheduling}>
              {scheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              אשר שיבוץ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
