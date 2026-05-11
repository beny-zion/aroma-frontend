'use client';

import { useEffect, useState } from 'react';
import { permissionsAPI } from '@/lib/api';
import { Check, X, Loader2, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

const ROLE_BADGE_COLOR = {
  admin:      'bg-purple-100 text-purple-700',
  manager:    'bg-blue-100 text-blue-700',
  secretary:  'bg-amber-100 text-amber-700',
  technician: 'bg-green-100 text-green-700',
};

export default function PermissionsMatrix({ defaultOpen = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    let alive = true;
    permissionsAPI.get()
      .then(res => { if (alive) setData(res); })
      .catch(err => { if (alive) setError(err.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return null; // panel is not critical, render nothing while loading

  if (error || !data) {
    return null; // silently fail — main users page works without the matrix
  }

  const { roles, capabilities, matrix } = data;

  // Group capabilities by their `group` field
  const groups = capabilities.reduce((acc, cap) => {
    if (!acc[cap.group]) acc[cap.group] = [];
    acc[cap.group].push(cap);
    return acc;
  }, {});

  return (
    <div className="bg-card border rounded-xl">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 text-right hover:bg-muted/30 rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">טבלת הרשאות לפי תפקיד</span>
          <span className="text-xs text-muted-foreground">
            (מסביר מה כל תפקיד יכול לעשות במערכת)
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t p-3 space-y-4">
          {/* Role descriptions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {roles.map(r => (
              <div key={r.value} className={`px-3 py-2 rounded-lg ${ROLE_BADGE_COLOR[r.value] || 'bg-muted text-muted-foreground'}`}>
                <div className="font-semibold text-sm">{r.label}</div>
                <div className="text-[11px] mt-0.5 opacity-80">{r.description}</div>
              </div>
            ))}
          </div>

          {/* Matrix table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/40">
                  <th className="text-right px-3 py-2 font-semibold text-xs sticky right-0 bg-muted/40 min-w-[200px]">יכולת</th>
                  {roles.map(r => (
                    <th key={r.value} className="px-3 py-2 font-semibold text-xs text-center min-w-[80px]">
                      {r.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(groups).map(([groupName, caps]) => (
                  <>
                    <tr key={`g-${groupName}`} className="bg-muted/20">
                      <td colSpan={roles.length + 1} className="px-3 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                        {groupName}
                      </td>
                    </tr>
                    {caps.map(cap => (
                      <tr key={cap.key} className="border-b last:border-b-0 hover:bg-muted/10">
                        <td className="text-right px-3 py-2 sticky right-0 bg-card">{cap.label}</td>
                        {roles.map(r => {
                          const allowed = matrix[r.value]?.[cap.key];
                          return (
                            <td key={r.value} className="text-center px-3 py-2">
                              {allowed ? (
                                <Check className="w-4 h-4 text-green-600 mx-auto" />
                              ) : (
                                <X className="w-4 h-4 text-gray-300 mx-auto" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-muted-foreground italic">
            ההרשאות מוגדרות בקוד ולא ניתנות לעריכה דרך הממשק. לשינויים בטבלה — צריך עדכון תוכנה.
          </p>
        </div>
      )}
    </div>
  );
}
