import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/lib/auth';
import { useTheme, type ThemePreference } from '../src/lib/ThemeContext';
import { useBiometrics } from '../src/hooks/useBiometrics';
import { clearCache } from '../src/lib/cache';
import { sendTestNotification } from '../src/lib/notifications';

const THEME_OPTIONS: { value: ThemePreference; labelKey: string; icon: string }[] = [
  { value: 'system', labelKey: 'themeToggle.system', icon: '📱' },
  { value: 'light', labelKey: 'themeToggle.light', icon: '☀️' },
  { value: 'dark', labelKey: 'themeToggle.dark', icon: '🌙' },
];

const LANG_OPTIONS: { value: string; labelKey: string; flag: string }[] = [
  { value: 'en', labelKey: 'languageToggle.english', flag: '🇺🇸' },
  { value: 'pt-BR', labelKey: 'languageToggle.portuguese', flag: '🇧🇷' },
];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { preference, setPreference, isDark: dark } = useTheme();
  const { user, logout, clearStoredCredentials } = useAuth();
  const { isAvailable, biometricType, isEnabled: biometricEnabled, setEnabled: setBiometricEnabled } = useBiometrics();
  const [cacheSize, setCacheSize] = useState('Calculating...');
  const c = s(dark);

  const biometricLabel = biometricType
    ? t('auth.biometricType.' + biometricType)
    : t('auth.biometricType.biometric');

  // Calculate cache size
  const loadCacheSize = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith('enlace-cache:') || k.startsWith('enlace-seen-') || k.startsWith('enlace-outage-'));
      if (cacheKeys.length === 0) {
        setCacheSize('Empty');
        return;
      }
      let totalBytes = 0;
      for (const key of cacheKeys) {
        const val = await AsyncStorage.getItem(key);
        if (val) totalBytes += val.length * 2; // UTF-16
      }
      if (totalBytes < 1024) setCacheSize(`${totalBytes} B`);
      else if (totalBytes < 1024 * 1024) setCacheSize(`${(totalBytes / 1024).toFixed(1)} KB`);
      else setCacheSize(`${(totalBytes / (1024 * 1024)).toFixed(1)} MB`);
    } catch {
      setCacheSize(t('common.unknown'));
    }
  }, []);

  useEffect(() => {
    void loadCacheSize();
  }, [loadCacheSize]);

  async function handleClearCache() {
    Alert.alert(t('settings.clearCacheTitle'), t('settings.clearCacheBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.clear'),
        style: 'destructive',
        onPress: async () => {
          await clearCache();
          // Also clear notification state cache
          const keys = await AsyncStorage.getAllKeys();
          const stateKeys = keys.filter((k) => k.startsWith('enlace-seen-') || k.startsWith('enlace-outage-'));
          if (stateKeys.length > 0) await AsyncStorage.multiRemove(stateKeys);
          setCacheSize('Empty');
          Alert.alert(t('settings.clearCacheDone'), t('settings.clearCacheDoneBody'));
        },
      },
    ]);
  }

  async function handleTestNotification() {
    const ok = await sendTestNotification();
    if (!ok) {
      Alert.alert(t('settings.notifDenied'), t('settings.openSettings'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.openSettings'), onPress: () => Linking.openSettings() },
      ]);
    }
  }

  async function handleLanguageChange(lang: string) {
    await i18n.changeLanguage(lang);
  }

  async function handleBiometricToggle() {
    if (biometricEnabled) {
      // Disable: clear the pref flag AND the stored credentials
      await setBiometricEnabled(false);
      await clearStoredCredentials();
      Alert.alert(t('settings.biometricDisabledTitle'), t('settings.biometricDisabledBody', { type: biometricLabel }));
    } else {
      // Authenticates once (inside setEnabled), then enables the pref flag.
      // Credentials are already stored from login.
      const ok = await setBiometricEnabled(true);
      if (ok) Alert.alert(t('auth.biometricEnabled', { type: biometricLabel }));
    }
  }

  function handleLogout() {
    Alert.alert(t('auth.logout'), `Sign out${user?.name ? ` (${user.name})` : ''}?`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.logout'),
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/');
        },
      },
    ]);
  }

  return (
    <ScrollView style={c.scroll} contentContainerStyle={c.content}>
      <View style={c.section}>
        <Text style={c.sectionTitle}>{t('settings.account')}</Text>
        <View style={c.card}>
          <View style={c.accountRow}>
            <View style={c.avatar}>
              <Text style={c.avatarText}>{user?.name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={c.accountName}>{user?.name ?? t('common.guest')}</Text>
              {user?.email ? <Text style={c.accountEmail}>{user.email}</Text> : null}
            </View>
          </View>
        </View>
      </View>

      {/* Theme */}
      <View style={c.section}>
        <Text style={c.sectionTitle}>{t('settings.appearance')}</Text>
        <View style={c.card}>
          <Text style={c.label}>{t('themeToggle.label')}</Text>
          <View style={c.optionRow}>
            {THEME_OPTIONS.map((opt) => (
              <TouchableOpacity key={opt.value} style={[c.optionBtn, preference === opt.value && c.optionBtnActive]} onPress={() => setPreference(opt.value)}>
                <Text style={c.optionIcon}>{opt.icon}</Text>
                <Text style={[c.optionText, preference === opt.value && c.optionTextActive]}>{t(opt.labelKey)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Language */}
      <View style={c.section}>
        <Text style={c.sectionTitle}>{t('languageToggle.label')}</Text>
        <View style={c.card}>
          <View style={c.optionRow}>
            {LANG_OPTIONS.map((opt) => (
              <TouchableOpacity key={opt.value} style={[c.optionBtn, i18n.language === opt.value && c.optionBtnActive]} onPress={() => handleLanguageChange(opt.value)}>
                <Text style={c.optionIcon}>{opt.flag}</Text>
                <Text style={[c.optionText, i18n.language === opt.value && c.optionTextActive]}>{t(opt.labelKey)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Security */}
      {isAvailable && (
        <View style={c.section}>
          <Text style={c.sectionTitle}>{t('settings.security')}</Text>
          <View style={c.card}>
            <View style={c.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={c.settingLabel}>{biometricIcon()} {t('settings.biometricLogin', { type: biometricLabel })}</Text>
                <Text style={c.settingDesc}>
                  {biometricEnabled ? t('settings.enabledTouch') : t('settings.disabled')}
                </Text>
              </View>
              <TouchableOpacity style={[c.toggle, biometricEnabled && c.toggleActive]} onPress={handleBiometricToggle}>
                <View style={[c.toggleDot, biometricEnabled && c.toggleDotActive]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Test notification */}
          <View style={c.card}>
            <View style={c.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={c.settingLabel}>🔔 {t('settings.testNotification')}</Text>
                <Text style={c.settingDesc}>{t('settings.notifDenied')}</Text>
              </View>
              <TouchableOpacity style={c.clearBtn} onPress={handleTestNotification}>
                <Text style={c.clearBtnText}>{t('common.send')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Cache */}
      <View style={c.section}>
        <Text style={c.sectionTitle}>{t('settings.storage')}</Text>
        <View style={c.card}>
          <View style={c.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={c.settingLabel}>{t('settings.cachedData')}</Text>
              <Text style={c.settingDesc}>{cacheSize} {t('settings.cached')}</Text>
            </View>
            <TouchableOpacity style={c.clearBtn} onPress={handleClearCache}>
              <Text style={c.clearBtnText}>{t('settings.clear')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Logout */}
      <View style={c.section}>
        <TouchableOpacity style={c.logoutBtn} onPress={handleLogout}>
          <Text style={c.logoutText}>{t('auth.logout')}</Text>
        </TouchableOpacity>
      </View>

      {/* App version */}
      <Text style={c.version}>Enlace v0.1.0</Text>
    </ScrollView>
  );
}

function biometricIcon(): string {
  return '👆';
}

const s = (dark: boolean) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: dark ? '#0f172a' : '#f9fafb' },
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: 'bold', color: dark ? '#f1f5f9' : '#111827', marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: dark ? '#94a3b8' : '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: dark ? '#1e293b' : '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: dark ? '#334155' : '#e5e7eb' },
  label: { fontSize: 14, fontWeight: '500', color: dark ? '#f1f5f9' : '#111827', marginBottom: 10 },
  // Account
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  accountName: { fontSize: 16, fontWeight: '600', color: dark ? '#f1f5f9' : '#111827' },
  accountEmail: { fontSize: 13, color: dark ? '#94a3b8' : '#6b7280', marginTop: 2 },
  // Options (theme/language)
  optionRow: { flexDirection: 'row', gap: 8 },
  optionBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: dark ? '#0f172a' : '#f9fafb', borderWidth: 1, borderColor: dark ? '#334155' : '#e5e7eb' },
  optionBtnActive: { backgroundColor: '#7c3aed20', borderColor: '#7c3aed' },
  optionIcon: { fontSize: 20, marginBottom: 4 },
  optionText: { fontSize: 12, fontWeight: '500', color: dark ? '#94a3b8' : '#6b7280' },
  optionTextActive: { color: '#7c3aed' },
  // Settings rows
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingLabel: { fontSize: 15, fontWeight: '500', color: dark ? '#f1f5f9' : '#111827' },
  settingDesc: { fontSize: 12, color: dark ? '#94a3b8' : '#6b7280', marginTop: 2 },
  // Toggle
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: dark ? '#475569' : '#d1d5db', padding: 2, justifyContent: 'center' },
  toggleActive: { backgroundColor: '#7c3aed' },
  toggleDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', alignSelf: 'flex-start' },
  toggleDotActive: { alignSelf: 'flex-end' },
  // Clear cache
  clearBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: dark ? '#451a1a' : '#fef2f2' },
  clearBtnText: { fontSize: 13, fontWeight: '600', color: '#ef4444' },
  // Logout
  logoutBtn: { width: '100%', paddingVertical: 14, borderRadius: 10, backgroundColor: dark ? '#451a1a' : '#fef2f2', alignItems: 'center', borderWidth: 1, borderColor: '#ef444430' },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
  // Version
  version: { textAlign: 'center', fontSize: 12, color: dark ? '#475569' : '#9ca3af', marginTop: 8 },
});
