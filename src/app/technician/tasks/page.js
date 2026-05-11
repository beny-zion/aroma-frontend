'use client';

import { useState, useRef } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { workOrdersAPI, serviceLogsAPI } from '@/lib/api';
import { useInvalidate, useScents } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import { uploadImage, thumbnailUrl } from '@/lib/cloudinary';
import {
  ClipboardList, MapPin, Clock, CheckCircle, Play,
  ChevronDown, ChevronUp, Phone, Navigation, Droplets,
  Camera, X as XIcon, AlertTriangle
} from 'lucide-react';

const statusLabels = {
  pending: 'ממתין', assigned: 'שובץ', in_progress: 'בביצוע',
  completed: 'הושלם', cancelled: 'בוטל'
};
const statusColors = {
  pending: 'bg-gray-100 text-gray-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
};
const priorityColors = {
  low: 'border-gray-200',
  medium: 'border-blue-200',
  high: 'border-amber-300',
  urgent: 'border-red-400 bg-red-50/30'
};
const typeLabels = {
  routine_refill: 'מילוי שוטף', repair: 'תיקון',
  installation: 'התקנה', removal: 'הסרה', complaint: 'תלונה'
};

export default function TechnicianTasksPage() {
  const { user } = useAuth();
  const { scents } = useScents();
  const { invalidateWorkOrders, invalidateDevices, invalidateScents, invalidateServiceLogs } = useInvalidate();
  const [filter, setFilter] = useState('active');
  const [expandedTask, setExpandedTask] = useState(null);
  // Region collapse state — keys "dateKey|city|region". Today's regions auto-expand.
  const [collapsedRegions, setCollapsedRegions] = useState(new Set());
  function toggleRegion(key) {
    setCollapsedRegions(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }
  const [completionNotes, setCompletionNotes] = useState('');
  const [activeFillKey, setActiveFillKey] = useState(null);
  const [fillForm, setFillForm] = useState({ scentId: '', mlFilled: '', notes: '', images: [] });
  const [savingFill, setSavingFill] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [completionModal, setCompletionModal] = useState(null);
  const [completionSaving, setCompletionSaving] = useState(false);

  const statusParam = filter === 'active' ? 'assigned,in_progress' : filter === 'completed' ? 'completed' : '';
  const swrKey = statusParam ? `/work-orders/my?status=${statusParam}` : '/work-orders/my';
  const { data: taskData, isLoading: loading } = useSWR(swrKey);
  const tasks = taskData?.data || [];

  async function handleStartTask(taskId) {
    try {
      await workOrdersAPI.updateStatus(taskId, 'in_progress');
      invalidateWorkOrders();
      toast.success('המשימה התחילה');
    } catch (err) { toast.error(err.message || 'שגיאה'); }
  }

  function openFillForm(task, deviceIdx) {
    const device = task.devices[deviceIdx];
    const fullDevice = device.deviceId;
    setFillForm({
      scentId: fullDevice?.scentId?._id || fullDevice?.scentId || '',
      mlFilled: fullDevice?.mlPerRefill?.toString() || '100',
      notes: '', images: []
    });
    setActiveFillKey(`${task._id}-${deviceIdx}`);
  }
  function cancelFillForm() {
    setActiveFillKey(null);
    setFillForm({ scentId: '', mlFilled: '', notes: '', images: [] });
  }

  async function handleImageCapture(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    e.target.value = '';
    try {
      setUploadingImage(true);
      const urls = await Promise.all(files.map(uploadImage));
      setFillForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (err) { toast.error(err.message || 'שגיאה בהעלאת תמונה'); }
    finally { setUploadingImage(false); }
  }
  function removeImage(idx) {
    setFillForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  }

  async function handleRefillDevice(task, deviceIdx) {
    const taskDevice = task.devices[deviceIdx];
    const deviceId = taskDevice.deviceId?._id || taskDevice.deviceId;
    if (!deviceId || !fillForm.mlFilled) { toast.error('יש להזין כמות מילוי'); return; }

    try {
      setSavingFill(true);
      await serviceLogsAPI.create({
        deviceId,
        mlFilled: parseInt(fillForm.mlFilled),
        scentId: fillForm.scentId || undefined,
        technicianName: user?.name,
        technicianNotes: fillForm.notes || undefined,
        images: fillForm.images,
        date: new Date().toISOString()
      });
      if (task.status === 'assigned') {
        await workOrdersAPI.updateStatus(task._id, 'in_progress');
      }
      const normalizedDevices = task.devices.map((d, idx) => ({
        deviceId: d.deviceId?._id || d.deviceId,
        taskDescription: d.taskDescription,
        isCompleted: idx === deviceIdx ? true : !!d.isCompleted
      }));
      await workOrdersAPI.update(task._id, { devices: normalizedDevices });
      cancelFillForm();
      invalidateWorkOrders(); invalidateDevices(); invalidateScents(); invalidateServiceLogs();
      toast.success('המילוי נרשם');
    } catch (err) { toast.error(err.message || 'שגיאה ברישום מילוי'); }
    finally { setSavingFill(false); }
  }

  function handleCompleteTaskClick(task) {
    const unfilled = (task.devices || []).filter(d => !d.isCompleted);
    if (unfilled.length === 0) { finalizeCompletion(task, { followupDays: 0 }); return; }
    setCompletionModal({ task, unfilled });
  }

  async function finalizeCompletion(task, { followupDays }) {
    try {
      setCompletionSaving(true);
      const result = await workOrdersAPI.updateStatus(task._id, 'completed', {
        completionNotes: completionNotes || undefined,
        followupDays: followupDays || undefined
      });
      setCompletionNotes('');
      setExpandedTask(null);
      setCompletionModal(null);
      invalidateWorkOrders();
      toast.success(result.followupOrderId ? (result.message || 'נוצרה הזמנת המשך') : 'המשימה הושלמה');
    } catch (err) { toast.error(err.message || 'שגיאה'); }
    finally { setCompletionSaving(false); }
  }

  function buildAddressString(branch) {
    if (!branch) return '';
    return [branch.address, branch.city].filter(Boolean).join(', ');
  }
  function openNavigation(branch) {
    const address = buildAddressString(branch);
    if (!address) { toast.error('כתובת חסרה'); return; }
    window.open(`https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`, '_blank');
  }
  function startOfToday() {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }
  function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return 'היום';
    if (d.toDateString() === tomorrow.toDateString()) return 'מחר';
    return d.toLocaleDateString('he-IL', { weekday: 'short', day: '2-digit', month: '2-digit' });
  }
  function groupByDate(tasks) {
    const groups = new Map();
    for (const task of tasks) {
      const taskDate = new Date(task.scheduledDate);
      taskDate.setHours(0, 0, 0, 0);
      const dateKey = taskDate.toDateString();
      if (!groups.has(dateKey)) {
        groups.set(dateKey, {
          label: formatDate(task.scheduledDate),
          dateKey,
          dateMs: taskDate.getTime(),
          tasks: []
        });
      }
      groups.get(dateKey).tasks.push(task);
    }
    // Order: today first, then future ascending, then overdue descending (most recent past first)
    const todayMs = startOfToday().getTime();
    const arr = [...groups.values()];
    arr.sort((a, b) => {
      const aIsTodayOrFuture = a.dateMs >= todayMs;
      const bIsTodayOrFuture = b.dateMs >= todayMs;
      if (aIsTodayOrFuture && !bIsTodayOrFuture) return -1;
      if (!aIsTodayOrFuture && bIsTodayOrFuture) return 1;
      // both same side
      return aIsTodayOrFuture ? a.dateMs - b.dateMs : b.dateMs - a.dateMs;
    });
    // Mark overdue groups so we can label them visually
    return arr.map(g => ({ ...g, isOverdue: g.dateMs < todayMs }));
  }

  // Within a single day, group tasks by city+region for collapsible rows
  function groupByRegion(tasks) {
    const map = new Map();
    for (const t of tasks) {
      const city = t.branchId?.city || 'ללא עיר';
      const region = t.branchId?.region || '';
      const key = `${city}::${region}`;
      if (!map.has(key)) map.set(key, { city, region, tasks: [] });
      map.get(key).tasks.push(t);
    }
    // Sort regions alphabetically by city, then region
    return [...map.values()].sort((a, b) => {
      const c = a.city.localeCompare(b.city, 'he');
      return c !== 0 ? c : a.region.localeCompare(b.region, 'he');
    });
  }

  const grouped = groupByDate(tasks);
  const activeCount = tasks.filter(t => ['assigned', 'in_progress'].includes(t.status)).length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">טוען משימות...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Compact mobile header */}
      <header>
        <h1 className="text-xl font-bold">שלום {user?.name?.split(' ')[0]}</h1>
        <p className="text-sm text-muted-foreground">{activeCount} משימות פתוחות</p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card border rounded-xl py-3 text-center">
          <div className="text-2xl font-bold text-primary">{activeCount}</div>
          <div className="text-[11px] text-muted-foreground">פתוחות</div>
        </div>
        <div className="bg-card border rounded-xl py-3 text-center">
          <div className="text-2xl font-bold text-amber-600">{inProgressCount}</div>
          <div className="text-[11px] text-muted-foreground">בביצוע</div>
        </div>
        <div className="bg-card border rounded-xl py-3 text-center">
          <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          <div className="text-[11px] text-muted-foreground">הושלמו</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted">
        {[
          { key: 'active', label: 'פתוחות' },
          { key: 'completed', label: 'הושלמו' },
          { key: 'all', label: 'הכל' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              filter === tab.key ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'
            }`}
          >{tab.label}</button>
        ))}
      </div>

      {/* Task Groups */}
      {grouped.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">אין משימות להצגה</p>
        </div>
      ) : (
        grouped.map((group, gIdx) => {
          const regions = groupByRegion(group.tasks);
          const isToday = group.label === 'היום';
          return (
          <div key={gIdx} className="space-y-2">
            <h3 className={`text-xs font-bold px-1 flex items-center gap-2 ${
              group.isOverdue ? 'text-red-700' : isToday ? 'text-primary' : 'text-muted-foreground'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                group.isOverdue ? 'bg-red-500' : isToday ? 'bg-primary' : 'bg-muted-foreground/40'
              }`}></span>
              {group.label}
              {group.isOverdue && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700 ms-1">פיגור</span>}
              <span className="text-muted-foreground/70 font-normal ms-auto font-tabular">
                {group.tasks.length} סניפים · {regions.length} אזורים
              </span>
            </h3>

            {regions.map((region) => {
              const regionKey = `${group.dateKey}|${region.city}|${region.region}`;
              // Today's regions auto-expand; other days collapse by default
              const isCollapsed = isToday ? collapsedRegions.has(regionKey) : !collapsedRegions.has(regionKey);
              const totalDevices = region.tasks.reduce((s, t) => s + (t.devices?.length || 0), 0);
              const doneDevices = region.tasks.reduce(
                (s, t) => s + (t.devices?.filter(d => d.isCompleted).length || 0), 0
              );
              const allBranchesDone = region.tasks.every(t => t.status === 'completed');
              return (
                <div key={regionKey} className="bg-muted/30 rounded-xl">
                  <button
                    type="button"
                    onClick={() => toggleRegion(regionKey)}
                    className="w-full px-3 py-2 flex items-center gap-2 text-right"
                  >
                    <MapPin className={`w-4 h-4 shrink-0 ${allBranchesDone ? 'text-green-600' : 'text-primary'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {region.region ? `${region.city} · ${region.region}` : region.city}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-tabular">
                        {region.tasks.length} סניפים · {doneDevices}/{totalDevices} מכשירים
                      </div>
                    </div>
                    {isCollapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>

                  {!isCollapsed && (
                    <div className="px-2 pb-2 space-y-2">
            {region.tasks.map((task) => {
              const isExpanded = expandedTask === task._id;
              return (
                <div
                  key={task._id}
                  className={`bg-card rounded-xl border-r-4 ${priorityColors[task.priority]} border p-3 shadow-sm transition-all`}
                >
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpandedTask(isExpanded ? null : task._id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-sm truncate">{task.branchId?.branchName || '-'}</h4>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${statusColors[task.status]}`}>
                          {statusLabels[task.status]}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{task.branchId?.customerId?.name || ''}</p>
                      <div className="flex flex-wrap gap-2 mt-1.5 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {task.branchId?.city || ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.devices?.length || 0} מכשירים
                        </span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        {task.branchId?.contactPhone && (
                          <a
                            href={`tel:${task.branchId.contactPhone}`}
                            className="flex items-center gap-1.5 p-2 bg-blue-50 rounded-lg text-blue-700 text-xs font-medium"
                          >
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{task.branchId.contactPhone}</span>
                          </a>
                        )}
                        {buildAddressString(task.branchId) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openNavigation(task.branchId); }}
                            className="flex items-center gap-1.5 p-2 bg-emerald-50 rounded-lg text-emerald-700 text-xs font-medium"
                          >
                            <Navigation className="w-3.5 h-3.5 shrink-0" />
                            <span>נווט ב-Waze</span>
                          </button>
                        )}
                      </div>

                      {task.devices?.length > 0 && (
                        <div>
                          <h5 className="text-xs font-bold text-muted-foreground mb-1.5">מכשירים:</h5>
                          <div className="space-y-1.5">
                            {task.devices.map((device, dIdx) => {
                              const fillKey = `${task._id}-${dIdx}`;
                              const isFillOpen = activeFillKey === fillKey;
                              const canFill = ['assigned', 'in_progress'].includes(task.status) && !device.isCompleted;
                              return (
                                <div key={dIdx} className="bg-muted/40 rounded-lg overflow-hidden">
                                  <div className="flex items-center justify-between p-2 text-xs">
                                    <span className="font-medium">
                                      {device.deviceId?.deviceType || 'מכשיר'}
                                      {device.deviceId?.locationInBranch ? ` (${device.deviceId.locationInBranch})` : ''}
                                    </span>
                                    {device.isCompleted ? (
                                      <span className="flex items-center gap-1 text-[11px] text-green-700 font-medium">
                                        <CheckCircle className="w-3.5 h-3.5" /> מולא
                                      </span>
                                    ) : canFill && (
                                      <button
                                        onClick={() => isFillOpen ? cancelFillForm() : openFillForm(task, dIdx)}
                                        className="flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-medium text-white bg-primary"
                                      >
                                        <Droplets className="w-3 h-3" />
                                        {isFillOpen ? 'בטל' : 'מלא'}
                                      </button>
                                    )}
                                  </div>

                                  {isFillOpen && (
                                    <div className="p-2.5 bg-card border-t space-y-2" onClick={(e) => e.stopPropagation()}>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">ריח</label>
                                          <select
                                            value={fillForm.scentId}
                                            onChange={(e) => setFillForm({ ...fillForm, scentId: e.target.value })}
                                            className="w-full px-2 py-1.5 border rounded-md text-xs"
                                          >
                                            <option value="">ללא שינוי</option>
                                            {scents.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                          </select>
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">מ"ל *</label>
                                          <input
                                            type="number"
                                            value={fillForm.mlFilled}
                                            onChange={(e) => setFillForm({ ...fillForm, mlFilled: e.target.value })}
                                            min="1"
                                            className="w-full px-2 py-1.5 border rounded-md text-xs"
                                          />
                                        </div>
                                      </div>
                                      <textarea
                                        value={fillForm.notes}
                                        onChange={(e) => setFillForm({ ...fillForm, notes: e.target.value })}
                                        rows={2}
                                        placeholder="הערות..."
                                        className="w-full px-2 py-1.5 border rounded-md text-xs"
                                      />
                                      <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        multiple
                                        onChange={handleImageCapture}
                                        className="hidden"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingImage}
                                        className="w-full flex items-center justify-center gap-2 py-2 rounded-md border border-dashed border-primary text-primary text-xs font-medium disabled:opacity-50"
                                      >
                                        <Camera className="w-3.5 h-3.5" />
                                        {uploadingImage ? 'מעלה...' : 'הוסף תמונה'}
                                      </button>
                                      {fillForm.images.length > 0 && (
                                        <div className="grid grid-cols-3 gap-1.5">
                                          {fillForm.images.map((url, imgIdx) => (
                                            <div key={imgIdx} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                                              <img src={thumbnailUrl(url, 200)} alt="" className="w-full h-full object-cover" />
                                              <button
                                                type="button"
                                                onClick={() => removeImage(imgIdx)}
                                                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                                              >
                                                <XIcon className="w-3 h-3" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      <button
                                        onClick={() => handleRefillDevice(task, dIdx)}
                                        disabled={!fillForm.mlFilled || savingFill || uploadingImage}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-white font-medium text-sm bg-primary disabled:opacity-50"
                                      >
                                        <Droplets className="w-4 h-4" />
                                        {savingFill ? 'שומר...' : 'אישור מילוי'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {task.notes && (
                        <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded-md">{task.notes}</p>
                      )}

                      <div className="flex gap-2">
                        {task.status === 'assigned' && (
                          <button
                            onClick={() => handleStartTask(task._id)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium bg-primary"
                          >
                            <Play className="w-5 h-5" />
                            התחל עבודה
                          </button>
                        )}
                        {task.status === 'in_progress' && (() => {
                          const allDone = task.devices?.length > 0 && task.devices.every(d => d.isCompleted);
                          return (
                            <div className="flex-1 space-y-2">
                              {allDone && (
                                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md text-xs text-green-700">
                                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>כל המכשירים מולאו</span>
                                </div>
                              )}
                              <textarea
                                value={completionNotes}
                                onChange={(e) => setCompletionNotes(e.target.value)}
                                placeholder="הערות סיום..."
                                className="w-full px-3 py-2 border rounded-md text-xs"
                                rows={2}
                              />
                              <button
                                onClick={() => handleCompleteTaskClick(task)}
                                className="w-full flex items-center justify-center gap-2 py-3 text-white rounded-xl font-medium bg-green-600"
                              >
                                <CheckCircle className="w-5 h-5" />
                                סיים משימה
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          );
        })
      )}

      {/* Completion modal */}
      {completionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-3">
          <div className="bg-card rounded-t-2xl sm:rounded-2xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold">מכשירים לא מולאו</h2>
              </div>
              <button onClick={() => setCompletionModal(null)} disabled={completionSaving}>
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm">{completionModal.unfilled.length} מכשירים לא מולאו. מה לעשות?</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 space-y-1">
                {completionModal.unfilled.map((d, i) => (
                  <div key={i} className="text-xs text-amber-900 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    {d.deviceId?.deviceType || 'מכשיר'}
                    {d.deviceId?.locationInBranch && <span className="text-amber-700">— {d.deviceId.locationInBranch}</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t flex flex-col gap-2">
              <button
                onClick={() => finalizeCompletion(completionModal.task, { followupDays: 7 })}
                disabled={completionSaving}
                className="w-full py-3 rounded-xl text-white font-medium bg-primary disabled:opacity-50"
              >
                {completionSaving ? 'שומר...' : 'סיים + תזמן ביקור חוזר השבוע הבא'}
              </button>
              <button
                onClick={() => finalizeCompletion(completionModal.task, { followupDays: 0 })}
                disabled={completionSaving}
                className="w-full py-3 rounded-xl border text-sm disabled:opacity-50"
              >
                סיים בלי ביקור חוזר
              </button>
              <button
                onClick={() => setCompletionModal(null)}
                disabled={completionSaving}
                className="w-full py-2 text-sm text-muted-foreground"
              >ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
