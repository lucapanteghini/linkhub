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
    'cta.steam': 'Wishlist su Steam',
    'cta.website': 'Sito',
    'badge.soon': 'Prossimamente',
    'footer.rights': 'Tutti i diritti riservati.',
    'footer.contact': 'Contattami',
    'lang.toggle': 'EN',
    'bg.label': 'Scegli lo sfondo',
    'bg.title': 'Sfondo',
    'bg.aurora': 'Aurora',
    'bg.clouds': 'Nuvole',
    'bg.circuits': 'Circuiti',
    'bg.sea': 'Mare',
  },
  en: {
    'meta.title': 'Luca Panteghini — Apps & Games',
    'meta.description':
      'Indie apps and games by Luca Panteghini: ScopaAI, BriscolaAI, Case Analyst.',
    'apps.heading': 'My apps',
    'cta.appstore': 'App Store',
    'cta.playstore': 'Google Play',
    'cta.steam': 'Wishlist on Steam',
    'cta.website': 'Website',
    'badge.soon': 'Coming soon',
    'footer.rights': 'All rights reserved.',
    'footer.contact': 'Get in touch',
    'lang.toggle': 'IT',
    'bg.label': 'Choose background',
    'bg.title': 'Background',
    'bg.aurora': 'Aurora',
    'bg.clouds': 'Clouds',
    'bg.circuits': 'Circuits',
    'bg.sea': 'Sea',
  },
} as const;

export function t(lang: Lang, key: keyof (typeof ui)['it']): string {
  return ui[lang][key] ?? ui[defaultLang][key];
}
