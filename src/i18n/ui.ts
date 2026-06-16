export const defaultLang = 'it';
export const languages = ['it', 'en'] as const;
export type Lang = (typeof languages)[number];

export const ui = {
  it: {
    'meta.title': 'Luca Panteghini — App & Giochi',
    'meta.description':
      'App e giochi indie di Luca Panteghini: ScopaAI, BriscolaAI, Case Analyst.',
    'apps.heading': 'Le mie app',
    'cta.appstore': 'App Store',
    'cta.playstore': 'Google Play',
    'cta.website': 'Sito',
    'badge.soon': 'Prossimamente',
    'footer.rights': 'Tutti i diritti riservati.',
    'footer.contact': 'Contattami',
    'lang.toggle': 'EN',
  },
  en: {
    'meta.title': 'Luca Panteghini — Apps & Games',
    'meta.description':
      'Indie apps and games by Luca Panteghini: ScopaAI, BriscolaAI, Case Analyst.',
    'apps.heading': 'My apps',
    'cta.appstore': 'App Store',
    'cta.playstore': 'Google Play',
    'cta.website': 'Website',
    'badge.soon': 'Coming soon',
    'footer.rights': 'All rights reserved.',
    'footer.contact': 'Get in touch',
    'lang.toggle': 'IT',
  },
} as const;

export function t(lang: Lang, key: keyof (typeof ui)['it']): string {
  return ui[lang][key] ?? ui[defaultLang][key];
}
