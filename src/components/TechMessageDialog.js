'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from '@/components/ui/command';
import { Send, Loader2, Building2, Users, Cpu, ChevronsUpDown, Check, Link2, X } from 'lucide-react';
import { techMessagesAPI } from '@/lib/api';
import { useBranches, useAllCustomers, useAllDevices } from '@/hooks/useData';
import { cn } from '@/lib/utils';

const ENTITY_META = {
  customer: { label: 'לקוח', icon: Users },
  branch: { label: 'סניף', icon: Building2 },
  device: { label: 'מכשיר', icon: Cpu },
};

export default function TechMessageDialog({ open, onOpenChange, onSent }) {
  const [body, setBody] = useState('');
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const [sending, setSending] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Only load the list the user actually picked, to keep dialog open instant
  const { branches } = useBranches();
  const { customers } = useAllCustomers();
  const { devices } = useAllDevices();

  const items = useMemo(() => {
    if (entityType === 'customer') {
      return customers.map(c => ({
        id: c._id,
        title: c.name,
        subtitle: '',
        haystack: c.name
      }));
    }
    if (entityType === 'branch') {
      return branches.map(b => ({
        id: b._id,
        title: b.branchName,
        subtitle: [b.city, b.region, b.customerId?.name].filter(Boolean).join(' · '),
        haystack: [b.branchName, b.city, b.region, b.customerId?.name].filter(Boolean).join(' ')
      }));
    }
    if (entityType === 'device') {
      return devices.map(d => ({
        id: d._id,
        title: `${d.deviceType || 'מכשיר'} ${d.locationInBranch || ''}`.trim(),
        subtitle: d.branchId?.branchName || '',
        haystack: `${d.deviceType || ''} ${d.locationInBranch || ''} ${d.branchId?.branchName || ''}`
      }));
    }
    return [];
  }, [entityType, customers, branches, devices]);

  const selected = items.find(i => i.id === entityId);

  function reset() {
    setBody('');
    setEntityType('');
    setEntityId('');
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>שליחת הודעה למשרד</DialogTitle>
          <DialogDescription>הודעה קצרה למנהל / מזכירה. אפשר לצרף לקוח, סניף או מכשיר.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">תוכן ההודעה *</Label>
            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="למשל: התקלה במכשיר המים בסניף תיקנתי, יש לשקול החלפת מסנן..."
              rows={4}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1.5">
              <Link2 className="w-3 h-3" />
              צירוף ישות (אופציונלי)
            </Label>
            <div className="flex gap-2">
              <Select value={entityType} onValueChange={(v) => { setEntityType(v); setEntityId(''); }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="סוג" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">לקוח</SelectItem>
                  <SelectItem value="branch">סניף</SelectItem>
                  <SelectItem value="device">מכשיר</SelectItem>
                </SelectContent>
              </Select>

              {entityType && (
                <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="flex-1 justify-between font-normal h-10"
                    >
                      <span className="truncate">
                        {selected ? selected.title : <span className="text-muted-foreground">בחר {ENTITY_META[entityType]?.label}</span>}
                      </span>
                      <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start" dir="rtl">
                    <Command filter={(value, search) => value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0}>
                      <CommandInput placeholder="חיפוש..." />
                      <CommandList>
                        <CommandEmpty>אין תוצאות</CommandEmpty>
                        <CommandGroup>
                          {items.map(item => (
                            <CommandItem
                              key={item.id}
                              value={item.haystack}
                              onSelect={() => { setEntityId(item.id); setPickerOpen(false); }}
                            >
                              <Check className={cn('h-4 w-4 mt-0.5 shrink-0', entityId === item.id ? 'opacity-100' : 'opacity-0')} />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{item.title}</div>
                                {item.subtitle && (
                                  <div className="text-[11px] text-muted-foreground truncate">{item.subtitle}</div>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}

              {(entityType || entityId) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setEntityType(''); setEntityId(''); }}
                  aria-label="הסר צירוף"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
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
