import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_BG, isBgMode, type BgMode } from '../config';

const KEY = 'lh-bg';

// Priorità: ?bg= nell'URL > scelta salvata > default del proprietario.
function detect(): BgMode {
  try {
    const p = new URLSearchParams(window.location.search).get('bg');
    if (isBgMode(p)) return p;
    const saved = localStorage.getItem(KEY);
    if (isBgMode(saved)) return saved;
  } catch {
    /* ignore */
  }
  return DEFAULT_BG;
}

export function useBg() {
  const [mode, setModeState] = useState<BgMode>(DEFAULT_BG);

  useEffect(() => {
    setModeState(detect());
  }, []);

  const setMode = useCallback((m: BgMode) => {
    setModeState(m);
    try {
      localStorage.setItem(KEY, m);
    } catch {
      /* ignore */
    }
  }, []);

  return { mode, setMode };
}
