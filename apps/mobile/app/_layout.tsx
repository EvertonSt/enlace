import { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import '../src/i18n';
import { AnimatedSplash } from '../src/components/AnimatedSplash';
import { AuthProvider, useAuth } from '../src/lib/auth';
import { ThemeProvider, useTheme } from '../src/lib/ThemeContext';
import { useNetworkStatus } from '../src/hooks/useNetworkStatus';
import { useNotifications } from '../src/hooks/useNotifications';

function TabIcon({ emoji, size }: { emoji: string; size: number }) {
  return <Text style={{ fontSize: size * 0.7 }}>{emoji}</Text>;
}

function LogoutButton() {
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const { isDark } = useTheme();

  function handleLogout() {
    Alert.alert(
      'Logout',
      `Sign out${user?.name ? ` (${user.name})` : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => logout() },
      ],
    );
  }

  return (
    <TouchableOpacity onPress={handleLogout}
      style={{ marginRight: 16, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: isDark ? '#334155' : '#f3f4f6' }}>
      <Text style={{ fontSize: 13, color: isDark ? '#f87171' : '#ef4444', fontWeight: '600' }}>{t('auth.logout')}</Text>
    </TouchableOpacity>
  );
}

function OfflineBanner() {
  const { isOnline, setOnline } = useAuth();
  const { isConnected } = useNetworkStatus();
  const { isDark } = useTheme();

  useEffect(() => {
    setOnline(isConnected);
  }, [isConnected, setOnline]);

  if (isConnected) return null;

  return (
    <View style={[offlineStyles.banner, { backgroundColor: isDark ? '#7f1d1d' : '#fef2f2' }]}>
      <Text style={[offlineStyles.text, { color: isDark ? '#fca5a5' : '#991b1b' }]}>
        ⚠️ You're offline — showing cached data
      </Text>
    </View>
  );
}

const offlineStyles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    paddingTop: Platform.OS === 'ios' ? 54 : 38,
    paddingBottom: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: { fontSize: 13, fontWeight: '600' },
});

function AppTabs() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { permission } = useNotifications();

  function triggerHaptic() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }

  useEffect(() => {
    if (permission === 'granted') {
      console.log('🔔 Push notifications enabled');
    } else if (permission === 'denied') {
      console.log('🔕 Push notifications denied');
    }
  }, [permission]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: isDark ? '#64748b' : '#9ca3af',
        tabBarLabelStyle: { fontSize: 10, numberOfLines: 2, marginBottom: 2 },
        tabBarStyle: {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderTopColor: isDark ? '#1e293b' : '#e5e7eb',
        },
        headerStyle: {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
        },
        headerTintColor: isDark ? '#f1f5f9' : '#111827',
        headerShadowVisible: false,
        headerRight: () => <LogoutButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('auth.login'),
          headerShown: false,
          href: undefined,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('dashboard.title'),
          tabBarLabel: t('nav.dashboard'),
          tabBarIcon: ({ size }) => <TabIcon emoji="🏠" size={size} />,
        }}
        listeners={{ focus: triggerHaptic }}
      />
      <Tabs.Screen
        name="outages"
        options={{
          title: t('outage.title'),
          tabBarLabel: t('nav.outages'),
          tabBarIcon: ({ size }) => <TabIcon emoji="📡" size={size} />,
        }}
        listeners={{ focus: triggerHaptic }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: t('ticket.title'),
          tabBarLabel: t('nav.tickets'),
          tabBarIcon: ({ size }) => <TabIcon emoji="🎫" size={size} />,
        }}
        listeners={{ focus: triggerHaptic }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: t('billing.title'),
          tabBarLabel: t('nav.billing'),
          tabBarIcon: ({ size }) => <TabIcon emoji="💳" size={size} />,
        }}
        listeners={{ focus: triggerHaptic }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('common.settings'),
          tabBarLabel: t('nav.settings'),
          tabBarIcon: ({ size }) => <TabIcon emoji="⚙️" size={size} />,
        }}
        listeners={{ focus: triggerHaptic }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <ThemeProvider>
      <AuthProvider>
        {!splashDone && (
          <AnimatedSplash onAnimationComplete={() => setSplashDone(true)} />
        )}
        {splashDone && (
          <>
            <OfflineBanner />
            <AppTabs />
          </>
        )}
      </AuthProvider>
    </ThemeProvider>
  );
}
