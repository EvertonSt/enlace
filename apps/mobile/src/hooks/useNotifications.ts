import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationState {
  permission: 'granted' | 'denied' | 'undetermined';
  expoPushToken: string | null;
}

/**
 * Registers the device for push notifications and returns the push token.
 * On Android, creates a notification channel for outage alerts.
 */
export function useNotifications(): NotificationState {
  const [state, setState] = useState<NotificationState>({
    permission: 'undetermined',
    expoPushToken: null,
  });
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    registered.current = true;

    async function register() {
      // Only runs on physical devices (not simulators/emulators for push)
      if (!Device.isDevice) {
        setState({ permission: 'denied', expoPushToken: null });
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setState({ permission: 'denied', expoPushToken: null });
        return;
      }

      // Android: create notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('outage-alerts', {
          name: 'Outage Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#7c3aed',
          sound: 'default',
        });
      }

      // Get push token (for future server-side push). Non-fatal if it fails
      // (e.g. no EAS project configured) — local notifications still work.
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        setState({ permission: 'granted', expoPushToken: tokenData.data });
      } catch {
        setState({ permission: 'granted', expoPushToken: null });
      }
    }

    void register();
  }, []);

  return state;
}
