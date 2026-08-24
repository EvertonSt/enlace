import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, StyleSheet, useColorScheme, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRefresh } from '../src/hooks/useRefresh';
import { useOutagePolling } from '../src/hooks/useOutagePolling';
import { useAuth } from '../src/lib/auth';
import type { Invoice, Ticket } from '@enlace/core';

interface PlanInfo {
  name: string;
  speedMbps: number;
  price: number;
  currency: string;
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const dark = useColorScheme() === 'dark';
  const c = s(dark);
  const { apiFetch, customer, user, logout } = useAuth();
  const { refreshing, onRefresh } = useRefresh();
  const { outages, lastUpdated, hasNewChanges, clearChanges } = useOutagePolling(apiFetch);
  const [plan, setPlan] = useState<PlanInfo | null>(customer?.plan ?? null);
  const [nextInvoice, setNextInvoice] = useState<Invoice | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async () => {
    try {
      const ticketsData = await apiFetch<Ticket[]>('/api/tickets');
      setTickets(ticketsData);

      if (customer?.id) {
        try {
          const invoices = await apiFetch<Invoice[]>(`/api/customers/${customer.id}/invoices`);
          if (invoices.length > 0) {
            setNextInvoice(invoices[0] ?? null);
          }
          if (customer.plan) {
            setPlan(customer.plan);
          }
        } catch {
          // Invoice fetch failed — not critical
        }
      }
    } catch {
      // Server unavailable
    } finally {
      setLoading(false);
    }
  }, [apiFetch, customer]);

  useEffect(() => {
    void loadUserData();
  }, [loadUserData]);

  useEffect(() => {
    if (refreshing) {
      loadUserData().then(() => {});
    }
  }, [refreshing, loadUserData]);

  const activeOutages = outages.filter((o) => o.status !== 'resolved');
  const timeAgo = lastUpdated ? getTimeAgo(lastUpdated, t) : '';

  if (loading) {
    return (
      <View style={[c.scroll, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={{ color: dark ? '#94a3b8' : '#6b7280', marginTop: 12 }}>{t('common.loading')}</Text>
      </View>
    );
  }

  function handleLogout() {
    Alert.alert(t('auth.logout'), t('auth.confirmLogout'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('auth.logout'), style: 'destructive', onPress: () => logout() },
    ]);
  }

  return (
    <ScrollView style={c.scroll} contentContainerStyle={c.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" colors={['#7c3aed']} />}>
      <View style={c.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={c.title}>{t('dashboard.title')}</Text>
          {user && <Text style={c.greeting}>{t('dashboard.greeting', { name: user.name?.split(' ')[0] ?? '' })} 👋</Text>}
        </View>
        <TouchableOpacity onPress={handleLogout} style={c.logoutBtn}>
          <Text style={c.logoutText}>{t('auth.logout')}</Text>
        </TouchableOpacity>
      </View>

      {/* Plan */}
      <View style={c.card}>
        <Text style={c.label}>{t('dashboard.currentPlan')}</Text>
        <Text style={c.value}>{plan?.name ?? 'N/A'}</Text>
        <Text style={c.sub}>{plan ? `${plan.speedMbps} Mbps — ${t('dashboard.planDetails.unlimited')}` : ''}</Text>
        {plan && <Text style={c.price}>{t('dashboard.price', { price: plan.price.toFixed(2).replace('.', ',') })}</Text>}
      </View>

      {/* Data Usage */}
      <View style={c.card}>
        <Text style={c.label}>{t('dashboard.dataUsage')}</Text>
        <Text style={c.value}>{tickets.length} {t('ticket.ticketCount', { count: '' }).trim()}</Text>
        <Text style={c.sub}>{t('dashboard.dataUsageCycle')}</Text>
        <View style={c.barBg}><View style={[c.barFill, { width: `${Math.min(tickets.length * 20, 100)}%` }]} /></View>
      </View>

      {/* Next Bill */}
      {nextInvoice && (
        <View style={c.card}>
          <Text style={c.label}>{t('dashboard.nextBill')}</Text>
          <Text style={c.value}>R$ {(nextInvoice.amount / 100).toFixed(2).replace('.', ',')}</Text>
          <Text style={c.sub}>{t('dashboard.dueOn', { date: new Date(nextInvoice.dueDate).toLocaleDateString('pt-BR') })}</Text>
          <View style={c.badge}><Text style={c.badgeText}>{t('billing.status.' + nextInvoice.status)}</Text></View>
        </View>
      )}

      {/* Active Outages */}
      <View style={c.card}>
        <View style={c.outageHeader}>
          <View style={{ flex: 1 }}>
            <Text style={c.label}>{t('dashboard.activeOutages')}</Text>
            {timeAgo && <Text style={c.pollTime}>🟢 {t('common.live')} • {timeAgo}</Text>}
          </View>
          {hasNewChanges && (
            <TouchableOpacity onPress={clearChanges} style={c.newBadge}>
              <Text style={c.newBadgeText}>{t('common.new')}</Text>
            </TouchableOpacity>
          )}
        </View>
        {activeOutages.length === 0 ? (
          <Text style={c.sub}>{t('dashboard.noActiveOutages')}</Text>
        ) : (
          activeOutages.slice(0, 3).map((o) => (
            <View key={o.id} style={c.outageItem}>
              <Text style={c.outageIcon}>
                {o.status === 'fix_in_progress' ? '🔧' : o.status === 'investigating' ? '🔍' : '📡'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={c.outageTitle}>{o.title}</Text>
                <Text style={c.outageSub}>{o.affectedArea} — {o.affectedCustomerCount.toLocaleString()} {t('outage.affectedCustomers', { count: '' }).trim()}</Text>
              </View>
              <View style={[c.statusBadge, { backgroundColor: (STATUS_COLORS[o.status] ?? '#6b7280') + '20' }]}>
                <Text style={[c.statusText, { color: STATUS_COLORS[o.status] ?? '#6b7280' }]}>{t('outage.' + (o.status === 'fix_in_progress' ? 'fixInProgress' : o.status))}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const STATUS_COLORS: Record<string, string> = { fix_in_progress: '#3b82f6', investigating: '#ef4444', identified: '#f97316', reported: '#eab308', resolved: '#22c55e' };

function getTimeAgo(date: Date, t: (key: string, opts?: any) => string): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return t('time.justNow');
  if (seconds < 60) return t('time.secondsAgo', { count: String(seconds) });
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('time.minutesAgo', { count: String(minutes) });
  const hours = Math.floor(minutes / 60);
  return t('time.hoursAgo', { count: String(hours) });
}

const s = (dark: boolean) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: dark ? '#0f172a' : '#f9fafb' },
  content: { padding: 16, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: dark ? '#f1f5f9' : '#111827' },
  greeting: { fontSize: 14, color: dark ? '#94a3b8' : '#6b7280', marginTop: 2 },
  logoutBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: dark ? '#451a1a' : '#fef2f2', marginTop: 4 },
  logoutText: { fontSize: 13, fontWeight: '600', color: '#ef4444' },
  card: { backgroundColor: dark ? '#1e293b' : '#fff', borderRadius: 12, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: dark ? '#334155' : '#e5e7eb' },
  label: { fontSize: 13, color: dark ? '#94a3b8' : '#6b7280', marginBottom: 4, fontWeight: '500' },
  value: { fontSize: 24, fontWeight: 'bold', color: dark ? '#f1f5f9' : '#111827' },
  sub: { fontSize: 13, color: dark ? '#94a3b8' : '#6b7280', marginTop: 2 },
  price: { fontSize: 18, fontWeight: '700', color: '#7c3aed', marginTop: 8 },
  barBg: { height: 8, borderRadius: 4, backgroundColor: dark ? '#334155' : '#e5e7eb', marginTop: 12, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: '#7c3aed' },
  badge: { alignSelf: 'flex-start', backgroundColor: '#fef3c7', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginTop: 8 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#92400e' },
  outageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pollTime: { fontSize: 11, color: '#22c55e', marginTop: 2 },
  newBadge: { backgroundColor: '#ef4444', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  newBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  outageItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: dark ? '#334155' : '#f3f4f6', gap: 10 },
  outageIcon: { fontSize: 20 },
  outageTitle: { fontSize: 14, fontWeight: '500', color: dark ? '#f1f5f9' : '#111827' },
  outageSub: { fontSize: 12, color: dark ? '#94a3b8' : '#6b7280', marginTop: 2 },
  statusBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
});
