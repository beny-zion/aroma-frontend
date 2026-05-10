'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { scheduleAPI } from '@/lib/api';
import { useTechnicians, useInvalidate } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
  closestCenter
} from '@dnd-kit/core';
import {
  CalendarDays, Sparkles, Save, MapPin, Navigation, AlertCircle,
  Building2, Loader2, Settings as SettingsIcon, ChevronDown, ChevronUp,
  CheckCircle, ExternalLink, GripVertical, Bookmark, Lock
} from 'lucide-react';
import Link from 'next/link';

const DAY_NAMES_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function toLocalDateString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function thisOrNextSunday(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = (7 - d.getDay()) % 7;
  d.setDate(d.getDate() + diff);
  return toLocalDateString(d);
}

function formatDateShort(isoDate) {
  const [, m, d] = String(isoDate).split('-').map(Number);
  return `${d}/${m}`;
}

// Deterministic pastel color per city (same city = same color across renders)
function cityColors(city) {
  if (!city) return { bg: '#F9FAFB', accent: '#D1D5DB' };
  let hash = 0;
  for (let i = 0; i < city.length; i++) {
    hash = (hash * 31 + city.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return {
    bg: `hsl(${hue}, 70%, 96%)`,    // very soft pastel for card background
    accent: `hsl(${hue}, 55%, 60%)`, // saturated accent for the side bar
    chip: `hsl(${hue}, 50%, 88%)`    // medium for the city chip background
  };
}

// Build Google Maps multi-stop URL from a list of branches
function buildRouteUrl(branches) {
  const addresses = branches
    .map(b => [b.address, b.city].filter(Boolean).join(', '))
    .filter(Boolean);
  if (addresses.length === 0) return null;
  if (addresses.length === 1) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addresses[0])}`;
  }
  const destination = encodeURIComponent(addresses[addresses.length - 1]);
  const waypoints = addresses
    .slice(0, -1)
    .map(a => encodeURIComponent(a))
    .join('|');
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
}

// Group blocks within a single day by city, preserving order
function groupBlocksByCity(blocks) {
  const map = new Map();
  for (const blk of blocks) {
    if (!map.has(blk.city)) map.set(blk.city, []);
    map.get(blk.city).push(blk);
  }
  return [...map.entries()].map(([city, blocks]) => ({ city, blocks }));
}

function CityGroupHandle({ city, blocks, dayDate, isOverlay = false }) {
  const colors = cityColors(city);
  const totalBranches = blocks.reduce((s, b) => s + b.branches.length, 0);
  const totalDevices = blocks.reduce((s, b) => s + b.devicesCount, 0);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `city-group:${city}:${dayDate}`,
    data: { type: 'city-group', city, sourceDayDate: dayDate }
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing border-2 transition-all ${
        isDragging ? 'opacity-30' : 'hover:shadow-md'
      } ${isOverlay ? 'shadow-xl rotate-1' : ''}`}
      style={{
        backgroundColor: colors.chip,
        borderColor: colors.accent,
        touchAction: 'none'
      }}
    >
      <GripVertical className="w-4 h-4 shrink-0" style={{ color: colors.accent }} />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-gray-800 truncate">
          {city}
        </div>
        <div className="text-xs text-gray-700">
          {blocks.length} אזורים · {totalBranches} סניפים · {totalDevices} מכשירים
        </div>
      </div>
    </div>
  );
}

function BlockCard({ block, expanded, onToggle, isOverlay = false }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: block.id,
    data: block
  });
  const colors = cityColors(block.city);
  const isExisting = !!block.existingWorkOrderId;

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border transition-all overflow-hidden ${
        isDragging ? 'opacity-30' : 'hover:shadow-md'
      } ${isOverlay ? 'shadow-xl rotate-2' : ''}`}
      style={{
        borderColor: 'var(--color-border-light)',
        backgroundColor: colors.bg,
        borderRightWidth: '4px',
        borderRightColor: colors.accent,
        borderStyle: isExisting ? 'solid' : 'dashed'
      }}
      title={isExisting ? 'הזמנה קיימת — שינוי יעדכן את ההזמנה' : 'בלוק חדש — שמירה תיצור הזמנה חדשה'}
    >
      <div
        {...listeners}
        {...attributes}
        className="p-3 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              {isExisting && (
                <Bookmark className="w-3.5 h-3.5 shrink-0" style={{ color: colors.accent }} />
              )}
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium text-gray-800 truncate max-w-[120px]"
                style={{ backgroundColor: colors.chip }}
              >
                {block.city}
              </span>
              {block.region && (
                <span className="text-xs text-gray-600 truncate">{block.region}</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {block.branches.length} סניפים
              </span>
              <span className="flex items-center gap-1 font-medium" style={{ color: colors.accent }}>
                {block.devicesCount} מכשירים
              </span>
            </div>
          </div>
          {!isOverlay && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="shrink-0 p-1 rounded hover:bg-white/60"
              aria-label={expanded ? 'כווץ' : 'הרחב'}
            >
              {expanded ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
            </button>
          )}
        </div>
      </div>
      {expanded && !isOverlay && (
        <div className="border-t px-3 py-2 space-y-1 bg-white/60" style={{ borderColor: 'var(--color-border-light)' }}>
          {block.branches.map(b => (
            <div key={b.branchId} className="text-xs text-gray-700 flex items-center justify-between gap-2 py-1">
              <span className="truncate">{b.branchName}</span>
              <span className="text-gray-400 shrink-0">{b.devicesCount} מכשירים</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Maps holiday types to badge colors
const HOLIDAY_STYLES = {
  chag:           { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5', label: 'חג' },
  modern_holiday: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD', label: 'יום זיכרון/עצמאות' },
  erev_chag:      { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D', label: 'ערב חג' },
  chol_hamoed:    { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D', label: "חוה\"מ" },
  fast_major:     { bg: '#F3E8FF', text: '#6B21A8', border: '#D8B4FE', label: 'צום' },
  fast_minor:     { bg: '#F3E8FF', text: '#6B21A8', border: '#D8B4FE', label: 'צום קל' },
  modern:         { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB', label: '' },
  minor:          { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB', label: '' },
};

function DayColumn({ day, technicians, cap, onTechChange, onPlanRoute, expandedBlockIds, onToggleBlock, isOver }) {
  const { setNodeRef } = useDroppable({ id: day.date });
  const branchesCount = day.blocks.reduce((s, b) => s + b.branches.length, 0);
  const isFull = branchesCount >= cap;
  const isOverCap = branchesCount > cap;
  const allBranches = day.blocks.flatMap(b => b.branches);
  const holiday = day.holiday;
  const holidayStyle = holiday ? HOLIDAY_STYLES[holiday.type] || HOLIDAY_STYLES.minor : null;
  const isBlocked = holiday?.isWorkBlocked;

  return (
    <div
      className="flex flex-col rounded-2xl border"
      style={{
        backgroundColor: isBlocked ? '#FEF2F2' : '#F9FAFB',
        borderColor: isOver ? 'var(--color-primary)' : (isBlocked ? '#FCA5A5' : 'var(--color-border-light)'),
        minHeight: '500px',
        boxShadow: isOver ? '0 0 0 2px var(--color-primary-100)' : 'none'
      }}
    >
      <div className="p-3 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="font-bold text-gray-800">{DAY_NAMES_HE[day.dayOfWeek]}</div>
            <div className="text-xs text-gray-500">{formatDateShort(day.date)}</div>
          </div>
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              isOverCap ? 'bg-red-100 text-red-700' : isFull ? 'bg-amber-100 text-amber-700' : 'bg-white border text-gray-600'
            }`}
          >
            {branchesCount}/{cap}
          </span>
        </div>
        {holiday && (
          <div
            className="text-xs px-2 py-1.5 rounded-lg border mb-2 font-medium text-center"
            style={{
              backgroundColor: holidayStyle.bg,
              color: holidayStyle.text,
              borderColor: holidayStyle.border
            }}
            title={isBlocked ? 'יום חג — לא נשבץ אוטומטית' : holidayStyle.label}
          >
            {holiday.name}
            {isBlocked && <span className="block text-[10px] opacity-80 mt-0.5">לא נשבץ אוטומטית</span>}
          </div>
        )}
        <select
          value={day.assignedTo || ''}
          onChange={(e) => onTechChange(day.date, e.target.value || null)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-(--color-primary)"
        >
          <option value="">ללא טכנאי</option>
          {technicians.map(t => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>
        {day.assignedTo && allBranches.length > 0 && (
          <button
            onClick={() => onPlanRoute(allBranches)}
            className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Navigation className="w-3.5 h-3.5" />
            תכנן מסלול
          </button>
        )}
      </div>

      <div ref={setNodeRef} className="flex-1 p-2 space-y-3 overflow-y-auto" style={{ minHeight: '200px' }}>
        {day.blocks.length === 0 ? (
          <div className="text-center text-xs text-gray-400 py-8">גרור עיר לכאן</div>
        ) : (
          groupBlocksByCity(day.blocks).map(group => (
            <div key={group.city} className="space-y-2">
              {group.blocks.length > 1 && (
                <CityGroupHandle city={group.city} blocks={group.blocks} dayDate={day.date} />
              )}
              {group.blocks.map(block => (
                <BlockCard
                  key={block.id}
                  block={block}
                  expanded={expandedBlockIds.has(block.id)}
                  onToggle={() => onToggleBlock(block.id)}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { technicians } = useTechnicians();
  const { invalidateWorkOrders } = useInvalidate();

  const [startDate, setStartDate] = useState(() => thisOrNextSunday());
  const [daysAhead, setDaysAhead] = useState(30);
  const [maxBranchesPerDay, setMaxBranchesPerDay] = useState(30);

  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState([]);
  const [overflow, setOverflow] = useState([]);
  const [summary, setSummary] = useState(null);

  const [activeBlock, setActiveBlock] = useState(null);
  const [activeCityGroup, setActiveCityGroup] = useState(null); // { city, blocks }
  const [overDay, setOverDay] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedBlockIds, setExpandedBlockIds] = useState(new Set());
  const [savedSummary, setSavedSummary] = useState(null); // { count } after save

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  if (!authLoading && user && !['admin', 'manager'].includes(user.role)) {
    router.replace('/');
    return null;
  }

  async function handleSuggest() {
    try {
      setLoading(true);
      const result = await scheduleAPI.suggest({
        startDate,
        daysCount: 5,
        daysAhead: Number(daysAhead),
        maxBranchesPerDay: Number(maxBranchesPerDay)
      });
      setDays(result.days || []);
      setOverflow(result.overflow || []);
      setSummary(result.summary || null);
      setExpandedBlockIds(new Set());
    } catch (err) {
      alert(err.message || 'שגיאה בקבלת הצעת מסלול');
    } finally {
      setLoading(false);
    }
  }

  function findBlockLocation(blockId) {
    for (let i = 0; i < days.length; i++) {
      const idx = days[i].blocks.findIndex(b => b.id === blockId);
      if (idx !== -1) return { source: 'day', dayIdx: i, idx };
    }
    const overflowIdx = overflow.findIndex(b => b.id === blockId);
    if (overflowIdx !== -1) return { source: 'overflow', idx: overflowIdx };
    return null;
  }

  function handleDragStart(event) {
    const data = event.active?.data?.current;
    if (data?.type === 'city-group') {
      const sourceDay = days.find(d => d.date === data.sourceDayDate);
      if (sourceDay) {
        const cityBlocks = sourceDay.blocks.filter(b => b.city === data.city);
        setActiveCityGroup({ city: data.city, blocks: cityBlocks });
      }
    } else if (data) {
      setActiveBlock(data);
    }
  }

  function handleDragOver(event) {
    setOverDay(event.over?.id || null);
  }

  function handleDragEnd(event) {
    setOverDay(null);
    setActiveBlock(null);
    setActiveCityGroup(null);

    const targetDate = event.over?.id;
    const data = event.active?.data?.current;
    if (!targetDate || !data) return;

    // City-group drag: move all blocks of the same city from source day → target day
    if (data.type === 'city-group') {
      if (data.sourceDayDate === targetDate) return;
      const targetDay = days.find(d => d.date === targetDate);
      if (targetDay?.holiday?.isWorkBlocked) {
        if (!confirm(`היום הזה הוא ${targetDay.holiday.name}. בטוח להעביר לכאן?`)) return;
      }
      setDays(prev => {
        const next = prev.map(d => ({ ...d, blocks: [...d.blocks] }));
        const sourceDay = next.find(d => d.date === data.sourceDayDate);
        const targetDay = next.find(d => d.date === targetDate);
        if (!sourceDay || !targetDay) return prev;
        const moving = sourceDay.blocks.filter(b => b.city === data.city);
        sourceDay.blocks = sourceDay.blocks.filter(b => b.city !== data.city);
        targetDay.blocks.push(...moving);
        targetDay.blocks.sort((a, b) => a.city.localeCompare(b.city, 'he'));
        return next;
      });
      return;
    }

    // Single-block drag (existing behavior)
    const blockId = event.active?.id;
    const loc = findBlockLocation(blockId);
    if (!loc) return;

    const block = loc.source === 'day' ? days[loc.dayIdx].blocks[loc.idx] : overflow[loc.idx];

    const targetDay = days.find(d => d.date === targetDate);
    if (targetDay?.holiday?.isWorkBlocked) {
      if (!confirm(`היום הזה הוא ${targetDay.holiday.name}. בטוח להעביר לכאן?`)) return;
    }

    setDays(prev => {
      const next = prev.map(d => ({ ...d, blocks: [...d.blocks] }));
      if (loc.source === 'day') {
        next[loc.dayIdx].blocks.splice(loc.idx, 1);
      }
      const targetDay = next.find(d => d.date === targetDate);
      if (targetDay) {
        targetDay.blocks.push(block);
        targetDay.blocks.sort((a, b) => a.city.localeCompare(b.city, 'he'));
      }
      return next;
    });

    if (loc.source === 'overflow') {
      setOverflow(prev => prev.filter(b => b.id !== blockId));
    }
  }

  function handleTechChange(date, techId) {
    setDays(prev => prev.map(d => d.date === date ? { ...d, assignedTo: techId } : d));
  }

  function handlePlanRoute(branches) {
    const url = buildRouteUrl(branches);
    if (!url) {
      alert('אין כתובות לסניפים ביום זה');
      return;
    }
    window.open(url, '_blank');
  }

  function toggleBlock(id) {
    setExpandedBlockIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    const totalBranches = days.reduce((s, d) => s + d.blocks.reduce((ss, b) => ss + b.branches.length, 0), 0);
    if (totalBranches === 0) {
      alert('אין סניפים לשמירה');
      return;
    }
    if (!confirm(`לשמור את המסלול? (${totalBranches} סניפים)`)) return;
    try {
      setSaving(true);
      const result = await scheduleAPI.save({ days });
      invalidateWorkOrders();
      setSavedSummary({
        count: result.count ?? 0,
        created: result.created ?? 0,
        updated: result.updated ?? 0,
        message: result.message
      });
    } catch (err) {
      alert(err.message || 'שגיאה בשמירת המסלול');
    } finally {
      setSaving(false);
    }
  }

  function dismissSavedBanner() {
    setSavedSummary(null);
  }

  function startNewPlanning() {
    setSavedSummary(null);
    handleSuggest();
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-50)' }}>
            <CalendarDays className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">מסלול שבועי</h1>
            <p className="text-gray-500 mt-1 text-sm">חלוקה לפי עיר ואזור — גרור ערים בין ימים</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-3 py-2 border rounded-xl text-sm hover:bg-gray-50"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            <SettingsIcon className="w-4 h-4" />
            הגדרות
          </button>
          <button
            onClick={handleSuggest}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50"
            style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            צור הצעה
          </button>
          <button
            onClick={handleSave}
            disabled={saving || days.every(d => d.blocks.length === 0)}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'שומר...' : 'שמור מסלול'}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="card grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">תאריך התחלה (ראשון)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">לכלול מכשירים שצריכים מילוי בתוך</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={daysAhead}
                onChange={(e) => setDaysAhead(e.target.value)}
                min={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-(--color-primary)"
              />
              <span className="text-sm text-gray-500">ימים</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">מקסימום סניפים ליום</label>
            <input
              type="number"
              value={maxBranchesPerDay}
              onChange={(e) => setMaxBranchesPerDay(e.target.value)}
              min={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>
        </div>
      )}

      {/* Saved banner */}
      {savedSummary && (
        <div className="card flex flex-col sm:flex-row items-start sm:items-center gap-3 border-2" style={{ borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary-50)' }}>
          <CheckCircle className="w-6 h-6 shrink-0" style={{ color: 'var(--color-primary)' }} />
          <div className="flex-1">
            <div className="font-bold text-gray-800">{savedSummary.message || 'המסלול נשמר'}</div>
            <div className="text-sm text-gray-600 mt-0.5">
              {savedSummary.created > 0 && <span>{savedSummary.created} הזמנות חדשות נוצרו. </span>}
              {savedSummary.updated > 0 && <span>{savedSummary.updated} הזמנות קיימות עודכנו (תאריך/טכנאי). </span>}
              לראות את כולן בעמוד "הזמנות עבודה".
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/work-orders"
              className="flex items-center gap-1.5 px-3 py-2 border rounded-xl text-sm hover:bg-white"
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
            >
              <ExternalLink className="w-4 h-4" />
              להזמנות עבודה
            </Link>
            <button
              onClick={startNewPlanning}
              className="px-3 py-2 rounded-xl text-sm text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              תכנן מסלול חדש
            </button>
            <button
              onClick={dismissSavedBanner}
              className="px-2 py-2 text-sm text-gray-500 hover:text-gray-700"
              aria-label="סגור"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="card flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span>{summary.totalBlocks} בלוקים</span>
          </div>
          {summary.existingBlocks > 0 && (
            <>
              <div className="text-gray-400">·</div>
              <div className="flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-gray-500" />
                <span>{summary.existingBlocks} כבר משובצים</span>
              </div>
            </>
          )}
          {summary.newBlocks > 0 && (
            <>
              <div className="text-gray-400">·</div>
              <div>{summary.newBlocks} חדשים</div>
            </>
          )}
          <div className="text-gray-400">·</div>
          <div>{summary.totalDevices} מכשירים</div>
          {summary.overflowBlocks > 0 && (
            <>
              <div className="text-gray-400">·</div>
              <div className="flex items-center gap-1.5 text-amber-700">
                <AlertCircle className="w-4 h-4" />
                {summary.overflowBlocks} לא נכנסו
              </div>
            </>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && days.length === 0 && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--color-primary-50)' }}>
            <Sparkles className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
          </div>
          <p className="font-medium text-gray-800">לחצי "צור הצעה" כדי להתחיל</p>
          <p className="text-sm text-gray-500 mt-2">המערכת תקבץ את הסניפים לפי עיר ואזור</p>
        </div>
      )}

      {/* Kanban */}
      {days.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => { setActiveBlock(null); setActiveCityGroup(null); setOverDay(null); }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {days.map(day => (
              <DayColumn
                key={day.date}
                day={day}
                technicians={technicians}
                cap={Number(maxBranchesPerDay)}
                onTechChange={handleTechChange}
                onPlanRoute={handlePlanRoute}
                expandedBlockIds={expandedBlockIds}
                onToggleBlock={toggleBlock}
                isOver={overDay === day.date}
              />
            ))}
          </div>

          <DragOverlay>
            {activeCityGroup ? (
              <CityGroupHandle city={activeCityGroup.city} blocks={activeCityGroup.blocks} dayDate="overlay" isOverlay />
            ) : activeBlock ? (
              <BlockCard block={activeBlock} expanded={false} onToggle={() => {}} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Overflow */}
      {overflow.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-gray-800">לא נכנסו במסלול ({overflow.length})</h3>
          </div>
          <p className="text-sm text-gray-500 mb-3">בלוקים אלה לא נכנסו לשבוע. אפשר להגדיל את המגבלה היומית או להשאיר לשבוע הבא.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {overflow.map(b => {
              const c = cityColors(b.city);
              return (
                <div
                  key={b.id}
                  className="p-3 border rounded-xl"
                  style={{
                    backgroundColor: c.bg,
                    borderColor: 'var(--color-border-light)',
                    borderRightWidth: '4px',
                    borderRightColor: c.accent
                  }}
                >
                  <div className="font-medium text-sm">{b.label}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{b.branches.length} סניפים · {b.devicesCount} מכשירים</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
