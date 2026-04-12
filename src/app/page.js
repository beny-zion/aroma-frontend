'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Wifi, Calendar } from 'lucide-react';
import { adminAPI } from '@/lib/api';

// Dashboard Components
import KPICard from '@/components/dashboard/KPICard';
import RefillStatusChart from '@/components/dashboard/RefillStatusChart';
import GeoDistributionChart from '@/components/dashboard/GeoDistributionChart';
import InventoryIntelligence from '@/components/dashboard/InventoryIntelligence';
import ActivityFeed from '@/components/dashboard/ActivityFeed';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminAPI.getDashboardStats();

      if (response.success) {
        setDashboardData(response.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(response.message || 'שגיאה בטעינת הנתונים');
      }
    } catch (err) {
      setError(err.message);
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

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
                onClick={loadDashboardData}
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">מרכז הבקרה</h1>
          <p className="text-gray-500 mt-1">סקירה כללית של ארומה פלוס</p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Wifi className="w-4 h-4 text-green-500" />
              <span>עודכן {lastUpdated.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
          <button
            onClick={loadDashboardData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            רענן
          </button>
        </div>
      </div>

      {/* Section 1: KPI Cards */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
            title="קריאות שירות פתוחות"
            value={kpis?.openServiceCalls || 0}
            icon="alerts"
            color={kpis?.openServiceCalls > 0 ? 'amber' : 'green'}
          />
        </div>
      </section>

      {/* Section 2: Operational Health */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></div>
          <h2 className="text-xl font-bold text-gray-800">מרכז הבקרה התפעולי</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RefillStatusChart data={refillStatus} />
          <GeoDistributionChart data={geoDistribution} />
        </div>
      </section>

      {/* Section 3: Inventory Intelligence */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: 'var(--color-primary-light)' }}></div>
          <h2 className="text-xl font-bold text-gray-800">ניהול מלאי חכם</h2>
        </div>
        <InventoryIntelligence
          lowStock={inventory?.lowStock}
          popularScents={inventory?.popularScents}
        />
      </section>

      {/* Section 4: Recent Activity */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: 'var(--color-primary-dark)' }}></div>
          <h2 className="text-xl font-bold text-gray-800">פעילות אחרונה</h2>
        </div>
        <ActivityFeed activities={recentActivity} />
      </section>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-400">
        <Calendar className="w-4 h-4" />
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
