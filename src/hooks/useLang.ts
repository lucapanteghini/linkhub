import { useCallback, useEffect, useState } from 'react';
import { defaultLang, languages, type Lang } from '../i18n/ui';

const KEY = 'lh-lang';

function detect(): Lang {
  try {
    const saved = localStorage.getItem(KEY) as Lang | null;
    if (saved && languages.includes(saved)) return saved;
  } catch {
    /* ignore */
  }
  const nav = (navigator.language || defaultLang).slice(0, 2).toLowerCase() as Lang;
  return languages.includes(nav) ? nav : defaultLang;
}

export function useLang() {
  const [lang, setLang] = useState<Lang>(defaultLang);

  useEffect(() => {
    setLang(detect());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const toggle = useCallback(() => {
    setLang((l) => (l === 'it' ? 'en' : 'it'));
  }, []);

  return { lang, toggle };
}
