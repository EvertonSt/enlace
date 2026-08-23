import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { useOutageWs } from '../hooks/useOutageWs';
import { formatDateTime, formatNumber } from '../lib/locale';
import type { OutageEvent, Ticket } from '@enlace/core';

const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function NocDashboard() {
  const { t } = useTranslation();
  const { apiFetch } = useAuth();
  const [initialOutages, setInitialOutages] = useState<OutageEvent[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    async function load() {
      try {
        const [o, tk] = await Promise.all([
          apiFetch<import('@enlace/core').OutageEvent[]>('/api/outages'),
          apiFetch<Ticket[]>('/api/tickets'),
        ]);
        setInitialOutages(o);
        setTickets(tk);
      } catch {
        // Keep empty
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [apiFetch]);

  // Real-time outage stream via WebSocket
  const { outages, connected } = useOutageWs(initialOutages);

  const active = outages.filter((o) => o.status !== 'resolved');
  const totalAffected = active.reduce((s, o) => s + (o.affectedCustomerCount ?? 0), 0);
  const openTickets = tickets.filter((tk) => tk.status === 'open').length;

  return (
    <motion.div className="space-y-6" variants={stagger} initial="initial" animate="animate">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-400">{connected ? 'Live' : 'Offline'}</span>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active Incidents', value: loading ? '...' : String(active.length), color: 'bg-red-900/30 text-red-400' },
          { label: 'Open Tickets', value: loading ? '...' : String(openTickets), color: 'bg-blue-900/30 text-blue-400' },
          { label: 'Customers Affected', value: loading ? '...' : formatNumber(totalAffected), color: 'bg-orange-900/30 text-orange-400' },
          { label: 'Avg Response', value: '12 min', color: 'bg-green-900/30 text-green-400' },
        ].map((card) => (
          <div key={card.label} className={`rounded-xl p-5 ${card.color}`}>
            <div className="text-sm opacity-80">{card.label}</div>
            <div className="mt-1 text-3xl font-bold">{card.value}</div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} className="rounded-xl border border-gray-800 bg-gray-800/50 p-5">
        <h2 className="mb-4 text-lg font-semibold">Incident Timeline</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-700/50" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {outages.length === 0 && (
              <div className="py-8 text-center text-gray-500">No outages recorded</div>
            )}
            {outages.map((outage) => (
              <div key={outage.id} className="flex items-start gap-3 rounded-lg border border-gray-700 bg-gray-900 p-4 transition-colors hover:border-gray-600">
                <span className="text-xl">{outage.status === 'fix_in_progress' ? '🔧' : outage.status === 'resolved' ? '✅' : '🔍'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{outage.title}</div>
                  <div className="mt-0.5 text-sm text-gray-400">{outage.affectedArea} — {formatNumber(outage.affectedCustomerCount ?? 0)} affected</div>
                  {outage.description && <div className="mt-1 text-xs text-gray-500 line-clamp-2">{outage.description}</div>}
                </div>
                <div className="text-right text-xs text-gray-500">
                  <div>{formatDateTime(outage.startedAt)}</div>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 ${
                    outage.status === 'fix_in_progress' ? 'bg-blue-900/50 text-blue-300' :
                    outage.status === 'resolved' ? 'bg-green-900/50 text-green-300' :
                    outage.status === 'investigating' ? 'bg-red-900/50 text-red-300' :
                    'bg-yellow-900/50 text-yellow-300'
                  }`}>
                    {outage.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
