'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Eye, Users, Activity, Zap,
  RefreshCw, Monitor, Smartphone, Tablet, HelpCircle,
  Clock, Globe, Shield, LogOut, Wifi, MessageCircle, Fingerprint
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { analyticsAPI } from '@/lib/api';
import Pagination from '@/components/Pagination';

const PERIOD_OPTIONS = [
  { label: '7 ימים', value: 7 },
  { label: '14 ימים', value: 14 },
  { label: '30 ימים', value: 30 },
  { label: '90 ימים', value: 90 },
];

const DEVICE_COLORS = {
  desktop: '#4A6B59',
  mobile: '#3B82F6',
  tablet: '#8B5CF6',
  unknown: '#9CA3AF'
};

const DEVICE_LABELS = {
  desktop: 'מחשב',
  mobile: 'נייד',
  tablet: 'טאבלט',
  unknown: 'לא ידוע'
};

const DEVICE_ICONS = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  unknown: HelpCircle
};

const ROLE_COLORS = {
  admin: '#4A6B59',
  manager: '#3B82F6',
  technician: '#F59E0B',
  anonymous: '#9CA3AF'
};

const ROLE_LABELS = {
  admin: 'מנהל',
  manager: 'מנהל משרד',
  technician: 'טכנאי',
  anonymous: 'אנונימי'
};

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const PAGE_LABELS = {
  '/': 'דשבורד',
  '/devices': 'מכשירים',
  '/customers': 'לקוחות',
  '/branches': 'סניפים',
  '/scents': 'ריחות',
  '/refill': 'ביצוע מילוי',
  '/service-logs': 'יומן שירות',
  '/work-orders': 'הזמנות עבודה',
  '/my-tasks': 'המשימות שלי',
  '/users': 'משתמשים',
  '/device-types': 'סוגי מכשירים',
  '/login': 'כניסה'
};

const ACTION_LABELS = {
  'chat_opened': 'פתיחת צ׳אט AI',
  'chat_message_sent': 'שליחת הודעה ב-AI',
};

// Format date in Israel timezone
function formatIsraelTime(dateStr, options = {}) {
  if (!dateStr) return '-';
  const defaults = { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' };
  return new Date(dateStr).toLocaleString('he-IL', { ...defaults, ...options });
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);
  const [refreshing, setRefreshing] = useState(false);

  // Events log state
  const [events, setEvents] = useState([]);
  const [eventsPagination, setEventsPagination] = useState(null);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsFilter, setEventsFilter] = useState({ type: '', deviceType: '' });

  const fetchOverview = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await analyticsAPI.getOverview({ days });
      setData(result.data);
    } catch (err) {
      setError(err.message || 'שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [days]);

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const params = { page: eventsPage, limit: 15 };
      if (eventsFilter.type) params.type = eventsFilter.type;
      if (eventsFilter.deviceType) params.deviceType = eventsFilter.deviceType;
      const result = await analyticsAPI.getEvents(params);
      setEvents(result.data);
      setEventsPagination(result.pagination);
    } catch {
      // silent
    } finally {
      setEventsLoading(false);
    }
  }, [eventsPage, eventsFilter]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);
  useEffect(() => { if (data) fetchEvents(); }, [fetchEvents, data]);

  const handleLogout = () => {
    sessionStorage.removeItem('analytics_admin_password');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9FAFB' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin mx-auto mb-4" style={{ borderTopColor: '#6B8E7B' }} />
          <p className="text-gray-500">טוען נתוני אנליטיקס...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F9FAFB' }}>
        <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8 max-w-md text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button onClick={() => fetchOverview()} className="px-6 py-2 rounded-xl text-white" style={{ backgroundColor: '#6B8E7B' }}>
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { kpis, dailyTrend, deviceBreakdown, topPages, topVisitors, hourlyHeatmap, roleBreakdown, browserBreakdown, chatUsage } = data;

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: '#F9FAFB' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ backgroundColor: '#E1EBE5' }}>
                <BarChart3 className="w-6 h-6" style={{ color: '#4A6B59' }} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">דשבורד אנליטיקס</h1>
                <p className="text-sm text-gray-500">
                  {data.period.days} ימים אחרונים
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Period Selector */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                {PERIOD_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDays(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      days === opt.value
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Refresh */}
              <button
                onClick={() => fetchOverview(true)}
                disabled={refreshing}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors"
                title="יציאה"
              >
                <LogOut className="w-5 h-5 text-gray-500 hover:text-red-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <KPIBox icon={Eye} label="סה״כ אירועים" value={kpis.totalEvents} color="#6B8E7B" bg="#F0F5F2" />
          <KPIBox icon={Wifi} label="מבקרים ייחודיים (IP)" value={kpis.uniqueVisitors} color="#3B82F6" bg="#EFF6FF" />
          <KPIBox icon={Fingerprint} label="מכשירים ייחודיים" value={kpis.uniqueDevices || 0} color="#8B5CF6" bg="#F5F3FF" />
          <KPIBox icon={Activity} label="סשנים ייחודיים" value={kpis.uniqueSessions} color="#F59E0B" bg="#FFFBEB" />
          <KPIBox icon={Zap} label="ממוצע אירועים/סשן" value={kpis.avgEventsPerSession} color="#EF4444" bg="#FEF2F2" />
        </div>

        {/* Daily Trend Chart */}
        <ChartCard title="מגמת שימוש יומית" subtitle={`${dailyTrend.length} ימים`} icon={Activity}>
          {dailyTrend.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6B8E7B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6B8E7B" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="colorActions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis
                    dataKey="_id"
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <Tooltip content={<DailyTooltip />} />
                  <Area type="monotone" dataKey="pageViews" stroke="#6B8E7B" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" name="צפיות" />
                  <Area type="monotone" dataKey="actions" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorActions)" name="פעולות" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState text="אין נתונים לתקופה זו" />}
        </ChartCard>

        {/* Two columns: Device + Top Pages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Device Type */}
          <ChartCard title="פילוח מכשירים" icon={Monitor}>
            {deviceBreakdown.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-1/2 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceBreakdown.map(d => ({
                          name: DEVICE_LABELS[d._id] || d._id,
                          value: d.count,
                          color: DEVICE_COLORS[d._id] || '#9CA3AF'
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {deviceBreakdown.map((d, i) => (
                          <Cell key={i} fill={DEVICE_COLORS[d._id] || '#9CA3AF'} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip total={deviceBreakdown.reduce((s, d) => s + d.count, 0)} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 space-y-2">
                  {deviceBreakdown.map((d) => {
                    const Icon = DEVICE_ICONS[d._id] || HelpCircle;
                    const total = deviceBreakdown.reduce((s, x) => s + x.count, 0);
                    const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                    return (
                      <div key={d._id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50">
                        <Icon className="w-5 h-5" style={{ color: DEVICE_COLORS[d._id] }} />
                        <span className="flex-1 text-sm text-gray-700">{DEVICE_LABELS[d._id] || d._id}</span>
                        <span className="font-bold text-gray-800">{d.count.toLocaleString('he-IL')}</span>
                        <span className="text-gray-400 text-sm">({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : <EmptyState text="אין נתונים" />}
          </ChartCard>

          {/* Top Pages */}
          <ChartCard title="עמודים פופולריים" icon={Globe}>
            {topPages.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topPages.slice(0, 10).map(p => ({
                      name: PAGE_LABELS[p._id] || p._id,
                      views: p.views,
                      visitors: p.uniqueVisitors
                    }))}
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <Tooltip content={<PageTooltip />} />
                    <Bar dataKey="views" fill="#6B8E7B" radius={[0, 6, 6, 0]} name="צפיות" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyState text="אין נתונים" />}
          </ChartCard>
        </div>

        {/* Two columns: Heatmap + Active Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Heatmap */}
          <ChartCard title="מפת חום - שעות פעילות" icon={Clock}>
            <HeatmapGrid data={hourlyHeatmap} />
          </ChartCard>

          {/* Top Visitors by IP */}
          <ChartCard title="מבקרים לפי IP" icon={Wifi}>
            {topVisitors && topVisitors.length > 0 ? (
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {topVisitors.map((v, i) => (
                  <div key={v._id} className="flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5" style={{ backgroundColor: i < 3 ? '#6B8E7B' : '#9CA3AF' }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono font-medium text-gray-800">{v._id}</p>
                        {v.userName && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">{v.userName}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-400">
                        <span>{v.sessionsCount} סשנים</span>
                        <span>{v.pagesVisited} עמודים</span>
                        {v.uniqueDevicesCount > 1 && (
                          <span className="text-purple-500 font-medium">{v.uniqueDevicesCount} מכשירים</span>
                        )}
                        <span>{v.devices?.filter(Boolean).map(d => DEVICE_LABELS[d] || d).join(', ')}</span>
                        <span>{v.browsers?.filter(Boolean).join(', ')}</span>
                      </div>
                      <div className="flex gap-x-3 mt-0.5 text-xs text-gray-400">
                        <span>ראשון: {formatIsraelTime(v.firstSeen)}</span>
                        <span>אחרון: {formatIsraelTime(v.lastSeen)}</span>
                      </div>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <span className="font-bold text-gray-700 text-lg">{v.events.toLocaleString('he-IL')}</span>
                      <p className="text-xs text-gray-400">אירועים</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState text="אין נתוני מבקרים" />}
          </ChartCard>
        </div>

        {/* Two columns: Role + Browser */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MiniPieChart
            title="פילוח לפי תפקיד"
            icon={Shield}
            data={roleBreakdown}
            colorMap={ROLE_COLORS}
            labelMap={ROLE_LABELS}
          />
          <MiniPieChart
            title="פילוח דפדפנים"
            icon={Globe}
            data={browserBreakdown}
            colorMap={{
              Chrome: '#4285F4',
              Safari: '#000000',
              Firefox: '#FF7139',
              Edge: '#0078D7',
              other: '#9CA3AF'
            }}
            labelMap={{}}
          />
        </div>

        {/* AI Chat Usage */}
        {chatUsage && chatUsage.length > 0 && (
          <ChartCard title="שימוש בצ׳אט AI" icon={MessageCircle}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(() => {
                const opened = chatUsage.find(c => c._id === 'chat_opened');
                const msgSent = chatUsage.find(c => c._id === 'chat_message_sent');
                const totalOpens = opened?.count || 0;
                const totalMessages = msgSent?.count || 0;
                const uniqueChatUsers = msgSent?.uniqueUsers || opened?.uniqueUsers || 0;
                const avgPerUser = uniqueChatUsers > 0 ? Math.round(totalMessages / uniqueChatUsers) : 0;
                return (
                  <>
                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-purple-700">{totalOpens.toLocaleString('he-IL')}</p>
                      <p className="text-sm text-purple-500 mt-1">פתיחות צ׳אט</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-blue-700">{totalMessages.toLocaleString('he-IL')}</p>
                      <p className="text-sm text-blue-500 mt-1">הודעות שנשלחו</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-green-700">{uniqueChatUsers.toLocaleString('he-IL')}</p>
                      <p className="text-sm text-green-500 mt-1">משתמשי AI ייחודיים</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-amber-700">{avgPerUser}</p>
                      <p className="text-sm text-amber-500 mt-1">הודעות/משתמש</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </ChartCard>
        )}

        {/* Events Log */}
        <ChartCard title="לוג אירועים" icon={Activity}>
          <div className="flex flex-wrap gap-2 mb-4">
            <select
              value={eventsFilter.type}
              onChange={(e) => { setEventsFilter(f => ({ ...f, type: e.target.value })); setEventsPage(1); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:outline-none"
              style={{ '--tw-ring-color': '#6B8E7B' }}
            >
              <option value="">כל הסוגים</option>
              <option value="page_view">צפיות</option>
              <option value="action">פעולות</option>
            </select>
            <select
              value={eventsFilter.deviceType}
              onChange={(e) => { setEventsFilter(f => ({ ...f, deviceType: e.target.value })); setEventsPage(1); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:outline-none"
              style={{ '--tw-ring-color': '#6B8E7B' }}
            >
              <option value="">כל המכשירים</option>
              <option value="desktop">מחשב</option>
              <option value="mobile">נייד</option>
              <option value="tablet">טאבלט</option>
            </select>
          </div>

          {eventsLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#6B8E7B' }} />
            </div>
          ) : events.length > 0 ? (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">זמן (IL)</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">סוג</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">עמוד</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">IP</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">משתמש</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">מכשיר</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">דפדפן</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => (
                      <tr key={ev._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-600 whitespace-nowrap">
                          {formatIsraelTime(ev.timestamp)}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            ev.type === 'page_view' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {ev.type === 'page_view' ? 'צפייה' : (ev.action?.startsWith('chat_') ? 'AI צ׳אט' : 'פעולה')}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-700">
                          {ev.type === 'action' && ev.action ? (ACTION_LABELS[ev.action] || ev.action) : (PAGE_LABELS[ev.page] || ev.page)}
                        </td>
                        <td className="py-2 px-3 text-gray-500 font-mono text-xs">{ev.ipAddress || '-'}</td>
                        <td className="py-2 px-3 text-gray-600">{ev.userName || 'אנונימי'}</td>
                        <td className="py-2 px-3 text-gray-600">{DEVICE_LABELS[ev.deviceType] || ev.deviceType}</td>
                        <td className="py-2 px-3 text-gray-600">{ev.browser}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-2">
                {events.map((ev) => (
                  <div key={ev._id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        ev.type === 'page_view' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {ev.type === 'page_view' ? 'צפייה' : (ev.action?.startsWith('chat_') ? 'AI צ׳אט' : 'פעולה')}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatIsraelTime(ev.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      {ev.type === 'action' && ev.action ? (ACTION_LABELS[ev.action] || ev.action) : (PAGE_LABELS[ev.page] || ev.page)}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">{ev.ipAddress || '-'}</p>
                    <p className="text-xs text-gray-500">{ev.userName || 'אנונימי'} · {DEVICE_LABELS[ev.deviceType] || ev.deviceType} · {ev.browser}</p>
                  </div>
                ))}
              </div>

              {eventsPagination && eventsPagination.pages > 1 && (
                <div className="mt-4">
                  <Pagination pagination={eventsPagination} onPageChange={setEventsPage} />
                </div>
              )}
            </>
          ) : <EmptyState text="אין אירועים שתואמים את הפילטר" />}
        </ChartCard>
      </div>
    </div>
  );
}

// ============ Sub-components ============

function KPIBox({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <div className="p-2 rounded-xl" style={{ backgroundColor: bg }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl md:text-3xl font-bold" style={{ color }}>
        {typeof value === 'number' ? value.toLocaleString('he-IL') : value}
      </p>
    </div>
  );
}

function ChartCard({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5" style={{ color: '#6B8E7B' }} />}
          <h3 className="text-base md:text-lg font-bold text-gray-800">{title}</h3>
        </div>
        {subtitle && <span className="text-sm text-gray-400">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex items-center justify-center py-10 text-gray-400">
      <p className="text-sm">{text}</p>
    </div>
  );
}

function DailyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = new Date(label);
  return (
    <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
      <p className="text-sm font-medium text-gray-800 mb-1">
        {d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}
      </p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm" style={{ color: p.stroke }}>
          {p.name}: <span className="font-bold">{p.value.toLocaleString('he-IL')}</span>
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
  return (
    <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
      <p className="font-semibold text-gray-800">{item.name}</p>
      <p className="text-gray-600">
        <span className="font-bold text-lg" style={{ color: item.color || item.fill }}>{item.value.toLocaleString('he-IL')}</span>
        {' '}({pct}%)
      </p>
    </div>
  );
}

function PageTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
      <p className="font-semibold text-gray-800">{d.name}</p>
      <p className="text-sm text-gray-600">
        צפיות: <span className="font-bold">{d.views.toLocaleString('he-IL')}</span>
      </p>
      <p className="text-sm text-gray-600">
        מבקרים ייחודיים: <span className="font-bold">{d.visitors.toLocaleString('he-IL')}</span>
      </p>
    </div>
  );
}

function HeatmapGrid({ data }) {
  if (!data || data.length === 0) return <EmptyState text="אין נתוני פעילות" />;

  // Build a 7x24 matrix
  const matrix = {};
  let maxCount = 0;
  data.forEach(({ _id, count }) => {
    const key = `${_id.dayOfWeek}-${_id.hour}`;
    matrix[key] = count;
    if (count > maxCount) maxCount = count;
  });

  const getColor = (count) => {
    if (!count || count === 0) return '#F3F4F6';
    const intensity = count / maxCount;
    if (intensity < 0.25) return '#E1EBE5';
    if (intensity < 0.5) return '#A5C3B1';
    if (intensity < 0.75) return '#6B8E7B';
    return '#3A5547';
  };

  // Show hours 6-23, 0-5 (typical usage)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  // dayOfWeek: 1=Sunday...7=Saturday
  const days = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        {/* Hour labels */}
        <div className="flex mr-16 mb-1">
          {hours.filter((_, i) => i % 3 === 0).map(h => (
            <div key={h} className="text-xs text-gray-400 text-center" style={{ width: `${(3 / 24) * 100}%` }}>
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {days.map(day => (
          <div key={day} className="flex items-center gap-1 mb-1">
            <span className="w-14 text-xs text-gray-500 text-left flex-shrink-0">{DAY_NAMES[day - 1]}</span>
            <div className="flex-1 flex gap-0.5">
              {hours.map(hour => {
                const count = matrix[`${day}-${hour}`] || 0;
                return (
                  <div
                    key={hour}
                    className="flex-1 h-6 rounded-sm cursor-pointer transition-transform hover:scale-110"
                    style={{ backgroundColor: getColor(count), minWidth: '12px' }}
                    title={`${DAY_NAMES[day - 1]} ${String(hour).padStart(2, '0')}:00 - ${count} אירועים`}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 mr-16">
          <span className="text-xs text-gray-400">פחות</span>
          {['#F3F4F6', '#E1EBE5', '#A5C3B1', '#6B8E7B', '#3A5547'].map(color => (
            <div key={color} className="w-4 h-4 rounded-sm" style={{ backgroundColor: color }} />
          ))}
          <span className="text-xs text-gray-400">יותר</span>
        </div>
      </div>
    </div>
  );
}

function MiniPieChart({ title, icon: Icon, data, colorMap, labelMap }) {
  if (!data || data.length === 0) {
    return (
      <ChartCard title={title} icon={Icon}>
        <EmptyState text="אין נתונים" />
      </ChartCard>
    );
  }

  const total = data.reduce((s, d) => s + d.count, 0);
  const chartData = data.map(d => ({
    name: labelMap[d._id] || d._id || 'לא ידוע',
    value: d.count,
    color: colorMap[d._id] || '#9CA3AF'
  }));

  return (
    <ChartCard title={title} icon={Icon}>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-full sm:w-1/2 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip total={total} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full sm:w-1/2 space-y-1.5">
          {chartData.map((d) => {
            const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
            return (
              <div key={d.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="flex-1 text-sm text-gray-700 truncate">{d.name}</span>
                <span className="font-semibold text-gray-800 text-sm">{d.value.toLocaleString('he-IL')}</span>
                <span className="text-gray-400 text-xs">({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
}
