// Redirect `/go/<slug>?src=…&store=ios|android` verso lo store giusto, con
// attribuzione e contatore. Nasce per la demo web di ScopaAI dentro Gestify
// (repo Scopa, docs/demo-web-gestify.md §2.5 e §8): i badge e il QR della demo
// non puntano agli store ma qui, così
//   1. il click si CONTA (evento GA4 via Measurement Protocol sulla property
//      «ScopaAI Demo Web», la stessa che misura la demo);
//   2. Play e App Store ricevono i parametri campagna (UTM nel `referrer` di
//      Play, `pt`/`ct` di App Store) e l'installazione resta attribuita alla
//      sorgente in Play Console / App Store Connect.
//
// Scelta dello store, in ordine: parametro `store` (l'utente ha già toccato il
// badge giusto) → User-Agent (QR scansionato da un telefono) → `fallback`
// (desktop senza indicazioni: l'hub, che mostra entrambi i badge).
//
// La tabella dei redirect è `data/go.json` (data-driven, come il resto del
// sito): aggiungere una app = aggiungere una voce, non codice.
//
// Pages Function: questo file diventa la rotta `/go/:slug` al deploy del
// progetto Pages `linkhub`, senza toccare la SPA. In locale:
//   npm run build && npx wrangler pages dev dist   (legge `.dev.vars`)

import table from '../../data/go.json';

interface GoEntry {
  ios: string;
  android: string;
  fallback: string;
  campaign: string;
  ios_pt?: string;
  ga4?: { measurement_id: string; event: string };
}

interface Env {
  GA4_DEMO_API_SECRET?: string;
  /** Qualsiasi valore → usa l'endpoint di validazione di GA4 e logga la risposta. */
  GA4_MP_DEBUG?: string;
}

type Store = 'ios' | 'android' | 'hub';
type ChosenBy = 'param' | 'ua' | 'fallback';

const SAFE = /^[a-z0-9_-]{1,32}$/i;
const clean = (v: string | null, fallback: string) => (v && SAFE.test(v) ? v : fallback);

function chooseStore(url: URL, ua: string): { store: Store; chosenBy: ChosenBy } {
  const hint = url.searchParams.get('store');
  if (hint === 'ios' || hint === 'android') return { store: hint, chosenBy: 'param' };
  if (/iPhone|iPad|iPod/i.test(ua)) return { store: 'ios', chosenBy: 'ua' };
  if (/Android/i.test(ua)) return { store: 'android', chosenBy: 'ua' };
  return { store: 'hub', chosenBy: 'fallback' };
}

function targetFor(entry: GoEntry, store: Store, src: string): string {
  const campaign = entry.campaign;
  if (store === 'android') {
    // Play Console legge la campagna dal parametro `referrer`, URL-encoded
    // dentro l'URL dello store. Gli utm in chiaro servono ai report web.
    const utm = `utm_source=${src}&utm_medium=demo&utm_campaign=${campaign}`;
    const u = new URL(entry.android);
    u.searchParams.set('referrer', utm);
    u.searchParams.set('utm_source', src);
    u.searchParams.set('utm_medium', 'demo');
    u.searchParams.set('utm_campaign', campaign);
    return u.toString();
  }
  if (store === 'ios') {
    // App Analytics attribuisce con `pt` (provider) + `ct` (campagna). `mt=8`
    // = App Store. Senza `pt` il link funziona ma l'installazione non è
    // attribuita: resta il conteggio del click qui.
    const u = new URL(entry.ios);
    if (entry.ios_pt) u.searchParams.set('pt', entry.ios_pt);
    u.searchParams.set('ct', `${campaign}_${src}`.slice(0, 40));
    u.searchParams.set('mt', '8');
    return u.toString();
  }
  const u = new URL(entry.fallback);
  u.searchParams.set('utm_source', src);
  u.searchParams.set('utm_medium', 'demo');
  u.searchParams.set('utm_campaign', campaign);
  return u.toString();
}

async function count(
  env: Env,
  entry: GoEntry,
  slug: string,
  src: string,
  store: Store,
  chosenBy: ChosenBy,
  request: Request,
): Promise<void> {
  const secret = env.GA4_DEMO_API_SECRET;
  if (!secret || !entry.ga4) return;
  // Un `client_id` nuovo per ogni click: qui contiamo click, non utenti (la
  // demo ha già il suo `demo_cta_click` per utente; il QR da desktop è
  // proprio il caso che la demo NON può vedere).
  const clientId = `${Date.now()}.${Math.floor(Math.random() * 1e9)}`;
  const endpoint = env.GA4_MP_DEBUG
    ? 'https://www.google-analytics.com/debug/mp/collect'
    : 'https://www.google-analytics.com/mp/collect';
  const url = `${endpoint}?measurement_id=${encodeURIComponent(entry.ga4.measurement_id)}&api_secret=${encodeURIComponent(secret)}`;
  const body = {
    client_id: clientId,
    events: [
      {
        name: entry.ga4.event,
        params: { slug, src, store, chosen_by: chosenBy, engagement_time_msec: 1 },
      },
    ],
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        // GA4 filtra i bot dallo User-Agent: passiamo quello del visitatore.
        'User-Agent': request.headers.get('user-agent') ?? 'linkhub-go',
      },
    });
    if (env.GA4_MP_DEBUG) console.log('GA4 MP', res.status, await res.text());
  } catch (e) {
    console.log('GA4 MP errore', String(e));
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, params, env, waitUntil }) => {
  const slug = String(params.slug ?? '');
  const entry = (table as Record<string, GoEntry | string>)[slug];
  if (!entry || typeof entry === 'string' || !SAFE.test(slug)) {
    return new Response('Not found', { status: 404 });
  }
  const url = new URL(request.url);
  const src = clean(url.searchParams.get('src'), 'direct');
  const ua = request.headers.get('user-agent') ?? '';
  const { store, chosenBy } = chooseStore(url, ua);
  const target = targetFor(entry, store, src);

  waitUntil(count(env, entry, slug, src, store, chosenBy, request));

  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      // Ogni click va contato e la scelta dipende dallo User-Agent: niente
      // cache, né nel browser né su Cloudflare.
      'Cache-Control': 'no-store',
      Vary: 'User-Agent',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
};
