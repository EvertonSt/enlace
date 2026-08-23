import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { formatDate } from '../lib/locale';
import type { Ticket } from '@enlace/core';

interface CustomerWithPlan {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  status: string;
  planId: string;
  createdAt: string;
  plan?: { name: string; speedMbps: number };
}

export default function CustomerLookup() {
  const { t } = useTranslation();
  const { apiFetch } = useAuth();
  const [customers, setCustomers] = useState<CustomerWithPlan[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [c, tk] = await Promise.all([
          apiFetch<CustomerWithPlan[]>('/api/customers'),
          apiFetch<Ticket[]>('/api/tickets'),
        ]);
        setCustomers(c);
        setTickets(tk);
      } catch {
        // Keep empty
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [apiFetch]);

  const results = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.id.includes(q) || (c.phone ?? '').includes(q));
  }, [customers, search]);

  const customer = customers.find((c) => c.id === selected);
  const customerTickets = selected ? tickets.filter((tk) => tk.customerId === selected) : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <h1 className="text-2xl font-bold">{t('nav.customerLookup', 'Customer Lookup')}</h1>
      <input value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none"
        placeholder="Search by name, email, phone, or ID..." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-1">
          {loading ? (
            [1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-700/50" />)
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No customers found</div>
          ) : (
            results.map((c) => (
              <div key={c.id} onClick={() => setSelected(c.id)}
                className={`cursor-pointer rounded-lg border p-3 transition-all ${selected === c.id ? 'border-brand-500 bg-brand-950/30' : 'border-gray-800 bg-gray-800/50 hover:border-gray-700'}`}>
                <div className="font-medium text-white">{c.name}</div>
                <div className="text-xs text-gray-400">{c.plan?.name ?? 'Unknown plan'}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <span>{tickets.filter((tk) => tk.customerId === c.id).length} tickets</span>
                  <span>•</span>
                  <span>Since {formatDate(c.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {loading ? (
            <div className="h-64 animate-pulse rounded-xl bg-gray-700/50" />
          ) : customer ? (
            <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-5 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-white">{customer.name}</h2>
                <span className="inline-block rounded-full bg-green-900/50 px-2 py-0.5 text-xs text-green-300">{customer.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Email:</span> <span className="text-white">{customer.email}</span></div>
                <div><span className="text-gray-500">Phone:</span> <span className="text-white">{customer.phone ?? 'N/A'}</span></div>
                <div><span className="text-gray-500">Plan:</span> <span className="text-white">{customer.plan?.name ?? 'Unknown'}</span></div>
                <div><span className="text-gray-500">Customer since:</span> <span className="text-white">{formatDate(customer.createdAt)}</span></div>
                <div className="col-span-2"><span className="text-gray-500">Address:</span> <span className="text-white">{customer.address ?? 'N/A'}</span></div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-400">Ticket History ({customerTickets.length})</h3>
                <div className="space-y-2">
                  {customerTickets.map((tk) => (
                    <div key={tk.id} className="rounded-lg border border-gray-700 bg-gray-900 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{tk.subject}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${tk.status === 'open' ? 'bg-green-900/50 text-green-300' : tk.status === 'in_progress' ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-700 text-gray-400'}`}>{tk.status}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{tk.category} • {formatDate(tk.createdAt)}</div>
                    </div>
                  ))}
                  {customerTickets.length === 0 && <div className="text-sm text-gray-500">No tickets</div>}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-gray-500">Select a customer to view details</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
