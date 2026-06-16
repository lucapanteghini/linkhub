import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MENU_BG, type BgMode } from '../config';
import { t, type Lang } from '../i18n/ui';

// Icone sintetiche per ciascuno sfondo del menu.
const BG_ICONS: Partial<Record<BgMode, JSX.Element>> = {
  aurora: (
    <path d="M3 14c3-4 5-4 7 0s4 4 7-2M3 18c3-4 5-4 7 0s4 4 7-2M4 8c2-3 4-3 6 0" />
  ),
  clouds: (
    <path d="M7 17h9a3 3 0 0 0 .3-6A4.5 4.5 0 0 0 7.5 9 3.5 3.5 0 0 0 7 17z" />
  ),
  circuits: (
    <path d="M5 5h6v6H5zM13 13h6v6h-6zM11 8h4M8 11v4M15 13v-2M19 8h-4" />
  ),
  sea: (
    <path d="M3 10c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0M16 6l3 1-3 1 1-1z" />
  ),
};

const LABEL_KEY: Record<string, 'bg.aurora' | 'bg.clouds' | 'bg.circuits' | 'bg.sea'> = {
  aurora: 'bg.aurora',
  clouds: 'bg.clouds',
  circuits: 'bg.circuits',
  sea: 'bg.sea',
};

export default function BgMenu({
  mode,
  onSelect,
  lang,
}: {
  mode: BgMode;
  onSelect: (m: BgMode) => void;
  lang: Lang;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  // chiudi cliccando fuori o con Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="bg-menu" ref={wrap}>
      <motion.button
        className="bg-menu__btn"
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t(lang, 'bg.label')}
        aria-haspopup="menu"
        aria-expanded={open}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          {BG_ICONS[mode] ?? BG_ICONS.aurora}
        </svg>
        <span>{t(lang, 'bg.title')}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.ul
            className="bg-menu__panel"
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.16 }}
          >
            {MENU_BG.map((m) => (
              <li key={m} role="none">
                <button
                  role="menuitemradio"
                  aria-checked={mode === m}
                  className={`bg-menu__item${mode === m ? ' is-active' : ''}`}
                  type="button"
                  onClick={() => {
                    onSelect(m);
                    setOpen(false);
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    aria-hidden="true"
                  >
                    {BG_ICONS[m]}
                  </svg>
                  <span>{t(lang, LABEL_KEY[m])}</span>
                  {mode === m && <span className="bg-menu__dot" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
