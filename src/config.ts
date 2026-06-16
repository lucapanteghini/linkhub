// Modalità sfondo.
// - Il proprietario imposta il default qui (DEFAULT_BG).
// - Il visitatore può sceglierlo dal menu sul sito (scelta salvata in localStorage).
// - Si può forzare al volo via URL (?bg=aurora|clouds|circuits|sea|orbit|both|off),
//   utile per condividere un link o confrontare senza ricompilare.
export type BgMode = 'aurora' | 'clouds' | 'circuits' | 'sea' | 'orbit' | 'both' | 'off';

// Default mostrato a chi non ha ancora scelto.
export const DEFAULT_BG: BgMode = 'aurora';

// Tutti i valori validi (anche per ?bg=).
export const ALL_BG: BgMode[] = ['aurora', 'clouds', 'circuits', 'sea', 'orbit', 'both', 'off'];

// Sfondi proposti nel menu del sito (orbit/both/off restano solo via URL).
export const MENU_BG: BgMode[] = ['aurora', 'clouds', 'circuits', 'sea'];

export function isBgMode(v: unknown): v is BgMode {
  return typeof v === 'string' && (ALL_BG as string[]).includes(v);
}
