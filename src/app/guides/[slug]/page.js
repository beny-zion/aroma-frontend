'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  BookOpen, ArrowRight, ArrowLeft, ChevronRight, ChevronLeft,
  Clock, Lightbulb, CheckCircle2, X, ZoomIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ROLE_LABELS = {
  admin: 'אדמין',
  manager: 'מנהל',
  secretary: 'מזכירה',
  technician: 'טכנאי',
};

export default function GuideViewerPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;

  const { data: guide, isLoading, error } = useSWR(slug ? `/guides/${slug}` : null);

  const [activeStep, setActiveStep] = useState(0);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Reset active step when guide changes
  useEffect(() => {
    setActiveStep(0);
  }, [slug]);

  // Esc closes lightbox
  useEffect(() => {
    if (!lightboxImg) return;
    const onKey = (e) => { if (e.key === 'Escape') setLightboxImg(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxImg]);

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">טוען מדריך...</div>;
  }

  if (error) {
    return (
      <Card className="p-6 max-w-2xl mx-auto border-destructive/30 bg-destructive/5">
        <p className="text-destructive font-medium">לא ניתן לטעון את המדריך</p>
        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push('/guides')}>
          <ArrowRight className="h-4 w-4" />
          חזרה לרשימת המדריכים
        </Button>
      </Card>
    );
  }

  if (!guide) return null;

  const steps = guide.steps || [];
  const total = steps.length;
  const current = steps[activeStep];
  const progressPct = total > 0 ? Math.round(((activeStep + 1) / total) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <Link
          href="/guides"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowRight className="h-4 w-4" />
          כל המדריכים
        </Link>
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">{guide.title}</h1>
            {guide.description && (
              <p className="text-sm text-muted-foreground mt-1">{guide.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              {guide.estimatedMinutes ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  ~{guide.estimatedMinutes} דקות
                </span>
              ) : null}
              <span>•</span>
              <span>{total} שלבים</span>
              {guide.audience?.length ? (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {guide.audience.map(r => (
                      <Badge key={r} variant="secondary" className="text-[10px] h-4 px-1.5">
                        {ROLE_LABELS[r] || r}
                      </Badge>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {total === 0 ? (
        <Card className="p-10 text-center">
          <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium">המדריך עוד ריק</p>
          <p className="text-sm text-muted-foreground mt-1">שלבים יתווספו בקרוב</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
          {/* Step navigator */}
          <aside className="space-y-2 lg:sticky lg:top-4 lg:self-start">
            <div className="text-xs font-semibold text-muted-foreground px-1">שלבים</div>
            <div className="space-y-1">
              {steps.map((s, idx) => {
                const isActive = idx === activeStep;
                const isPast = idx < activeStep;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`w-full text-right px-3 py-2 rounded-lg text-sm flex items-start gap-2 transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isPast
                        ? 'text-muted-foreground hover:bg-accent'
                        : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    <span
                      className={`h-5 w-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                        isActive
                          ? 'bg-primary-foreground text-primary'
                          : isPast
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isPast ? <CheckCircle2 className="h-3 w-3" /> : idx + 1}
                    </span>
                    <span className="flex-1 leading-snug">{s.title}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Step content */}
          <div className="space-y-4">
            {/* Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>שלב {activeStep + 1} מתוך {total}</span>
                <span className="font-mono">{progressPct}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <Card className="p-5 md:p-6 space-y-4">
              <h2 className="text-lg font-bold tracking-tight">
                {activeStep + 1}. {current.title}
              </h2>

              {current.imageUrl && (
                <figure className="space-y-2">
                  <button
                    onClick={() => setLightboxImg(current.imageUrl)}
                    className="group relative w-full overflow-hidden rounded-xl border bg-muted/30 block"
                  >
                    <img
                      src={current.imageUrl}
                      alt={current.imageCaption || current.title}
                      className="w-full h-auto"
                      loading="lazy"
                    />
                    <span className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <ZoomIn className="h-3 w-3" />
                      הגדל
                    </span>
                  </button>
                  {current.imageCaption && (
                    <figcaption className="text-xs text-muted-foreground text-center">
                      {current.imageCaption}
                    </figcaption>
                  )}
                </figure>
              )}

              {current.body && (
                <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                  {current.body}
                </div>
              )}

              {current.tip && (
                <div className="flex gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900">
                    <span className="font-semibold">טיפ: </span>
                    {current.tip}
                  </div>
                </div>
              )}
            </Card>

            {/* Step nav */}
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => setActiveStep(s => Math.max(0, s - 1))}
                disabled={activeStep === 0}
              >
                <ChevronRight className="h-4 w-4" />
                הקודם
              </Button>

              {activeStep === total - 1 ? (
                <Button onClick={() => router.push('/guides')}>
                  סיימתי
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => setActiveStep(s => Math.min(total - 1, s + 1))}>
                  הבא
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 left-4 h-10 w-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
            aria-label="סגור"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxImg}
            alt=""
            className="max-h-full max-w-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
