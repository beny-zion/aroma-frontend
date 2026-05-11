'use client';

import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User as UserIcon, ClipboardList, Droplets, CheckCircle } from 'lucide-react';

export default function TechnicianProfilePage() {
  const { user, logout } = useAuth();

  // Stats — counts from work orders + service logs the user has done
  const { data: tasksData } = useSWR('/work-orders/my');
  const { data: logsData } = useSWR(user?._id ? `/service-logs?technicianName=${encodeURIComponent(user.name)}&limit=500` : null);

  const tasks = tasksData?.data || [];
  const logs = logsData?.data || [];

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const activeTasks = tasks.filter(t => ['assigned', 'in_progress'].includes(t.status)).length;

  // refills this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const refillsThisWeek = logs.filter(l => new Date(l.date) > weekAgo).length;
  const totalMlThisWeek = logs
    .filter(l => new Date(l.date) > weekAgo)
    .reduce((s, l) => s + (l.mlFilled || 0), 0);

  return (
    <div className="space-y-5">
      {/* Profile card */}
      <div className="bg-card border rounded-2xl p-5 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <span className="text-2xl font-bold text-primary">
            {user?.name?.charAt(0) || <UserIcon className="w-8 h-8" />}
          </span>
        </div>
        <h1 className="text-lg font-bold">{user?.name}</h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
        <span className="inline-block mt-2 px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
          טכנאי
        </span>
      </div>

      {/* Stats */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground mb-2 px-1">השבוע</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card border rounded-xl p-4">
            <Droplets className="w-5 h-5 text-primary mb-1.5" />
            <div className="text-2xl font-bold">{refillsThisWeek}</div>
            <div className="text-xs text-muted-foreground">מילויים</div>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <Droplets className="w-5 h-5 text-blue-500 mb-1.5" />
            <div className="text-2xl font-bold">{totalMlThisWeek.toLocaleString('he-IL')}</div>
            <div className="text-xs text-muted-foreground">מ"ל סה"כ</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-muted-foreground mb-2 px-1">משימות</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card border rounded-xl p-4">
            <ClipboardList className="w-5 h-5 text-amber-500 mb-1.5" />
            <div className="text-2xl font-bold">{activeTasks}</div>
            <div className="text-xs text-muted-foreground">פתוחות</div>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <CheckCircle className="w-5 h-5 text-green-600 mb-1.5" />
            <div className="text-2xl font-bold">{completedTasks}</div>
            <div className="text-xs text-muted-foreground">הושלמו</div>
          </div>
        </div>
      </div>

      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-destructive/30 text-destructive font-medium hover:bg-destructive/5"
      >
        <LogOut className="w-4 h-4" />
        יציאה מהמערכת
      </button>
    </div>
  );
}
