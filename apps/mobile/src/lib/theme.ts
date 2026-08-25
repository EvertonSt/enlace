import { useTheme } from './ThemeContext';

export function useThemeColors() {
  const { isDark: dark } = useTheme();
  return {
    dark,
    bg: dark ? '#0f172a' : '#f9fafb',
    card: dark ? '#1e293b' : '#ffffff',
    border: dark ? '#334155' : '#e5e7eb',
    text: dark ? '#f1f5f9' : '#111827',
    textSecondary: dark ? '#94a3b8' : '#6b7280',
    textMuted: dark ? '#64748b' : '#9ca3af',
    accent: '#7c3aed',
    accentLight: dark ? '#7c3aed20' : '#7c3aed15',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
  };
}
