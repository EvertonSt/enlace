/**
 * Currency formatting that follows the active UI language.
 *
 * The backend stores invoice/plan amounts in BRL as a DECIMAL string
 * (e.g. "119.9" meaning R$ 119,90). This helper takes that native value
 * (reais) directly — do NOT pre-multiply by 100.
 *
 * - pt-BR  -> symbol "R$ ", value shown as BRL (e.g. "R$ 119,90")
 * - en-US  -> symbol "$ ", value converted to USD using USD_BRL_RATE
 *            (e.g. "119.90" BRL / 5.00 = "$23.98")
 */
const USD_BRL_RATE = 5.0; // 1 USD = 5.00 BRL — single source of truth, change here

export function formatBRL(amountInReais: number | string, lang?: string): string {
  const brl = Number(amountInReais) || 0;
  const usd = brl / USD_BRL_RATE;
  const symbol = lang === 'pt-BR' ? 'R$ ' : '$';
  const value =
    lang === 'pt-BR'
      ? brl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return symbol + value;
}
