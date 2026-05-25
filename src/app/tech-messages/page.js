'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { techMessagesAPI } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  Bell, MessageCircle, Users, Building2, Cpu, Link2, CheckCircle2, Loader2,
  X, Trash2, Search
} from 'lucide-react';

const STATUS_TABS = [
  { key: '', label: 'הכל' },
  { key: 'unread', label: 'לא נקראו' },
  { key: 'read', label: 'נקראו' },
  { key: 'resolved', label: 'טופלו' },
];

const STATUS_META = {
  unread:   { label: 'חדש', color: 'bg-primary/10 text-primary border-primary/30' },
  read:     { label: 'נצפה', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  resolved: { label: 'טופל', color: 'bg-green-100 text-green-700 border-green-300' },
};

const ENTITY_HREF = {
  customer: id => `/customers/${id}`,
  branch:   id => `/branches/${id}`,
  device:   id => `/devices/${id}`,
};
const ENTITY_ICON = { customer: Users, branch: Building2, device: Cpu };

function relativeTime(iso) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'כרגע';
  if (diff < 3600) return `לפני ${Math.floor(diff / 60)} ד'`;
  if (diff < 86400) return `לפני ${Math.floor(diff / 3600)} שעות`;
  if (diff < 7 * 86400) return `לפני ${Math.floor(diff / 86400)} ימים`;
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function TechMessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Role guard
  useEffect(() => {
    if (!authLoading && user && !['admin', 'manager', 'secretary'].includes(user.role)) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const swrKey = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    return `/tech-messages?${params.toString()}`;
  }, [statusFilter]);

  const { data, isLoading, mutate } = useSWR(swrKey);
  const messages = data?.data || [];

  // Client-side search across sender + body + attached entity name
  const filtered = useMemo(() => {
    if (!search.trim()) return messages;
    const q = search.toLowerCase();
    return messages.filter(m => {
      return (m.fromUserName || '').toLowerCase().includes(q)
        || (m.body || '').toLowerCase().includes(q)
        || (m.attachedEntity?.name || '').toLowerCase().includes(q);
    });
  }, [messages, search]);

  // Resolve dialog
  const [resolveTarget, setResolveTarget] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [resolving, setResolving] = useState(false);

  async function handleMarkRead(id) {
    try { await techMessagesAPI.markRead(id); mutate(); }
    catch (err) { toast.error(err.message || 'שגיאה'); }
  }
  async function submitResolve() {
    if (!resolveTarget) return;
    try {
      setResolving(true);
      await techMessagesAPI.resolve(resolveTarget._id, replyBody || null);
      toast.success('סומן כטופל');
      setResolveTarget(null);
      setReplyBody('');
      mutate();
    } catch (err) {
      toast.error(err.message || 'שגיאה');
    } finally {
      setResolving(false);
    }
  }
  async function handleDelete(id) {
    if (!confirm('למחוק את ההודעה?')) return;
    try { await techMessagesAPI.delete(id); mutate(); toast.success('נמחק'); }
    catch (err) { toast.error(err.message || 'שגיאה'); }
  }

  // Counts for tabs
  const counts = useMemo(() => {
    const c = { unread: 0, read: 0, resolved: 0 };
    for (const m of messages) c[m.status] = (c[m.status] || 0) + 1;
    return c;
  }, [messages]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="הודעות מטכנאים"
        subtitle="היסטוריית הודעות שנשלחו מהשטח"
        icon={MessageCircle}
        count={messages.length}
      />

      {/* Status tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted overflow-x-auto scrollbar-hide">
        {STATUS_TABS.map(t => {
          const count = t.key ? counts[t.key] : messages.length;
          return (
            <button
              key={t.key || 'all'}
              onClick={() => setStatusFilter(t.key)}
              className={`flex-1 min-w-fit md:min-w-0 px-3 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                statusFilter === t.key ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {t.label}
              {count > 0 && <span className="ms-1 text-[11px] opacity-70 font-tabular">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לפי טכנאי, תוכן או ישות מצורפת..."
          className="ps-9 h-11"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          טוען הודעות...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card border rounded-xl">
          <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>{messages.length === 0 ? 'אין הודעות עדיין' : 'אין תוצאות לחיפוש'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => {
            const status = STATUS_META[m.status] || STATUS_META.read;
            const Icon = ENTITY_ICON[m.attachedEntity?.type];
            const href = m.attachedEntity?.type && m.attachedEntity?.id
              ? ENTITY_HREF[m.attachedEntity.type]?.(m.attachedEntity.id)
              : null;
            const isUnread = m.status === 'unread';

            return (
              <div
                key={m._id}
                className={`bg-card border rounded-xl p-3 ${isUnread ? 'ring-1 ring-primary/30' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold`}>
                    {m.fromUserName?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-semibold text-sm">{m.fromUserName || 'טכנאי'}</span>
                      <span className="text-[11px] text-muted-foreground">{relativeTime(m.createdAt)}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${status.color} ms-auto`}>
                        {status.label}
                      </span>
                    </div>

                    <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap break-words">
                      {m.body}
                    </p>

                    {m.attachedEntity?.type && m.attachedEntity?.name && (
                      href ? (
                        <Link
                          href={href}
                          className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                        >
                          {Icon ? <Icon className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                          {m.attachedEntity.name}
                        </Link>
                      ) : (
                        <span className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          {Icon ? <Icon className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                          {m.attachedEntity.name}
                        </span>
                      )
                    )}

                    {m.replyBody && (
                      <div className="mt-2 p-2.5 rounded-lg bg-muted/50 text-sm">
                        <div className="text-[11px] text-muted-foreground mb-0.5">
                          תגובה {m.replyByName ? `מ${m.replyByName}` : ''} · {relativeTime(m.replyAt)}
                        </div>
                        {m.replyBody}
                      </div>
                    )}

                    {/* Inline actions */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {isUnread && (
                        <button
                          onClick={() => handleMarkRead(m._id)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          סמן כנקרא
                        </button>
                      )}
                      {m.status !== 'resolved' && (
                        <button
                          onClick={() => { setResolveTarget(m); setReplyBody(''); }}
                          className="text-xs font-medium text-green-700 hover:text-green-800 inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          סמן כטופל
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(m._id)}
                        className="text-xs text-muted-foreground hover:text-destructive ms-auto inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        מחק
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolve dialog with optional reply */}
      <Dialog open={!!resolveTarget} onOpenChange={(o) => !o && setResolveTarget(null)}>
        <DialogContent className="max-w-md w-[calc(100vw-1rem)]">
          <DialogHeader>
            <DialogTitle>סימון כטופל</DialogTitle>
            <DialogDescription>
              אפשר להוסיף תגובה קצרה (אופציונלי). הטכנאי יוכל לראות אותה בהיסטוריה שלו.
            </DialogDescription>
          </DialogHeader>
          {resolveTarget && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <div className="text-[11px] text-muted-foreground mb-1">
                {resolveTarget.fromUserName} · {relativeTime(resolveTarget.createdAt)}
              </div>
              {resolveTarget.body}
            </div>
          )}
          <div>
            <Label className="text-xs">תגובה (אופציונלי)</Label>
            <Textarea
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              placeholder="למשל: הוזמן חלק חילוף, יגיע ביום ראשון"
              rows={3}
              className="text-base"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setResolveTarget(null)}>ביטול</Button>
            <Button onClick={submitResolve} disabled={resolving}>
              {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              אשר כטופל
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
