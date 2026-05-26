'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { toast } from 'sonner';
import { workOrdersAPI, serviceRequestsAPI } from '@/lib/api';
import { useTechnicians, useInvalidate } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/PageHeader';
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
  AlertTriangle, Clock, MapPin, Phone, CheckCircle2, Calendar, ArrowRight,
  Loader2, Wrench, RefreshCw, X, Cpu
} from 'lucide-react';

function fmtDate(d) {
  return new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function daysAgo(d) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return 'היום';
  if (diff === 1) return 'אתמול';
  return `לפני ${diff} ימים`;
}
function nextSundayIso() {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  d.setDate(d.getDate() + daysUntilSunday);
  return d.toISOString().slice(0, 10);
}

const STATUS_LABEL = { pending: 'ממתין', assigned: 'שובץ', in_progress: 'בביצוע' };

export default function BacklogPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { technicians } = useTechnicians();
  const { invalidateWorkOrders } = useInvalidate();

  useEffect(() => {
    if (!authLoading && user && !['admin', 'manager', 'secretary'].includes(user.role)) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  const { data, isLoading, mutate } = useSWR('/work-orders/backlog');
  const untouched = data?.untouched || [];
  const partial = data?.partial || [];
  const openRequests = data?.openRequests || [];
  const counts = data?.counts || { untouched: 0, partial: 0, total: 0, partialDevices: 0, openRequests: 0 };

  const [tab, setTab] = useState('untouched'); // 'untouched' | 'partial' | 'requests'
  const [selected, setSelected] = useState(new Set());
  const [actionOpen, setActionOpen] = useState(null); // 'reschedule' | 'followup' | 'schedule-requests'
  const [actionDate, setActionDate] = useState(nextSundayIso());
  const [actionTech, setActionTech] = useState('');
  const [actionSaving, setActionSaving] = useState(false);

  const list = tab === 'untouched' ? untouched : tab === 'partial' ? partial : openRequests;

  // Reset selection when switching tabs
  useEffect(() => { setSelected(new Set()); }, [tab]);

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (selected.size === list.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(list.map(w => w._id)));
    }
  }

  async function quickCancel(id) {
    if (!confirm('לבטל את ההזמנה?')) return;
    try {
      await workOrdersAPI.updateStatus(id, 'cancelled');
      mutate(); invalidateWorkOrders();
      toast.success('בוטל');
    } catch (err) { toast.error(err.message || 'שגיאה'); }
  }
  async function quickComplete(id) {
    try {
      await workOrdersAPI.updateStatus(id, 'completed');
      mutate(); invalidateWorkOrders();
      toast.success('סומן כהושלם');
    } catch (err) { toast.error(err.message || 'שגיאה'); }
  }

  async function submitAction() {
    if (selected.size === 0) return toast.error('יש לבחור הזמנות');
    if (!actionDate) return toast.error('יש לבחור תאריך');
    try {
      setActionSaving(true);
      const ids = [...selected];

      if (actionOpen === 'followup') {
        await workOrdersAPI.bulkFollowup({ sourceIds: ids, targetDate: actionDate, assignedTo: actionTech || undefined });
        toast.success(`${ids.length} הזמנות המשך נוצרו`);
      } else if (actionOpen === 'schedule-requests') {
        // Per-request schedule — backend currently exposes a single-request endpoint,
        // so we fan out client-side. Failures are toasted individually but don't abort.
        let ok = 0, fail = 0;
        for (const id of ids) {
          try {
            await serviceRequestsAPI.schedule(id, { assignedTo: actionTech || undefined });
            ok++;
          } catch { fail++; }
        }
        if (ok) toast.success(`${ok} פניות שובצו (${fail ? `${fail} נכשלו` : ''})`);
        if (fail && !ok) toast.error(`שגיאה — לא נשבצו ${fail} פניות`);
      } else {
        await workOrdersAPI.bulkReschedule({ ids, newDate: actionDate, assignedTo: actionTech || null });
        toast.success(`${ids.length} הזמנות הועברו ל-${fmtDate(actionDate)}`);
      }
      setActionOpen(null);
      setSelected(new Set());
      mutate(); invalidateWorkOrders();
    } catch (err) {
      toast.error(err.message || 'שגיאה');
    } finally {
      setActionSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="פיגורים"
        subtitle="הזמנות שלא טופלו ומכשירים שלא מולאו — מקובצים לשיבוץ מחדש"
        icon={AlertTriangle}
        count={counts.total}
      />

      {/* Status banner */}
      {counts.total === 0 && !isLoading && (
        <div className="bg-card border rounded-xl p-6 text-center text-muted-foreground">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-600/50" />
          <p className="font-medium text-foreground">אין פיגורים — כל הכבוד!</p>
          <p className="text-sm mt-1">כל ההזמנות מטופלות וכל המכשירים מולאו.</p>
        </div>
      )}

      {counts.total > 0 && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-muted overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setTab('untouched')}
              className={`flex-1 min-w-fit md:min-w-0 py-2 px-3 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                tab === 'untouched' ? 'bg-card text-red-700 shadow-sm' : 'text-muted-foreground'
              }`}
            >
              לא טופלו ({counts.untouched})
            </button>
            <button
              onClick={() => setTab('partial')}
              className={`flex-1 min-w-fit md:min-w-0 py-2 px-3 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                tab === 'partial' ? 'bg-card text-amber-700 shadow-sm' : 'text-muted-foreground'
              }`}
            >
              מכשירים חסרים ({counts.partial})
            </button>
            <button
              onClick={() => setTab('requests')}
              className={`flex-1 min-w-fit md:min-w-0 py-2 px-3 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                tab === 'requests' ? 'bg-card text-orange-700 shadow-sm' : 'text-muted-foreground'
              }`}
            >
              פניות באיחור ({counts.openRequests || 0})
            </button>
          </div>

          {/* Bulk action toolbar */}
          {list.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-card border">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.size === list.length && list.length > 0}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded"
                />
                {selected.size > 0
                  ? <span className="font-medium">{selected.size} נבחרו</span>
                  : <span className="text-muted-foreground">בחר הכל</span>}
              </label>
              {selected.size > 0 && (
                <div className="flex gap-2 ms-auto">
                  {tab === 'untouched' && (
                    <Button size="sm" onClick={() => { setActionOpen('reschedule'); setActionDate(nextSundayIso()); }} className="gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      העבר תאריך ({selected.size})
                    </Button>
                  )}
                  {tab === 'partial' && (
                    <Button size="sm" onClick={() => { setActionOpen('followup'); setActionDate(nextSundayIso()); }} className="gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" />
                      צור הזמנת המשך ({selected.size})
                    </Button>
                  )}
                  {tab === 'requests' && (
                    <Button size="sm" onClick={() => { setActionOpen('schedule-requests'); setActionDate(nextSundayIso()); }} className="gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      שבץ עכשיו ({selected.size})
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* List */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              טוען...
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card border rounded-xl">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">אין פריטים בקטגוריה זו</p>
            </div>
          ) : (
            <div className="space-y-2">
              {list.map(wo => {
                const isPartial = tab === 'partial';
                const isRequest = tab === 'requests';

                // Service request branch: render dedicated card and skip the WO layout
                if (isRequest) {
                  return (
                    <RequestCard
                      key={wo._id}
                      request={wo}
                      selected={selected.has(wo._id)}
                      onToggle={() => toggle(wo._id)}
                    />
                  );
                }

                const branch = wo.branchId;
                const customer = branch?.customerId?.name || '';
                const isSelected = selected.has(wo._id);
                return (
                  <div
                    key={wo._id}
                    className={`bg-card border rounded-xl p-3 ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(wo._id)}
                        className="h-4 w-4 mt-1 rounded shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
                          <Link href={`/branches/${branch?._id}`} className="font-bold text-sm hover:underline">
                            {branch?.branchName || '—'}
                          </Link>
                          {customer && (
                            <span className="text-xs text-muted-foreground">{customer}</span>
                          )}
                          {!isPartial && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted">
                              {STATUS_LABEL[wo.status]}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                          {branch?.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {branch.city}{branch.region ? ` · ${branch.region}` : ''}
                            </span>
                          )}
                          {branch?.contactPhone && (
                            <a href={`tel:${branch.contactPhone}`} className="flex items-center gap-1 hover:text-primary">
                              <Phone className="w-3 h-3" />
                              {branch.contactPerson || branch.contactPhone}
                            </a>
                          )}
                          <span className="flex items-center gap-1 text-red-700 font-medium">
                            <Clock className="w-3 h-3" />
                            תוזמן ל-{fmtDate(wo.scheduledDate)} · {daysAgo(wo.scheduledDate)}
                          </span>
                          {wo.assignedTo?.name && (
                            <span className="text-xs">טכנאי: {wo.assignedTo.name}</span>
                          )}
                        </div>

                        {/* Partial-completion: show which devices weren't done */}
                        {isPartial && wo.unfilledDevices?.length > 0 && (
                          <div className="mt-2 p-2 rounded-md bg-amber-50 border border-amber-200">
                            <div className="text-[11px] font-medium text-amber-900 mb-1">
                              {wo.unfilledDevices.length} מכשירים לא מולאו (מתוך {wo.totalDevices}):
                            </div>
                            <ul className="space-y-0.5">
                              {wo.unfilledDevices.slice(0, 5).map((d, i) => (
                                <li key={i} className="text-[11px] text-amber-900 flex items-center gap-1">
                                  <Cpu className="w-3 h-3" />
                                  {d.deviceId?.deviceType || 'מכשיר'}
                                  {d.deviceId?.locationInBranch && <span className="opacity-80"> · {d.deviceId.locationInBranch}</span>}
                                </li>
                              ))}
                              {wo.unfilledDevices.length > 5 && (
                                <li className="text-[11px] text-amber-700">+{wo.unfilledDevices.length - 5} נוספים</li>
                              )}
                            </ul>
                          </div>
                        )}

                        {/* Per-row quick actions */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <Link
                            href={`/work-orders?id=${wo._id}`}
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <ArrowRight className="w-3 h-3" />
                            לפרטי ההזמנה
                          </Link>
                          {!isPartial && (
                            <>
                              <button
                                onClick={() => quickComplete(wo._id)}
                                className="text-xs text-green-700 hover:underline inline-flex items-center gap-1 ms-2"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                סמן כהושלם
                              </button>
                              <button
                                onClick={() => quickCancel(wo._id)}
                                className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1 ms-2"
                              >
                                <X className="w-3 h-3" />
                                בטל
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Action dialog */}
      <Dialog open={!!actionOpen} onOpenChange={(o) => !o && setActionOpen(null)}>
        <DialogContent className="max-w-md w-[calc(100vw-1rem)]">
          <DialogHeader>
            <DialogTitle>
              {actionOpen === 'followup' ? 'צור הזמנות המשך' : 'העבר לתאריך חדש'}
            </DialogTitle>
            <DialogDescription>
              {actionOpen === 'followup'
                ? `${selected.size} הזמנות המשך חדשות יווצרו עם המכשירים שלא טופלו.`
                : `${selected.size} הזמנות יקבלו תאריך מתוזמן חדש.`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div>
              <Label className="text-xs">תאריך יעד</Label>
              <Input
                type="date"
                value={actionDate}
                onChange={e => setActionDate(e.target.value)}
                className="font-tabular"
              />
            </div>
            <div>
              <Label className="text-xs">שייך לטכנאי (אופציונלי)</Label>
              <Select value={actionTech} onValueChange={setActionTech}>
                <SelectTrigger>
                  <SelectValue placeholder={actionOpen === 'followup' ? 'אותו טכנאי כמו במקור' : 'ללא שינוי שיוך'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— ללא שיוך —</SelectItem>
                  {technicians.map(t => (
                    <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setActionOpen(null)}>ביטול</Button>
            <Button onClick={submitAction} disabled={actionSaving}>
              {actionSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              אשר
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const REQUEST_URGENCY = {
  urgent: { label: 'מאוד דחוף', color: 'bg-red-100 text-red-700 border-red-300', accent: 'border-r-red-500' },
  medium: { label: 'דחוף',     color: 'bg-amber-100 text-amber-700 border-amber-300', accent: 'border-r-amber-500' },
  low:    { label: 'לא דחוף',  color: 'bg-blue-100 text-blue-700 border-blue-300', accent: 'border-r-blue-400' },
};
const REQUEST_ISSUE = {
  device_broken: 'תקלה במכשיר', scent_issue: 'בעיית ריח', refill_request: 'בקשת מילוי',
  leak: 'דליפה', noise: 'רעש', other: 'אחר'
};

function RequestCard({ request, selected, onToggle }) {
  const urgency = REQUEST_URGENCY[request.urgency] || REQUEST_URGENCY.medium;
  const branch = request.branchId;
  const customer = branch?.customerId?.name || '';
  const diffDays = Math.floor((Date.now() - new Date(request.targetByDate).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className={`bg-card border rounded-xl p-3 border-r-4 ${urgency.accent} ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="h-4 w-4 mt-1 rounded shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
            <Link href={`/branches/${branch?._id}`} className="font-bold text-sm hover:underline">
              {branch?.branchName || '—'}
            </Link>
            {customer && (
              <span className="text-xs text-muted-foreground">{customer}</span>
            )}
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${urgency.color}`}>
              {urgency.label}
            </span>
          </div>

          <div className="text-sm mt-1 text-foreground/90">
            <span className="text-muted-foreground">{REQUEST_ISSUE[request.issueType] || 'תקלה'}:</span> {request.description}
          </div>

          {request.reportedBy && (
            <div className="text-[11px] text-muted-foreground mt-0.5">
              דווח ע"י: {request.reportedBy}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-muted-foreground">
            {branch?.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {branch.city}{branch.region ? ` · ${branch.region}` : ''}
              </span>
            )}
            {branch?.contactPhone && (
              <a href={`tel:${branch.contactPhone}`} className="flex items-center gap-1 hover:text-primary">
                <Phone className="w-3 h-3" />
                {branch.contactPerson || branch.contactPhone}
              </a>
            )}
            <span className="flex items-center gap-1 text-red-700 font-medium">
              <Clock className="w-3 h-3" />
              יעד: {fmtDate(request.targetByDate)} · פיגור של {diffDays} ימים
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            <Link
              href="/service-requests"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              <ArrowRight className="w-3 h-3" />
              לדף פניות שירות
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
