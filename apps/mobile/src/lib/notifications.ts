import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OutageEvent } from '@enlace/core';

const SEEN_OUTAGES_KEY = 'enlace-seen-outages';
const STATUS_KEY = 'enlace-outage-statuses';

/**
 * Tracks which outages the user has already been notified about.
 * Compares current outages against previously seen ones and fires
 * local notifications for new or status-changed outages.
 */

async function getSeenIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(SEEN_OUTAGES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

async function saveSeenIds(ids: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(SEEN_OUTAGES_KEY, JSON.stringify([...ids]));
  } catch {
    // Ignore
  }
}

async function getStoredStatuses(): Promise<Map<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(STATUS_KEY);
    return raw ? new Map(Object.entries(JSON.parse(raw))) : new Map();
  } catch {
    return new Map();
  }
}

async function saveStoredStatuses(statuses: Map<string, string>): Promise<void> {
  try {
    const obj: Record<string, string> = {};
    statuses.forEach((v, k) => { obj[k] = v; });
    await AsyncStorage.setItem(STATUS_KEY, JSON.stringify(obj));
  } catch {
    // Ignore
  }
}

import i18n from '../i18n';
import { translateOutageTitle, translateOutageArea } from './outageText';

function getStatusLabel(status: string): string {
  return i18n.t('outage.' + (status === 'fix_in_progress' ? 'fixInProgress' : status));
}

const STATUS_ICONS: Record<string, string> = {
  reported: '📡',
  investigating: '🔍',
  identified: '⚠️',
  fix_in_progress: '🔧',
  resolved: '✅',
};

/**
 * Compare current outages with previously seen ones.
 * Sends local notifications for:
 *  - Brand new outages
 *  - Status changes on existing outages
 * Returns the count of notifications sent.
 */
export async function checkAndNotify(outages: OutageEvent[]): Promise<number> {
  const seenIds = await getSeenIds();
  const storedStatuses = await getStoredStatuses();
  const currentIds = new Set(outages.map((o) => o.id));
  let notified = 0;

  for (const outage of outages) {
    const isNew = !seenIds.has(outage.id);
    const prevStatus = storedStatuses.get(outage.id);
    const statusChanged = prevStatus && prevStatus !== outage.status;

    if (isNew || statusChanged) {
      const icon = STATUS_ICONS[outage.status] ?? '📢';
      const statusLabel = getStatusLabel(outage.status);

      let title: string;
      let body: string;

      if (isNew) {
        title = `${icon} ${i18n.t('outage.newOutage')}`;
        body = `${translateOutageTitle(outage.title, i18n)} — ${translateOutageArea(outage.affectedArea, i18n)}`;
        if (outage.affectedCustomerCount > 0) {
          body += ` (${outage.affectedCustomerCount.toLocaleString()} ${i18n.t('outage.affected')})`;
        }
      } else {
        title = `${icon} ${i18n.t('outage.updated')}`;
        body = `${translateOutageTitle(outage.title, i18n)} → ${statusLabel}`;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { outageId: outage.id },
          sound: true,
          ...(Platform.OS === 'android' ? { channelId: 'outage-alerts' } : {}),
        },
        trigger: null, // immediate
      });

      notified++;
    }
  }

  // Update stored state
  const newSeen = new Set([...seenIds, ...currentIds]);
  const newStatuses = new Map(storedStatuses);
  for (const o of outages) {
    newStatuses.set(o.id, o.status);
  }

  // Prune resolved outages from seen list (after 24h they're no longer relevant)
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const id of newSeen) {
    if (!currentIds.has(id)) {
      const outage = outages.find((o) => o.id === id);
      if (!outage || new Date(outage.createdAt).getTime() < cutoff) {
        newSeen.delete(id);
        newStatuses.delete(id);
      }
    }
  }

  await saveSeenIds(newSeen);
  await saveStoredStatuses(newStatuses);

  return notified;
}

/**
 * Fires a single sample outage alert so the user can verify the
 * notification pipeline (permission → channel → display) works.
 * Returns true if the notification was scheduled, false if permission denied.
 */
export async function sendTestNotification(): Promise<boolean> {
  const { status: current } = await Notifications.getPermissionsAsync();
  let status = current;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('outage-alerts', {
      name: 'Outage Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7c3aed',
      sound: 'default',
    });
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `📡 ${i18n.t('outage.newOutage')}`,
      body: i18n.t('settings.testNotificationBody'),
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: 'outage-alerts' } : {}),
    },
    trigger: null,
  });

  return true;
}
