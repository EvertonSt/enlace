import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRefresh } from '../src/hooks/useRefresh';
import { useOutagePolling } from '../src/hooks/useOutagePolling';
import { useAuth } from '../src/lib/auth';
import { useTheme } from '../src/lib/ThemeContext';
import { translateOutageTitle, translateOutageArea } from '../src/lib/outageText';

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

export default function OutagesScreen() {
  const { t, i18n } = useTranslation();
  const { isDark: dark } = useTheme();
  const c = s(dark);
  const { apiFetch } = useAuth();
  const { refreshing, onRefresh } = useRefresh();
  const { outages, loading, lastUpdated, isPolling } = useOutagePolling(apiFetch, 20_000);
  const timeAgo = lastUpdated ? getTimeAgo(lastUpdated, t) : '';

  return (
    <ScrollView style={c.scroll} contentContainerStyle={c.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" colors={['#7c3aed']} />}>
      <View style={c.titleRow}>
        {timeAgo && (
          <View style={c.liveIndicator}>
            <View style={[c.liveDot, isPolling && c.liveDotActive]} />
            <Text style={c.liveText}>{t('outage.live')} • {timeAgo}</Text>
          </View>
        )}
      </View>
      <View style={c.legend}>
        {Object.entries(STATUS_COLORS).filter(([k]) => k !== 'resolved').map(([k, col]) => (
          <View key={k} style={c.legendItem}><View style={[c.dot, { backgroundColor: col }]} /><Text style={c.legendText}>{t('outage.' + (k === 'fix_in_progress' ? 'fixInProgress' : k))}</Text></View>
        ))}
      </View>

      {loading ? (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={{ color: dark ? '#94a3b8' : '#6b7280', marginTop: 12 }}>{t('common.loading')}</Text>
        </View>
      ) : outages.length === 0 ? (
        <View style={c.emptyCard}>
          <Text style={c.emptyText}>{t('dashboard.noActiveOutages')}</Text>
        </View>
      ) : (
        outages.map((o) => (
          <View key={o.id} style={c.card}>
            <View style={c.cardHeader}>
              <Text style={c.cardTitle}>{/* RAW USER DATA: outage.title — API-sourced, translated via slug map */}{translateOutageTitle(o.title, t)}</Text>
              <View style={[c.statusBadge, { backgroundColor: (STATUS_COLORS[o.status] ?? '#6b7280') + '20' }]}>
                <Text style={[c.statusText, { color: STATUS_COLORS[o.status] ?? '#6b7280' }]}>{t('outage.' + (o.status === 'fix_in_progress' ? 'fixInProgress' : o.status))}</Text>
              </View>
            </View>
            <Text style={c.cardSub}>{translateOutageArea(o.affectedArea, t)} — {(o.affectedCustomerCount ?? 0).toLocaleString()} {t('outage.affectedCustomers', { count: '' }).trim()}</Text>
            {o.description && <Text style={c.desc}>{/* RAW USER DATA: outage.description — operator-submitted, not translated */}{o.description}</Text>}
            {o.estimatedResolution && <Text style={c.eta}>{t('outage.eta')}: {new Date(o.estimatedResolution).toLocaleTimeString(i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</Text>}
          </View>
        ))
      )}
      {!loading && outages.length > 0 && (
        <Text style={c.apiNote}>{/* SYSTEM UI: outage.apiDataNote — translated via i18n */}{t('outage.apiDataNote')}</Text>
      )}
    </ScrollView>
  );
}

const s = (dark: boolean) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: dark ? '#0f172a' : '#f9fafb' },
  content: { padding: 16, paddingBottom: 32 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: dark ? '#f1f5f9' : '#111827', flexShrink: 1 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: dark ? '#1e3a2a' : '#dcfce7', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6b7280' },
  liveDotActive: { backgroundColor: '#22c55e' },
  liveText: { fontSize: 11, fontWeight: '600', color: '#22c55e' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: dark ? '#94a3b8' : '#6b7280' },
  card: { backgroundColor: dark ? '#1e293b' : '#fff', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: dark ? '#334155' : '#e5e7eb' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: dark ? '#f1f5f9' : '#111827', flex: 1, marginRight: 8 },
  statusBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardSub: { fontSize: 13, color: dark ? '#94a3b8' : '#6b7280', marginTop: 6 },
  desc: { fontSize: 12, color: dark ? '#94a3b8' : '#6b7280', marginTop: 4 },
  eta: { fontSize: 12, color: '#3b82f6', marginTop: 4, fontWeight: '500' },
  emptyCard: { backgroundColor: dark ? '#1e293b' : '#fff', borderRadius: 12, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: dark ? '#334155' : '#e5e7eb' },
  emptyText: { fontSize: 14, color: dark ? '#94a3b8' : '#6b7280' },
  apiNote: { fontSize: 11, color: dark ? '#64748b' : '#9ca3af', marginTop: 14, paddingHorizontal: 4, fontStyle: 'italic' },
});
