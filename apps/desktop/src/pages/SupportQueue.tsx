import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth';
import { useTicketWs } from '../hooks/useTicketWs';
import { formatDate } from '../lib/locale';
import type { Ticket } from '@enlace/core';

const URG_COLORS: Record<number, string> = { 1: 'bg-green-900/50 text-green-300', 2: 'bg-blue-900/50 text-blue-300', 3: 'bg-yellow-900/50 text-yellow-300', 4: 'bg-orange-900/50 text-orange-300', 5: 'bg-red-900/50 text-red-300' };
const STAT_COLORS: Record<string, string> = { open: 'bg-green-900/50 text-green-300', in_progress: 'bg-blue-900/50 text-blue-300', resolved: 'bg-gray-700 text-gray-300', closed: 'bg-gray-700 text-gray-400' };

interface TicketWithCustomer extends Ticket {
  customer?: { id: string; name: string; email: string };
}

export default function SupportQueue() {
  const { t } = useTranslation();
  const { apiFetch } = useAuth();
  const [initialTickets, setInitialTickets] = useState<TicketWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<TicketWithCustomer[]>('/api/tickets');
        setInitialTickets(data);
      } catch {
        // Keep empty
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [apiFetch]);

  // Real-time ticket stream via WebSocket
  const { tickets, connected } = useTicketWs(initialTickets);

  const filtered = useMemo(() => {
    return tickets.filter((tk) => {
      const matchSearch = !search || tk.subject.toLowerCase().includes(search.toLowerCase()) || tk.body.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'all' || tk.status === filter;
      return matchSearch && matchFilter;
    }).sort((a, b) => ((b.aiTriage as Record<string, unknown>)?.urgency as number ?? 0) - ((a.aiTriage as Record<string, unknown>)?.urgency as number ?? 0));
  }, [tickets, search, filter]);

  function getTriage(ticket: TicketWithCustomer) {
    const triage = ticket.aiTriage as Record<string, unknown> | null;
    if (!triage) return null;
    return {
      urgency: triage.urgency as number,
      category: triage.category as string,
      provider: triage.provider as string,
      suggestedResponse: triage.suggestedResponse as string,
    };
  }

  async function handleStatusChange(ticketId: string, newStatus: string) {
    try {
      await apiFetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      // WebSocket will broadcast the update to all clients
      toast.success('Ticket updated', { description: `Status changed to ${newStatus}` });
    } catch {
      toast.error('Failed to update ticket');
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Support Queue</h1>
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-400">{connected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
        <span className="text-sm text-gray-400">{loading ? '...' : `${filtered.length} tickets`}</span>
      </div>

      <div className="flex gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none"
          placeholder="Search tickets..." />
        <div className="flex gap-2">
          {['all', t('status.open'), t('status.in_progress'), t('status.resolved')].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filter === f ? 'bg-brand-600/30 text-brand-400' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-700/50" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((tk, i) => {
              const triage = getTriage(tk);
              return (
                <motion.div key={tk.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                  className="rounded-xl border border-gray-800 bg-gray-800/50 transition-colors hover:border-gray-700">
                  <div className="cursor-pointer p-4" onClick={() => setExpanded(expanded === tk.id ? null : tk.id)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white">{tk.subject}</h3>
                          {triage && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${URG_COLORS[triage.urgency]}`}>⚡ {triage.urgency}/5</span>}
                        </div>
                        <p className="mt-1 text-sm text-gray-400 line-clamp-1">{tk.body}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STAT_COLORS[tk.status]}`}>{tk.status}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                      {triage && <span>🤖 {triage.provider} ({triage.category})</span>}
                      {triage && <span>•</span>}
                      <span>{tk.customer?.name ?? 'Unknown'}</span>
                      <span>•</span>
                      <span>{formatDate(tk.createdAt)}</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expanded === tk.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-gray-700">
                        <div className="p-4 space-y-3">
                          <div className="text-sm text-gray-300">{tk.body}</div>
                          {triage?.suggestedResponse && (
                            <div className="rounded-lg border border-brand-800 bg-brand-950/30 p-3">
                              <div className="text-xs font-medium text-brand-400 mb-1">AI Suggested Response:</div>
                              <p className="text-sm text-gray-300">{triage.suggestedResponse}</p>
                              <div className="mt-2 flex gap-2">
                                <button onClick={(e) => { e.stopPropagation(); toast.success('Response approved'); }}
                                  className="rounded-md bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-500">✓ Approve & Send</button>
                                <button onClick={(e) => e.stopPropagation()}
                                  className="rounded-md border border-gray-700 px-3 py-1 text-xs text-gray-300 hover:bg-gray-800">✏️ Edit</button>
                              </div>
                            </div>
                          )}
                          {tk.customer && (
                            <div className="rounded-lg bg-gray-900 p-3 text-xs text-gray-400">
                              <div className="font-medium text-white">{tk.customer.name}</div>
                              <div>{tk.customer.email}</div>
                            </div>
                          )}
                          <div className="flex gap-2">
                            {tk.status === 'open' && (
                              <button onClick={(e) => { e.stopPropagation(); handleStatusChange(tk.id, 'in_progress'); }}
                                className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500">
                                ▶ Start Working
                              </button>
                            )}
                            {tk.status === 'in_progress' && (
                              <button onClick={(e) => { e.stopPropagation(); handleStatusChange(tk.id, 'resolved'); }}
                                className="rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-500">
                                ✅ Mark Resolved
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
