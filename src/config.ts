// Modalità sfondo. Si può cambiare al volo via URL (?bg=aurora|orbit|both|off)
// senza ricompilare — utile per confrontare e "tornare indietro".
export type BgMode = 'aurora' | 'orbit' | 'both' | 'off';

export const DEFAULT_BG: BgMode = 'aurora';

export function getBgMode(): BgMode {
  try {
    const p = new URLSearchParams(window.location.search).get('bg');
    if (p === 'aurora' || p === 'orbit' || p === 'both' || p === 'off') return p;
  } catch {
    /* ignore */
  }
  return DEFAULT_BG;
}
