import { motion } from 'framer-motion';
import { Icon } from './icons';
import socialsData from '../../data/socials.json';

const socials = socialsData.socials.filter((s) => s.enabled && s.url);

export default function SocialBar() {
  return (
    <motion.nav
      className="socials"
      aria-label="Social"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.07, delayChildren: 0.5 } },
      }}
    >
      {socials.map((s) => (
        <motion.a
          key={s.id}
          className="social"
          href={s.url}
          aria-label={s.label}
          target={s.id === 'email' ? undefined : '_blank'}
          rel={s.id === 'email' ? undefined : 'noopener noreferrer'}
          variants={{
            hidden: { opacity: 0, y: 12, scale: 0.8 },
            show: { opacity: 1, y: 0, scale: 1 },
          }}
          whileHover={{ y: -4, scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          <Icon name={s.id} className="social__icon" />
        </motion.a>
      ))}
    </motion.nav>
  );
}
