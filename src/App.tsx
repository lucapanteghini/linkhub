import { motion } from 'framer-motion';
import Scene3D from './components/Scene3D';
import SocialBar from './components/SocialBar';
import ProductCard from './components/ProductCard';
import LangToggle from './components/LangToggle';
import BgMenu from './components/BgMenu';
import { useLang } from './hooks/useLang';
import { useBg } from './hooks/useBg';
import { ui } from './i18n/ui';
import productsData from '../data/products.json';
import socialsData from '../data/socials.json';

const products = productsData.products;
const profile = socialsData.profile;
const contactEmail =
  socialsData.socials.find((s) => s.id === 'email')?.url ?? 'mailto:luca.panteghini@nurale.com';
const year = 2026;

export default function App() {
  const { lang, toggle } = useLang();
  const { mode, setMode } = useBg();

  return (
    <>
      <Scene3D mode={mode} />
      <div className="bg-veil" aria-hidden="true" />

      <main className="wrap">
        <div className="topbar">
          <SocialBar />
          <div className="topbar__controls">
            <BgMenu mode={mode} onSelect={setMode} lang={lang} />
            <LangToggle lang={lang} onToggle={toggle} />
          </div>
        </div>

        <header className="hero">
          <motion.div
            className="hero__avatar"
            initial={{ opacity: 0, scale: 0.7, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 140, damping: 14 }}
          >
            <span className="hero__ring" aria-hidden="true" />
            <img src={`/${profile.avatar}`} alt={profile.name} width={120} height={120} />
          </motion.div>

          <motion.p
            className="hero__kicker"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            {profile.kicker}
          </motion.p>

          <motion.h1
            className="hero__name"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26 }}
          >
            {profile.name}
          </motion.h1>

          <motion.p
            className="hero__bio"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34 }}
          >
            {profile.bio[lang]}
          </motion.p>
        </header>

        <motion.section
          className="cards"
          aria-label={ui[lang]['apps.heading']}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.12 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} lang={lang} />
          ))}
        </motion.section>

        <footer className="footer">
          <a className="footer__cta" href={contactEmail}>
            {ui[lang]['footer.contact']}
          </a>
          <p className="footer__rights">
            © {year} {profile.name}. {ui[lang]['footer.rights']}
          </p>
        </footer>
      </main>
    </>
  );
}
