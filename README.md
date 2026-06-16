# LinkHub — Luca Panteghini

Hub personale che sostituisce `linktr.ee/lucaspanthe`: una pagina statica di proprietà,
bilingue IT/EN, alimentata da un manifest e aggiornabile in automatico.

SPA statica in **React + Vite**, sfondo **aurora WebGL** (react-three-fiber) e animazioni
**Framer Motion**. Deploy su **Cloudflare Pages**.

## Come funziona

Tutto il contenuto vive in due file (unica fonte di verità):

- `data/products.json` — le app (nome, tagline IT/EN, link store, colore, asset).
- `data/socials.json` — profilo, kicker, bio IT/EN e link social/contatto.

La UI è generata da questi dati: **aggiornare = modificare il JSON**, non i componenti.

## Comandi

```bash
npm install          # installa le dipendenze
npm run sync         # importa+ottimizza icone/screenshot+avatar → public/assets
npm run dev          # anteprima locale (http://localhost:5173)
npm run build        # genera il sito statico in dist/
npm run sync:build   # sync + build in un colpo
```

## Sfondo configurabile

La modalità sfondo si cambia al volo via URL (utile per confrontare / tornare indietro):

- `?bg=aurora` — solo aurora shader (default, vedi `src/config.ts`)
- `?bg=orbit` — solo icone app in orbita
- `?bg=both` — aurora + orbita
- `?bg=off` — sfondo nero pulito

Il default è in `DEFAULT_BG` (`src/config.ts`). La palette dell'aurora è nello shader in
`src/components/Scene3D.tsx`.

## Aggiungere o modificare un'app

1. Aggiungi/modifica un blocco in `data/products.json`.
2. Nel campo `assetSources` indica i percorsi locali di icona/screenshot del progetto.
3. `npm run sync` per importarli e ottimizzarli (WebP) in `public/assets/<id>/`.
4. `git commit` (gli asset ottimizzati vengono versionati) → Cloudflare ribuilda e pubblica.

`status` può essere `published` o `coming_soon` (la card mostra un badge "Prossimamente").

## Aggiungere un social (es. Instagram/X)

In `data/socials.json` imposta `url` e `enabled: true` sul blocco corrispondente
(le icone sono già pronte in `src/components/icons.tsx`).

## Deploy su Cloudflare Pages

1. Push del repo su GitHub.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → seleziona il repo.
3. Impostazioni build:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - Node version: letta da `.node-version` (22).
4. Ogni push su `main` → build e deploy automatici. Parti sul dominio `*.pages.dev`,
   poi collega il dominio custom da **Custom domains**.

Gli header HTTP (sicurezza + cache) sono in `public/_headers` (Vite lo copia in `dist/`).

## Statistiche (analytics)

Su Cloudflare Pages hai **Web Analytics gratuita e privacy-friendly** (no cookie/banner):
dashboard → progetto Pages → **Metrics / Web Analytics** → abilita. Si attiva senza
modificare il codice. In alternativa si può aggiungere uno script (GA4, Plausible, Umami)
in `index.html`.

## Sync degli asset

È un passo **locale**: i progetti sorgente stanno sulla macchina di Luca, non in CI.
`scripts/sync-assets.mjs` legge i percorsi da `data/products.json` (icone/screenshot) e
l'avatar da `data/socials.json` (`avatarSource`), li ottimizza in WebP e li scrive in
`public/assets/`. Gli asset risultanti sono committati nel repo.

## Da completare

- Dominio definitivo (per ora `*.pages.dev`).
- Abilitare Cloudflare Web Analytics dal dashboard dopo il primo deploy.
- Eventuali handle Instagram/X.
- Quando Nova Drop è live su App Store, il link è già impostato.
