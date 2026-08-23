import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, useColorScheme, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRefresh } from '../src/hooks/useRefresh';
import { useAuth } from '../src/lib/auth';
import type { Invoice } from '@enlace/core';

export default function BillingScreen() {
  const { t } = useTranslation();
  const dark = useColorScheme() === 'dark';
  const c = s(dark);
  const { apiFetch } = useAuth();
  const { refreshing, onRefresh } = useRefresh();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = useCallback(async () => {
    try {
      const data = await apiFetch<Invoice[]>('/api/invoices');
      setInvoices(data);
    } catch {
      // Keep empty
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    if (refreshing) {
      loadInvoices().then(() => {});
    }
  }, [refreshing, loadInvoices]);

  const pendingTotal = invoices
    .filter((inv) => inv.status === 'pending')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <ScrollView style={c.scroll} contentContainerStyle={c.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" colors={['#7c3aed']} />}>
      <Text style={c.title}>{t('billing.title')}</Text>

      {loading ? (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={{ color: dark ? '#94a3b8' : '#6b7280', marginTop: 12 }}>{t('common.loading')}</Text>
        </View>
      ) : (
        <>
          <View style={c.card}>
            <Text style={c.cardTitle}>{t('billing.invoices')}</Text>
            {invoices.length === 0 ? (
              <Text style={{ color: dark ? '#94a3b8' : '#6b7280', fontSize: 14 }}>{t('common.noData')}</Text>
            ) : (
              invoices.map((inv) => (
                <View key={inv.id} style={c.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={c.amount}>R$ {(inv.amount / 100).toFixed(2).replace('.', ',')}</Text>
                    <Text style={c.date}>{t('billing.dueDate')}: {new Date(inv.dueDate).toLocaleDateString('pt-BR')}</Text>
                  </View>
                  <View style={[c.badge, inv.status === 'paid' ? c.badgePaid : c.badgePending]}>
                    <Text style={[c.badgeText, inv.status === 'paid' ? c.badgeTextPaid : c.badgeTextPending]}>{t('billing.status.' + inv.status)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {pendingTotal > 0 && (
            <View style={c.card}>
              <Text style={c.cardTitle}>{t('billing.amountDue')}</Text>
              {invoices.filter((inv) => inv.status === 'pending').map((inv) => (
                <View key={inv.id} style={c.lineItem}>
                  <Text style={c.lineDesc}>{inv.lineItems?.[0]?.description ?? 'Monthly service'}</Text>
                  <Text style={c.lineAmt}>R$ {(inv.amount / 100).toFixed(2).replace('.', ',')}</Text>
                </View>
              ))}
              <View style={c.totalRow}>
                <Text style={c.totalLabel}>Total</Text>
                <Text style={c.totalValue}>R$ {(pendingTotal / 100).toFixed(2).replace('.', ',')}</Text>
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const s = (dark: boolean) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: dark ? '#0f172a' : '#f9fafb' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: 'bold', color: dark ? '#f1f5f9' : '#111827', marginBottom: 16 },
  card: { backgroundColor: dark ? '#1e293b' : '#fff', borderRadius: 12, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: dark ? '#334155' : '#e5e7eb' },
  cardTitle: { fontSize: 17, fontWeight: '600', color: dark ? '#f1f5f9' : '#111827', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: dark ? '#334155' : '#f3f4f6' },
  amount: { fontSize: 16, fontWeight: '600', color: dark ? '#f1f5f9' : '#111827' },
  date: { fontSize: 13, color: dark ? '#94a3b8' : '#6b7280', marginTop: 2 },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgePaid: { backgroundColor: '#dcfce7' }, badgePending: { backgroundColor: '#fef3c7' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextPaid: { color: '#166534' }, badgeTextPending: { color: '#92400e' },
  lineItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: dark ? '#334155' : '#f3f4f6' },
  lineDesc: { fontSize: 14, color: dark ? '#cbd5e1' : '#374151' },
  lineAmt: { fontSize: 14, fontWeight: '500', color: dark ? '#f1f5f9' : '#111827' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: dark ? '#f1f5f9' : '#111827' },
  totalValue: { fontSize: 20, fontWeight: '700', color: '#7c3aed' },
});
