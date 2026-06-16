# LinkHub — Pagina personale di Luca Panteghini (sostituto di Linktree)

> Documento di progettazione. Obiettivo: dismettere `linktr.ee/lucaspanthe` e sostituirlo
> con una pagina statica, di proprietà, alimentabile e aggiornabile in automatico.
> Stato: **DESIGN** (nessuna implementazione avviata).

---

## 1. Decisioni prese

| Tema | Scelta |
|---|---|
| Identità | **Hub personale di Luca Panteghini** (creatore / indie dev) |
| Prodotti mostrati | Solo le **3 app pubblicate**: ScopaAI, BriscolaAI, Case Analyst |
| Social / contatti | **LinkedIn, TikTok, pulsante Email** (Instagram/X rimandati) |
| Lingua | **Bilingue IT/EN** con switch |
| Raccolta contatti | **Solo pulsante email** (nessun form/newsletter) |
| Header | Include un **mini-claim/bio** su Luca |
| Hosting | **Netlify** (coerente con case-analyst.com) |
| Dominio | Da decidere → si parte su `*.netlify.app`, dominio definitivo collegato dopo |
| Stack | **Astro** (sito statico, pattern JSON→pagina) |
| Stile | **Design nuovo, pulito, multi-prodotto** a griglia di card |

---

## 2. Contenuti confermati

### App pubblicate
1. **ScopaAI** — gioco di carte italiano vs AI
   - App Store: https://apps.apple.com/us/app/scopaai/id6757974029
   - Google Play: https://play.google.com/store/apps/details?id=com.scopaai.scopaai
   - Asset: `Scopa/store_assets/icon_512x512.png`, screenshot, feature graphic
   - Palette: verde tavolo #1B5E20 + oro #FFB300

2. **BriscolaAI** — gioco di carte italiano vs AI
   - App Store: https://apps.apple.com/us/app/briscola-ai/id6759338400
   - Google Play: https://play.google.com/store/apps/details?id=com.briscolaai.briscolaai
   - Asset: `Briscola/store_assets/icon_1024x1024.png`, screenshot, feature graphic

3. **Case Analyst** — gioco cyberpunk di investigazione forense
   - App Store: https://apps.apple.com/app/id6776575829
   - Google Play: https://play.google.com/store/apps/details?id=app.caseanalyst
   - Steam: coming soon
   - Sito dedicato già live: https://case-analyst.com
   - Asset: logo, 5 trailer, screenshot in `case-analyst-landing-recovered/assets/`
   - Palette: nero #0A0A0A + verde fosforo #33FF33

### Social / contatti
- LinkedIn: https://www.linkedin.com/in/luca-panteghini/
- TikTok: https://www.tiktok.com/@panthe78
- Email: luca.panteghini@nurale.com (pulsante `mailto:`)
- Instagram / X: rimandati (il manifest è già predisposto per aggiungerli dopo)

---

## 3. Architettura: sito statico data-driven

Principio: **un'unica fonte di verità** (`data/products.json`) da cui viene generato l'HTML.
Aggiornare la pagina = modificare dati, non toccare HTML/CSS.

```
linkhub/
├── data/
│   ├── products.json        # un blocco per app: nome, tagline IT/EN, icona,
│   │                         #   screenshot, link store, categoria, colore, stato
│   └── socials.json         # link social + email
├── assets/                  # icone/screenshot/video ottimizzati (webp, ridimensionati)
├── src/
│   ├── layout/              # template pagina + componenti card
│   └── styles/              # design system (token colore, tipografia, griglia)
├── scripts/
│   ├── sync-assets.mjs      # importa e ottimizza asset dai progetti locali
│   ├── fetch-store-data.mjs # (opz.) rating/stato live da Google Play + App Store
│   └── build.mjs            # genera il sito dal manifest
├── netlify.toml             # config deploy + header sicurezza/cache
└── .github/workflows/
    └── build-deploy.yml     # build automatica: on push + cron settimanale
```

### Stack
- **Astro** (consigliato): genera HTML statico, pattern "JSON → pagina" nativo, resta
  semplice come il template Case Analyst. Alternativa minimale: HTML + piccolo script Node.
- **i18n**: dizionario IT/EN nel manifest (campi `title_it`/`title_en`) + toggle lingua client-side.

### Tre livelli di automazione ("alimentare e aggiornare")
1. **Manifest** — aggiungere/modificare un'app = un blocco JSON.
2. **Sync asset** — `sync-assets.mjs` pesca icone e screenshot dai progetti
   (`Scopa/`, `Briscola/`, `case-analyst-landing-recovered/`), li ottimizza e li copia.
3. **Auto-refresh** — GitHub Action su cron ricostruisce e (opzionale) aggiorna
   rating/disponibilità dagli store. È già presente il service account Google Play
   (`nurale-...json`) utilizzabile per i dati Play.

---

## 4. Design della pagina (struttura)

- **Header**: nome/avatar "Luca Panteghini" + tagline bilingue + toggle lingua IT/EN.
- **Riga social**: icone LinkedIn · Instagram · X · TikTok · Email.
- **Griglia card prodotto** (1 card per app): icona, nome, tagline, badge categoria,
  pulsanti store (App Store / Google Play), eventuale link "sito" (Case Analyst).
- **Design neutro/moderno**: card su sfondo pulito, ogni card può riprendere il colore
  brand della sua app come accento → coerenza pur con app dallo stile diverso.
- **Responsive** mobile-first (è il caso d'uso tipico di un link-in-bio).
- **Footer**: copyright + pulsante email di contatto.

---

## 5. Piano di lavoro (alla tua approvazione)

| Fase | Attività | Output |
|---|---|---|
| 1 | Creazione repo GitHub `linkhub` + scaffold Astro | repo + struttura cartelle |
| 2 | `products.json` + `socials.json` popolati coi dati confermati | manifest completo |
| 3 | `sync-assets.mjs`: import e ottimizzazione asset dai progetti | assets/ pronti |
| 4 | Template + design system + griglia card + toggle lingua | pagina renderizzata |
| 5 | Deploy su Netlify (sottodominio .netlify.app) | URL live |
| 6 | GitHub Action build+deploy (push + cron) | aggiornamento automatico |
| 7 | (dopo) collegamento dominio definitivo + switch del bio da Linktree | go-live |

### Switch finale
Una volta online, aggiorni il link nel bio dei social (e ovunque usi `linktr.ee/lucaspanthe`)
puntando al nuovo dominio. Linktree può restare attivo qualche giorno in parallelo e poi
essere dismesso.

---

## 6. Punti aperti (non bloccanti)
- [x] Handle social → LinkedIn + TikTok (@panthe78) + email; IG/X rimandati
- [x] App Store BriscolaAI → confermato (id6759338400)
- [x] Mini-bio header → sì
- [x] Stack → Astro
- [ ] Testo esatto del mini-claim/bio (lo proponiamo io e tu lo limi) — IT + EN
- [ ] Dominio definitivo (non bloccante: si parte su `.netlify.app`)
