'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { checksAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  CreditCard, Plus, Layers, Check as CheckIcon, X, AlertTriangle, Loader2,
  CalendarDays, Trash2, RotateCcw, MoreVertical
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const STATUS_META = {
  pending:   { label: 'ממתין',   color: 'bg-amber-100 text-amber-700 border-amber-300' },
  deposited: { label: 'הופקד',  color: 'bg-green-100 text-green-700 border-green-300' },
  bounced:   { label: 'חזר',    color: 'bg-red-100   text-red-700   border-red-300'   },
  cancelled: { label: 'בוטל',   color: 'bg-gray-100  text-gray-700  border-gray-300'  },
};

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function ChecksPanel({ customerId }) {
  const { data: listData, mutate: mutateList } = useSWR(
    customerId ? `/checks?customerId=${customerId}` : null
  );
  const { data: summary, mutate: mutateSummary } = useSWR(
    customerId ? `/checks/summary?customerId=${customerId}` : null
  );

  const checks = listData?.data || [];

  // Group: pending first, sorted by due date; then past
  const sorted = useMemo(() => {
    const status = (c) => ['pending', 'deposited', 'bounced', 'cancelled'].indexOf(c.status);
    return [...checks].sort((a, b) => {
      const sa = status(a), sb = status(b);
      if (sa !== sb) return sa - sb;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }, [checks]);

  // Dialogs
  const [singleOpen, setSingleOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  function refresh() {
    mutateList();
    mutateSummary();
  }

  async function setStatus(check, status) {
    try {
      await checksAPI.update(check._id, { status });
      refresh();
      toast.success('עודכן');
    } catch (err) { toast.error(err.message || 'שגיאה'); }
  }
  async function handleDelete(check) {
    if (!confirm(`למחוק את הצ'ק (${check.amount} ₪, ${fmtDate(check.dueDate)})?`)) return;
    try {
      await checksAPI.delete(check._id);
      refresh();
      toast.success('נמחק');
    } catch (err) { toast.error(err.message || 'שגיאה'); }
  }

  return (
    <div className="space-y-3">
      {/* Status banner */}
      {summary && summary.total > 0 && (() => {
        const { counts, sums, nextPending, lowStock, outOfChecks } = summary;
        const tone = outOfChecks ? 'red' : lowStock ? 'amber' : 'emerald';
        const toneClasses = {
          red: 'bg-red-50 border-red-200 text-red-800',
          amber: 'bg-amber-50 border-amber-200 text-amber-800',
          emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        };
        return (
          <div className={`rounded-lg border p-3 ${toneClasses[tone]}`}>
            <div className="flex items-start gap-2">
              {outOfChecks || lowStock ? <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> : <CheckIcon className="w-4 h-4 mt-0.5 shrink-0" />}
              <div className="flex-1 min-w-0">
                {outOfChecks ? (
                  <div className="text-sm font-semibold">הצ'קים אזלו — צריך לבקש סדרה חדשה</div>
                ) : lowStock ? (
                  <div className="text-sm font-semibold">נשארו {counts.pending} צ'קים — שווה לבקש סדרה חדשה</div>
                ) : (
                  <div className="text-sm font-semibold font-tabular">
                    {counts.pending} צ'קים פתוחים · {sums.pending.toLocaleString('he-IL')} ₪
                  </div>
                )}
                {nextPending && (
                  <div className="text-xs mt-0.5 font-tabular opacity-80">
                    הבא לפירעון: {fmtDate(nextPending.dueDate)} · {nextPending.amount.toLocaleString('he-IL')} ₪
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setSingleOpen(true)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          צ'ק יחיד
        </Button>
        <Button size="sm" variant="outline" onClick={() => setBulkOpen(true)} className="gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          חבילת צ'קים
        </Button>
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-card border rounded-xl">
          <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">אין צ'קים מתועדים</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] text-muted-foreground">
              <tr>
                <th className="text-right px-3 py-2 font-medium">מס' צ'ק</th>
                <th className="text-right px-3 py-2 font-medium">סכום</th>
                <th className="text-right px-3 py-2 font-medium">תאריך</th>
                <th className="text-right px-3 py-2 font-medium">סטטוס</th>
                <th className="text-right px-3 py-2 font-medium hidden sm:table-cell">בנק</th>
                <th className="px-3 py-2 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.map(c => {
                const meta = STATUS_META[c.status] || STATUS_META.pending;
                const isPending = c.status === 'pending';
                return (
                  <tr key={c._id} className={c.status === 'cancelled' ? 'opacity-50' : ''}>
                    <td className="px-3 py-2 font-tabular">
                      {c.checkNumber || '—'}
                      {c.batchSequence && (
                        <span className="text-[10px] text-muted-foreground ms-1">
                          ({c.batchSequence}/{c.batchSize})
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-tabular font-semibold">
                      {c.amount.toLocaleString('he-IL')} ₪
                    </td>
                    <td className="px-3 py-2 font-tabular">{fmtDate(c.dueDate)}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded border ${meta.color}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-xs hidden sm:table-cell">
                      {c.bank || '—'}
                    </td>
                    <td className="px-1 py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isPending && (
                            <DropdownMenuItem onClick={() => setStatus(c, 'deposited')}>
                              <CheckIcon className="w-4 h-4 text-green-600" />
                              סמן כהופקד
                            </DropdownMenuItem>
                          )}
                          {isPending && (
                            <DropdownMenuItem onClick={() => setStatus(c, 'bounced')}>
                              <X className="w-4 h-4 text-red-600" />
                              סמן כחזר
                            </DropdownMenuItem>
                          )}
                          {!isPending && c.status !== 'cancelled' && (
                            <DropdownMenuItem onClick={() => setStatus(c, 'pending')}>
                              <RotateCcw className="w-4 h-4" />
                              החזר ל"ממתין"
                            </DropdownMenuItem>
                          )}
                          {isPending && (
                            <DropdownMenuItem onClick={() => setStatus(c, 'cancelled')}>
                              <X className="w-4 h-4 text-gray-500" />
                              בטל
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(c)} className="text-destructive focus:text-destructive">
                            <Trash2 className="w-4 h-4" />
                            מחק
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <SingleCheckDialog
        open={singleOpen}
        onOpenChange={setSingleOpen}
        customerId={customerId}
        onCreated={refresh}
      />
      <BulkChecksDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        customerId={customerId}
        onCreated={refresh}
      />
    </div>
  );
}

function SingleCheckDialog({ open, onOpenChange, customerId, onCreated }) {
  const [form, setForm] = useState({ checkNumber: '', amount: '', dueDate: todayIso(), bank: '', notes: '' });
  const [saving, setSaving] = useState(false);

  function reset() { setForm({ checkNumber: '', amount: '', dueDate: todayIso(), bank: '', notes: '' }); }

  async function submit() {
    if (!form.amount || !form.dueDate) {
      toast.error('סכום ותאריך הם שדות חובה');
      return;
    }
    try {
      setSaving(true);
      await checksAPI.create({
        customerId,
        checkNumber: form.checkNumber || undefined,
        amount: Number(form.amount),
        dueDate: form.dueDate,
        bank: form.bank || undefined,
        notes: form.notes || undefined
      });
      reset();
      onOpenChange(false);
      onCreated?.();
      toast.success('הצ\'ק נוסף');
    } catch (err) {
      toast.error(err.message || 'שגיאה');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100vw-1rem)]">
        <DialogHeader>
          <DialogTitle>הוספת צ'ק</DialogTitle>
          <DialogDescription>צ'ק יחיד עם תאריך פירעון בעתיד או בהווה.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">מס' צ'ק</Label>
              <Input value={form.checkNumber} onChange={e => setForm({ ...form, checkNumber: e.target.value })} className="font-tabular" />
            </div>
            <div>
              <Label className="text-xs">סכום *</Label>
              <Input type="number" inputMode="numeric" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="font-tabular" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">תאריך פירעון *</Label>
              <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} required />
            </div>
            <div>
              <Label className="text-xs">בנק</Label>
              <Input value={form.bank} onChange={e => setForm({ ...form, bank: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs">הערות</Label>
            <Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => { reset(); onOpenChange(false); }}>ביטול</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            הוסף
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkChecksDialog({ open, onOpenChange, customerId, onCreated }) {
  const [form, setForm] = useState({
    count: 12, amount: '', firstDueDate: todayIso(),
    startCheckNumber: '', intervalMonths: 1, bank: '', notes: ''
  });
  const [saving, setSaving] = useState(false);

  function reset() {
    setForm({
      count: 12, amount: '', firstDueDate: todayIso(),
      startCheckNumber: '', intervalMonths: 1, bank: '', notes: ''
    });
  }

  // Preview the resulting dates so the user can verify before submitting
  const preview = useMemo(() => {
    const n = Math.min(60, Math.max(1, Number(form.count) || 1));
    const start = new Date(form.firstDueDate || todayIso());
    const interval = Number(form.intervalMonths) || 1;
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(start);
      d.setMonth(d.getMonth() + i * interval);
      return d;
    });
  }, [form.count, form.firstDueDate, form.intervalMonths]);

  const totalAmount = (Number(form.amount) || 0) * (Number(form.count) || 0);

  async function submit() {
    if (!form.amount || !form.firstDueDate || !form.count) {
      toast.error('סכום, כמות ותאריך ראשון הם שדות חובה');
      return;
    }
    try {
      setSaving(true);
      const result = await checksAPI.createBatch({
        customerId,
        count: Number(form.count),
        amount: Number(form.amount),
        firstDueDate: form.firstDueDate,
        startCheckNumber: form.startCheckNumber || undefined,
        intervalMonths: Number(form.intervalMonths) || 1,
        bank: form.bank || undefined,
        notes: form.notes || undefined
      });
      reset();
      onOpenChange(false);
      onCreated?.();
      toast.success(`נוספו ${result.data?.length || form.count} צ'קים`);
    } catch (err) {
      toast.error(err.message || 'שגיאה');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[calc(100vw-1rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>הוספת חבילת צ'קים</DialogTitle>
          <DialogDescription>צ'קים חודשיים מראש — המערכת תיצור אוטומטית את כולם בתאריכים עוקבים.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">כמות צ'קים *</Label>
              <Input type="number" inputMode="numeric" value={form.count}
                onChange={e => setForm({ ...form, count: e.target.value })} className="font-tabular" min="1" max="60" />
            </div>
            <div>
              <Label className="text-xs">סכום פר צ'ק *</Label>
              <Input type="number" inputMode="numeric" value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })} className="font-tabular" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">תאריך צ'ק ראשון *</Label>
              <Input type="date" value={form.firstDueDate}
                onChange={e => setForm({ ...form, firstDueDate: e.target.value })} required />
            </div>
            <div>
              <Label className="text-xs">מרווח (חודשים)</Label>
              <Input type="number" inputMode="numeric" value={form.intervalMonths}
                onChange={e => setForm({ ...form, intervalMonths: e.target.value })} className="font-tabular" min="1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">מס' צ'ק התחלתי</Label>
              <Input value={form.startCheckNumber}
                onChange={e => setForm({ ...form, startCheckNumber: e.target.value })} className="font-tabular"
                placeholder="לדוגמה 100" />
            </div>
            <div>
              <Label className="text-xs">בנק</Label>
              <Input value={form.bank} onChange={e => setForm({ ...form, bank: e.target.value })} />
            </div>
          </div>

          {/* Preview */}
          {totalAmount > 0 && (
            <div className="rounded-lg bg-muted/40 p-3 text-sm">
              <div className="flex justify-between font-semibold mb-1.5 font-tabular">
                <span>סך החבילה:</span>
                <span>{totalAmount.toLocaleString('he-IL')} ₪</span>
              </div>
              <div className="text-[11px] text-muted-foreground mb-1">תאריכי פירעון:</div>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto font-tabular text-[11px]">
                {preview.slice(0, 24).map((d, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-card border text-foreground/80">
                    {fmtDate(d)}
                  </span>
                ))}
                {preview.length > 24 && (
                  <span className="px-1.5 py-0.5 text-muted-foreground">+{preview.length - 24} נוספים</span>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => { reset(); onOpenChange(false); }}>ביטול</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
            הוסף חבילה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
