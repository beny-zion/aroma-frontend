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
  ChevronDown, ChevronUp, Calendar, Phone, Navigation, Droplets,
  Camera, X as XIcon, AlertTriangle
} from 'lucide-react';

const statusLabels = {
  pending: 'ממתין',
  assigned: 'שובץ',
  in_progress: 'בביצוע',
  completed: 'הושלם',
  cancelled: 'בוטל'
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

const priorityLabels = {
  low: 'נמוכה',
  medium: 'בינונית',
  high: 'גבוהה',
  urgent: 'דחוף'
};

const typeLabels = {
  routine_refill: 'מילוי שוטף',
  repair: 'תיקון',
  installation: 'התקנה',
  removal: 'הסרה',
  complaint: 'תלונה'
};

export default function MyTasksPage() {
  const { user } = useAuth();
  const { scents } = useScents();
  const { invalidateWorkOrders, invalidateDevices, invalidateScents, invalidateServiceLogs } = useInvalidate();
  const [filter, setFilter] = useState('active'); // active | completed | all
  const [expandedTask, setExpandedTask] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [activeFillKey, setActiveFillKey] = useState(null); // `${taskId}-${deviceIdx}`
  const [fillForm, setFillForm] = useState({ scentId: '', mlFilled: '', notes: '', images: [] });
  const [savingFill, setSavingFill] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [completionModal, setCompletionModal] = useState(null); // { task, unfilled, choice: 'followup'|'leave-open'|null }
  const [completionSaving, setCompletionSaving] = useState(false);

  // SWR key based on filter
  const statusParam = filter === 'active' ? 'assigned,in_progress' : filter === 'completed' ? 'completed' : '';
  const swrKey = statusParam ? `/work-orders/my?status=${statusParam}` : '/work-orders/my';
  const { data: taskData, isLoading: loading } = useSWR(swrKey);
  const tasks = taskData?.data || [];

  async function handleStartTask(taskId) {
    try {
      await workOrdersAPI.updateStatus(taskId, 'in_progress');
      invalidateWorkOrders();
      toast.success('המשימה התחילה');
    } catch (err) {
      toast.error(err.message || 'שגיאה בעדכון סטטוס');
    }
  }

  function openFillForm(task, deviceIdx) {
    const device = task.devices[deviceIdx];
    const fullDevice = device.deviceId;
    setFillForm({
      scentId: fullDevice?.scentId?._id || fullDevice?.scentId || '',
      mlFilled: fullDevice?.mlPerRefill?.toString() || '100',
      notes: '',
      images: []
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
    e.target.value = ''; // allow re-selecting same file
    try {
      setUploadingImage(true);
      const urls = await Promise.all(files.map(uploadImage));
      setFillForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (err) {
      toast.error(err.message || 'שגיאה בהעלאת תמונה');
    } finally {
      setUploadingImage(false);
    }
  }

  function removeImage(idx) {
    setFillForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx)
    }));
  }

  async function handleRefillDevice(task, deviceIdx) {
    const taskDevice = task.devices[deviceIdx];
    const deviceId = taskDevice.deviceId?._id || taskDevice.deviceId;

    if (!deviceId || !fillForm.mlFilled) {
      toast.error('יש להזין כמות מילוי');
      return;
    }

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

      // Auto-bump status from 'assigned' → 'in_progress' on first fill
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
      invalidateWorkOrders();
      invalidateDevices();
      invalidateScents();
      invalidateServiceLogs();
      toast.success('המילוי נרשם');
    } catch (err) {
      toast.error(err.message || 'שגיאה ברישום מילוי');
    } finally {
      setSavingFill(false);
    }
  }

  function handleCompleteTaskClick(task) {
    const unfilled = (task.devices || []).filter(d => !d.isCompleted);
    if (unfilled.length === 0) {
      // All devices filled — complete directly
      finalizeCompletion(task, { followupDays: 0 });
      return;
    }
    // Some unfilled — open modal to ask what to do
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
      if (result.followupOrderId) {
        toast.success(result.message || 'נוצרה הזמנת המשך');
      } else {
        toast.success('המשימה הושלמה');
      }
    } catch (err) {
      toast.error(err.message || 'שגיאה בעדכון סטטוס');
    } finally {
      setCompletionSaving(false);
    }
  }

  function buildAddressString(branch) {
    if (!branch) return '';
    const parts = [branch.address, branch.city].filter(Boolean);
    return parts.join(', ');
  }

  function openNavigation(branch) {
    const address = buildAddressString(branch);
    if (!address) {
      toast.error('כתובת חסרה לסניף');
      return;
    }
    const query = encodeURIComponent(address);
    window.open(`https://waze.com/ul?q=${query}&navigate=yes`, '_blank');
  }

  function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return 'היום';
    if (d.toDateString() === tomorrow.toDateString()) return 'מחר';
    return d.toLocaleDateString('he-IL', { weekday: 'short', day: '2-digit', month: '2-digit' });
  }

  function groupByDate(tasks) {
    const groups = {};
    for (const task of tasks) {
      const dateKey = new Date(task.scheduledDate).toDateString();
      if (!groups[dateKey]) groups[dateKey] = { label: formatDate(task.scheduledDate), tasks: [] };
      groups[dateKey].tasks.push(task);
    }
    return Object.values(groups);
  }

  const grouped = groupByDate(tasks);
  const activeCount = tasks.filter(t => ['assigned', 'in_progress'].includes(t.status)).length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="loading-spinner-inner">
          <div className="loading-spinner-circle"></div>
        </div>
        <p className="loading-spinner-text">טוען משימות...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-50)' }}>
          <ClipboardList className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">המשימות שלי</h1>
          <p className="text-gray-500 mt-1 text-sm">שלום {user?.name}, יש לך {activeCount} משימות פתוחות</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-4">
          <ClipboardList className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--color-primary)' }} />
          <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{activeCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">פתוחות</div>
        </div>
        <div className="card text-center py-4">
          <Clock className="w-5 h-5 mx-auto mb-1 text-amber-600" />
          <div className="text-2xl font-bold text-amber-600">{inProgressCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">בביצוע</div>
        </div>
        <div className="card text-center py-4">
          <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-600" />
          <div className="text-2xl font-bold text-green-600">{tasks.filter(t => t.status === 'completed').length}</div>
          <div className="text-xs text-gray-500 mt-0.5">הושלמו</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--color-primary-50)' }}>
        {[
          { key: 'active', label: 'פתוחות' },
          { key: 'completed', label: 'הושלמו' },
          { key: 'all', label: 'הכל' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              filter === tab.key
                ? 'bg-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={filter === tab.key ? { color: 'var(--color-primary)' } : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task Groups */}
      {grouped.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <ClipboardList className="w-8 h-8" />
          </div>
          <p className="text-gray-500 font-medium">אין משימות להצגה</p>
        </div>
      ) : (
        grouped.map((group, gIdx) => (
          <div key={gIdx} className="space-y-3">
            <h3 className="text-sm font-bold text-gray-500 px-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></span>
              {group.label}
            </h3>

            {group.tasks.map((task) => {
              const isExpanded = expandedTask === task._id;

              return (
                <div
                  key={task._id}
                  className={`card border-r-4 ${priorityColors[task.priority]} transition-all`}
                >
                  {/* Task Header */}
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpandedTask(isExpanded ? null : task._id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-800">{task.branchId?.branchName || '-'}</h4>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${statusColors[task.status]}`}>
                          {statusLabels[task.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{task.branchId?.customerId?.name || ''}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {task.branchId?.city || ''} {task.branchId?.address || ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {typeLabels[task.type]} - {task.devices?.length || 0} מכשירים
                        </span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      {/* Contact + Navigation */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {task.branchId?.contactPhone && (
                          <a
                            href={`tel:${task.branchId.contactPhone}`}
                            className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl text-blue-700 font-medium"
                          >
                            <Phone className="w-5 h-5" />
                            <span className="truncate">{task.branchId.contactPerson || 'איש קשר'}: {task.branchId.contactPhone}</span>
                          </a>
                        )}
                        {buildAddressString(task.branchId) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openNavigation(task.branchId); }}
                            className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl text-emerald-700 font-medium hover:bg-emerald-100 transition-colors"
                          >
                            <Navigation className="w-5 h-5" />
                            <span className="truncate">נווט ב-Waze</span>
                          </button>
                        )}
                      </div>

                      {/* Devices */}
                      {task.devices?.length > 0 && (
                        <div>
                          <h5 className="text-sm font-bold text-gray-700 mb-2">מכשירים לטיפול:</h5>
                          <div className="space-y-2">
                            {task.devices.map((device, dIdx) => {
                              const fillKey = `${task._id}-${dIdx}`;
                              const isFillOpen = activeFillKey === fillKey;
                              const canFill = ['assigned', 'in_progress'].includes(task.status) && !device.isCompleted;

                              return (
                                <div key={dIdx} className="bg-gray-50 rounded-lg overflow-hidden">
                                  <div className="flex items-center justify-between p-2 text-sm">
                                    <span>
                                      {device.deviceId?.deviceType || 'מכשיר'}
                                      {device.deviceId?.locationInBranch ? ` (${device.deviceId.locationInBranch})` : ''}
                                    </span>
                                    {device.isCompleted ? (
                                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                        <CheckCircle className="w-4 h-4" />
                                        מולא
                                      </span>
                                    ) : canFill && (
                                      <button
                                        onClick={() => isFillOpen ? cancelFillForm() : openFillForm(task, dIdx)}
                                        className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium text-white"
                                        style={{ backgroundColor: 'var(--color-primary)' }}
                                      >
                                        <Droplets className="w-3.5 h-3.5" />
                                        {isFillOpen ? 'בטל' : 'מלא ריח'}
                                      </button>
                                    )}
                                  </div>

                                  {isFillOpen && (
                                    <div className="p-3 bg-white border-t space-y-3" onClick={(e) => e.stopPropagation()}>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">ריח</label>
                                          <select
                                            value={fillForm.scentId}
                                            onChange={(e) => setFillForm({ ...fillForm, scentId: e.target.value })}
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-(--color-primary)"
                                          >
                                            <option value="">ללא שינוי</option>
                                            {scents.map(s => (
                                              <option key={s._id} value={s._id}>{s.name}</option>
                                            ))}
                                          </select>
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">כמות (מ"ל) *</label>
                                          <input
                                            type="number"
                                            value={fillForm.mlFilled}
                                            onChange={(e) => setFillForm({ ...fillForm, mlFilled: e.target.value })}
                                            min="1"
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-(--color-primary)"
                                          />
                                        </div>
                                      </div>
                                      <textarea
                                        value={fillForm.notes}
                                        onChange={(e) => setFillForm({ ...fillForm, notes: e.target.value })}
                                        rows={2}
                                        placeholder="הערות (אופציונלי)..."
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-(--color-primary)"
                                      />

                                      {/* Photos */}
                                      <div>
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
                                          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed text-sm font-medium disabled:opacity-50"
                                          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                                        >
                                          <Camera className="w-4 h-4" />
                                          {uploadingImage ? 'מעלה...' : 'הוסף תמונה'}
                                        </button>
                                        {fillForm.images.length > 0 && (
                                          <div className="grid grid-cols-3 gap-2 mt-2">
                                            {fillForm.images.map((url, imgIdx) => (
                                              <div key={imgIdx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                                                <img
                                                  src={thumbnailUrl(url, 200)}
                                                  alt={`תמונה ${imgIdx + 1}`}
                                                  className="w-full h-full object-cover"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => removeImage(imgIdx)}
                                                  className="absolute top-1 left-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                                                  aria-label="הסר תמונה"
                                                >
                                                  <XIcon className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      <button
                                        onClick={() => handleRefillDevice(task, dIdx)}
                                        disabled={!fillForm.mlFilled || savingFill || uploadingImage}
                                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                                        style={{ backgroundColor: 'var(--color-primary)' }}
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

                      {/* Notes */}
                      {task.notes && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{task.notes}</p>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        {task.status === 'assigned' && (
                          <button
                            onClick={() => handleStartTask(task._id)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium text-lg"
                            style={{ backgroundColor: 'var(--color-primary)' }}
                          >
                            <Play className="w-5 h-5" />
                            התחל עבודה
                          </button>
                        )}

                        {task.status === 'in_progress' && (() => {
                          const allDone = task.devices?.length > 0 && task.devices.every(d => d.isCompleted);
                          return (
                            <div className="flex-1 space-y-3">
                              {allDone && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                                  <CheckCircle className="w-4 h-4 shrink-0" />
                                  <span>כל המכשירים מולאו — ניתן לסיים את המשימה</span>
                                </div>
                              )}
                              <textarea
                                value={completionNotes}
                                onChange={(e) => setCompletionNotes(e.target.value)}
                                placeholder="הערות סיום (אופציונלי)..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-(--color-primary)"
                                rows={2}
                              />
                              <button
                                onClick={() => handleCompleteTaskClick(task)}
                                className={`w-full flex items-center justify-center gap-2 py-3 text-white rounded-xl font-medium text-lg transition-all ${allDone ? 'bg-green-600 hover:bg-green-700 shadow-lg' : 'bg-green-600/80 hover:bg-green-700'}`}
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
        ))
      )}

      {/* Completion modal — shown when finishing a task with unfilled devices */}
      {completionModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg w-full">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-bold">מכשירים לא מולאו</h2>
              </div>
              <button
                onClick={() => setCompletionModal(null)}
                className="modal-close"
                disabled={completionSaving}
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700">
                {completionModal.unfilled.length} מכשירים בסניף הזה לא מולאו. מה לעשות איתם?
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                {completionModal.unfilled.map((d, i) => (
                  <div key={i} className="text-sm text-amber-900 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    {d.deviceId?.deviceType || 'מכשיר'}
                    {d.deviceId?.locationInBranch && (
                      <span className="text-xs text-amber-700">— {d.deviceId.locationInBranch}</span>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500">
                "תזמן ביקור חוזר" יצור הזמנת עבודה חדשה לסניף עם המכשירים שלא מולאו בלבד.
              </p>
            </div>

            <div className="modal-footer flex-wrap gap-2">
              <button
                onClick={() => setCompletionModal(null)}
                className="btn-secondary"
                disabled={completionSaving}
              >
                ביטול
              </button>
              <div className="flex-1" />
              <button
                onClick={() => finalizeCompletion(completionModal.task, { followupDays: 0 })}
                disabled={completionSaving}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                סיים בלי ביקור חוזר
              </button>
              <button
                onClick={() => finalizeCompletion(completionModal.task, { followupDays: 7 })}
                disabled={completionSaving}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {completionSaving ? 'שומר...' : 'סיים + תזמן ביקור חוזר השבוע הבא'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
