'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Send, Loader2, Building2, Users, Cpu, Check, Link2, X, Search
} from 'lucide-react';
import { techMessagesAPI } from '@/lib/api';
import { useBranches, useAllCustomers, useAllDevices } from '@/hooks/useData';
import { cn } from '@/lib/utils';

const ENTITY_OPTIONS = [
  { value: 'customer', label: 'לקוח',  icon: Users },
  { value: 'branch',   label: 'סניף',  icon: Building2 },
  { value: 'device',   label: 'מכשיר', icon: Cpu },
];

export default function TechMessageDialog({ open, onOpenChange, onSent }) {
  const [body, setBody] = useState('');
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);

  const { branches } = useBranches();
  const { customers } = useAllCustomers();
  const { devices } = useAllDevices();

  const items = useMemo(() => {
    if (entityType === 'customer') {
      return customers.map(c => ({
        id: c._id,
        title: c.name,
        subtitle: '',
        haystack: (c.name || '').toLowerCase()
      }));
    }
    if (entityType === 'branch') {
      return branches.map(b => ({
        id: b._id,
        title: b.branchName,
        subtitle: [b.city, b.region, b.customerId?.name].filter(Boolean).join(' · '),
        haystack: [b.branchName, b.city, b.region, b.customerId?.name].filter(Boolean).join(' ').toLowerCase()
      }));
    }
    if (entityType === 'device') {
      return devices.map(d => ({
        id: d._id,
        title: `${d.deviceType || 'מכשיר'} ${d.locationInBranch || ''}`.trim(),
        subtitle: d.branchId?.branchName || '',
        haystack: `${d.deviceType || ''} ${d.locationInBranch || ''} ${d.branchId?.branchName || ''}`.toLowerCase()
      }));
    }
    return [];
  }, [entityType, customers, branches, devices]);

  // Filter list against the search string (always-visible search input, no popover)
  const filtered = useMemo(() => {
    if (!search.trim()) return items.slice(0, 50); // cap list when not searching for perf
    const q = search.toLowerCase();
    return items.filter(it => it.haystack.includes(q)).slice(0, 50);
  }, [items, search]);

  const selected = items.find(i => i.id === entityId);

  function reset() {
    setBody('');
    setEntityType('');
    setEntityId('');
    setSearch('');
  }
  function clearEntity() {
    setEntityType('');
    setEntityId('');
    setSearch('');
  }

  async function handleSend() {
    if (!body.trim()) {
      toast.error('יש להזין הודעה');
      return;
    }
    try {
      setSending(true);
      await techMessagesAPI.send({
        body,
        attachedEntity: entityType && entityId ? { type: entityType, id: entityId } : null
      });
      toast.success('ההודעה נשלחה למשרד');
      reset();
      onOpenChange(false);
      onSent?.();
    } catch (err) {
      toast.error(err.message || 'שגיאה בשליחה');
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Mobile-friendly: full viewport on phones, capped on tablet+ */}
      <DialogContent className="max-w-md w-[calc(100vw-1rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>שליחת הודעה למשרד</DialogTitle>
          <DialogDescription>הודעה קצרה למנהל / מזכירה. אפשר לצרף לקוח, סניף או מכשיר.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">תוכן ההודעה *</Label>
            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="למשל: התקלה במכשיר המים בסניף תיקנתי, יש לשקול החלפת מסנן..."
              rows={4}
              className="text-base"
              autoFocus
            />
          </div>

          {/* Entity attachment — inline, no popover */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1.5">
              <Link2 className="w-3 h-3" />
              צירוף ישות (אופציונלי)
            </Label>

            {/* Step 1: pick the entity TYPE as a segmented control */}
            <div className="grid grid-cols-3 gap-1.5">
              {ENTITY_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isActive = entityType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      if (isActive) { clearEntity(); return; }
                      setEntityType(opt.value);
                      setEntityId('');
                      setSearch('');
                    }}
                    className={cn(
                      'flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border text-xs font-medium transition-colors',
                      isActive
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Step 2: once a type is picked, show inline search + list */}
            {entityType && (
              <div className="space-y-2">
                {/* Selected chip */}
                {selected && (
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-primary/10 border border-primary/30">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate text-primary">{selected.title}</div>
                      {selected.subtitle && (
                        <div className="text-[11px] text-primary/70 truncate">{selected.subtitle}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => { setEntityId(''); setSearch(''); }}
                      className="shrink-0 p-1 rounded hover:bg-primary/20 text-primary"
                      aria-label="הסר בחירה"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Always-visible search input */}
                {!selected && (
                  <>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={`חיפוש ${ENTITY_OPTIONS.find(o => o.value === entityType)?.label}...`}
                        className="ps-9 h-11 text-base"
                      />
                    </div>

                    {/* Scrollable result list */}
                    <div className="border rounded-lg max-h-56 overflow-y-auto bg-card">
                      {filtered.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          {search ? 'לא נמצאו תוצאות' : 'התחל להקליד לחיפוש...'}
                        </div>
                      ) : (
                        <ul className="divide-y">
                          {filtered.map(item => (
                            <li key={item.id}>
                              <button
                                type="button"
                                onClick={() => { setEntityId(item.id); setSearch(''); }}
                                className="w-full text-right px-3 py-3 flex items-start gap-2 hover:bg-muted active:bg-muted/70"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">{item.title}</div>
                                  {item.subtitle && (
                                    <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>
                                  )}
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {items.length > filtered.length && !search && (
                      <p className="text-[11px] text-muted-foreground text-center">
                        מציג 50 מתוך {items.length} — חפש לצמצם
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => { reset(); onOpenChange(false); }}>
            ביטול
          </Button>
          <Button onClick={handleSend} disabled={sending || !body.trim()}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            שלח
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
