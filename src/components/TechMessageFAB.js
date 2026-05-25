'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import TechMessageDialog from './TechMessageDialog';

/**
 * Floating action button shown on every technician screen, just above the
 * bottom nav. Opens the message dialog when tapped.
 */
export default function TechMessageFAB() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="שלח הודעה למשרד"
        className="fixed bottom-20 left-4 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform flex items-center justify-center"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
      <TechMessageDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
