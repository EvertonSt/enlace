/**
 * Locale-aware formatting utilities.
 * Uses the current i18n language to pick the right Intl formatter.
 * EN mode: $ USD format / PT mode: R$ BRL format
 */

import i18n from 'i18next';

function getCurrentLocale(): string {
  const lng = i18n.language;
  return lng === 'pt-BR' ? 'pt-BR' : 'en-US';
}

function getCurrentCurrency(): string {
  return i18n.language === 'pt-BR' ? 'BRL' : 'USD';
}

/** Format currency: $49.90 (EN) or R$ 49,90 (PT) */
export function formatCurrency(amount: number | string): string {
  return new Intl.NumberFormat(getCurrentLocale(), {
    style: 'currency',
    currency: getCurrentCurrency(),
  }).format(Number(amount));
}

/** Format a date string using the current locale */
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat(getCurrentLocale(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr));
}

/** Format a date+time string using the current locale */
export function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat(getCurrentLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

/** Format a compact number (e.g., 1,200 or 1.200) */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat(getCurrentLocale()).format(n);
}
