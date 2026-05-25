'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { BookOpen, Search, Clock, ArrowLeft, Sparkles, Users, Calendar, Wrench, Settings } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const CATEGORY_META = {
  'getting-started': { label: 'התחלה מהירה',     icon: Sparkles, color: 'text-amber-600',   bg: 'bg-amber-50' },
  customers:         { label: 'לקוחות וסניפים',  icon: Users,    color: 'text-blue-600',    bg: 'bg-blue-50' },
  schedule:          { label: 'יומן ועבודה',     icon: Calendar, color: 'text-purple-600',  bg: 'bg-purple-50' },
  technician:        { label: 'טכנאים בשטח',     icon: Wrench,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
  admin:             { label: 'הגדרות וניהול',   icon: Settings, color: 'text-slate-600',   bg: 'bg-slate-50' },
  general:           { label: 'כללי',            icon: BookOpen, color: 'text-gray-600',    bg: 'bg-gray-50' },
};

const ROLE_LABELS = {
  admin: 'אדמין',
  manager: 'מנהל',
  secretary: 'מזכירה',
  technician: 'טכנאי',
};

export default function GuidesIndexPage() {
  const { user } = useAuth();
  const { data: guides = [], isLoading, error } = useSWR('/guides');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return guides.filter(g => {
      if (activeCategory !== 'all' && g.category !== activeCategory) return false;
      if (!term) return true;
      return (
        g.title?.toLowerCase().includes(term) ||
        g.description?.toLowerCase().includes(term)
      );
    });
  }, [guides, search, activeCategory]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const g of filtered) {
      const list = map.get(g.category) || [];
      list.push(g);
      map.set(g.category, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const categories = useMemo(() => {
    const set = new Set(guides.map(g => g.category));
    return ['all', ...Array.from(set)];
  }, [guides]);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <PageHeader
        title="מדריכי שימוש"
        subtitle={`מדריכים שלב-אחרי-שלב למערכת ארומה פלוס — מותאמים לתפקיד שלך (${ROLE_LABELS[user?.role] || ''})`}
        icon={BookOpen}
        count={guides.length}
      />

      {/* Hero card */}
      <Card className="p-5 bg-gradient-to-br from-[var(--brand-50,#eef5f0)] to-white border-[var(--brand,#6B8E7B)]/20">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold">חדש כאן? מתחילים מ"התחלה מהירה"</h2>
            <p className="text-sm text-muted-foreground mt-1">
              כל מדריך כולל צילומי מסך, הסבר על כל כפתור, וטיפים מעשיים. אפשר לדפדף לפי תפקיד או לחפש לפי מילה.
            </p>
          </div>
        </div>
      </Card>

      {/* Search + categories */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש במדריכים..."
            className="pr-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map(cat => {
            const meta = cat === 'all'
              ? { label: 'הכל', icon: BookOpen, color: 'text-foreground', bg: 'bg-muted' }
              : CATEGORY_META[cat] || CATEGORY_META.general;
            const Icon = meta.icon;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card hover:bg-accent border-border text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading / error / empty */}
      {isLoading && (
        <div className="text-center py-12 text-muted-foreground">טוען מדריכים...</div>
      )}
      {error && !isLoading && (
        <Card className="p-6 border-destructive/30 bg-destructive/5">
          <p className="text-destructive font-medium">שגיאה בטעינת המדריכים</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </Card>
      )}
      {!isLoading && !error && filtered.length === 0 && (
        <Card className="p-10 text-center">
          <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium">אין מדריכים להצגה</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? 'נסה מילת חיפוש אחרת' : 'מדריכים יתווספו כאן בהמשך'}
          </p>
        </Card>
      )}

      {/* Grouped list */}
      <div className="space-y-6">
        {grouped.map(([category, items]) => {
          const meta = CATEGORY_META[category] || CATEGORY_META.general;
          const CatIcon = meta.icon;
          return (
            <section key={category}>
              <div className="flex items-center gap-2 mb-3">
                <CatIcon className={`h-4 w-4 ${meta.color}`} />
                <h3 className="text-sm font-bold tracking-tight">{meta.label}</h3>
                <span className="text-xs text-muted-foreground">({items.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map(g => (
                  <Link key={g.slug} href={`/guides/${g.slug}`}>
                    <Card className="p-4 hover:shadow-md transition-all hover:border-primary/40 cursor-pointer h-full">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}>
                          <CatIcon className={`h-5 w-5 ${meta.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold leading-snug">{g.title}</h4>
                            <ArrowLeft className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          </div>
                          {g.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{g.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground">
                            {g.estimatedMinutes ? (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {g.estimatedMinutes} דק'
                              </span>
                            ) : null}
                            {g.audience?.length ? (
                              <div className="flex items-center gap-1 flex-wrap">
                                {g.audience.map(r => (
                                  <Badge key={r} variant="secondary" className="text-[10px] h-4 px-1.5">
                                    {ROLE_LABELS[r] || r}
                                  </Badge>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
