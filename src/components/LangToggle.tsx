import { motion } from 'framer-motion';
import { ui, type Lang } from '../i18n/ui';

export default function LangToggle({ lang, onToggle }: { lang: Lang; onToggle: () => void }) {
  return (
    <motion.button
      className="lang-toggle"
      type="button"
      onClick={onToggle}
      aria-label="Switch language"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
    >
      <span className="lang-toggle__dot" aria-hidden="true" />
      {ui[lang]['lang.toggle']}
    </motion.button>
  );
}
