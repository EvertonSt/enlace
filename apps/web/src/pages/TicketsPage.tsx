import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth';
import { MOCK_TICKETS } from '../lib/mock-data';
import { formatDate } from '../lib/locale';
import { SearchInput } from '../components/ui/SearchInput';
import { Badge } from '../components/ui/Badge';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { EmptyState } from '../components/ui/ErrorBoundary';
import PageTransition from '../components/ui/PageTransition';
import type { Ticket } from '@enlace/core';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
const URGENCY_COLORS: Record<number, 'success' | 'info' | 'warning' | 'danger' | 'brand'> = { 1: 'success', 2: 'info', 3: 'warning', 4: 'danger', 5: 'danger' };
const STATUS_VARIANTS: Record<TicketStatus, 'success' | 'info' | 'default' | 'brand'> = { open: 'success', in_progress: 'info', resolved: 'default', closed: 'brand' };
const CATEGORY_ICONS: Record<string, string> = { outage: '🔌', billing: '💳', speed: '⚡', equipment: '📦', general: '💬', technical: '🔧' };
const stagger = { animate: { transition: { staggerChildren: 0.04 } } };
const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

export default function TicketsPage() {
  const { t } = useTranslation();
  const { apiFetch, user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);

  // Fetch tickets from API
  useEffect(() => {
    async function fetchTickets() {
      try {
        const data = await apiFetch<Ticket[]>('/api/tickets');
        if (data.length > 0) setTickets(data);
      } catch {
        // Keep mock data
      }
    }
    void fetchTickets();
  }, [apiFetch]);

  const filteredTickets = useMemo(() => tickets.filter((ticket) => {
    const matchesSearch = !searchQuery || ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) || ticket.body.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [tickets, searchQuery, statusFilter]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) { toast.error(t('common.error')); return; }
    setSubmitting(true);
    try {
      await apiFetch('/api/tickets', {
        method: 'POST',
        body: JSON.stringify({ customerId: user?.id ?? 'cust-001', subject, body }),
      });
      toast.success(t('ticket.submitted'));
      setShowForm(false);
      setSubject('');
      setBody('');
      // Refresh tickets
      const data = await apiFetch<Ticket[]>('/api/tickets');
      if (data.length > 0) setTickets(data);
    } catch {
      toast.error('Error');
    } finally {
      setSubmitting(false);
    }
  }

  function handleApproveResponse() { toast.success(t('ticket.triage.approveResponse')); }
  function handleDeleteConfirm() { if (deleteId) { toast.success(t('ticket.status.closed')); setDeleteId(null); } }
  const fb = (s: string) => `flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${statusFilter === s ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`;

  return (
    <PageTransition>
      <motion.div className="space-y-6" variants={stagger} initial="initial" animate="animate">
        <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('ticket.title')}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("ticket.ticketCount", { count: String(filteredTickets.length) })}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-[0.98] dark:bg-brand-500 dark:hover:bg-brand-600">
            + {t('ticket.newTicket')}
          </button>
        </motion.div>

        <AnimatePresence>{showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('ticket.createTicket')}</h2>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('ticket.subject')}</label>
                  <input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white" /></div>
                <div><label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('ticket.description')}</label>
                  <textarea required rows={4} value={body} onChange={(e) => setBody(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white" /></div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="submit" disabled={submitting} className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-700 disabled:opacity-50 dark:bg-brand-500">{submitting ? t('ticket.submitting') : t('ticket.createTicket')}</button>
                  <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">{t('common.cancel')}</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}</AnimatePresence>

        <motion.div variants={fadeUp} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput value={searchQuery} onChange={setSearchQuery} className="flex-1" />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={fb(s)}>{t("ticket.status." + s)}</button>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTickets.length === 0 ? <EmptyState icon="📭" title={t("ticket.noTickets")} />
            : filteredTickets.map((ticket, i) => (
              <TicketCard key={ticket.id} ticket={ticket} index={i} expanded={expandedTicket === ticket.id}
                onToggle={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                onApprove={handleApproveResponse} />
            ))}
          </AnimatePresence>
        </motion.div>
      </motion.div>
      <ConfirmationDialog open={deleteId !== null} title={t("ticket.closeTicket")} confirmLabel={t("ticket.status.closed")} cancelLabel={t("common.cancel")} danger onConfirm={handleDeleteConfirm} onCancel={() => setDeleteId(null)} />
    </PageTransition>
  );
}

function TicketCard({ ticket, index, expanded, onToggle, onApprove }: { ticket: Ticket; index: number; expanded: boolean; onToggle: () => void; onApprove: () => void }) {
  const { t } = useTranslation();
  const triage = ticket.aiTriage;
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.25, delay: index * 0.03 } }}
      exit={{ opacity: 0, scale: 0.95 }} className="rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="cursor-pointer p-5" onClick={onToggle}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base">{CATEGORY_ICONS[ticket.category] ?? '💬'}</span>
              <h3 className="font-semibold text-gray-900 dark:text-white">{ticket.subject}</h3>
              {triage && <Badge variant={URGENCY_COLORS[triage.urgency]} size="sm">⚡ {triage.urgency}/5</Badge>}
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{ticket.body}</p>
          </div>
          <Badge variant={STATUS_VARIANTS[ticket.status as TicketStatus] ?? 'default'} size="sm">{t("ticket.status." + ticket.status)}</Badge>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Badge variant="default" size="sm">{t("ticket.priority." + ticket.priority)}</Badge>
          <Badge variant="default" size="sm">{t("ticket.category." + ticket.category)}</Badge>
          <span>•</span><span>{formatDate(ticket.createdAt)}</span>
          {triage && <><span>•</span><span className="text-brand-600 dark:text-brand-400">🤖 {triage.provider}</span></>}
        </div>
      </div>
      <AnimatePresence>{expanded && triage && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <div className="border-t border-gray-100 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-800/30">
            <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">🤖 {t("ticket.triage.title")}</h4>
            <div className="mb-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div className="rounded-lg bg-white p-2.5 dark:bg-gray-900"><div className="text-gray-500">{t("ticket.triage.provider")}</div><div className="mt-0.5 font-semibold text-gray-900 dark:text-white">{triage.provider}</div></div>
              {triage.model && <div className="rounded-lg bg-white p-2.5 dark:bg-gray-900"><div className="text-gray-500">{t("ticket.triage.model")}</div><div className="mt-0.5 font-semibold text-gray-900 dark:text-white">{triage.model}</div></div>}
              {triage.confidence != null && <div className="rounded-lg bg-white p-2.5 dark:bg-gray-900"><div className="text-gray-500">{t("ticket.triage.confidence")}</div><div className="mt-0.5 font-semibold text-gray-900 dark:text-white">{(triage.confidence * 100).toFixed(0)}%</div></div>}
              <div className="rounded-lg bg-white p-2.5 dark:bg-gray-900"><div className="text-gray-500">{t("ticket.triage.urgency")}</div><div className="mt-0.5"><Badge variant={URGENCY_COLORS[triage.urgency]} size="sm">{triage.urgency}/5</Badge></div></div>
            </div>
            {triage.suggestedResponse && (
              <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-950/50">
                <div className="mb-2 text-xs font-medium text-brand-700 dark:text-brand-300">{t("ticket.triage.suggestedResponse")}</div>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{triage.suggestedResponse}</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button onClick={(e) => { e.stopPropagation(); onApprove(); }} className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 dark:bg-brand-500">✓ {t("ticket.triage.approveResponse")}</button>
                  <button onClick={(e) => e.stopPropagation()} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300">✏️ {t("ticket.triage.editResponse")}</button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}</AnimatePresence>
    </motion.div>
  );
}
