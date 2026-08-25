import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'enlace-biometric-enabled';

export type BiometricType = 'fingerprint' | 'face' | 'iris' | null;

interface BiometricsState {
  /** Whether the device supports biometrics at all */
  isAvailable: boolean;
  /** The type of biometric enrolled (fingerprint, face, iris) */
  biometricType: BiometricType;
  /** Whether user has opted in to biometric login */
  isEnabled: boolean;
  /** Whether we're currently showing the biometric prompt */
  isAuthenticating: boolean;
}

/**
 * Manages biometric authentication availability and preference.
 *
 * - Checks if the device has biometric hardware + enrolled biometrics
 * - Persists user's "enable biometrics" preference in SecureStore
 * - Provides `authenticate()` to trigger the OS biometric prompt
 * - Provides `setEnabled()` to toggle biometric preference
 */
export function useBiometrics(): BiometricsState & {
  authenticate: () => Promise<boolean>;
  setEnabled: (enabled: boolean) => Promise<boolean>;
} {
  const [state, setState] = useState<BiometricsState>({
    isAvailable: false,
    biometricType: null,
    isEnabled: false,
    isAuthenticating: false,
  });

  // Check availability on mount
  useEffect(() => {
    async function check() {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometricType: BiometricType = null;
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = 'fingerprint';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'face';
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricType = 'iris';
      }

      const storedPref = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);

      setState((prev) => ({
        ...prev,
        isAvailable: compatible && enrolled,
        biometricType,
        isEnabled: storedPref === 'true' && compatible && enrolled,
      }));
    }
    void check();
  }, []);

  /**
   * Triggers the OS biometric prompt (fingerprint/face/iris dialog).
   * Returns true if authentication succeeded, false otherwise.
   */
  const authenticate = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isAuthenticating: true }));

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to continue',
        cancelLabel: 'Use password',
        disableDeviceFallback: false,
        fallbackLabel: 'Use password',
      });

      return result.success;
    } catch {
      return false;
    } finally {
      setState((prev) => ({ ...prev, isAuthenticating: false }));
    }
  }, []);

  /**
   * Toggle biometric preference. If enabling, verifies biometrics work first.
   */
  const setEnabled = useCallback(async (enabled: boolean): Promise<boolean> => {
    if (enabled) {
      // Verify biometrics work before enabling (single prompt)
      const success = await authenticate();
      if (!success) return false;
    }

    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
    setState((prev) => ({ ...prev, isEnabled: enabled }));
    return true;
  }, [authenticate]);

  return { ...state, authenticate, setEnabled };
}
