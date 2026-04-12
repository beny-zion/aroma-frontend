'use client';

import { AlertTriangle, Droplets, TrendingUp, Package } from 'lucide-react';

export default function InventoryIntelligence({ lowStock, popularScents }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--color-primary-100)' }}>
          <Package className="w-5 h-5" style={{ color: 'var(--color-primary-dark)' }} />
        </div>
        <h3 className="text-lg font-bold text-gray-800">ניהול מלאי חכם</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h4 className="font-semibold text-gray-700">התראות מלאי נמוך</h4>
          </div>

          {lowStock && lowStock.length > 0 ? (
            <div className="space-y-2">
              {lowStock.map((scent) => {
                const urgencyStyles = scent.urgency === 'critical'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700';

                return (
                  <div
                    key={scent.id}
                    className={`flex items-center justify-between p-3 rounded-xl border ${urgencyStyles}`}
                  >
                    <div className="flex items-center gap-3">
                      <Droplets className="w-4 h-4" />
                      <span className="font-medium">{scent.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">
                        {scent.stockQuantity} {scent.unit === 'liter' ? 'ל' : 'מ"ל'}
                      </span>
                      {scent.urgency === 'critical' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full animate-pulse">
                          אזל!
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400 bg-gray-50 rounded-xl">
              <div className="text-center">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>כל המלאי תקין</p>
              </div>
            </div>
          )}
        </div>

        {/* Popular Scents */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <h4 className="font-semibold text-gray-700">ריחות פופולריים</h4>
          </div>

          {popularScents && popularScents.length > 0 ? (
            <div className="space-y-2">
              {popularScents.map((scent, index) => {
                const maxUsage = popularScents[0]?.usageCount || 1;
                const percentage = Math.round((scent.usageCount / maxUsage) * 100);

                return (
                  <div
                    key={scent.id}
                    className="relative p-3 rounded-xl border overflow-hidden"
                    style={{
                      background: 'linear-gradient(to left, var(--color-primary-50), white)',
                      borderColor: 'var(--color-primary-100)'
                    }}
                  >
                    {/* Progress background */}
                    <div
                      className="absolute inset-y-0 right-0 transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: 'rgba(107, 142, 123, 0.1)'
                      }}
                    />

                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold"
                          style={{
                            backgroundColor: 'var(--color-primary-200)',
                            color: 'var(--color-primary-dark)'
                          }}
                        >
                          {index + 1}
                        </span>
                        <div>
                          <span className="font-medium text-gray-800">{scent.name}</span>
                          <p className="text-xs text-gray-500">מלאי: {scent.stockQuantity} מ"ל</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="font-bold" style={{ color: 'var(--color-primary-dark)' }}>
                          {scent.usageCount}
                        </span>
                        <p className="text-xs text-gray-500">מכשירים</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400 bg-gray-50 rounded-xl">
              <div className="text-center">
                <Droplets className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>אין נתונים</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
