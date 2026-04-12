'use client';

import { useState, useEffect } from 'react';
import { workOrdersAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  ClipboardList, MapPin, Clock, CheckCircle, Play,
  ChevronDown, ChevronUp, Calendar, Phone
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
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // active | completed | all
  const [expandedTask, setExpandedTask] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');

  useEffect(() => {
    loadTasks();
  }, [filter]);

  async function loadTasks() {
    try {
      setLoading(true);
      const params = {};
      if (filter === 'active') params.status = 'assigned,in_progress';
      else if (filter === 'completed') params.status = 'completed';

      const result = await workOrdersAPI.getMy(params);
      setTasks(result.data || []);
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartTask(taskId) {
    try {
      await workOrdersAPI.updateStatus(taskId, 'in_progress');
      loadTasks();
    } catch (err) {
      alert(err.message || 'שגיאה בעדכון סטטוס');
    }
  }

  async function handleCompleteTask(taskId) {
    try {
      await workOrdersAPI.updateStatus(taskId, 'completed', {
        completionNotes: completionNotes || undefined
      });
      setCompletionNotes('');
      setExpandedTask(null);
      loadTasks();
    } catch (err) {
      alert(err.message || 'שגיאה בעדכון סטטוס');
    }
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
                      {/* Contact */}
                      {task.branchId?.contactPhone && (
                        <a
                          href={`tel:${task.branchId.contactPhone}`}
                          className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl text-blue-700 font-medium"
                        >
                          <Phone className="w-5 h-5" />
                          {task.branchId.contactPerson || 'איש קשר'}: {task.branchId.contactPhone}
                        </a>
                      )}

                      {/* Devices */}
                      {task.devices?.length > 0 && (
                        <div>
                          <h5 className="text-sm font-bold text-gray-700 mb-2">מכשירים לטיפול:</h5>
                          <div className="space-y-2">
                            {task.devices.map((device, dIdx) => (
                              <div key={dIdx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                                <span>{device.deviceId?.deviceType || 'מכשיר'} {device.deviceId?.locationInBranch ? `(${device.deviceId.locationInBranch})` : ''}</span>
                                {device.isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
                              </div>
                            ))}
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

                        {task.status === 'in_progress' && (
                          <div className="flex-1 space-y-3">
                            <textarea
                              value={completionNotes}
                              onChange={(e) => setCompletionNotes(e.target.value)}
                              placeholder="הערות סיום (אופציונלי)..."
                              className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-(--color-primary)"
                              rows={2}
                            />
                            <button
                              onClick={() => handleCompleteTask(task._id)}
                              className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-medium text-lg hover:bg-green-700"
                            >
                              <CheckCircle className="w-5 h-5" />
                              סיים משימה
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
