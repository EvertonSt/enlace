import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../src/lib/auth';
import { useBiometrics } from '../src/hooks/useBiometrics';

const BIOMETRIC_ICONS: Record<string, string> = {
  fingerprint: '👆',
  face: '👤',
  iris: '👁️',
};

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dark = useColorScheme() === 'dark';
  const { login, loginWithStoredCredentials, storeCredentials, hasBiometricCredentials } = useAuth();
  const { isAvailable, biometricType, isEnabled, authenticate, setEnabled } = useBiometrics();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const c = s(dark);

  const biometricIcon = biometricType ? (BIOMETRIC_ICONS[biometricType] ?? '🔐') : '🔐';
  const biometricLabel = biometricType
    ? biometricType.charAt(0).toUpperCase() + biometricType.slice(1)
    : 'Biometric';

  // Auto-trigger biometric on launch if credentials are stored
  useEffect(() => {
    if (hasBiometricCredentials && isAvailable && !loading) {
      handleBiometricLogin();
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasBiometricCredentials, isAvailable]);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) { Alert.alert(t('common.error'), t('auth.emailRequired')); return; }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.error) {
      Alert.alert(t('common.error'), result.error);
    } else {
      // Offer to enable biometrics if available and not yet enabled
      if (isAvailable && !isEnabled && !hasBiometricCredentials) {
        Alert.alert(
          `${biometricIcon} Enable ${biometricLabel}?`,
          `Use ${biometricLabel.toLowerCase()} for faster login next time.`,
          [
            { text: 'Not now', style: 'cancel', onPress: () => router.replace('/dashboard') },
            {
              text: 'Enable',
              onPress: async () => {
                const success = await authenticate();
                if (success) {
                  await storeCredentials(email, password);
                  Alert.alert('Enabled', `${biometricLabel} login has been enabled.`);
                }
                router.replace('/dashboard');
              },
            },
          ],
        );
      } else {
        router.replace('/dashboard');
      }
    }
  }

  async function handleBiometricLogin() {
    if (!hasBiometricCredentials) return;
    setBiometricLoading(true);

    const authSuccess = await authenticate();
    if (!authSuccess) {
      setBiometricLoading(false);
      return; // User cancelled — stay on login screen
    }

    const result = await loginWithStoredCredentials();
    setBiometricLoading(false);

    if (result.error) {
      Alert.alert(
        'Biometric login failed',
        'Stored credentials may be expired. Please log in with your password.',
        [{ text: 'OK' }],
      );
      // Clear stale credentials
      // Note: clearStoredCredentials is not used here to avoid clearing on transient errors
    } else {
      router.replace('/dashboard');
    }
  }

  return (
    <View style={c.container}>
      <View style={c.logo}><Text style={c.logoText}>🌐</Text></View>
      <Text style={c.title}>{t('common.appName')}</Text>
      <Text style={c.subtitle}>{t('auth.welcomeBack')}</Text>

      {/* Biometric Login Button */}
      {hasBiometricCredentials && isAvailable && (
        <TouchableOpacity
          style={[c.biometricButton, biometricLoading && { opacity: 0.6 }]}
          onPress={handleBiometricLogin}
          disabled={biometricLoading || loading}>
          <Text style={c.biometricIcon}>{biometricIcon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={c.biometricTitle}>
              {biometricLoading ? `Authenticating...` : `Login with ${biometricLabel}`}
            </Text>
            <Text style={c.biometricSub}>Touch the sensor to authenticate</Text>
          </View>
          <Text style={c.biometricArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* Divider */}
      {hasBiometricCredentials && isAvailable && (
        <View style={c.divider}>
          <View style={c.dividerLine} />
          <Text style={c.dividerText}>or sign in with password</Text>
          <View style={c.dividerLine} />
        </View>
      )}

      {/* Password Form */}
      <View style={c.card}>
        <Text style={c.label}>{t('auth.email')}</Text>
        <TextInput style={c.input} value={email} onChangeText={setEmail} placeholder="everton@andrade.com.br" placeholderTextColor={dark ? '#64748b' : '#9ca3af'} keyboardType="email-address" autoCapitalize="none" />
        <Text style={c.label}>{t('auth.password')}</Text>
        <TextInput style={c.input} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={dark ? '#64748b' : '#9ca3af'} secureTextEntry />
        <TouchableOpacity style={[c.button, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
          <Text style={c.buttonText}>{loading ? t('auth.signingIn') : t('auth.signIn')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={c.demo}>Demo: everton@andrade.com.br / password123</Text>
    </View>
  );
}

const s = (dark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: dark ? '#0f172a' : '#f9fafb', alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: { width: 72, height: 72, borderRadius: 18, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText: { fontSize: 36 },
  title: { fontSize: 28, fontWeight: 'bold', color: dark ? '#f1f5f9' : '#111827', marginBottom: 4 },
  subtitle: { fontSize: 15, color: dark ? '#94a3b8' : '#6b7280', marginBottom: 24 },
  // Biometric button
  biometricButton: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: dark ? '#1e293b' : '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#7c3aed', gap: 12 },
  biometricIcon: { fontSize: 28 },
  biometricTitle: { fontSize: 15, fontWeight: '600', color: dark ? '#f1f5f9' : '#111827' },
  biometricSub: { fontSize: 12, color: dark ? '#94a3b8' : '#6b7280', marginTop: 2 },
  biometricArrow: { fontSize: 18, color: '#7c3aed', fontWeight: '600' },
  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: dark ? '#334155' : '#e5e7eb' },
  dividerText: { fontSize: 12, color: dark ? '#64748b' : '#9ca3af' },
  // Card
  card: { width: '100%', backgroundColor: dark ? '#1e293b' : '#fff', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: dark ? '#334155' : '#e5e7eb' },
  label: { fontSize: 13, fontWeight: '600', color: dark ? '#cbd5e1' : '#374151', marginBottom: 6 },
  input: { width: '100%', borderWidth: 1, borderColor: dark ? '#475569' : '#d1d5db', borderRadius: 10, padding: 14, fontSize: 15, color: dark ? '#f1f5f9' : '#111827', marginBottom: 16, backgroundColor: dark ? '#0f172a' : '#f9fafb' },
  button: { width: '100%', backgroundColor: '#7c3aed', borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  demo: { marginTop: 20, color: dark ? '#64748b' : '#9ca3af', fontSize: 12 },
});
