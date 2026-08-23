import { useTranslation } from 'react-i18next';
import { useOutages } from '../lib/use-outages';
import { formatDateTime, formatNumber } from '../lib/locale';
import OutageMap from '../components/OutageMap';
import type { OutageEvent } from '@enlace/core';

const STATUS_ICONS: Record<string, string> = {
  reported: '📢',
  investigating: '🔍',
  identified: '🎯',
  fix_in_progress: '🔧',
  resolved: '✅',
};

export default function OutagesPage() {
  const { t } = useTranslation();
  const { activeOutages, resolvedOutages, connected } = useOutages();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('outage.title')}
        </h1>
        <div className="flex items-center gap-2 text-sm">
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-gray-500 dark:text-gray-400">
            {connected ? t('outage.live') : t('outage.offline')}
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <OutageMap outages={[...activeOutages, ...resolvedOutages]} height="450px" />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
        {Object.entries({
          reported: '#f59e0b',
          investigating: '#ef4444',
          identified: '#f97316',
          fix_in_progress: '#3b82f6',
          resolved: '#22c55e',
        }).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            <span>{t(`outage.${status === 'fix_in_progress' ? 'fixInProgress' : status}`)}</span>
          </div>
        ))}
      </div>

      {/* Active */}
      {activeOutages.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {t("dashboard.activeIncidents", { count: String(activeOutages.length) })}
          </h2>
          <div className="space-y-3">
            {activeOutages.map((outage) => (
              <OutageCard key={outage.id} outage={outage} t={t} />
            ))}
          </div>
        </div>
      )}

      {/* Resolved */}
      {resolvedOutages.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {t("dashboard.resolvedIncidents", { count: String(resolvedOutages.length) })}
          </h2>
          <div className="space-y-3">
            {resolvedOutages.map((outage) => (
              <OutageCard key={outage.id} outage={outage} t={t} />
            ))}
          </div>
        </div>
      )}

      {activeOutages.length === 0 && resolvedOutages.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-gray-500 dark:text-gray-400">{t('dashboard.noActiveOutages')}</p>
        </div>
      )}
    </div>
  );
}

function OutageCard({
  outage,
  t,
}: {
  outage: OutageEvent;
  t: (key: string, args?: Record<string, string>) => string;
}) {
  const isActive = outage.status !== 'resolved';

  return (
    <div className={`rounded-lg border p-4 ${
      isActive
        ? 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900'
        : 'border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-lg">{STATUS_ICONS[outage.status] ?? '❓'}</span>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{outage.title}</div>
            {outage.description && (
              <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{outage.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span>📍 {outage.affectedArea}</span>
              <span>👥 {t('outage.affectedCustomers', { count: formatNumber(outage.affectedCustomerCount) })}</span>
              <span>🕐 {formatDateTime(outage.startedAt)}</span>
              {outage.estimatedResolution && (
                <span>⏱️ ETA: {formatDateTime(outage.estimatedResolution)}</span>
              )}
            </div>
          </div>
        </div>
        <span className={`inline-flex flex-shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          isActive
            ? outage.status === 'fix_in_progress'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
            : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
        }`}>
          {t(`outage.${outage.status === 'fix_in_progress' ? 'fixInProgress' : outage.status}`)}
        </span>
      </div>
    </div>
  );
}
