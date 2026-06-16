# LinkHub — contesto di progetto

Memoria del progetto e registro di cosa è stato fatto. Per istruzioni operative dettagliate
vedi anche `README.md`; per il documento di design iniziale vedi `PROPOSAL.md`.

## Cos'è

Hub personale "link-in-bio" di **Luca Panteghini**, sostituto di `linktr.ee/lucaspanthe`.
Una pagina statica di proprietà che raccoglie le sue app pubblicate e i suoi social.

- **Live (dominio custom):** https://games.nurale.it/
- **Live (Pages):** https://linkhub-akv.pages.dev/
- **Repo:** https://github.com/lucapanteghini/linkhub (pubblico)

## Stack

- **React + Vite** (SPA statica, una sola pagina).
- **Sfondo "aurora"** WebGL: shader GLSL (noise domain-warped) in `src/components/Scene3D.tsx`,
  via `@react-three/fiber` + `three`. Palette **Case Analyst** (verde fosforo `#33FF33` + ambra `#FFB000` su nero).
- **Framer Motion** per animazioni d'ingresso e tilt 3D delle card.
- Font: Sora (display) + Inter.

## Architettura data-driven

Tutto il contenuto vive in 2 file = unica fonte di verità. **Aggiornare = modificare il JSON**, non i componenti.

- `data/products.json` — le app: nome, `status` (`published`/`coming_soon`), categoria IT/EN,
  tagline IT/EN, `accent` (colore brand), link store, e `assetSources` (percorsi locali usati solo dallo sync).
- `data/socials.json` — profilo (nome, `kicker`, bio IT/EN, `avatarSource`) e link social (`enabled`).

Bilingue IT/EN con toggle (hook `src/hooks/useLang.ts`, stringhe `src/i18n/ui.ts`).

### App mostrate (ordine attuale)
1. Case Analyst · 2. Nova Drop · 3. AI Handstand · 4. ScopaAI · 5. BriscolaAI
### Social
TikTok (@panthe78) · LinkedIn · Email (Instagram/X predisposti ma `enabled:false`).

## Sfondo configurabile (`src/config.ts`)

Cambiabile via URL senza ricompilare: `?bg=aurora` (default) · `?bg=orbit` (icone app in orbita) ·
`?bg=both` · `?bg=off`. Il codice dell'orbita resta disponibile ma di default è disattivato
(scartato perché non gradito).

## Come aggiornare

- **Testi/app/social:** modifica `data/*.json`.
- **Icone/screenshot/avatar:** `npm run sync` (legge `assetSources` e `avatarSource`, ottimizza in WebP in `public/assets/`).
- Poi `git push` → Cloudflare ribuilda e pubblica da solo (~1 min).

## Hosting & deploy

- **Cloudflare Pages**, flusso "Pages" Connect-to-Git. Build: `npm run build`, output: `dist`. Node da `.node-version` (22).
- **Dominio custom:** `games.nurale.it` via record **CNAME** `games → linkhub-akv.pages.dev` sul DNS esterno di nurale.it.
  Scelta deliberata di NON spostare i nameserver su Cloudflare → email (MX) e altri sottodomini di nurale.it intatti.
- **HTTPS** automatico (cert Google Trust via Cloudflare, rinnovo automatico).
- **Header** sicurezza/cache in `public/_headers`.
- `wrangler.jsonc` presente per l'eventuale flusso "Workers" (`npx wrangler deploy`); ignorato dal flusso Pages.

## Statistiche

**Cloudflare Web Analytics** (privacy-friendly, no cookie/banner) attivata da
Workers & Pages → linkhub → Metrics → Enable. Il beacon è iniettato automaticamente al deploy
(token `52a6b2c396d14155a480e795a7029c91`). Dati in: Metrics del progetto.

## Storico decisioni

- Partiti da Astro, **rifatto in React+Vite** su richiesta (look "game studio").
- Primo sfondo (starfield + orbi) **scartato**; scelto **aurora shader**, poi ricolorata sui toni di Case Analyst.
- Icone app in orbita provate e **rimosse** (default solo aurora).
- Bio dal claim TikTok ("Apps • Fitness • Tech / from idea to App Store" + video quotidiani).
- Hosting: valutati GitHub Pages / Netlify / Cloudflare → scelto **Cloudflare Pages** (statico + analytics gratis incluse).
- AI Handstand risultata già pubblicata (scoperto dal Linktree, App Store id6758057958 + Play).
- Nova Drop: Play live + App Store (id6780262100) impostato.

## Aperto / TODO

- **Switch finale:** aggiornare il link nelle bio social verso `https://games.nurale.it/` e dismettere Linktree.
- Eventuale sezione "coming soon" separata per app non pubblicate.
- Attivare Instagram/X quando disponibili (in `data/socials.json`).
