'use client';

import { useEffect, useState } from 'react';
import { auditAPI } from '@/lib/api';
import { History, Plus, Pencil, Trash2, CheckCircle2, XCircle, UserPlus, ArrowRight, Loader2 } from 'lucide-react';

const ACTION_META = {
  create:        { label: 'נוצר',         icon: Plus,        color: 'text-green-700 bg-green-100' },
  update:        { label: 'עודכן',        icon: Pencil,      color: 'text-blue-700 bg-blue-100' },
  status_change: { label: 'שינוי סטטוס',  icon: ArrowRight,  color: 'text-purple-700 bg-purple-100' },
  assign:        { label: 'שיוך טכנאי',   icon: UserPlus,    color: 'text-indigo-700 bg-indigo-100' },
  complete:      { label: 'הושלם',        icon: CheckCircle2, color: 'text-green-700 bg-green-100' },
  cancel:        { label: 'בוטל',         icon: XCircle,     color: 'text-red-700 bg-red-100' },
  delete:        { label: 'נמחק',         icon: Trash2,      color: 'text-red-700 bg-red-100' },
};

const ROLE_LABEL = { admin: 'אדמין', manager: 'מנהל', technician: 'טכנאי' };

const FIELD_LABELS = {
  // Customer
  name: 'שם',
  monthlyPrice: 'מחיר חודשי',
  status: 'סטטוס',
  notes: 'הערות',
  'billingDetails.address': 'כתובת לחיוב',
  'billingDetails.email': 'אימייל לחיוב',
  'billingDetails.phone': 'טלפון לחיוב',
  'billingDetails.taxId': 'ע.מ./ח.פ.',
  // Branch
  branchName: 'שם הסניף',
  address: 'כתובת',
  city: 'עיר',
  region: 'אזור',
  contactPerson: 'איש קשר',
  contactPhone: 'טלפון איש קשר',
  visitIntervalDays: 'מרווח ימים בין ביקורים',
  isActive: 'פעיל',
  // Device
  deviceType: 'סוג מכשיר',
  scentId: 'ריח',
  locationInBranch: 'מיקום בסניף',
  monthlyRate: 'תעריף חודשי',
  mlPerRefill: 'מ"ל למילוי',
  refillIntervalDays: 'מרווח מילוי (ימים)',
  // Work order
  assignedTo: 'טכנאי משובץ',
  scheduledDate: 'תאריך מתוזמן',
  priority: 'עדיפות',
  type: 'סוג',
  estimatedDuration: 'משך משוער',
};

const STATUS_LABEL = {
  active: 'פעיל', inactive: 'לא פעיל', frozen: 'מוקפא', pending: 'ממתין',
  assigned: 'שובץ', in_progress: 'בביצוע', completed: 'הושלם', cancelled: 'בוטל',
};

function formatValue(field, value) {
  if (value == null || value === '') return '—';
  if (field === 'isActive') return value ? 'פעיל' : 'לא פעיל';
  if (field === 'status') return STATUS_LABEL[value] || value;
  if (field === 'monthlyPrice' || field === 'monthlyRate') return `${Number(value).toLocaleString('he-IL')} ₪`;
  if (field === 'scheduledDate') return new Date(value).toLocaleDateString('he-IL');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function relativeTime(iso) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'כרגע';
  if (diff < 3600) return `לפני ${Math.floor(diff / 60)} דקות`;
  if (diff < 86400) return `לפני ${Math.floor(diff / 3600)} שעות`;
  if (diff < 7 * 86400) return `לפני ${Math.floor(diff / 86400)} ימים`;
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AuditLogPanel({ entityType, entityId, showEntityColumn = false, limit = 50 }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const params = { limit };
        if (entityType) params.entityType = entityType;
        if (entityId) params.entityId = entityId;
        const result = await auditAPI.list(params);
        if (alive) setEntries(result.data || []);
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [entityType, entityId, limit]);

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        טוען היסטוריה...
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-700">שגיאה בטעינת תיעוד: {error}</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-card border rounded-xl">
        <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p>אין שינויים מתועדים{entityType ? ' לישות זו' : ''}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map(entry => {
        const meta = ACTION_META[entry.action] || ACTION_META.update;
        const Icon = meta.icon;
        return (
          <div key={entry._id} className="bg-card border rounded-xl p-3">
            <div className="flex items-start gap-3">
              <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${meta.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-semibold text-sm">{entry.userName || 'משתמש לא ידוע'}</span>
                  {entry.userRole && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {ROLE_LABEL[entry.userRole] || entry.userRole}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{meta.label}</span>
                  {showEntityColumn && entry.entityName && (
                    <span className="text-xs text-muted-foreground">· {entry.entityName}</span>
                  )}
                  <span className="text-xs text-muted-foreground ms-auto">{relativeTime(entry.createdAt)}</span>
                </div>

                {entry.changes && entry.changes.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {entry.changes.map((ch, i) => (
                      <li key={i} className="text-sm text-foreground/80">
                        <span className="text-muted-foreground">{FIELD_LABELS[ch.field] || ch.field}:</span>{' '}
                        <span className="line-through opacity-60">{formatValue(ch.field, ch.from)}</span>
                        {' → '}
                        <span className="font-medium">{formatValue(ch.field, ch.to)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {entry.notes && (
                  <p className="mt-1 text-xs text-muted-foreground italic">{entry.notes}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
