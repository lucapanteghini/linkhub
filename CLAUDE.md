# LinkHub — contesto di progetto

Memoria del progetto e registro di cosa è stato fatto. Per istruzioni operative dettagliate
vedi anche `README.md`; per il documento di design iniziale vedi `PROPOSAL.md`.

## Cos'è

Hub personale "link-in-bio" di **Luca Panteghini**, sostituto di `linktr.ee/lucaspanthe`.
Una pagina statica di proprietà che raccoglie le sue app pubblicate e i suoi social.

- **Live (dominio base):** https://nurale.games/ (rispondono anche `www.nurale.games` e `games.nurale.it`)
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

Sfondi animati selezionabili in 3 modi:

- **Default del proprietario:** `DEFAULT_BG` in `src/config.ts` (attuale: `aurora`).
- **Dal sito (visitatore):** menu a icone nella topbar (`src/components/BgMenu.tsx`); la scelta
  è salvata in `localStorage` (`lh-bg`) — vedi hook `src/hooks/useBg.ts`.
- **Via URL (forza, ha priorità):** `?bg=aurora|clouds|circuits|sea|orbit|both|off`.

Sfondi disponibili:
- `aurora` — shader verde/ambra Case Analyst (default) + rete di nodi "neural net" (linee con impulsi), scie di dati/meteore e particelle/scintille fluttuanti.
- `clouds` — nuvole bianche su cielo azzurro + stormo di uccelli con battito d'ali (palette naturale).
- `circuits` — PCB verde scuro con segnali luminosi sulle piste + robottini che camminano (occhi/antenna luminosi).
- `sea` — mare blu con fondale basso, pesci cartoon (occhio/pinna) e bolle cartoon.
- `orbit` / `both` / `off` — icone app in orbita / aurora+orbita / nessuno (solo via URL; orbita scartata).

Implementazione: tutti gli sfondi shader usano un piano fullscreen condiviso
(`src/components/backgrounds/ShaderBackground.tsx`) con i fragment shader in
`src/components/backgrounds/shaders.ts` (palette naturali per nuvole/circuiti/mare,
scelta del 2026-06-16). I nuovi sfondi sono montati da `Scene3D` in base al `mode`.

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
- Nova Drop: Play live + App Store (id6780262100); sito `novadrop.nurale.games` aggiunto come link "Sito" sulla card.

## SEO / GEO (farsi trovare anche dagli LLM)

Il sito è una SPA: l'HTML statico avrebbe `#root` vuoto e i crawler degli LLM (ClaudeBot,
GPTBot, PerplexityBot, Google-Extended…) **non eseguono JS**. Risolto con un plugin Vite
in `vite.config.ts` (`seoPlugin`), tutto **data-driven da `data/*.json`**:

- **Fallback statico** iniettato dentro `#root` (bio + lista app con link + social) → crawler/LLM
  leggono i contenuti senza JS. React lo rimpiazza al mount (`createRoot().render`).
- **`<head>`**: canonical + `og:url`/`og:image`/`og:locale`/`og:site_name` + `twitter:image` + `author`.
- **JSON-LD**: `Person` (con `sameAs` social) + `WebSite` + `ItemList` di `SoftwareApplication`.
- **Build (`closeBundle`)** genera in `dist/`: `robots.txt`, `sitemap.xml`, `llms.txt`.
- **OG image** 1200×630: `npm run gen:og` (`scripts/gen-og.mjs`, palette Case Analyst) →
  `public/assets/og.png` (committata). Rigenerare se cambiano nome/app/tagline.

Canonico impostato su `https://nurale.games/` (gestisce il doppio dominio con `*.pages.dev`).

## Aperto / TODO

- **Switch finale:** aggiornare il link nelle bio social verso `https://nurale.games/` e dismettere Linktree.
- Dopo il deploy: verificare anteprima con i debugger di LinkedIn/Facebook e il Rich Results Test di Google.
- Eventuale sezione "coming soon" separata per app non pubblicate.
- Attivare Instagram/X quando disponibili (in `data/socials.json`).
