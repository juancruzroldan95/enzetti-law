// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
// https://astro.build/config
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://estudioenzetti.com", // TODO: Replace with actual production URL
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()]
  }
});