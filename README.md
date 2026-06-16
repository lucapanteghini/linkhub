# LinkHub — Luca Panteghini

Hub personale che sostituisce `linktr.ee/lucaspanthe`: una pagina statica di proprietà,
bilingue IT/EN, alimentata da un manifest e aggiornabile in automatico.

Sito statico in **Astro**, deploy su **Netlify**.

## Come funziona

Tutto il contenuto vive in due file (unica fonte di verità):

- `data/products.json` — le app (nome, tagline IT/EN, link store, colore, asset).
- `data/socials.json` — profilo, bio IT/EN e link social/contatto.

La pagina viene generata da questi dati: **aggiornare = modificare il JSON**, non l'HTML.

## Comandi

```bash
npm install          # installa le dipendenze
npm run sync         # importa+ottimizza icone/screenshot dai progetti locali → public/assets
npm run dev          # anteprima locale su http://localhost:4321
npm run build        # genera il sito statico in dist/
npm run sync:build   # sync + build in un colpo
```

## Aggiungere o modificare un'app

1. Aggiungi/modifica un blocco in `data/products.json`.
2. Nel campo `assetSources` indica i percorsi locali di icona e screenshot del progetto.
3. Esegui `npm run sync` per importarli e ottimizzarli (WebP) in `public/assets/<id>/`.
4. `git commit` (gli asset ottimizzati vengono versionati) → Netlify ribuilda e pubblica.

`status` può essere `published` o `coming_soon`. La home mostra solo le app `published`
(facile da estendere per una sezione "in arrivo").

## Aggiungere un social (es. Instagram/X)

In `data/socials.json` imposta `url` e `enabled: true` sul blocco corrispondente
(le icone sono già pronte in `src/components/SocialBar.astro`).

## Automazione

- **Push su GitHub** → Netlify ricostruisce e pubblica (integrazione Git nativa).
- **Refresh settimanale** → `.github/workflows/build-deploy.yml` pinga il build hook di
  Netlify ogni lunedì. Richiede il secret `NETLIFY_BUILD_HOOK`.
- Lo **sync degli asset** è un passo locale (i progetti sorgente stanno sulla macchina di
  Luca, non in CI): gli asset ottimizzati sono committati nel repo.

## Deploy su Netlify

1. Connetti il repo GitHub a Netlify (build command e publish dir sono già in `netlify.toml`).
2. Parti sul sottodominio `*.netlify.app`; collega il dominio definitivo quando deciso
   (e aggiorna `site` in `astro.config.mjs`).

## Da completare

- Avatar profilo: aggiungere `public/assets/profile/avatar.webp` (ora c'è un placeholder con iniziali).
- Dominio definitivo.
- Eventuali handle Instagram/X.
