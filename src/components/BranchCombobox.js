'use client';

import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from '@/components/ui/command';

/**
 * Searchable branch picker. Drop-in replacement for a <Select> of branches
 * — typing filters by branch name, city, or customer name simultaneously.
 *
 * Props:
 *   branches: full branch list (populated with customerId.name when possible)
 *   value:    selected branch _id (string)
 *   onChange: (id) => void
 *   placeholder: visible when nothing selected
 */
export default function BranchCombobox({ branches = [], value, onChange, placeholder = 'בחר סניף', disabled }) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => branches.find(b => b._id === value),
    [branches, value]
  );

  // Build a single searchable string per branch so CommandInput's built-in
  // filter matches across name + city + customer name.
  const items = useMemo(() => branches.map(b => {
    const customerName = b.customerId?.name || (typeof b.customerId === 'string' ? '' : '');
    const haystack = [b.branchName, b.city, b.region, customerName].filter(Boolean).join(' ');
    return { id: b._id, branchName: b.branchName, city: b.city, region: b.region, customerName, haystack };
  }), [branches]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal h-10"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4 h-4 shrink-0 opacity-60" />
            <span className="truncate">
              {selected
                ? (
                  <>
                    <span className="font-medium">{selected.branchName}</span>
                    {selected.city && <span className="text-muted-foreground"> · {selected.city}</span>}
                  </>
                )
                : <span className="text-muted-foreground">{placeholder}</span>}
            </span>
          </span>
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        // On mobile (< sm): use most of the viewport so the search list isn't
        // cramped inside a dialog. On desktop: align to trigger width.
        className="p-0 w-[calc(100vw-2rem)] max-w-[420px] sm:w-[--radix-popover-trigger-width]"
        align="start"
        dir="rtl"
        sideOffset={4}
      >
        <Command
          // Use our combined haystack as the searchable value, so a single
          // typed query matches branch / city / customer at once.
          filter={(value, search) => {
            return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="חיפוש לפי שם, עיר או לקוח..." className="h-11 text-base" />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>לא נמצאו סניפים</CommandEmpty>
            <CommandGroup>
              {items.map(item => (
                <CommandItem
                  key={item.id}
                  value={item.haystack}
                  onSelect={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                  className="flex items-start gap-2 py-3 cursor-pointer"
                >
                  <Check
                    className={cn(
                      'h-4 w-4 mt-1 shrink-0',
                      value === item.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.branchName}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {[item.city, item.region, item.customerName].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
