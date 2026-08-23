import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/auth';
import { MOCK_INVOICE } from '../lib/mock-data';
import { formatCurrency, formatDate } from '../lib/locale';

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: string;
  lineItems: Array<{ description: string; amount: number }>;
  createdAt: string;
}

export default function BillingPage() {
  const { t } = useTranslation();
  const { apiFetch } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([{ ...MOCK_INVOICE, lineItems: MOCK_INVOICE.lineItems } as Invoice]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const data = await apiFetch<Invoice[]>('/api/invoices');
        if (data.length > 0 && data[0]) {
          setInvoices(data);
          setSelectedInvoice(data[0]);
        }
      } catch {
        // Keep mock data
      }
    }
    void fetchInvoices();
  }, [apiFetch]);

  const current = selectedInvoice ?? invoices[0] ?? MOCK_INVOICE;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('billing.title')}</h1>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {t('billing.invoices')}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left dark:border-gray-800">
                <th className="pb-3 pr-4 font-medium text-gray-500 dark:text-gray-400">{t('billing.amountDue')}</th>
                <th className="pb-3 pr-4 font-medium text-gray-500 dark:text-gray-400">{t('billing.dueDate')}</th>
                <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}
                  className={`cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 ${current.id === inv.id ? 'bg-brand-50 dark:bg-brand-950/20' : ''}`}
                  onClick={() => setSelectedInvoice(inv)}>
                  <td className="py-4 pr-4 font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(inv.amount)}
                  </td>
                  <td className="py-4 pr-4 text-gray-600 dark:text-gray-400">
                    {formatDate(inv.dueDate)}
                  </td>
                  <td className="py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      inv.status === 'paid'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                        : inv.status === 'overdue'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                    }`}>
                      {t(`billing.status.${inv.status}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {current && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
            {t('billing.amountDue')} — {formatDate(current.createdAt)}
          </h3>
          {(current.lineItems ?? []).map((item, i) => (
            <div key={i} className="flex items-center justify-between border-b border-gray-100 py-3 text-sm last:border-0 dark:border-gray-800">
              <span className="text-gray-700 dark:text-gray-300">{item.description}</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.amount)}</span>
            </div>
          ))}
          <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-800">
            <span className="font-semibold text-gray-900 dark:text-white">Total</span>
            <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
              {formatCurrency(current.amount)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
