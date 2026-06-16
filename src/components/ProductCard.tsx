import { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { AppleIcon, PlayIcon, WebIcon } from './icons';
import { ui, type Lang } from '../i18n/ui';

type Product = {
  id: string;
  name: string;
  status: string;
  category: { it: string; en: string };
  tagline: { it: string; en: string };
  accent: string;
  icon: string;
  links: { appstore?: string; playstore?: string; website?: string };
};

export default function ProductCard({ product, lang }: { product: Product; lang: Lang }) {
  const { name, accent, icon, category, tagline, links, status } = product;
  const comingSoon = status === 'coming_soon';

  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 200, damping: 18 });
  const glowX = useTransform(mx, [0, 1], ['0%', '100%']);
  const glowY = useTransform(my, [0, 1], ['0%', '100%']);
  const glow = useMotionTemplate`radial-gradient(420px circle at ${glowX} ${glowY}, ${accent}22, transparent 60%)`;

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  }
  function onLeave() {
    mx.set(0.5);
    my.set(0.5);
  }

  return (
    <motion.article
      ref={ref}
      className="card"
      style={
        {
          '--accent': accent,
          rotateX: rx,
          rotateY: ry,
          transformStyle: 'preserve-3d',
        } as React.CSSProperties
      }
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      variants={{
        hidden: { opacity: 0, y: 40, scale: 0.96 },
        show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 120, damping: 16 } },
      }}
      whileHover={{ scale: 1.015 }}
    >
      <motion.div className="card__glow" style={{ background: glow }} aria-hidden="true" />
      <div className="card__inner">
        <div className="card__iconwrap" style={{ transform: 'translateZ(40px)' }}>
          <img className="card__icon" src={`/${icon}`} alt={`${name}`} width={76} height={76} loading="lazy" />
          <span className="card__iconglow" aria-hidden="true" />
        </div>

        <div className="card__body">
          <span className="card__cat">{category[lang]}</span>
          <h3 className="card__name">{name}</h3>
          <p className="card__tagline">{tagline[lang]}</p>

          <div className="card__links">
            {comingSoon && <span className="store-btn store-btn--soon">{ui[lang]['badge.soon']}</span>}
            {!comingSoon && links.appstore && (
              <a className="store-btn" href={links.appstore} target="_blank" rel="noopener noreferrer">
                <AppleIcon className="store-btn__icon" />
                {ui[lang]['cta.appstore']}
              </a>
            )}
            {!comingSoon && links.playstore && (
              <a className="store-btn" href={links.playstore} target="_blank" rel="noopener noreferrer">
                <PlayIcon className="store-btn__icon" />
                {ui[lang]['cta.playstore']}
              </a>
            )}
            {!comingSoon && links.website && (
              <a className="store-btn" href={links.website} target="_blank" rel="noopener noreferrer">
                <WebIcon className="store-btn__icon" />
                {ui[lang]['cta.website']}
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
