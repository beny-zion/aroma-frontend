'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { toast } from 'sonner';
import { Bell, CheckCircle2, Loader2, Users, Building2, Cpu, Link2, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { techMessagesAPI } from '@/lib/api';

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
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
}

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);

  // Unread count refreshes every 60s (cheap query) — main badge data
  const { data: unreadData, mutate: mutateUnread } = useSWR(
    '/tech-messages/unread-count',
    null,
    { refreshInterval: 60000 }
  );
  const unread = unreadData?.count || 0;

  // Recent messages only loaded when the bell is opened
  const { data: msgData, isLoading, mutate: mutateMsgs } = useSWR(
    open ? '/tech-messages?status=' : null
  );
  const messages = msgData?.data || [];

  async function handleMarkRead(id) {
    try {
      await techMessagesAPI.markRead(id);
      mutateMsgs(); mutateUnread();
    } catch (err) { toast.error(err.message || 'שגיאה'); }
  }
  async function handleResolve(id) {
    try {
      await techMessagesAPI.resolve(id, null);
      mutateMsgs(); mutateUnread();
      toast.success('סומן כטופל');
    } catch (err) { toast.error(err.message || 'שגיאה'); }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-11 w-11" aria-label="התראות">
          <Bell className="!h-6 !w-6" />
          {unread > 0 && (
            // Sit on the top-left corner of the button so it doesn't cover the bell.
            // In RTL the visual upper-left of the bell is the screen's upper-left,
            // so absolute positioning still reads correctly.
            <span className="absolute -top-0.5 -left-0.5 min-w-[20px] h-5 px-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold leading-none flex items-center justify-center ring-2 ring-card">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-0 w-96" dir="rtl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">הודעות מטכנאים</h3>
          {unread > 0 && (
            <span className="text-[11px] text-muted-foreground">{unread} לא נקראו</span>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10 px-4 text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">אין הודעות חדשות</p>
            </div>
          ) : (
            <ul className="divide-y">
              {messages.slice(0, 30).map(m => {
                const Icon = ENTITY_ICON[m.attachedEntity?.type];
                const href = m.attachedEntity?.type && m.attachedEntity?.id
                  ? ENTITY_HREF[m.attachedEntity.type]?.(m.attachedEntity.id)
                  : null;
                const isUnread = m.status === 'unread';
                const isResolved = m.status === 'resolved';
                return (
                  <li
                    key={m._id}
                    className={`px-4 py-3 ${isUnread ? 'bg-primary/5' : isResolved ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {isUnread && <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-primary" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{m.fromUserName || 'טכנאי'}</span>
                          <span className="text-[11px] text-muted-foreground">{relativeTime(m.createdAt)}</span>
                          {isResolved && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> טופל
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground/90 mt-0.5 whitespace-pre-wrap break-words">
                          {m.body}
                        </p>

                        {m.attachedEntity?.type && m.attachedEntity?.name && (
                          href ? (
                            <Link
                              href={href}
                              onClick={() => { setOpen(false); if (isUnread) handleMarkRead(m._id); }}
                              className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              {Icon ? <Icon className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
                              {m.attachedEntity.name}
                            </Link>
                          ) : (
                            <span className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                              {Icon ? <Icon className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
                              {m.attachedEntity.name}
                            </span>
                          )
                        )}

                        {m.replyBody && (
                          <div className="mt-2 p-2 rounded bg-muted/50 text-xs">
                            <span className="font-medium">תגובה {m.replyByName ? `מ${m.replyByName}` : ''}:</span> {m.replyBody}
                          </div>
                        )}

                        {!isResolved && (
                          <div className="flex gap-1 mt-2">
                            {isUnread && (
                              <button
                                onClick={() => handleMarkRead(m._id)}
                                className="text-[11px] text-muted-foreground hover:text-foreground"
                              >
                                סמן כנקרא
                              </button>
                            )}
                            <button
                              onClick={() => handleResolve(m._id)}
                              className="text-[11px] text-green-700 hover:text-green-800 font-medium ms-auto"
                            >
                              סמן כטופל
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer link to full inbox */}
        <div className="border-t">
          <Link
            href="/tech-messages"
            onClick={() => setOpen(false)}
            className="block text-center text-sm text-primary font-medium py-3 hover:bg-muted/30 rounded-b-md"
          >
            הצג את כל ההודעות →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
