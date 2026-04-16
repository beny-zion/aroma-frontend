'use client';

import AnalyticsPasswordGate from '@/components/analytics/AnalyticsPasswordGate';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export default function AdminPage() {
  return (
    <AnalyticsPasswordGate>
      <AnalyticsDashboard />
    </AnalyticsPasswordGate>
  );
}
