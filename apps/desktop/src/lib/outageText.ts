import type { TFunction } from 'i18next';

/**
 * Outage titles/areas arrive from the backend as English strings.
 * We translate the known ones via i18n; anything unmapped falls back to the
 * raw API text so nothing breaks if the backend adds new outage types.
 */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function translateOutageTitle(title: string, t: TFunction): string {
  if (!title) return title;
  const key = 'outage.titles.' + slugify(title);
  const tr = t(key);
  return tr === key ? title : tr;
}

export function translateOutageArea(area: string, t: TFunction): string {
  if (!area) return area;
  const key = 'outage.areas.' + slugify(area);
  const tr = t(key);
  return tr === key ? area : tr;
}
