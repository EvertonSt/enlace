import en from './en.json' with { type: 'json' };
import ptBR from './pt-BR.json' with { type: 'json' };

export const enResources = en;
export const ptBRResources = ptBR;
export const supportedLocales = ['en', 'pt-BR'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];
