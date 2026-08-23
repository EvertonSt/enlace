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

const STATUS_LABELS: Record<string, string> = {
  reported: 'Reported',
  investigating: 'Investigating',
  identified: 'Identified',
  fix_in_progress: 'Fix in Progress',
  resolved: 'Resolved',
};

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
      const statusLabel = STATUS_LABELS[outage.status] ?? outage.status;

      let title: string;
      let body: string;

      if (isNew) {
        title = `${icon} New Outage Reported`;
        body = `${outage.title} — ${outage.affectedArea}`;
        if (outage.affectedCustomerCount > 0) {
          body += ` (${outage.affectedCustomerCount.toLocaleString()} affected)`;
        }
      } else {
        title = `${icon} Outage Updated`;
        body = `${outage.title} → ${statusLabel}`;
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
