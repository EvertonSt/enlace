import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { MOCK_PLAN, MOCK_USAGE, MOCK_INVOICE, MOCK_TICKETS } from '../lib/mock-data';
import { useOutages } from '../lib/use-outages';
import { formatCurrency, formatDate, formatNumber } from '../lib/locale';
import OutageMap from '../components/OutageMap';
import PageTransition from '../components/ui/PageTransition';
import { EmptyState } from '../components/ui/ErrorBoundary';
import { Badge } from '../components/ui/Badge';

const STATUS_VARIANTS: Record<string, 'success' | 'info' | 'default'> = { open: 'success', in_progress: 'info', resolved: 'default', closed: 'default' };

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const { apiFetch, customer } = useAuth();
  const { activeOutages, connected } = useOutages();

  const [plan, setPlan] = useState(MOCK_PLAN);
  const [usage] = useState(MOCK_USAGE);
  const [nextInvoice, setNextInvoice] = useState(MOCK_INVOICE);
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch plan from customer data or plans endpoint
        if (customer?.plan) {
          setPlan(customer.plan);
        }

        // Fetch invoices
        const invs = await apiFetch<Array<{ id: string; amount: number; dueDate: string; status: string; lineItems: Array<{ description: string; amount: number }> }>>('/api/invoices');
        if (invs.length > 0 && invs[0]) {
          setNextInvoice(invs[0] as typeof MOCK_INVOICE);
        }

        // Fetch tickets
        const tkts = await apiFetch<Array<{ id: string; subject: string; body: string; status: string; priority: string; category: string; aiTriage: Record<string, unknown> | null; createdAt: string }>>('/api/tickets');
        if (tkts.length > 0) {
          setTickets(tkts as typeof MOCK_TICKETS);
        }

        setIsDemo(false);
      } catch {
        // Server unavailable — keep mock data
      }
    }
    void fetchData();
  }, [apiFetch, customer]);

  return (
    <PageTransition>
      <motion.div
        className="space-y-6"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        <motion.h1 variants={fadeUp} className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('dashboard.title')}
          {isDemo && <span className="ml-2 text-sm font-normal text-gray-400">({t("common.demo")})</span>}
        </motion.h1>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <motion.div variants={fadeUp} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:shadow-lg dark:hover:shadow-brand-500/5">
            <div className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.currentPlan')}</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('dashboard.planDetails.speed', { speed: String(plan.speedMbps) })}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.planDetails.unlimited')}</div>
            <div className="mt-3 text-lg font-bold text-brand-600 dark:text-brand-400">
              {formatCurrency(plan.price)}<span className="text-sm font-normal text-gray-500">{t("dashboard.perMonth")}</span>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:shadow-lg dark:hover:shadow-brand-500/5">
            <div className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.dataUsage')}</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatNumber(usage.usedGb)} GB</div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('dashboard.dataUsageCycle')}</div>
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(usage.usedGb / 20, 100)}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:shadow-lg dark:hover:shadow-brand-500/5">
            <div className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.nextBill')}</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(nextInvoice.amount)}</div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('dashboard.dueOn', { date: formatDate(nextInvoice.dueDate) })}</div>
            <div className="mt-3">
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
                {t('billing.status.pending')}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Map + outages */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:col-span-3">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('outage.title')}</h2>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
                {connected ? t('outage.live') : t('outage.offline')}
              </div>
            </div>
            <OutageMap outages={activeOutages} height="320px" zoom={11} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
            <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
              {t('dashboard.activeOutages')}
              {activeOutages.length > 0 && (
                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                  {activeOutages.length}
                </span>
              )}
            </h2>
            {activeOutages.length === 0 ? (
              <EmptyState icon="✅" title={t('dashboard.noActiveOutages')} />
            ) : (
              <div className="space-y-3">
                {activeOutages.map((outage) => (
                  <div key={outage.id} className="rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium text-gray-900 dark:text-white">{outage.title}</div>
                        <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                          {outage.affectedArea} — {t("dashboard.customersAffected", { count: formatNumber(outage.affectedCustomerCount) })}
                        </div>
                      </div>
                      <span className={`inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        outage.status === 'fix_in_progress'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
                      }`}>
                        {t(`outage.${outage.status === 'fix_in_progress' ? 'fixInProgress' : 'investigating'}`)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent tickets */}
        <motion.div variants={fadeUp} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('ticket.title')}</h2>
          </div>
          <div className="space-y-2">
            {tickets.slice(0, 3).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium text-gray-900 dark:text-white">{ticket.subject}</div>
                  <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{t("ticket.category." + ticket.category)}</div>
                </div>
                <Badge variant={STATUS_VARIANTS[ticket.status] ?? 'default'} size="sm">{t("ticket.status." + ticket.status)}</Badge>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}
