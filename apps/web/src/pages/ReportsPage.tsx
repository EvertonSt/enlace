import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { useAuth } from '../lib/auth';

const CHART_COLORS = ['#7c3aed', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

interface Overview {
  totalCustomers: number;
  totalTickets: number;
  openTickets: number;
  totalRevenue: number;
  totalOutages: number;
  activeOutages: number;
  avgRevenuePerCustomer: number;
}

interface StatusCount { status: string; count: number }
interface CategoryCount { category: string; count: number }
interface DayCount { date: string; count: number }
interface PlanCount { plan: string; count: number; price: number; revenue: number }
interface MonthRevenue { month: string; revenue: number }
interface AffectedArea { title: string; affectedArea: string; affectedCustomerCount: number; status: string }
interface TechPerf { name: string; rating: number; completedToday: number; status: string }

const STATUS_LABELS: Record<string, string> = {
  open: 'Open', in_progress: 'In Progress', waiting_customer: 'Waiting',
  resolved: 'Resolved', closed: 'Closed',
  reported: 'Reported', investigating: 'Investigating', identified: 'Identified',
  fix_in_progress: 'Fix in Progress',
};
const STATUS_COLORS: Record<string, string> = {
  open: '#22c55e', in_progress: '#3b82f6', waiting_customer: '#f59e0b',
  resolved: '#94a3b8', closed: '#64748b',
  reported: '#eab308', investigating: '#ef4444', identified: '#f97316',
  fix_in_progress: '#3b82f6',
};

function MetricCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className={`rounded-xl p-5 ${color}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium opacity-80">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="mt-2 text-3xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</div>
    </div>
  );
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const { apiFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [ticketsByStatus, setTicketsByStatus] = useState<StatusCount[]>([]);
  const [ticketsByCategory, setTicketsByCategory] = useState<CategoryCount[]>([]);
  const [ticketsByDay, setTicketsByDay] = useState<DayCount[]>([]);
  const [outagesByStatus, setOutagesByStatus] = useState<StatusCount[]>([]);
  const [outagesAffected, setOutagesAffected] = useState<AffectedArea[]>([]);
  const [customersByPlan, setCustomersByPlan] = useState<PlanCount[]>([]);
  const [revenueMonthly, setRevenueMonthly] = useState<MonthRevenue[]>([]);
  const [techPerformance, setTechPerformance] = useState<TechPerf[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [ov, tbs, tbc, tbd, obs, oa, cbp, rm, tp] = await Promise.all([
          apiFetch<Overview>('/api/analytics/overview'),
          apiFetch<StatusCount[]>('/api/analytics/tickets/by-status'),
          apiFetch<CategoryCount[]>('/api/analytics/tickets/by-category'),
          apiFetch<DayCount[]>('/api/analytics/tickets/by-day'),
          apiFetch<StatusCount[]>('/api/analytics/outages/by-status'),
          apiFetch<AffectedArea[]>('/api/analytics/outages/affected'),
          apiFetch<PlanCount[]>('/api/analytics/customers/by-plan'),
          apiFetch<MonthRevenue[]>('/api/analytics/revenue/monthly'),
          apiFetch<TechPerf[]>('/api/analytics/technicians/performance'),
        ]);
        setOverview(ov);
        setTicketsByStatus(tbs);
        setTicketsByCategory(tbc);
        setTicketsByDay(tbd);
        setOutagesByStatus(obs);
        setOutagesAffected(oa);
        setCustomersByPlan(cbp);
        setRevenueMonthly(rm);
        setTechPerformance(tp);
      } catch {
        // Keep defaults
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [apiFetch]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {t('nav.reports', 'Reports & Analytics')}
      </h1>

      {/* KPI Cards */}
      {overview && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total Customers" value={overview.totalCustomers} icon="👥" color="bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" />
          <MetricCard label="Open Tickets" value={overview.openTickets} icon="🎫" color="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" />
          <MetricCard label="Active Outages" value={overview.activeOutages} icon="🔴" color="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" />
          <MetricCard label="Monthly Revenue" value={`R$ ${overview.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon="💰" color="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tickets by Status (Pie) */}
        <ChartCard title="Tickets by Status">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={ticketsByStatus.map((d) => ({ ...d, name: STATUS_LABELS[d.status] ?? d.status }))}
                dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {ticketsByStatus.map((d, i) => (
                  <Cell key={d.status} fill={STATUS_COLORS[d.status] ?? CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Tickets by Category (Bar) */}
        <ChartCard title="Tickets by Category">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ticketsByCategory.map((d) => ({ ...d, name: d.category.charAt(0).toUpperCase() + d.category.slice(1) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Tickets Trend (Line) */}
        <ChartCard title="Ticket Trend (Last 30 Days)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={ticketsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Customers by Plan (Bar) */}
        <ChartCard title="Customers by Plan">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={customersByPlan}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="plan" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(v, name) => name === 'revenue' ? `R$ ${Number(v).toFixed(2)}` : v} />
              <Legend />
              <Bar dataKey="count" name="Customers" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Outages by Status (Pie) */}
        <ChartCard title="Outages by Status">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={outagesByStatus.filter((d) => d.count > 0).map((d) => ({ ...d, name: STATUS_LABELS[d.status] ?? d.status }))}
                dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {outagesByStatus.filter((d) => d.count > 0).map((d, i) => (
                  <Cell key={d.status} fill={STATUS_COLORS[d.status] ?? CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Customers Affected by Outages (Bar) */}
        <ChartCard title="Customers Affected by Active Outages">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={outagesAffected.map((d) => ({ ...d, name: d.title.length > 25 ? d.title.slice(0, 25) + '...' : d.title }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="affectedCustomerCount" name="Affected" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Technician Performance Table */}
      <ChartCard title="Technician Performance">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Technician</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Rating</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Completed Today</th>
              </tr>
            </thead>
            <tbody>
              {techPerformance.map((tech) => (
                <tr key={tech.name} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{tech.name}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      tech.status === 'available' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      tech.status === 'on_job' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                      'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {tech.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">⭐ {tech.rating}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{tech.completedToday}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
      {children}
    </div>
  );
}
