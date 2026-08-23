import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TextInput, TouchableOpacity, StyleSheet, Alert, useColorScheme, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRefresh } from '../src/hooks/useRefresh';
import { useAuth } from '../src/lib/auth';
import type { Ticket } from '@enlace/core';

const URG_BG: Record<number, string> = { 1: '#dcfce7', 2: '#dbeafe', 3: '#fef9c3', 4: '#fed7aa', 5: '#fecaca' };
const URG_FG: Record<number, string> = { 1: '#166534', 2: '#1e40af', 3: '#854d0e', 4: '#9a3412', 5: '#991b1b' };

export default function TicketsScreen() {
  const { t } = useTranslation();
  const dark = useColorScheme() === 'dark';
  const c = s(dark);
  const { apiFetch, user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshing, onRefresh } = useRefresh();

  const loadTickets = useCallback(async () => {
    try {
      const data = await apiFetch<Ticket[]>('/api/tickets');
      setTickets(data);
    } catch {
      // Keep empty
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (refreshing) {
      loadTickets().then(() => {});
    }
  }, [refreshing, loadTickets]);

  async function handleSubmit() {
    if (!subject.trim() || !body.trim()) { Alert.alert(t('common.error'), t('auth.emailRequired')); return; }
    setSubmitting(true);
    try {
      const customerId = user?.id ?? '';
      const newTicket = await apiFetch<Ticket>('/api/tickets', {
        method: 'POST',
        body: JSON.stringify({ customerId, subject, body }),
      });
      setTickets((prev) => [newTicket, ...prev]);
      Alert.alert(t('ticket.createTicket'), t('ticket.triage.title'));
      setShowForm(false); setSubject(''); setBody('');
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  }

  function getUrgency(ticket: Ticket): number | null {
    if (!ticket.aiTriage) return null;
    const triage = ticket.aiTriage as Record<string, unknown>;
    return typeof triage.urgency === 'number' ? triage.urgency : null;
  }

  return (
    <ScrollView style={c.scroll} contentContainerStyle={c.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" colors={['#7c3aed']} />}>
      <View style={c.header}>
        <Text style={c.title}>{t('ticket.title')}</Text>
        <TouchableOpacity style={c.addBtn} onPress={() => setShowForm(!showForm)}>
          <Text style={c.addBtnText}>+ {t('ticket.newTicket')}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={c.form}>
          <Text style={c.formTitle}>{t('ticket.createTicket')}</Text>
          <Text style={c.label}>{t('ticket.subject')}</Text>
          <TextInput style={c.input} value={subject} onChangeText={setSubject} placeholderTextColor={dark ? '#64748b' : '#9ca3af'} />
          <Text style={c.label}>{t('ticket.description')}</Text>
          <TextInput style={[c.input, { height: 80 }]} value={body} onChangeText={setBody} multiline placeholderTextColor={dark ? '#64748b' : '#9ca3af'} />
          <View style={c.formActions}>
            <TouchableOpacity style={[c.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
              <Text style={c.submitText}>{submitting ? t('ticket.submitting') : t('ticket.createTicket')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowForm(false)}><Text style={c.cancelText}>{t('common.cancel')}</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={{ color: dark ? '#94a3b8' : '#6b7280', marginTop: 12 }}>{t('common.loading')}</Text>
        </View>
      ) : tickets.length === 0 ? (
        <View style={c.emptyCard}>
          <Text style={c.emptyText}>{t('ticket.noTickets')}</Text>
        </View>
      ) : (
        tickets.map((tk) => {
          const urgency = getUrgency(tk);
          return (
            <View key={tk.id} style={c.card}>
              <View style={c.cardHeader}>
                <Text style={c.subject} numberOfLines={1}>{tk.subject}</Text>
                {urgency && (
                  <View style={[c.urgBadge, { backgroundColor: URG_BG[urgency] ?? '#f3f4f6' }]}>
                    <Text style={[c.urgText, { color: URG_FG[urgency] ?? '#374151' }]}>⚡{urgency}/5</Text>
                  </View>
                )}
              </View>
              <View style={c.cardMeta}>
                <Text style={c.metaText}>{t('ticket.category.' + tk.category)}</Text>
                <Text style={c.metaText}>•</Text>
                <Text style={c.metaText}>{new Date(tk.createdAt).toLocaleDateString('pt-BR')}</Text>
                <Text style={c.metaText}>•</Text>
                <Text style={[c.statusText, { color: tk.status === 'open' ? '#22c55e' : tk.status === 'in_progress' ? '#3b82f6' : '#6b7280' }]}>{t('ticket.status.' + tk.status)}</Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const s = (dark: boolean) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: dark ? '#0f172a' : '#f9fafb' },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: dark ? '#f1f5f9' : '#111827' },
  addBtn: { backgroundColor: '#7c3aed', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  form: { backgroundColor: dark ? '#1e293b' : '#fff', borderRadius: 12, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: dark ? '#334155' : '#e5e7eb' },
  formTitle: { fontSize: 17, fontWeight: '600', color: dark ? '#f1f5f9' : '#111827', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '500', color: dark ? '#cbd5e1' : '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: dark ? '#475569' : '#d1d5db', borderRadius: 10, padding: 12, fontSize: 14, color: dark ? '#f1f5f9' : '#111827', marginBottom: 12, backgroundColor: dark ? '#0f172a' : '#f9fafb' },
  formActions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  submitBtn: { backgroundColor: '#7c3aed', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  cancelText: { color: dark ? '#94a3b8' : '#6b7280', fontSize: 14 },
  card: { backgroundColor: dark ? '#1e293b' : '#fff', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: dark ? '#334155' : '#e5e7eb' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subject: { fontSize: 15, fontWeight: '600', color: dark ? '#f1f5f9' : '#111827', flex: 1, marginRight: 8 },
  urgBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  urgText: { fontSize: 11, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', gap: 6, marginTop: 8 },
  metaText: { fontSize: 12, color: dark ? '#94a3b8' : '#6b7280' },
  statusText: { fontSize: 12, fontWeight: '600' },
  emptyCard: { backgroundColor: dark ? '#1e293b' : '#fff', borderRadius: 12, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: dark ? '#334155' : '#e5e7eb' },
  emptyText: { fontSize: 14, color: dark ? '#94a3b8' : '#6b7280' },
});
