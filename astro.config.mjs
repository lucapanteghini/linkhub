// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Aggiornare con il dominio definitivo quando deciso.
  // Per ora va bene anche il sottodominio *.netlify.app.
  site: 'https://lucapanteghini.netlify.app',
  build: {
    inlineStylesheets: 'auto',
  },
});
