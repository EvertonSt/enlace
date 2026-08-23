import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth';
import type { Ticket } from '@enlace/core';

interface Technician {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  area: string;
  status: string;
  rating: number;
  completedToday: number;
  currentJob: {
    ticketId: string;
    address: string;
    customer: string;
    eta: string | null;
  } | null;
}

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-green-900/50 text-green-300',
  on_job: 'bg-blue-900/50 text-blue-300',
  off_duty: 'bg-gray-700 text-gray-400',
};

export default function TechDispatch() {
  const { t } = useTranslation();
  const { apiFetch } = useAuth();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [techs, tk] = await Promise.all([
          apiFetch<Technician[]>('/api/technicians'),
          apiFetch<Ticket[]>('/api/tickets'),
        ]);
        setTechnicians(techs);
        setTickets(tk);
      } catch {
        // Keep empty
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [apiFetch]);

  async function handleAssign(techId: string, ticketId: string) {
    try {
      await apiFetch(`/api/technicians/${techId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ ticketId }),
      });
      // Refresh data
      const [techs, tk] = await Promise.all([
        apiFetch<Technician[]>('/api/technicians'),
        apiFetch<Ticket[]>('/api/tickets'),
      ]);
      setTechnicians(techs);
      setTickets(tk);
      const tech = technicians.find((t) => t.id === techId);
      toast.success('Technician assigned', { description: `Job dispatched to ${tech?.name ?? 'Unknown'}` });
    } catch (err) {
      toast.error('Failed to assign', { description: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  const openTickets = tickets.filter((tk) => tk.status === 'open');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-2xl font-bold">{t('nav.dispatch', 'Technician Dispatch')}</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-5">
          <h2 className="mb-4 text-lg font-semibold">Field Technicians</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-700/50" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {technicians.length === 0 && (
                <div className="py-8 text-center text-gray-500">No technicians found</div>
              )}
              {technicians.map((tech) => (
                <div key={tech.id} className="rounded-lg border border-gray-700 bg-gray-900 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">👤</span>
                        <span className="font-medium text-white">{tech.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[tech.status] ?? 'bg-gray-700 text-gray-400'}`}>{tech.status.replace('_', ' ')}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{tech.area} • {tech.phone ?? 'N/A'}</div>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <div>⭐ {tech.rating}</div>
                      <div>{tech.completedToday} done today</div>
                    </div>
                  </div>
                  {tech.currentJob && (
                    <div className="mt-3 rounded-lg bg-gray-800 p-3 text-xs text-gray-400">
                      <div className="font-medium text-white">Current Job — {tech.currentJob.customer}</div>
                      <div>{tech.currentJob.address}</div>
                      {tech.currentJob.eta && <div className="text-blue-400">ETA: {tech.currentJob.eta}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-5">
          <h2 className="mb-4 text-lg font-semibold">Unassigned Jobs</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-700/50" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {openTickets.length === 0 && (
                <div className="py-8 text-center text-gray-500">No open tickets</div>
              )}
              {openTickets.map((tk) => {
                const triage = tk.aiTriage as Record<string, unknown> | null;
                const availableTech = technicians.find((t) => t.status === 'available');
                return (
                  <div key={tk.id} className="rounded-lg border border-gray-700 bg-gray-900 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">{tk.subject}</div>
                        <div className="text-xs text-gray-500">{tk.category} • Priority: {tk.priority}</div>
                      </div>
                      {triage && (
                        <span className="rounded-full bg-red-900/50 px-2 py-0.5 text-[10px] font-bold text-red-300">⚡ {(triage.urgency as number)}/5</span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-400 line-clamp-2">{tk.body}</div>
                    {availableTech && (
                      <button onClick={() => handleAssign(availableTech.id, tk.id)}
                        className="mt-3 w-full rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-500 transition-colors">
                        Assign to {availableTech.name}
                      </button>
                    )}
                    {!availableTech && (
                      <div className="mt-3 text-xs text-gray-500">No available technicians</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
