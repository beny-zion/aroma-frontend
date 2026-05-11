'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { auditAPI, usersAPI } from '@/lib/api';
// AuditLogPanel reuses entity-scoped logic; here we render a richer list with filters
import {
  History, Filter, X, Loader2,
  Plus, Pencil, Trash2, CheckCircle2, XCircle, UserPlus, ArrowRight
} from 'lucide-react';

const ENTITY_LABELS = {
  '': 'הכל',
  customer: 'לקוחות',
  branch: 'סניפים',
  device: 'מכשירים',
  work_order: 'הזמנות עבודה',
};

const ACTION_LABELS = {
  '': 'הכל',
  create: 'יצירה',
  update: 'עדכון',
  status_change: 'שינוי סטטוס',
  assign: 'שיוך טכנאי',
  complete: 'השלמה',
  cancel: 'ביטול',
  delete: 'מחיקה',
};

export default function AuditLogPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    entityType: '',
    userId: '',
    action: '',
    dateFrom: '',
    dateTo: '',
  });
  // Apply key — bumped each time user clicks "Apply" so the panel re-fetches
  const [applied, setApplied] = useState(filters);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!authLoading && user && !['admin', 'manager', 'secretary'].includes(user.role)) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  // Load technicians + admins for filter
  useEffect(() => {
    let alive = true;
    usersAPI.getAll?.()
      .then(res => { if (alive) setUsers(Array.isArray(res) ? res : (res?.data || [])); })
      .catch(() => { /* non-blocking */ });
    return () => { alive = false; };
  }, []);

  function applyFilters() {
    setApplied(filters);
    setRefreshKey(k => k + 1);
  }

  function resetFilters() {
    const empty = { entityType: '', userId: '', action: '', dateFrom: '', dateTo: '' };
    setFilters(empty);
    setApplied(empty);
    setRefreshKey(k => k + 1);
  }

  const hasFilters = applied.entityType || applied.userId || applied.action || applied.dateFrom || applied.dateTo;

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">יומן פעילות</h1>
            <p className="text-sm text-muted-foreground mt-0.5">תיעוד שינויים על-ידי משתמשים</p>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-card border rounded-xl p-3 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="w-4 h-4" />
          סינון
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <select
            value={filters.entityType}
            onChange={e => setFilters({ ...filters, entityType: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm bg-background"
          >
            {Object.entries(ENTITY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l === 'הכל' ? 'כל הישויות' : l}</option>
            ))}
          </select>
          <select
            value={filters.action}
            onChange={e => setFilters({ ...filters, action: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm bg-background"
          >
            {Object.entries(ACTION_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l === 'הכל' ? 'כל הפעולות' : l}</option>
            ))}
          </select>
          <select
            value={filters.userId}
            onChange={e => setFilters({ ...filters, userId: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm bg-background"
          >
            <option value="">כל המשתמשים</option>
            {users.map(u => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm bg-background"
            placeholder="מתאריך"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm bg-background"
            placeholder="עד תאריך"
          />
        </div>
        <div className="flex justify-end gap-2">
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              נקה סינון
            </button>
          )}
          <button
            onClick={applyFilters}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground"
          >
            החל
          </button>
        </div>
      </div>

      {/* Filtered audit list */}
      <FilteredAudit applied={applied} refreshKey={refreshKey} />
    </div>
  );
}

// Wraps AuditLogPanel and forwards filters as props.
// Uses a key prop to force re-mount on each "Apply" — simplest way to re-fetch with new params.
function FilteredAudit({ applied, refreshKey }) {
  return (
    <AuditLogList
      key={refreshKey}
      entityType={applied.entityType}
      userId={applied.userId}
      action={applied.action}
      dateFrom={applied.dateFrom}
      dateTo={applied.dateTo}
    />
  );
}

// Variant that accepts more filters than the entity-scoped panel.
const ACTION_META = {
  create:        { label: 'נוצר',         icon: Plus,        color: 'text-green-700 bg-green-100' },
  update:        { label: 'עודכן',        icon: Pencil,      color: 'text-blue-700 bg-blue-100' },
  status_change: { label: 'שינוי סטטוס',  icon: ArrowRight,  color: 'text-purple-700 bg-purple-100' },
  assign:        { label: 'שיוך טכנאי',   icon: UserPlus,    color: 'text-indigo-700 bg-indigo-100' },
  complete:      { label: 'הושלם',        icon: CheckCircle2, color: 'text-green-700 bg-green-100' },
  cancel:        { label: 'בוטל',         icon: XCircle,     color: 'text-red-700 bg-red-100' },
  delete:        { label: 'נמחק',         icon: Trash2,      color: 'text-red-700 bg-red-100' },
};
const ROLE_LABEL = { admin: 'אדמין', manager: 'מנהל', secretary: 'מזכירה', technician: 'טכנאי' };
const ENTITY_HREF = {
  customer: id => `/customers/${id}`,
  branch:   id => `/branches/${id}`,
  device:   id => `/devices/${id}`,
  work_order: id => `/work-orders?id=${id}`,
};
const ENTITY_TYPE_LABEL = { customer: 'לקוח', branch: 'סניף', device: 'מכשיר', work_order: 'הזמנת עבודה' };

function relativeTime(iso) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'כרגע';
  if (diff < 3600) return `לפני ${Math.floor(diff / 60)} דקות`;
  if (diff < 86400) return `לפני ${Math.floor(diff / 3600)} שעות`;
  if (diff < 7 * 86400) return `לפני ${Math.floor(diff / 86400)} ימים`;
  return d.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function AuditLogList({ entityType, userId, action, dateFrom, dateTo }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    auditAPI.list({ entityType, userId, action, dateFrom, dateTo, limit: 100 })
      .then(res => { if (alive) setEntries(res.data || []); })
      .catch(e => { if (alive) setErr(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [entityType, userId, action, dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        טוען...
      </div>
    );
  }
  if (err) return <div className="text-center py-8 text-red-700">שגיאה: {err}</div>;
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-card border rounded-xl">
        <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p>אין רשומות תואמות לסינון</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">{entries.length} רשומות</div>
      {entries.map(entry => {
        const meta = ACTION_META[entry.action] || ACTION_META.update;
        const Icon = meta.icon;
        const href = ENTITY_HREF[entry.entityType]?.(entry.entityId);
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
                  <span className="text-xs text-muted-foreground">{ENTITY_TYPE_LABEL[entry.entityType]}:</span>
                  {href ? (
                    <Link href={href} className="text-xs font-medium text-primary hover:underline truncate max-w-[280px]">
                      {entry.entityName || '—'}
                    </Link>
                  ) : (
                    <span className="text-xs">{entry.entityName || '—'}</span>
                  )}
                  <span className="text-xs text-muted-foreground ms-auto">{relativeTime(entry.createdAt)}</span>
                </div>
                {entry.changes && entry.changes.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5 text-sm text-foreground/80">
                    {entry.changes.slice(0, 3).map((ch, i) => (
                      <li key={i}>
                        <span className="text-muted-foreground">{ch.field}:</span>{' '}
                        <span className="line-through opacity-60">{String(ch.from ?? '—').slice(0, 30)}</span>
                        {' → '}
                        <span className="font-medium">{String(ch.to ?? '—').slice(0, 30)}</span>
                      </li>
                    ))}
                    {entry.changes.length > 3 && (
                      <li className="text-xs text-muted-foreground">+{entry.changes.length - 3} שדות נוספים</li>
                    )}
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
