import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE_URL = 'https://nurale.games';

type Json = Record<string, any>;

function loadData() {
  const products = JSON.parse(readFileSync('data/products.json', 'utf8')).products as Json[];
  const socials = JSON.parse(readFileSync('data/socials.json', 'utf8'));
  return { products, profile: socials.profile as Json, socials: socials.socials as Json[] };
}

const escAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Plugin SEO/GEO:
 *  - inietta nel <head> canonical, Open Graph, Twitter e JSON-LD (Person + WebSite + app)
 *  - inietta dentro #root un fallback statico (bio + app + social) così i crawler e i
 *    bot degli LLM (che NON eseguono JS) leggono i contenuti. React lo rimpiazza al mount.
 *  - in build genera robots.txt, sitemap.xml e llms.txt in dist/.
 */
function seoPlugin(): Plugin {
  let cfg: ResolvedConfig;
  return {
    name: 'linkhub-seo',
    configResolved(c) {
      cfg = c;
    },
    transformIndexHtml(html) {
      const { products, profile, socials } = loadData();
      const published = products.filter((p) => p.status === 'published');
      const links = socials.filter((s) => s.enabled && s.url);
      const ogImage = `${SITE_URL}/assets/og.png`;

      // ---- tag <head> ----
      const headTags = [
        { tag: 'link', attrs: { rel: 'canonical', href: `${SITE_URL}/` }, injectTo: 'head' as const },
        { tag: 'meta', attrs: { property: 'og:url', content: `${SITE_URL}/` }, injectTo: 'head' as const },
        { tag: 'meta', attrs: { property: 'og:site_name', content: profile.name }, injectTo: 'head' as const },
        { tag: 'meta', attrs: { property: 'og:locale', content: 'it_IT' }, injectTo: 'head' as const },
        { tag: 'meta', attrs: { property: 'og:image', content: ogImage }, injectTo: 'head' as const },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' }, injectTo: 'head' as const },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' }, injectTo: 'head' as const },
        { tag: 'meta', attrs: { name: 'twitter:image', content: ogImage }, injectTo: 'head' as const },
        { tag: 'meta', attrs: { name: 'author', content: profile.name }, injectTo: 'head' as const },
        {
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          children: JSON.stringify(buildJsonLd(SITE_URL, profile, links, published)),
          injectTo: 'head' as const,
        },
      ];

      // ---- fallback statico dentro #root ----
      const appsHtml = published
        .map((p) => {
          const url = p.links.appstore || p.links.website || p.links.playstore || '#';
          const steam = p.links.steam
            ? ` · <a href="${escAttr(p.links.steam)}">Wishlist on Steam</a>`
            : '';
          return `<li><a href="${escAttr(url)}"><strong>${escHtml(p.name)}</strong> — ${escHtml(
            p.category.it,
          )}: ${escHtml(p.tagline.it)}</a>${steam}</li>`;
        })
        .join('');
      const socialHtml = links
        .map((s) => `<a href="${escAttr(s.url)}">${escHtml(s.label)}</a>`)
        .join(' · ');
      // display:none → nessun flash per l'utente; il testo resta nel markup per crawler/LLM
      // (Google indicizza dal DOM renderizzato da React, i bot senza JS leggono l'HTML grezzo).
      const fallback = `<article style="display:none">
<p>${escHtml(profile.kicker)}</p>
<h1>${escHtml(profile.name)}</h1>
<p>${escHtml(profile.bio.it)}</p>
<h2>App</h2>
<ul>${appsHtml}</ul>
<nav aria-label="Social">${socialHtml}</nav>
</article>`;

      const withFallback = html.replace('<div id="root"></div>', `<div id="root">${fallback}</div>`);
      return { html: withFallback, tags: headTags };
    },
    closeBundle() {
      // genera file SEO solo in build
      if (!cfg || cfg.command !== 'build') return;
      const out = cfg.build.outDir;
      const { products, profile } = loadData();
      const published = products.filter((p) => p.status === 'published');

      writeFileSync(
        join(out, 'robots.txt'),
        `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
      );

      writeFileSync(
        join(out, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${SITE_URL}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`,
      );

      const appLines = published
        .map((p) => {
          const url = p.links.appstore || p.links.website || p.links.playstore || `${SITE_URL}/`;
          const steam = p.links.steam ? ` — Wishlist on Steam: ${p.links.steam}` : '';
          return `- [${p.name}](${url}): ${p.tagline.en}${steam}`;
        })
        .join('\n');
      writeFileSync(
        join(out, 'llms.txt'),
        `# ${profile.name}\n\n> ${profile.bio.en}\n\nPersonal hub (link-in-bio) of ${profile.name} — indie developer publishing apps and games on the App Store and Google Play.\n\n## Apps\n\n${appLines}\n\n## Links\n\n- Site: ${SITE_URL}/\n- TikTok: https://www.tiktok.com/@panthe78\n- LinkedIn: https://www.linkedin.com/in/luca-panteghini/\n`,
      );
    },
  };
}

function buildJsonLd(site: string, profile: Json, links: Json[], apps: Json[]) {
  const osFor = (p: Json) => {
    const os: string[] = [];
    if (p.links.appstore) os.push('iOS');
    if (p.links.playstore) os.push('Android');
    return os.join(', ') || 'iOS, Android';
  };
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: profile.name,
      url: `${site}/`,
      description: profile.bio.it,
      jobTitle: 'App & Game Developer',
      image: `${site}/${profile.avatar}`,
      sameAs: links.filter((s) => s.id !== 'email').map((s) => s.url),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: `${profile.name} — Apps & Games`,
      url: `${site}/`,
      inLanguage: ['it', 'en'],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `App di ${profile.name}`,
      itemListElement: apps.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'SoftwareApplication',
          name: p.name,
          applicationCategory: 'MobileApplication',
          operatingSystem: osFor(p),
          description: p.tagline.en,
          url: p.links.website || p.links.appstore || p.links.playstore,
          ...(p.links.appstore || p.links.playstore
            ? { offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }
            : {}),
        },
      })),
    },
  ];
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), seoPlugin()],
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
});
