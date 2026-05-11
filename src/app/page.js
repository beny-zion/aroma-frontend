'use client';

import { RefreshCw, Wifi, Calendar } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Dashboard Components
import KPICard from '@/components/dashboard/KPICard';
import RefillStatusChart from '@/components/dashboard/RefillStatusChart';
import GeoDistributionChart from '@/components/dashboard/GeoDistributionChart';
import InventoryIntelligence from '@/components/dashboard/InventoryIntelligence';
import ActivityFeed from '@/components/dashboard/ActivityFeed';

export default function Dashboard() {
  const { data: dashboardData, isLoading: loading, error: swrError, refresh } = useDashboardStats();
  const error = swrError?.message || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto">
            <div
              className="absolute inset-0 rounded-full border-4"
              style={{ borderColor: 'var(--color-primary-100)' }}
            />
            <div
              className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
            />
          </div>
          <p className="mt-6 text-gray-500 font-medium">טוען את מרכז הבקרה...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-800 text-lg">שגיאה בטעינת הנתונים</h3>
              <p className="text-red-600 mt-1 text-sm">{error}</p>
              <button
                onClick={() => refresh()}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                נסה שוב
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { kpis, refillStatus, geoDistribution, inventory, recentActivity } = dashboardData || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-strong)]">מרכז הבקרה</h1>
          <p className="text-[var(--text-soft)] mt-0.5 text-sm">סקירה כללית של ארומה פלוס</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-soft)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-green)]"></span>
            <span>נתונים מעודכנים</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            <RefreshCw className="w-3.5 h-3.5" />
            רענן
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="הכנסה חודשית צפויה"
          value={kpis?.mrr || 0}
          prefix="₪"
          icon="money"
          color="primary"
          subtitle={`${kpis?.activeCustomers || 0} לקוחות פעילים`}
        />
        <KPICard
          title="מכשירים פעילים"
          value={kpis?.activeDevices || 0}
          icon="devices"
          color="blue"
        />
        <KPICard
          title="נקודות שירות"
          value={kpis?.activeBranches || 0}
          icon="branches"
          color="green"
        />
        <KPICard
          title="קריאות פתוחות"
          value={kpis?.openServiceCalls || 0}
          icon="alerts"
          color={kpis?.openServiceCalls > 0 ? 'amber' : 'green'}
        />
      </section>

      {/* Operational Health */}
      <section>
        <SectionHeader title="מרכז הבקרה התפעולי" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <RefillStatusChart data={refillStatus} />
          <GeoDistributionChart data={geoDistribution} />
        </div>
      </section>

      {/* Inventory */}
      <section>
        <SectionHeader title="ניהול מלאי" />
        <InventoryIntelligence
          lowStock={inventory?.lowStock}
          popularScents={inventory?.popularScents}
        />
      </section>

      {/* Recent Activity */}
      <section>
        <SectionHeader title="פעילות אחרונה" />
        <ActivityFeed activities={recentActivity} />
      </section>

      {/* Footer */}
      <div className="flex items-center justify-center gap-1.5 pt-2 text-xs text-[var(--text-faint)]">
        <Calendar className="w-3 h-3" />
        <span>
          נוצר ב-{new Date(dashboardData?.generatedAt).toLocaleString('he-IL', {
            dateStyle: 'short',
            timeStyle: 'short'
          })}
        </span>
      </div>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-0.5 h-4 rounded bg-[var(--brand)]" />
      <h2 className="text-sm font-semibold text-[var(--text-strong)] tracking-tight">{title}</h2>
    </div>
  );
}
