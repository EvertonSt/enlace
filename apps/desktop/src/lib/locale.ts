import i18n from '../i18n';

export function formatCurrency(value: number | string): string {
  const locale = i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US';
  const currency = i18n.language === 'pt-BR' ? 'BRL' : 'USD';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(value));
}

export function formatDate(dateStr: string): string {
  const locale = i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US';
  const options: Intl.DateTimeFormatOptions = i18n.language === 'pt-BR'
    ? { day: '2-digit', month: '2-digit', year: 'numeric' }
    : { month: '2-digit', day: '2-digit', year: 'numeric' };
  return new Intl.DateTimeFormat(locale, options).format(new Date(dateStr));
}

export function formatDateTime(dateStr: string): string {
  const locale = i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr));
}

export function formatNumber(value: number): string {
  const locale = i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US';
  return new Intl.NumberFormat(locale).format(value);
}
