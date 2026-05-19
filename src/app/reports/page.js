'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, Users, Cpu, Building2, RefreshCw, AlertCircle, Trophy, Info
} from 'lucide-react';
import { reportsAPI } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import KPICard from '@/components/dashboard/KPICard';

const MONTH_LABELS_HE = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

function shortMonth(label) {
  // label = "2025-06"
  const [y, m] = label.split('-');
  return `${MONTH_LABELS_HE[Number(m) - 1].slice(0, 3)} ${y.slice(2)}`;
}

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [months, setMonths] = useState(12);

  function load() {
    setLoading(true);
    setError(null);
    reportsAPI
      .getRevenue({ months })
      .then(setData)
      .catch((err) => setError(err.message || 'שגיאה'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [months]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <AlertCircle className="w-6 h-6 mx-auto mb-2 text-[var(--text-soft)]" />
        <p className="text-sm text-[var(--text-soft)]">{error}</p>
        <Button onClick={load} variant="outline" size="sm" className="mt-3">
          <RefreshCw className="w-3.5 h-3.5" />
          נסה שוב
        </Button>
      </Card>
    );
  }

  const { current, trend, topCustomers, meta } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-50)] flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[var(--brand)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-strong)]">דוחות כספיים</h1>
            <p className="text-[var(--text-soft)] mt-0.5 text-sm">סקירת הכנסות, פעילות שירות וטופ לקוחות</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-card border rounded-xl p-1">
            {[6, 12, 24].map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={`px-3 py-1.5 text-[12px] rounded-md transition ${
                  months === m
                    ? 'bg-[var(--brand)] text-white font-medium'
                    : 'text-[var(--text-soft)] hover:bg-[var(--surface-muted)]'
                }`}
              >
                {m} חודשים
              </button>
            ))}
          </div>
          <Button onClick={load} variant="outline" size="sm">
            <RefreshCw className="w-3.5 h-3.5" />
            רענן
          </Button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="card flex items-start gap-2 bg-[var(--brand-50)] border-[var(--brand)]/20">
        <Info className="w-4 h-4 text-[var(--brand)] shrink-0 mt-0.5" />
        <p className="text-[12.5px] text-[var(--text-default)] leading-relaxed">
          {meta?.note || 'הכנסה מבוססת MRR חוזה - לא כולל חשבוניות/תשלומים בפועל (יתווסף בשלב 3 של מפת הדרכים).'}
        </p>
      </div>

      {/* KPI cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="MRR חודשי כולל"
          value={current.totalMRR}
          prefix="₪"
          icon="money"
          color="primary"
          subtitle={`₪${current.monthlyPriceSum.toLocaleString('he-IL')} חוזה + ₪${current.deviceMonthlyRateSum.toLocaleString('he-IL')} מכשירים`}
        />
        <KPICard
          title="צפי שנתי"
          value={current.projectedAnnual}
          prefix="₪"
          icon="money"
          color="green"
        />
        <KPICard
          title="לקוחות פעילים"
          value={current.activeCustomersCount}
          icon="branches"
          color="blue"
          subtitle={`${current.activeBranchesCount} סניפים`}
        />
        <KPICard
          title="מכשירים פעילים"
          value={current.activeDevicesCount}
          icon="devices"
          color="primary"
        />
      </section>

      {/* Trend chart */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-0.5 h-4 rounded bg-[var(--brand)]" />
          <h2 className="text-sm font-semibold text-[var(--text-strong)] tracking-tight">
            פעילות שירות לאורך זמן
          </h2>
        </div>
        <Card className="p-4">
          {trend.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-soft)] text-sm">
              אין נתוני פעילות בתקופה הנבחרת
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" />
                <XAxis
                  dataKey="month"
                  tickFormatter={shortMonth}
                  tick={{ fontSize: 11, fill: 'var(--text-soft)' }}
                  reversed
                />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-soft)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface-default)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 8,
                    fontSize: 12
                  }}
                  labelFormatter={shortMonth}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="serviceLogCount" name="ביקורי שירות" fill="#6B8E7B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completedWorkOrders" name="הזמנות הושלמו" fill="#8BA99A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </section>

      {/* Top customers */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-0.5 h-4 rounded bg-[var(--brand)]" />
          <h2 className="text-sm font-semibold text-[var(--text-strong)] tracking-tight flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-[var(--brand)]" />
            טופ 10 לקוחות לפי הכנסה
          </h2>
        </div>
        <Card className="p-0 overflow-hidden">
          {topCustomers.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-soft)] text-sm">
              אין לקוחות פעילים
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface-muted)] text-[var(--text-soft)] text-[11.5px]">
                  <tr>
                    <th className="px-3 py-2 text-right font-medium">#</th>
                    <th className="px-3 py-2 text-right font-medium">לקוח</th>
                    <th className="px-3 py-2 text-right font-medium">סניפים</th>
                    <th className="px-3 py-2 text-right font-medium">חוזה</th>
                    <th className="px-3 py-2 text-right font-medium">מכשירים</th>
                    <th className="px-3 py-2 text-right font-medium">סה"כ חודשי</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-soft)]">
                  {topCustomers.map((c, idx) => (
                    <tr key={c._id} className="hover:bg-[var(--surface-muted)] transition">
                      <td className="px-3 py-2 text-[var(--text-muted)] font-tabular">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/customers/${c._id}`}
                          className="text-[var(--text-strong)] hover:text-[var(--brand)] font-medium"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-[var(--text-soft)] font-tabular">{c.branchCount}</td>
                      <td className="px-3 py-2 text-[var(--text-soft)] font-tabular">
                        ₪{c.monthlyPrice.toLocaleString('he-IL')}
                      </td>
                      <td className="px-3 py-2 text-[var(--text-soft)] font-tabular">
                        ₪{c.deviceMonthlyTotal.toLocaleString('he-IL')}
                      </td>
                      <td className="px-3 py-2 font-bold text-[var(--brand)] font-tabular">
                        ₪{c.totalMonthlyRevenue.toLocaleString('he-IL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
